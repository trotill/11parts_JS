/**
 * Created by i7 on 17.08.2017.
 */
const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();
const net = require('./net_func');

const nat = require('./iptables.js');
const ipaddr = require('./ipaddr');
const nmroute = require('./nm_route');
const { glob } = require('../../Jnoda_global.js');

const eve = require('events');
const Event = new eve.EventEmitter();
//console.log("Network manager ");

let IfNameTab = [];
let NetScope = {};
let NetPriority = [];
let TInternet = []; //Internet detect timeout
let TLink = []; //Link detect timeout
let TLinkSlow = []; //A timer that determines if the network is restarted if
// it does not exist. Only for lan
let TIntSlow = []; //A timer that determines the restart of a WAN in the absence
// the Internet. Only for WAN
let IFint = ''; //Source LAN device (br0)
let RedirectConf = [];
let SharedCCNat = {};
let DoReconfNAT = false;
let DMZConf = [];
let ConfIn = []; //Copy full conf, saved in Run
let RouteConf = []; //Store route configuration, GW, IP e.t.c

let SourceWan = ''; //Source WAN internet connected device
let RouteTable = []; //Generated route table ID
let ConnectTestIP = {}; //{{
let ExNetSetting = {};

async function Init(iface, ifname, iftype, specup, specdeduct, specdown, specparams) {
	logger.debug('Init nm iface', iface, 'ifname', ifname, 'iftype', iftype);
	IfNameTab[iface] = ifname;
	TInternet[iface] = 0;
	TLink[iface] = 0;
	TLinkSlow[iface] = 0;
	TIntSlow[iface] = 0;

	let n = {
		lnk: 0,
		internet: 0,
		intwdt: 0,
		stat: 0,
		type: '',
		ParseIfconfig: null, //eth,ppp
		inten: 0,
		run: 0,
		try: { cnt: 1, idx: 0 },
		route: {
			default: []
		},
		func_netup: async function () {
			//console.log("IFACE",iface,"specup",specup,"specparams.obj",specparams.obj);
			if (specup != null) await specup(specparams.obj);
		},
		func_deduction: async function (args) {
			if (specdeduct != null) await specdeduct(specparams.obj, specparams.ssend, args);
		},
		func_netdown: async function () {
			if (specdown != null) {
				await specdown(specparams.obj);
			}
			NetScope[iface].try.idx = 0;
		},
		GetNetSettings: null
		//func_netparams:specparams,
	};
	let NetOldConfigured = false;

	if (NetScope[iface]) {
		NetOldConfigured = true;
	}

	if (!NetScope[iface]) NetScope[iface] = n;
	else {
		let internet = NetScope[iface].internet;
		let lnk = NetScope[iface].lnk;
		let inten = NetScope[iface].inten;
		let run = NetScope[iface].run;
		NetScope[iface] = n;
		NetScope[iface].internet = internet;
		NetScope[iface].lnk = lnk;
		NetScope[iface].inten = inten;
		NetScope[iface].run = run;
	}

	if (iftype === 'ethunconf') {
		NetScope[iface].ParseIfconfig = net.ParseIfconfigEth;
		NetScope[iface].type = 'eth';
		NetScope[iface].GetNetSettings = () => {
			//logger.debug("specparams ",specparams);
			let obj = specparams.obj;
			let dns = [];
			if (obj.usedns === 'true' && obj.dhDNS && obj.dhDNSex) {
				dns[0] = obj.dhDNS;
				dns[1] = obj.dhDNSex;
			}
			return {
				ip_gw: obj.Gw,
				ip_net: obj.Ip,
				ip_mask: obj.Ms,
				ip_dns: dns
			};
		};
	}
	if (iftype === 'eth') {
		NetScope[iface].ParseIfconfig = net.ParseIfconfigEth;
		NetScope[iface].type = 'eth';
		NetScope[iface].GetNetSettings = () => {
			//logger.debug("specparams ",specparams);
			let obj = specparams.obj;
			let dns = [];
			// console.log('GetNetSettings',obj);
			if (obj.usedns === 'true' && obj.dhDNS && obj.dhDNSex) {
				dns[0] = obj.dhDNS;
				dns[1] = obj.dhDNSex;
			}
			return {
				ip_gw: obj.Gw,
				ip_net: obj.Ip,
				ip_mask: obj.Ms,
				ip_dns: dns
			};
		};
	}

	if (iftype === 'tun') {
		NetScope[iface].ParseIfconfig = net.ParseIfconfigTun;
		NetScope[iface].type = 'tun';
		NetScope[iface].GetNetSettings = () => {
			//logger.debug("specparams ",specparams);
			let obj = specparams.obj;
			let dns = [];
			if (obj.usedns === 'true' && obj.dhDNS && obj.dhDNSex) {
				dns[0] = obj.dhDNS;
				dns[1] = obj.dhDNSex;
			} else {
				dns = [NetScope[iface].stat.ptp];
			}

			return {
				ip_gw: NetScope[iface].stat.ptp,
				ip_net: NetScope[iface].stat.ip,
				ip_mask: NetScope[iface].stat.mask,
				ip_dns: dns
			};
		};
	}

	if (iftype === 'ethdhcp') {
		NetScope[iface].ParseIfconfig = net.ParseIfconfigEth;
		NetScope[iface].type = 'eth';
		NetScope[iface].GetNetSettings = () => {
			//console.log('!!!!GetNetSettings',iface,'->',c.CACHE_PATH + "/" + IfNameTab[iface] + ".dhcp");
			let dhcp_file = c.CACHE_PATH + '/' + IfNameTab[iface] + '.dhcp';
			let dns = [];
			let obj = { gw: '0.0.0.0', ip: '0.0.0.0', mask: '0.0.0.0' };
			try {
				obj = JSON.parse(fs.readFileSync(dhcp_file, 'utf8'));

				let sobj = specparams.obj;
				// console.log('ethdhcp',obj);
				if (sobj.usedns === 'true' && sobj.dhDNS && sobj.dhDNSex) {
					dns[0] = sobj.dhDNS;
					dns[1] = sobj.dhDNSex;
				} else {
					dns = obj.dns;
				}
			} catch (e) {
				console.log('Not found DHCP file', dhcp_file);
				obj.gw = '0.0.0.0';
				obj.ip = '0.0.0.0.';
				obj.mask = '255.255.255.255';
				dns = ['0.0.0.0'];
			}
			return {
				ip_gw: obj.gw,
				ip_net: obj.ip,
				ip_mask: net.IntToDotNetMask(parseInt(obj.mask)),
				ip_dns: dns
			};
		};
	}

	if (iftype === 'ppp') {
		NetScope[iface].ParseIfconfig = net.ParseIfconfigPPP;
		NetScope[iface].type = 'ppp';
		NetScope[iface].GetNetSettings = () => {
			//console.log('GetNetSettings',iface);
			let obj = specparams.obj;
			let dns = [];
			if (obj.usedns === 'true' && obj.dhDNS && obj.dhDNSex) {
				dns[0] = obj.dhDNS;
				dns[1] = obj.dhDNSex;
			} else {
				dns = [NetScope[iface].stat.ptp];
			}

			return {
				ip_gw: NetScope[iface].stat.ptp,
				ip_net: NetScope[iface].stat.ip,
				ip_mask: NetScope[iface].stat.mask,
				ip_dns: dns
			};
		};
	}

	await nmroute.InitRouteTable({ RouteTable, iface, NetScope });

	if (NetOldConfigured) {
		logger.debug('Try reconfigure device, reinit network', iface);
		console.log('Try reconfigure device, reinit network', iface);
		await NetScope[iface].func_netdown();
		await NetScope[iface].func_netup();
	}

	logger.debug('glob.net_set[', iface, ']', glob.net_set[iface]);
	RewriteExNetSetting(iface, glob.net_set[iface]);
}

