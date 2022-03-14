/**
 * Created by i7 on 14.08.2017.
 */
const c = require('../../../backCore.js');
const logger = c.getLogger();
const ex = require('./../../../exec.js');
const fs = require('fs');
const ut = require('./../../../utils');
const nm = require('./network_manager');
const Mustache = require('mustache');

function GetPPP_NetName(page) {
	const num = parseInt(page.slice(-1)) + 100;

	return 'ppp' + num;
}

function CreateOptions(fprefix, ctrltty, unit) {
	const num = parseInt(unit);
	const nid = num + 100;

	txt =
		'kdebug 0\n' +
		'noauth\n' +
		'unit ' +
		nid +
		'\n' +
		ctrltty +
		'\n' +
		'921600\n' +
		'modem\n' +
		'crtscts\n' +
		'persist holdoff 5\n' +
		'maxfail 10\n' +
		'lcp-echo-interval 10\n' +
		'lcp-echo-failure 2';

	fs.writeFileSync(c.CACHE_PATH + '/' + fprefix + '.options', txt);
}

function CreateDiscScrStr(txt) {
	if (txt === undefined)
		txt =
			'ABORT           BUSY\n' +
			'ABORT           ERROR\n' +
			"ABORT           'NO DIALTONE'\n" +
			"''              '+++c'\n" +
			'SAY             " + sending break"\n' +
			"''              'ATH'\n" +
			'SAY             "\\n + dropping data connection"\n' +
			"OK              'AT+CGATT=0'\n" +
			'SAY             "\\n + disconnecting from GPRS"\n' +
			"OK              '\\c'\n" +
			'SAY             "\\n + disconnected"\n' +
			'SAY             "\\n + sleeping modem"\n' +
			"''              'AT+ZSTOPT'\n" +
			"''              'AT+ZOPRT=6'";

	return txt;
}
function CreateDiscScr(fprefix, txt) {
	fs.writeFileSync(c.CACHE_PATH + '/' + fprefix + '.disc', CreateDiscScrStr(txt));
}

function CreateConnScrStr(txt) {
	//apn,dnum,txt
	if (txt === undefined)
		txt =
			"ABORT           'BUSY'\n" +
			"ABORT           'NO ANSWER'\n" +
			"ABORT           'NO CARRIER'\n" +
			"ABORT           'NO DIALTONE'\n" +
			'SAY             "GPRS modem init"\n' +
			"''              'AT+ZOPRT=5'\n" +
			"''              'AT+ZSTART'\n" +
			"''              'AT+CFUN=1'\n" +
			"''              'AT+CPBS=\"SM\"'\n" +
			'\'\'              \'AT+CPMS="SM","SM",""\'\n' +
			"SAY             '\\n + Enter APN'\n" +
			'OK              \'AT+CGDCONT=1,"IP","{{apn}}"\'\n' +
			// "''              'AT^NDISDUP=1,1,\"internet\"'\n"+
			'SAY             "\\n + attaching to GPRS"\n' +
			"OK              'ATDT{{dnum}}'\n" +
			'SAY             "\\n + requesting data connection"\n' +
			"CONNECT         ''\n" +
			'SAY             "\\n + connected"';
	return txt;
}
function CreateConnScr(fprefix, apn, dnum, txt) {
	fs.writeFileSync(
		c.CACHE_PATH + '/' + fprefix + '.conn',
		Mustache.render(CreateConnScrStr(txt), { apn: apn, dnum: dnum })
	);
}

function CreatePPPConf(obj, fprefix) {
	const fn = c.CACHE_PATH + '/' + fprefix;
	const target = fn;
	txt = 'file ' + fn + '.options' + '\n';

	if (obj.auth === 'true') {
		txt += 'user ' + '"' + obj.uname + '"\n' + 'password ' + '"' + obj.upasswd + '"\n';
	}
	txt +=
		'connect "/usr/sbin/chat -v -t15 -f ' +
		fn +
		'.conn"\n' +
		'disconnect "/usr/sbin/chat -f ' +
		fn +
		'.disc"\n';

	fs.writeFileSync(target, txt);
}