function GetIfaceName(ifname) {
	for (const iface in IfNameTab) {
		if (IfNameTab[iface] === ifname) return iface;
	}

	return ifname;
}

function GetLink(iface) {
	let res;
	try {
		res = NetScope[iface].lnk;
	} catch (e) {
		res = 0;
	}
	return res;
}

function GetInternet(iface) {
	let res;
	try {
		res = NetScope[iface].internet;
	} catch (e) {
		res = 0;
	}

	return res;
}

function GetIfconfig(iface) {
	if (NetScope[iface] && NetScope[iface].stat) return NetScope[iface].stat;
	else return '';
}

function GetWANInfo(iface) {
	let res = {
		gw: '',
		srcwan: 'undef'
	};

	if (iface === '') iface = SourceWan;
	if (RouteConf[iface]) res.gw = RouteConf[iface].gw;

	res.srcwan = SourceWan;
	return res;
}

function GetInternalIface() {
	return IFint;
}
function ConfigInternalIface(ifint) {
	IFint = ifint;
}

function ConfigRedir(tNRedir) {
	logger.debug('ConfigRedir tNRedir ', tNRedir);
	RedirectConf['tNRedir'] = tNRedir;
}

function ConfigDMZ(ipDMZ) {
	logger.debug('ConfigDMZ ipDMZ ', ipDMZ);
	DMZConf['ipDMZ'] = ipDMZ;
}

function AddIptablesRule(name, callback) {
	if (SharedCCNat[name] && SharedCCNat[name] === callback) {
		return;
	}

	DoReconfNAT = true;
	SharedCCNat[name] = callback;
	logger.debug('Add iptables rule ', name);
}

async function DoConfigShared(arg) {
	console.log('DoConfigShared SharedCCNat', SharedCCNat, 'arg', arg);
	for (const f in SharedCCNat) {
		if (SharedCCNat[f]) {
			logger.debug('run addition rule', f);
			await SharedCCNat[f](arg);
		}
	}
}

async function DeleteAllRuleForTable(tab) {
	try {
		await ex.ExecPromise('ip rule delete from 0/0 to 0/0 table ' + tab);
		await ex.ExecPromise('ip rule delete from 0/0 to 0/0 table ' + tab);
	} catch (e) {
		console.log('Not delete rules for table ', tab, ', rules not souch');
	}
	logger.debug('Delete 2 rules for table ', tab);
	console.log('Delete 2 rules for table ', tab);
}

async function ReconfRoute(iface, conf) {
	logger.debug('ReconfRoute if ', iface, ' RouteConf ', conf);

	console.log('ReconfRoute if ', iface, ' RouteConf ', conf);

	await DeleteAllRuleForTable(conf.tab);
	await ex.ExecPromise('ip rule add to ' + conf.ip + ' table ' + conf.tab);
	await ex.ExecPromise('ip rule add from ' + conf.ip + ' table ' + conf.tab);
	await ex.ExecPromise('ip route flush table ' + conf.tab);
	await ex.ExecPromise(
		'ip route add default via ' + conf.gw + ' dev ' + iface + ' table ' + conf.tab
	);
	if (!conf.netip) {
		console.log('!!!!ReconfRoute conf.netip undefined, iface', iface, 'conf', conf);
	} else
		await ex.ExecPromise(
			'ip route add ' + conf.netip + '/' + conf.mask + ' dev ' + iface + ' table ' + conf.tab
		);

	await ex.ExecPromise('ip route flush cache');

	Event.emit('ReconfRoute', { iface: iface, conf: conf });
}

async function DeleteAllDefaultRoutes() {
	await ex.ExecPromise('ip route del 0/0');
}
async function DefaultRoute(iface, gwIP) {
	let str;
	try {
		let result = await ex.ExecPromise('ip route list 0/0');
		str = result.stdout.toString();
	} catch (e) {
		str = '';
	}

	if (str === '') {
		logger.debug('force add default route', iface, '/', gwIP);
		await DeleteAllDefaultRoutes();
		await ex.ExecPromise('ip route add default via ' + gwIP + ' dev ' + iface);
		await ex.ExecPromise('ip route flush cache');
		return c.NO_ERROR; // c.ERROR;
	}

	let rows = str.split(/\n/g);
	// console.log(iface,"DefaultRoute rows ",rows," str",str);
	let result = [];
	for (const row in rows) {
		let t = rows[row].split(/\s/g);
		//result[t[0]]={};
		//console.log("Parse str ",t);
		if (t[1] !== 'dev' && !t[4]) continue;
		let lgwIP = '';
		let liface = '';
		if (t[1] === 'dev') {
			//for type [default dev br0]
			lgwIP = '';
			liface = t[2];
		} else {
			//for type [default via 192.168.0.1 dev eth0]
			lgwIP = t[2];
			liface = t[4];
		}
		result.push({ iface: liface, gwIP: lgwIP });
	}

	// console.log(iface,"DefaultRoute result ",result);
	if (result.length > 1) {
		for (let n = 1; n < result.length; n++) {
			logger.debug('default routes > 1, delete ', result.length - 1, ' route');
			await ex.ExecPromise('ip route del default dev ' + result[n].iface);
		}
		//ip route del default dev eth0
		//ip route add default via 192.168.50.1 dev eth0
	}

	if (result.length !== 0) {
		if (result[0].iface !== iface || result[0].gwIP !== gwIP) {
			await DeleteAllDefaultRoutes();
			//ex.ExecNoOutSync('ip route del default dev ' + result[0].iface);
			await ex.ExecPromise('ip route add default via ' + gwIP + ' dev ' + iface);
			await ex.ExecPromise('ip route flush cache');
			return c.NO_ERROR;
		}
	}
	//console.log("rows ",rows);
	return c.ERROR;
}