function CreatePPPConfig(obj) {
	logger.debug('GM:obj.ddev ', obj.ddev);
	if (obj.ddev !== '') {
		ex.ExecNoOutSync('rm ' + c.CACHE_PATH + '/' + obj.page + '.ppp');
		var ppp_link = c.CACHE_PATH + '/' + obj.page + '.ppp';
		ex.ExecNoOutSync('ln -s ' + c.PPPD_PATH + ' ' + ppp_link);
		CreateOptions(obj.page, obj.ddev, obj.page.slice(-1));
		CreateDiscScr(obj.page, obj.disscr);
		logger.debug('GM:CreateDiscScr ', obj.ddev);

		CreateConnScr(obj.page, obj.apn, obj.dnum, obj.conscr);
		logger.debug('GM:CreateConnScr ', obj.ddev);

		CreatePPPConf(obj, obj.page);
		logger.debug('GM:Created all conf for ' + obj.page);
		return c.NO_ERROR;
	} else return c.ERROR;
}

function ConnectPPP(obj) {
	obj.ppp_service_id = ex.Service(
		c.CACHE_PATH + '/' + obj.page + '.ppp',
		'call ' + obj.page + ' nodetach',
		'restart'
	);

	return c.NO_ERROR;
}

function DisconnectPPP(obj) {
	if (obj.ppp_service_id) ex.ServiceCtrl(obj.ppp_service_id, 'stop');

	return c.NO_ERROR;
}

function GSM_ETH_Init(iface, obj) {
	nm.Init(iface, obj.eif, 'ethdhcp', GSM_ETH_Up, null, null, { obj: obj, ssend: '' });
}

function GSM_RAS_Down(obj) {
	const iface = GetPPP_NetName(obj.page);

	try {
		DisconnectPPP(obj);
		ex.ExecNoOutSync('poff ' + obj.page);
		ex.ExecNoOutSync('poff ' + obj.page); //Need 2 times
		logger.debug('GSM RAS link is down ', iface);
	} catch (e) {
		logger.debug('Error GSM RAS link down ', iface);
	}
}

function GSM_RAS_Init(iface, obj) {
	logger.debug('GSM_RAS_Init ');
	nm.Init(iface, GetPPP_NetName(obj.page), 'ppp', GSM_RAS_Up, null, GSM_RAS_Down, {
		obj: obj,
		ssend: ''
	});
}

function GSM_MBIM_Init(iface, obj) {
	logger.debug('GSM_MBIM_Init ');
	MBIM_Init(iface, obj);
	nm.Init(iface, obj.eif, 'eth', GSM_MBIM_Up, GSM_MBIM_Deduct, GSM_MBIM_Down, {
		obj: obj,
		ssend: ''
	});
}

function SendATI(ati, dev) {
	if (ati.length > 3 && ati !== 'none') {
		logger.debug('RES Force send ATI', ati, ' to ' + dev);
		if (fs.existsSync(dev)) {
			ex.ExecNoOutSync("echo -ne '" + ati + "' > " + dev);
		}
	}
}

function SendATI_arr(ati, dev) {
	if (ati.length !== 0) {
		logger.debug('RES Force send ATI', ati, ' to ' + dev);
		if (fs.existsSync(dev)) {
			let chatf = '';
			let cres = "''";
			ati.forEach((atiN) => {
				chatf += cres + '   ' + atiN + '\n';
				cres = 'OK';
			});

			fs.writeFileSync(c.CACHE_PATH + '/chat.cfg', chatf, 'utf-8');
			const chs = 'chat -f ' + c.CACHE_PATH + '/chat.cfg' + '< ' + dev + '> ' + dev;
			ex.ExecNoOutSync(chs);
		}
	}
}

function ATI_MNG(obj) {
	if (typeof obj.atic !== 'undefined' && typeof obj.cdev !== 'undefined')
		SendATI(Mustache.render(obj.atic, obj), obj.cdev);
}

function GSM_RAS_Up(obj) {
	logger.debug('GSM_RAS_Up ', obj);

	ATI_MNG(obj);
	if (CreatePPPConfig(obj) === c.NO_ERROR) ConnectPPP(obj);
}

function MBIM_Init(iface, obj) {
	obj.Ip = '';
	obj.Gw = '';
	obj.Ms = '';
	obj.dhDNS = '';
	obj.dhDNSex = '';
	obj.Ms = '';
	obj.usedns = 'true';
}

function GSM_MBIM_Down(obj) {
	logger.debug('GSM_MBIM_Down ', obj.eif);
	console.log('GSM_MBIM_Down [', obj.eif, ']', 'obj', obj);
	ex.ExecNoOutSync('ifconfig ' + obj.eif + ' down');
	ex.ExecNoOutSync('ip addr flush dev ' + obj.eif);
	ex.ExecNoOutSync('mbimcli -p -d /dev/cdc-wdm0 --disconnect --no-close');
	obj.Ip = '';
	obj.Gw = '';
	obj.Ms = '';
	obj.dhDNS = '';
	obj.dhDNSex = '';
	obj.Ms = '';
}

function GSM_MBIM_Up(obj) {
	logger.debug('GSM_MBIM_Up ', obj.eif);
	console.log('GSM_MBIM_Up [', obj.eif, ']', 'obj', obj);
	GSM_MBIM_Deduct(obj);
}
function GSM_MBIM_Deduct(obj) {
	obj['mb_data'] = '';
	ex.ExecSpawnAsync(
		'mbimcli',
		['-p', '-d', '/dev/cdc-wdm0', '--query-ip-configuration', '--no-close'],
		function (data) {
			obj['mb_data'] += data;
		},
		function () {},
		function (code) {
			if (code !== 0) {
				logger.debug('MBIM:Connect ', obj.eif);
				ex.ExecSpawnAsync(
					'mbimcli',
					['-p', '-d', '/dev/cdc-wdm0', '--query-subscriber-ready-status', '--no-close'],
					null,
					null,
					() => {
						ex.ExecSpawnAsync(
							'mbimcli',
							['-p', '-d', '/dev/cdc-wdm0', `--connect=${obj.apn}`, '--no-close'],
							null,
							null,
							() => {
								console.log(`Exit mbimcli -p -d /dev/cdc-wdm0 --connect=${obj.apn} --no-close`);
							}
						);
					}
				);
			} else {
				//console.log("DATA ["+obj.mb_data+"]");
				if (obj['mb_res'] === undefined) obj['mb_res'] = { ip: '', gw: '', dns1: '', dns2: '' };

				var ipcidr = ut.match_p(/IP \[.*?]: '(.*?)'/i, obj.mb_data);
				if (ipcidr != null) {
					obj.mb_res.ipcidr = ipcidr.split('/');
					obj.mb_res.ip = obj.mb_res.ipcidr[0]; //obj.mb_res.ipcidr
					obj.mb_res.cidr = obj.mb_res.ipcidr[1];
					obj.mb_res.gw = ut.match_p(/Gateway: '(.*?)'/i, obj.mb_data);

					obj.mb_res.dns1 = ut.match_p(/DNS \[0]: '(.*?)'/i, obj.mb_data);
					obj.mb_res.dns2 = ut.match_p(/DNS \[1]: '(.*?)'/i, obj.mb_data);

					if (obj.Ip !== obj.mb_res.ip) {
						var ipf = require('./ipaddr');
						obj.Ip = obj.mb_res.ip;
						obj.Gw = obj.mb_res.gw;
						obj.dhDNS = obj.mb_res.dns1;
						obj.dhDNSex = obj.mb_res.dns2;
						obj.Ms = ipf.getSubmask(parseInt(obj.mb_res.cidr, 10));
						obj.Bcast = ipf.IPv4_GetBcast(obj.Ip, obj.Ms);
						logger.debug('GSM_MBIM_Deduct obj', obj);
						ex.ExecNoOutSync('ifconfig ' + obj.eif + ' down');
						ex.ExecNoOutSync('ip addr flush dev ' + obj.eif);
						ex.ExecNoOutSync('ip addr add ' + obj.Ip + ' dev ' + obj.eif);
						ex.ExecNoOutSync(
							'ifconfig ' + obj.eif + ' netmask ' + obj.Ms + ' broadcast ' + obj.Bcast
						);
						ex.ExecNoOutSync('ifconfig ' + obj.eif + ' up');
					}
				}
			}
		}
	);
	//mbimcli -p -d /dev/cdc-wdm0 --query-ip-configuration --no-close
	//mbimcli -p -d /dev/cdc-wdm0 --disconnect --no-close
	//mbimcli -p -d /dev/cdc-wdm0 --connect=internet --no-close

	//-p -d /dev/cdc-wdm0 --connect=MTS --no-open=5 --no-close
	/*
    Connect
     mbimcli -d /dev/cdc-wdm0 --query-subscriber-ready-status --no-close --device-open-proxy
     mbimcli -d /dev/cdc-wdm0 --query-registration-state --no-open=$TRID --no-close --device-open-proxy
     mbimcli -d /dev/cdc-wdm0 --attach-packet-service --no-open=$TRID --no-close --device-open-proxy
     mbimcli -d /dev/cdc-wdm0 --connect="apn=internet" --no-open=$TRID --no-close --device-open-proxy
     or
     mbimcli -p -d /dev/cdc-wdm0 --query-subscriber-ready-status --no-close
     mbimcli -p -d /dev/cdc-wdm0 --connect=MTS --no-open=5 --no-close
     */
	/*
    Disconnect
     mbimcli -d /dev/cdc-wdm0 --disconnect --device-open-proxy
     or
     mbimcli -p -d /dev/cdc-wdm0 --disconnect --no-close
     */
	// console.log("GSM_MBIM_Deduct");
}