function RemoveRouteInfo(iface) {
	RouteConf[iface] = undefined;
}
async function ConfigRoute(iface, DotGW, DotIP, DotMask, RouteTableID) {
	logger.debug('ConfigRoute if ', iface, ' GW ', DotGW, ' IP ', DotIP, ' TAB ', RouteTableID);
	if (!DotIP) {
		logger.debug('ConfigRoute if ', iface, ' terminated not souch IP addr');
		return;
	}

	if (!DotGW) DotGW = '0.0.0.0';

	let n = {
		gw: DotGW,
		ip: DotIP,
		mask: DotMask,
		tab: RouteTableID
	};

	if (
		!RouteConf?.[iface]?.['netip'] ||
		n.gw !== RouteConf[iface].gw ||
		n.ip !== RouteConf[iface].ip
	) {
		n['netip'] = ipaddr.IPv4_GetNetAddr(n.ip, n.mask);
		await ReconfRoute(IfNameTab[iface], n);
		RouteConf[iface] = n;
		logger.debug('new RouteConf', RouteConf[iface]);
	}
}

async function ReconfNAT(iface) {
	logger.debug('ReconfNAT for if ', iface, ' RouteConf ', RouteConf[iface]);

	if (RouteConf[iface] && RouteConf[iface].ip && RouteConf[iface].gw) {
		logger.debug('Run NAT configure for if ', iface);
		await nat.CleanNAT();
		if ((await nat.ConfigNAT(IfNameTab[iface], IFint)) === c.ERROR) return c.ERROR;

		await DoConfigShared({ ifext: IfNameTab[iface], ifint: IFint });

		if (RedirectConf['tNRedir']) await nat.ConfigRedir(IfNameTab[iface], RedirectConf['tNRedir']);

		if (DMZConf['ipDMZ']) await nat.ConfigDMZ(IfNameTab[iface], DMZConf['ipDMZ']);

		await nat.ConfigLastrules(IfNameTab[iface], IFint);
		await ReconfRoute(IfNameTab[iface], RouteConf[iface]);

		DoReconfNAT = false;
		Event.emit('ReconfNAT', { iface: iface });
		return c.NO_ERROR;
	} else {
		logger.debug('Skip NAT configure for if ', iface, ' nor ready route vars');
	}
	return c.ERROR;
}

function ClearSourceWAN() {
	SourceWan = '';
}

async function SelectWAN() {
	logger.debug('Src WAN ', SourceWan);
	for (const iface in NetScope) {
		if (NetScope[iface]['run'] === 1)
			logger.debug(
				iface,
				' stat lnk  ',
				NetScope[iface].lnk,
				' internet ',
				NetScope[iface].internet
			);
	}

	let found_wan = 0;
	for (const iface in NetPriority) {
		//выбираем интерфейс по приоритету
		if (NetScope[iface].run === 1 && NetScope[iface].lnk === 1) {
			if (NetScope[iface].internet === 1) {
				found_wan = 1;
				//logger.debug("WAN candidate ",iface);
				if (!RouteConf[iface]) {
					logger.debug('RouteConf show ', RouteConf[iface]);
					logger.debug('Error select NAT, if ', iface, ' not configured');
					continue;
				}
				logger.debug('SourceWan ', SourceWan, ' iface ', iface);
				console.log('SourceWan ', SourceWan, ' iface ', iface);
				let route_iface = iface;

				if (NetScope[iface].route.default.length !== 0) {
					for (let idx in NetScope[iface].route.default) {
						let lrt_iface = NetScope[iface].route.default[idx];
						if (RouteConf[lrt_iface] && RouteConf[lrt_iface].gw && RouteConf[lrt_iface].gw !== '') {
							route_iface = lrt_iface;
							logger.debug(
								'Overlay default route from',
								RouteConf[iface].gw,
								'to',
								RouteConf[route_iface].gw
							);
							break;
						}
					}
				}
				if (SourceWan !== iface) {
					logger.debug('Switches WAN ', SourceWan, ' to ', iface);
					console.log('Switches WAN ', SourceWan, ' to ', iface);
					if ((await ReconfNAT(iface)) === c.NO_ERROR) SourceWan = iface;
					Event.emit('SelectWAN', { SourceWan: SourceWan });
					let net_set = NetScope[route_iface].GetNetSettings();
					await net.FillResolve(net_set.ip_dns);
				}
				//Требуется переопределение iptables правил, если например добавили новые
				if (DoReconfNAT === true) await ReconfNAT(SourceWan);

				// console.log('DefaultRoute',route_iface,"RouteConf[iface].gw",RouteConf[route_iface].gw);
				await DefaultRoute(IfNameTab[route_iface], RouteConf[route_iface].gw);
				break;
			} else {
				if (SourceWan === iface) {
					SourceWan = '';
					Event.emit('SelectWAN', { SourceWan: SourceWan });
				}
			}
		} else {
			if (SourceWan === iface) {
				SourceWan = '';
				Event.emit('SelectWAN', { SourceWan: SourceWan });
			}
		}
	}

	if (found_wan === 0) {
		//only lan
		SourceWan = '';
	}
}

async function SelectLAN(iface, net_set) {
	//поддерживается только bridge!!!
	//среди LAN, bridge самый приоритетный
	if (iface !== IFint) return;

	if (NetScope[IFint]) {
		if (RouteConf[IFint]) {
			if ((await DefaultRoute(IfNameTab[IFint], RouteConf[IFint].gw)) === c.NO_ERROR) {
				console.log('net_set', net_set);
				await net.FillResolve(net_set.ip_dns);
			}
		}
	}
}

async function CheckConnect(iface, ip) {
	let exec = require('child_process').exec;

	if (ConnectTestIP[iface].ips === undefined || ConnectTestIP[iface].ips[0] === undefined) {
		logger.debug('CheckConnect:there are no IP in the array, connect on');
		NetScope[iface].internet = 1;
		await SelectWAN();
		return;
	}

	logger.debug('ping iface ', iface, 'ip', ConnectTestIP[iface].ips[ConnectTestIP[iface].point]);
	let ret = await new Promise((resolve) => {
		exec(`ping -I ${ip} ${ConnectTestIP[iface].ips[ConnectTestIP[iface].point]} -c 1 -w 1`).on(
			'exit',
			(code) => {
				resolve(code);
			}
		);
	});

	logger.debug('ping ret', JSON.stringify(ret));
	if (ret === 0) {
		NetScope[iface].internet = 1;
		NetScope[iface].try.idx = 0;
	} else {
		NetScope[iface].try.idx++;
		if (NetScope[iface].try.cnt === NetScope[iface].try.idx) {
			NetScope[iface].internet = 0;
			ConnectTestIP[iface].point++;
			if (ConnectTestIP[iface].point >= ConnectTestIP[iface].ips.length)
				ConnectTestIP[iface].point = 0;
			NetScope[iface].try.idx = 0;
		}
		logger.debug(
			'change test ip to ',
			ConnectTestIP[iface].ips[ConnectTestIP[iface].point],
			'for iface',
			iface
		);
	}
	logger.debug(iface, 'try idx', NetScope[iface].try.idx, '/', NetScope[iface].try.cnt);

	await SelectWAN();
}

async function Connect(iface) {
	logger.debug('Connect', iface);
	logger.debug(`Connect NetScope[${iface}].lnk=${NetScope[iface].lnk}`);
	if (NetScope[iface].lnk === 1) {
		logger.debug('Try test connect for', iface);
		// console.log("NetScope[iface].stat.ip ",NetScope[iface].stat.ip);
		if (NetScope[iface].stat.ip) await CheckConnect(iface, NetScope[iface].stat.ip);
		else {
			NetScope[iface].internet = 0;
		}
	} else {
		NetScope[iface].internet = 0;
	}

	if (NetScope[iface].internet === 0) {
		logger.debug('NetScope[iface].internet =0', iface);
		if (NetScope[iface].intwdt === 0) {
			NetScope[iface].intwdt = 1;
			let restart = async (iface) => {
				if (
					NetScope[iface] === undefined ||
					!NetScope[iface].func_netdown ||
					!NetScope[iface].func_netup
				) {
					console.log(
						`func_netdown/func_netup==undefined for iface ${iface} NetScope[${iface}]=${NetScope[iface]}`
					);
				} else {
					await NetScope[iface].func_netdown();
					await NetScope[iface].func_netup();
				}
			};
			new Promise((resolve) => {
				TIntSlow[iface] = setTimeout(function () {
					let res = 0;
					if (ExNetSetting[iface].connect.updown === true) {
						logger.debug('Restart WAN iface ', iface);
						res = 1;
					} else logger.debug('Block restart WAN iface ', iface);

					resolve(res);
				}, 40000);
			})
				.then((res) => {
					if (res) {
						return restart(iface);
					}
					return Promise.resolve();
				})
				.then(() => {
					if (RouteConf[iface]) {
						RouteConf[iface].gw = '';
						RouteConf[iface].ip = '';
					}
					NetScope[iface].intwdt = 0;
				});
		}
	} else {
		try {
			NetScope[iface].intwdt = 0;
			clearTimeout(TIntSlow[iface]);
		} catch (e) {
			logger.debug('NM Connect error');
		}
	}

	logger.debug('Exit test connect for', iface);
	TInternet[iface] = setTimeout(Connect, c.CHK_INTERNET_TIME_MS, iface);
}