function GSM_ETH_Up(obj) {
	logger.debug('GSM_ETH_Up ', obj);
	ATI_MNG(obj);

	ex.Service('udhcpc', '-f -i ' + obj.eif + ' -s ' + c.UDHCPC_CONFIG, 'stop');
	ex.ExecNoOutSync('ifconfig ' + obj.eif + ' down');
	ex.ExecNoOutSync('ip addr flush dev ' + obj.eif);
	ex.ExecNoOutSync('ifconfig ' + obj.eif + ' up');

	ex.Service('udhcpc', '-f -i ' + obj.eif + ' -s ' + c.UDHCPC_CONFIG, 'start');
}

function GSM_ModeOptions(obj) {
	if (obj.dev_opts) {
		GSM_SwitchModeOptions(obj);
	}
}

function GSM_SwitchModeOptions(obj) {
	var dopt = obj.dev_opts;
	if (dopt.switch_mode) {
		SendATI_arr(dopt.switch_mode, obj.cdev);
		GSM_ResetModem(obj);
	}
}

function GSM_ResetModem(obj) {
	if (obj.usbplug) {
		obj.usbplug.slice(4).replace('.', ':');
	}
}

function GSM_Setup(iface, obj, agent) {
	logger.debug('GSM_Setup iface', iface, 'agent', agent);

	if (agent === 'rst_set') {
		logger.debug('rst_set::GSM_Setup stop iface', iface);
		nm.StopIfaceNM({ iface: iface });
	}

	GSM_ModeOptions(obj);

	if (obj['mmode']) {
		switch (obj['mmode']) {
			case 'CDC':
				GSM_ETH_Init(iface, obj);
				break;
			case 'RAS':
				GSM_RAS_Init(iface, obj);
				break;
			case 'MBIM':
				GSM_MBIM_Init(iface, obj);
				//GSM_RAS_Init(iface,obj);
				break;
			default: {
				GSM_RAS_Init(iface, obj);
			}
		}
	}

	if (agent === 'rst_set') {
		logger.debug('rst_set::GSM_Setup start iface', iface);
		nm.StartIfaceNM_iface(iface);
	}
}