async function LinkRestart(iface) {
	if (NetScope[iface].lnk === 0) {
		console.log('No link, restart ', iface);
		logger.debug('No link, restart ', iface);
		if (NetScope[iface] && NetScope[iface].func_netdown) {
			await NetScope[iface].func_netdown();
			await NetScope[iface].func_netup();
		}
	} else {
		console.log('link Ok for ', iface);
		logger.debug('link Ok for ', iface);
	}
	TLinkSlow[iface] = setTimeout(LinkRestart, 20000, iface);
}

function CheckConnectON_GW(iface, ip_gw) {
	if (
		ip_gw &&
		ExNetSetting[iface].connect &&
		ExNetSetting[iface].connect.gw === 'true' &&
		(ConnectTestIP[iface].ips.length === ExNetSetting[iface].connect.url.length ||
			ip_gw !== ConnectTestIP[iface].ips[0])
	) {
		logger.debug('ExNetSetting[iface] for iface', iface, 'content:', ExNetSetting[iface]);
		ConnectTestIP[iface].ips = [];
		ConnectTestIP[iface].ips.push(ip_gw);
		ConnectTestIP[iface].ips = ConnectTestIP[iface].ips.concat(ExNetSetting[iface].connect.url);
		ConnectTestIP[iface].point = 0;
		logger.debug(
			'Add gw ip for connect detect, summary',
			ConnectTestIP[iface].ips,
			'for iface',
			iface
		);
	}
}

function WANCorrector() {
	let trg = 0;
	for (let z in NetScope) {
		if (NetScope[z].run === 1 && NetScope[z].inten === 1) {
			trg = 1;
			break;
		}
	}
	if (trg === 0) SourceWan = '';
}
TestServices();

function TestServices() {
	setInterval(function () {
		ex.ShowRunarr();
	}, 5000);
}
//Detect up or down interface, up - 1, down - 0
async function Link(iface, type) {
	logger.debug('Link thr', iface, 'type', type, 'SourceWan', SourceWan);
	//var old_link=NetScope[iface].lnk;//сохраняем текущее значение линка
	if (NetScope[iface].ParseIfconfig === undefined || NetScope[iface].run === 0) {
		NetScope[iface].internet = 0;
		NetScope[iface].lnk = 0;

		TLink[iface] = setTimeout(Link, c.CHK_LINK_TIME_MS, iface, NetScope[iface].type);
		return;
	}

	if (type === 'eth') NetScope[iface].lnk = await net.GetLinkState(IfNameTab[iface]);
	else NetScope[iface].lnk = await net.GetLinkState_Carrier(IfNameTab[iface]);

	logger.debug(`Link NetScope[${iface}].lnk=${NetScope[iface].lnk}`);

	NetScope[iface].stat = await NetScope[iface].ParseIfconfig(IfNameTab[iface], 1);

	if (NetScope[iface].lnk) {
		if (NetScope[iface].stat.ip) {
			const obj = NetScope[iface].GetNetSettings();
			await ConfigRoute(iface, obj.ip_gw, obj.ip_net, obj.ip_mask, RouteTable[iface]);
			//if (old_link==0)//если не было линка то вносим шлюз в список
			CheckConnectON_GW(iface, obj.ip_gw); //внести в список определения коннекта - IP шлюза, если требуется в iptables.set
			if (SourceWan === '') SelectLAN(iface, obj);
		}
	} else {
		NetScope[iface].internet = 0;
		RemoveRouteInfo(iface);
	}

	if (NetScope[iface].func_deduction) await NetScope[iface].func_deduction(NetScope[iface]);
	else console.log('!!!Error:func_deduction undefined for', iface);

	TLink[iface] = setTimeout(Link, c.CHK_LINK_TIME_MS, iface, NetScope[iface].type);
}

async function StopIfaceNM(conf) {
	await StopIface(conf.iface);
}

async function StartIface(conf) {
	if (!NetScope[conf.iface]) {
		logger.debug('SINM:Uncofigured ' + conf.iface + ' set spirit mode');
		NetScope[conf.iface] = {
			run: 0,
			inten: 0,
			linken: 0,
			lnk: 0,
			internet: 0,
			try: {
				cnt: 1,
				idx: 0
			}
		};
		conf.linken = 0;
		conf.inten = 0;
		RewriteExNetSetting(conf.iface, glob.net_set[conf.iface]);
	}

	if (NetScope[conf.iface]['run'] && NetScope[conf.iface]['run'] === 1) {
		await StopIface(conf.iface);
		//NetScope[conf.iface]['run']=0;
	}

	if (conf.inten === 1) {
		NetScope[conf.iface].inten = 1;
		clearTimeout(TInternet[conf.iface]);
		console.log('SINM:Set internet watchdog for ', conf.iface);
		TInternet[conf.iface] = setTimeout(Connect, c.CHK_INTERNET_TIME_MS, conf.iface);
	} else NetScope[conf.iface].inten = 0;

	if (!ExNetSetting[conf.iface]) {
		console.log(
			'SINM:!!!!!!!!!!!!!!!!!!undefined ExNetSetting[conf.iface]',
			conf.iface,
			'ExNetSetting',
			ExNetSetting
		);
		console.log('SINM:!!!!!!!!!!!!!!!!!!EXIT');
		return;
	}
	if (conf.linken === 1) {
		clearTimeout(TLink[conf.iface]);
		NetScope[conf.iface].lnk = 0;

		NetScope[conf.iface].oldtime = Date.now();
		TLink[conf.iface] = setTimeout(Link, c.CHK_LINK_TIME_MS, conf.iface, NetScope[conf.iface].type);
		if (
			conf.inten === 0 ||
			(ExNetSetting[conf.iface].connect.url.length === 0 &&
				ExNetSetting[conf.iface].connect.gw === 'false') ||
			ExNetSetting[conf.iface].connect.updown === 'false'
		) {
			logger.debug('SINM:Set link watchdog for ', conf.iface);
			if (ExNetSetting[conf.iface].link && ExNetSetting[conf.iface].link.relink === 'true')
				TLinkSlow[conf.iface] = setTimeout(LinkRestart, 20000, conf.iface);
			else logger.debug('SINM:Do not check link for', conf.iface);
		}
	}

	logger.debug('SINM:Total result ', NetScope);

	if (NetScope[conf.iface].func_netup) {
		console.log('IFACE', conf.iface, 'func_netup Ok');
		await NetScope[conf.iface].func_netup();
	}

	NetScope[conf.iface]['run'] = 1;
}

async function StartIfaceNM_conf(conf) {
	logger.debug('SINM:conf[n].iface ', conf.iface);
	await StartIface(conf);
}

async function StartIfaceNM_iface(iface) {
	logger.debug('SINM:conf[n].iface ', iface);
	for (const idx in ConfIn) {
		if (ConfIn[idx].iface === iface) await StartIface(ConfIn[idx]);
	}
}

async function Run(conf) {
	logger.debug('NM conf ', conf);
	console.log('NM conf ', conf);
	ConfIn = conf;

	setInterval(WANCorrector, 5000);

	logger.debug('conf.length ', conf.length);

	for (let n = 0; n < conf.length - 1; n++) {
		logger.debug('conf iface ', conf[n]);
		await StartIfaceNM_conf(conf[n]);
		NetPriority[conf[n].iface] = conf[n].iface;
	}

	logger.debug('IfNameTab ', IfNameTab);
	logger.debug('NetPriority ', NetPriority);
}