function dynGenDefRAS_Cfg(dev) {
	if (!dev.settings.apn) dev.settings.apn = 'internet';
	if (!dev.settings.dnum) dev.settings.dnum = '*99***1#';
	if (!dev.settings.conscr) dev.settings.conscr = CreateConnScrStr();
	if (!dev.settings.disscr) dev.settings.disscr = CreateDiscScrStr();

	return dev.settings;
}
function dynFillInfo(dev) {
	let ncd = 0;
	let ndd = 0;
	let out = {
		ras: {},
		edrv: '',
		eif: '',
		adev: [],
		ttyctrlidx: 0,
		ttydataidx: 0,
		ttyitems_name: [],
		ttyitems_val: [],
		modes: {},
		def_mode: dev.dev_opts.def_mode
	};

	let have_dev_opts = 0;

	if (dev?.dev_opts?.modes) {
		have_dev_opts = 1;
	}

	if (have_dev_opts) {
		out.modes = dev.dev_opts.modes;
	}

	if (dev.interface_opts.control) ncd = dev.interface_opts.control;

	if (dev.interface_opts.data) ndd = dev.interface_opts.data;

	let gsmobj = {};
	try {
		logger.debug(
			'Run',
			'/bin/sh ' +
				c.GSM_DETECT_SCRIPT +
				' ' +
				dev.interface_opts.usbport +
				' ' +
				ncd +
				' ' +
				ndd +
				' 2>/dev/null'
		);
		console.log(
			'Run',
			'/bin/sh ' +
				c.GSM_DETECT_SCRIPT +
				' ' +
				dev.interface_opts.usbport +
				' ' +
				ncd +
				' ' +
				ndd +
				' 2>/dev/null'
		);
		let result = ex
			.ExecWOutSync(
				'/bin/sh ' +
					c.GSM_DETECT_SCRIPT +
					' ' +
					dev.interface_opts.usbport +
					' ' +
					ncd +
					' ' +
					ndd +
					' 2>/dev/null'
			)
			.toString();
		console.log('GSM detect result ', result);
		gsmobj = JSON.parse(result);
		// cdev=gsmobj.cdev;
		// ddev=gsmobj.ddev;
		out.edrv = gsmobj.edrv;
		out.eif = gsmobj.eif;
		if (have_dev_opts === 0 && out.eif !== '') {
			out.modes['CDC'] = {};
			out.def_mode = 'CDC';
		}

		out.adev = gsmobj.adev;

		if (have_dev_opts === 0 && out.adev.length !== 0) {
			out.modes['RAS'] = {};
			out.def_mode = 'RAS';
		}

		out.adev.forEach((adevN, n) => {
			out.ttyitems_name[n] = n;
			out.ttyitems_val[n] = '/dev/' + adevN;
		});

		//Example content ["/dev/ttyUSB0","/dev/ttyUSB1","/dev/ttyUSB2"]
		fs.writeFileSync(
			c.CACHE_PATH + '/gsm_network' + dev.order_num + '.tty',
			JSON.stringify(out.adev)
		);
		// ttyitems_name = adev;
		// ttyitems_val = adev;
		out.ttyctrlidx = dev.interface_opts.control;
		if (out.adev.length <= out.ttyctrlidx) out.ttyctrlidx = out.adev.length - 1;
		if (out.ttyctrlidx < 0) out.ttyctrlidx = 0;
		//3 2
		out.ttydataidx = dev.interface_opts.data;
		if (out.adev.length <= out.ttydataidx) out.ttydataidx = out.adev.length - 1;
		if (out.ttydataidx < 0) out.ttydataidx = 0;
	} catch (e) {
		console.log('error gsm fillInfo');
	}
	logger.debug('Get modem info ', gsmobj);

	return out;
}

module.exports = {
	GSM_Setup,
	CreateConnScr,
	CreateDiscScr,
	dynFillInfo,
	dynGenDefRAS_Cfg
};