let StopIface = async (iface) => {
	console.log('base:nm:StopIface', iface);
	logger.debug('try stop ', iface);
	if (TInternet[iface]) clearTimeout(TInternet[iface]);
	if (TLink[iface]) clearTimeout(TLink[iface]);
	if (TIntSlow[iface]) clearTimeout(TIntSlow[iface]);
	if (TLinkSlow[iface]) clearTimeout(TLinkSlow[iface]);

	if (NetScope[iface] && (await NetScope[iface].func_netdown)) {
		console.log('IFACE', iface, 'func_netdown Ok');
		await NetScope[iface].func_netdown();
		NetScope[iface]['lnk'] = 0;
		NetScope[iface]['internet'] = 0;
		NetScope[iface]['stat'] = undefined; //не менять повлияет на VPN и GetIfconfig
		NetScope[iface]['run'] = 0;
	}
	if (RouteTable[iface]) await nmroute.DeleteRouteTable(RouteTable[iface]);
	else logger.debug('Iface ', iface, ' is stop!!!');
};

async function StopAll() {
	console.log('base:nm:StopAll');

	for (let n = 0; n < ConfIn.length; n++) {
		if (ConfIn[n].iface) await StopIface(ConfIn[n].iface);
	}
	console.log('All net iface is down');
}

function AddConnectTestIP(iface, ips) {
	ConnectTestIP[iface].ips = ExNetSetting[iface].connect.url;
	ConnectTestIP[iface].ips = ConnectTestIP[iface].ips.concat(ips);
	ConnectTestIP[iface].point = 0;
	logger.debug('AddConnectTestIP for iface', iface, 'ConnectTestIP[iface]', ConnectTestIP[iface]);
}

function RewriteExNetSetting(iface, setting) {
	ExNetSetting[iface] = setting;
	if (ConnectTestIP[iface] === undefined) ConnectTestIP[iface] = { ips: [], point: 0 };

	logger.debug('ExNetSetting[', iface, ']', ExNetSetting[iface]);
	console.log('ExNetSetting[', iface, ']', ExNetSetting[iface]);
	if (ExNetSetting[iface] === undefined) ExNetSetting[iface] = {};

	if (ExNetSetting[iface].connect === undefined) {
		ExNetSetting[iface]['connect'] = {
			gw: false,
			url: []
		};
	}

	if (ExNetSetting[iface].connect.updown === undefined) {
		ExNetSetting[iface].connect.updown = true;
	}

	if (ExNetSetting[iface].link === undefined) {
		ExNetSetting[iface].link = { relink: 'true' };
	}

	if (ExNetSetting[iface].connect.try) {
		NetScope[iface].try.idx = 0;
		NetScope[iface].try.cnt = ExNetSetting[iface].connect.try;
	}

	if (ExNetSetting[iface].route) {
		if (ExNetSetting[iface].route.default) {
			NetScope[iface].route = ExNetSetting[iface].route;
		}
	}
	console.log('ExNetSetting[iface].connect', ExNetSetting[iface].connect);
	ConnectTestIP[iface].ips = ExNetSetting[iface].connect.url;
	ConnectTestIP[iface].point = 0;
	logger.debug(
		'RewriteExNetSetting for iface',
		iface,
		'ConnectTestIP[iface]',
		ConnectTestIP[iface]
	);
}

function GetSourceWANInfo() {
	if (NetScope[SourceWan]) return { info: NetScope[SourceWan], iface: SourceWan };
	else return undefined;
}

async function RestartAllLanIfaces(exclude) {
	if (exclude === undefined) exclude = [];

	console.log('Restart All LAN ifaces exclude', exclude);
	// console.log("NetScope",NetScope);
	let found_excl;
	for (const iface in NetScope) {
		if (NetScope[iface].inten === 0) {
			found_excl = 0;
			for (let n = 0; n < exclude.length; n++) {
				if (exclude[n] === iface) {
					found_excl = 1;
					break;
				}
			}
			if (found_excl === 0) await RestartLanIface(iface);
		}
	}
}
async function RestartLanIface(iface) {
	console.log('Restart LAN iface', iface);
	await StopIface(iface);
	await StartIfaceNM_iface(iface);
}

module.exports = {
	Run,
	StopAll,
	GetLink,
	GetInternet,
	Init,
	ConfigInternalIface,
	ConfigRedir,
	ConfigDMZ,
	AddIptablesRule,
	ConfigRoute,
	GetIfconfig,
	GetWANInfo,
	GetIfaceName,
	AddConnectTestIP,
	StartIfaceNM: StartIfaceNM_conf,
	StartIfaceNM_iface,
	StopIfaceNM,
	GetSourceWANInfo,
	ClearSourceWAN,
	RestartAllLanIfaces,
	GetInternalIface,
	Event
};
