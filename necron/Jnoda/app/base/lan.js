/**
 * Created by i7 on 09.03.2017.
 */
const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();
const { glob } = require('../../Jnoda_global.js');
const ipaddr = require('./ipaddr');
const nm = require('./network_manager');
const belib = require('./../../../web/be/belib.js');
const priv = require('../../../private.js');
let dhcp_cli = 'udhcpc';

async function SetMAC(obj) {
	let devid;
	if (obj.page && fs.existsSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + obj.page))
		devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + obj.page, 'utf8');
	else devid = '';

	const privmac = priv.GetPrivateValue('net.' + devid + '.mac');
	const iface = obj.ifname;

	if (!obj.FakeMac) obj['FakeMac'] = 'flase';

	//  console.log("setMAC obj.FakeMac ",obj.FakeMac);
	if (obj.FakeMac === 'true') {
		//   console.log("setMAC obj.FakeMac ","ifconfig " + iface + " hw ether " + obj.Mac);
		await ex.ExecPromise('ifconfig ' + iface + ' hw ether ' + obj.Mac);
	} else {
		//console.log("privmac ",privmac);
		if (privmac !== undefined) {
			// console.log("setMAC obj.FakeMac ","ifconfig " + iface + " hw ether " + privmac);
			await ex.ExecPromise('ifconfig ' + iface + ' hw ether ' + privmac);
		}
	}
}

async function LANDownStatic(obj) {
	const iface = obj.ifname;
	await ex.ExecPromise('ifconfig ' + iface + ' down');

	await ex.ExecPromise('ip addr flush dev ' + iface);
}
async function LANSetupStatic(obj) {
	const err = 0;

	const iface = obj.ifname;
	await ex.ExecPromise('ifconfig ' + iface + ' down');

	await ex.ExecPromise('ip addr flush dev ' + iface);
	// ex.ExecNoOutSync("ip link set "+iface+" address "+obj.Mac);
	if (obj.Ms === undefined) obj.Ms = '255.255.255.0';

	if (obj.Ip === undefined) obj.Ip = '192.168.20.222';

	if (obj.Ms.length !== 0) {
		await ex.ExecPromise('ip addr add ' + obj.Ip + ' dev ' + iface);
		await ex.ExecPromise(
			'ifconfig ' +
				iface +
				' netmask ' +
				obj.Ms +
				' broadcast ' +
				ipaddr.IPv4_GetBcast(obj.Ip, obj.Ms)
		);
	} else await ex.ExecPromise('ifconfig ' + iface + ' ' + obj.Ip);

	await SetMAC(obj);

	await ex.ExecPromise('ifconfig ' + iface + ' up');

	if (obj.UseAltIP && obj.UseAltIP === 'true' && obj.exIp && obj.exIp.length !== 0) {
		await ex.ExecPromise(`ifconfig ${iface}:0 ${obj.exIp} netmask ${obj.Ms} up`);
	}

	return err;
}

let ost = [];
let dhcp_id = {};
async function LANDeductInBridge(obj) {
	let iface = obj.ifname;

	let osf = '/sys/class/net/' + iface + '/operstate';
	// console.log('LANDeductInBridge ',osf,'obj ',obj);

	if (fs.existsSync(osf) === false) return;

	let operstate = fs.readFileSync(osf, 'utf8');

	if (iface === 'tap0')
		//Need for OpenVPN
		operstate = 'up\n';

	if (operstate === 'up\n') {
		if (ost[iface] === false) {
			ost[iface] = true;
			await ex.ExecPromise('brctl addif ' + c.BRIDGE_NAME + ' ' + iface);
		}
	} else {
		ost[iface] = false;
		await ex.ExecPromise('brctl delif ' + c.BRIDGE_NAME + ' ' + iface);
	}
}

async function LANSetupInBridge(obj) {
	let err = 0;

	let iface = obj.ifname;
	await ex.ExecPromise('ifconfig ' + iface + ' down');
	await ex.ExecPromise('ip addr flush dev ' + iface);
	await SetMAC(obj);
	await ex.ExecPromise('ifconfig ' + iface + ' up');

	return err;
}

async function LANDownInBridge(obj) {
	let iface = obj.ifname;
	ost[iface] = false;
	await ex.ExecPromise('brctl delif ' + c.BRIDGE_NAME + ' ' + iface);
	await ex.ExecPromise('ifconfig ' + iface + ' down');
	await ex.ExecPromise('ip addr flush dev ' + iface);
}
async function LANDownAuto(obj) {
	let iface = obj.ifname;
	ex.Service(
		'udhcpc',
		`-f -i ${iface} -s ${c.UDHCPC_CONFIG} -x hostname:${glob.websrv.cfg.hostname}`,
		'stop'
	);
	await ex.ExecPromise('ifconfig ' + iface + ' down');
	await ex.ExecPromise('ip addr flush dev ' + iface);
}
async function LANSetupAuto(obj) {
	let iface = obj.ifname;
	//wsrv
	console.log('UDHCPC up for iface', iface);
	if (dhcp_cli === 'dhcpcd') {
		dhcp_id[iface] = ex.Service(
			'dhcpcd',
			`-B -c ${c.DHCPCD_CONFIG} --noipv4ll --nogateway ${iface}`,
			'stop'
		);
	} else
		dhcp_id[iface] = ex.Service(
			'udhcpc',
			`-f -i ${iface} -s ${c.UDHCPC_CONFIG} -x hostname:${glob.websrv.cfg.hostname}`,
			'stop'
		);

	await ex.ExecPromise('ifconfig ' + iface + ' down');

	await SetMAC(obj);

	await ex.ExecPromise('ip addr flush dev ' + iface);
	await ex.ExecPromise('ifconfig ' + iface + ' up');
	if (obj.UseAltIP && obj.UseAltIP === 'true' && obj.exIp && obj.exIp.length !== 0) {
		await ex.ExecPromise(`ifconfig ${iface}:0 ${obj.exIp} netmask ${obj.Ms} up`);
	}
	ex.ServiceCtrl(dhcp_id[iface], 'start');

	return 0;
}

async function LANSetup(iface, obj, exinfo) {
	if (c.DEBUG_IFACE === iface) {
		logger.debug('skip debug iface ' + iface);
		return;
	}

	if (typeof obj['Mode'] == 'undefined') {
		logger.debug('Error: LAN  mode undefined');
		return;
	}

	logger.debug('Configure lan ');

	if (belib.CheckForNFS() === true && iface !== 'tap0') {
		console.log('Detect NFS rootfs, ignore configure LAN network');
		logger.debug('Detect NFS rootfs, ignore configure LAN network');
		return;
	}

	if (glob.websrv.cfg.webSkipConfNet === 'true') {
		console.log('Skip configure net (websrv), ignore configure LAN network');
		logger.debug('Skip configure net (websrv), ignore configure LAN network');
		return;
	}

	// Связь имени интерфейса с его системным именем,
	// например USB-gadget (NDIS/CDC) имеет имя usb0 в Lunux системе,
	// а в системе necron ему будет присвоено eth0..3. Поле name
	// конфига интерфейса содержит его реальное имя.
	var ifns = iface;
	if (exinfo !== undefined && exinfo.name !== undefined) ifns = exinfo.name;

	obj['ifname'] = ifns;

	if (dhcp_id[iface] !== undefined) ex.ServiceCtrl(dhcp_id[iface], 'stop');

	if (glob.config.ext_pack !== undefined && glob.config.ext_pack.dhcp_cli !== undefined) {
		dhcp_cli = glob.config.ext_pack.dhcp_cli;
	}
	// nm.StopIfaceNM({conf:{iface:iface}});
	switch (
		obj['Mode'] // == c.LAN_MODE_STATIC)
	) {
		case 'stip':
			{
				console.log('iface ', ifns, 'is WAN');
				await nm.Init(iface, ifns, 'eth', LANSetupStatic, null, LANDownStatic, {
					obj: obj,
					ssend: ''
				});
			}
			break;
		case 'dhcp':
			{
				console.log('iface ', ifns, 'is WAN');
				await nm.Init(iface, ifns, 'ethdhcp', LANSetupAuto, null, LANDownAuto, {
					obj: obj,
					ssend: ''
				});
			}
			break;
		case 'bridge':
			{
				ost[ifns] = false;
				console.log('iface ', ifns, 'is LAN (Bridge)');
				await nm.Init(iface, ifns, 'eth', LANSetupInBridge, LANDeductInBridge, LANDownInBridge, {
					obj: obj,
					ssend: ''
				});
			}
			break;
		case 'unconf':
			{
				console.log('iface ', ifns, 'is unconf');
				await nm.Init(iface, ifns, 'ethunconf', null, null, null, {
					obj: obj,
					ssend: ''
				});
			}
			break;
	}
	nm.ClearSourceWAN();
	logger.debug('LAN  mode', obj['Mode']);
}

async function TUNSetup(iface, obj) {
	await nm.Init(iface, iface, 'tun', null, null, null, {
		obj: obj,
		ssend: ''
	});
}

function GetL2TP_NetName(page) {
	var num = parseInt(page.slice(-1)) + 200;

	return 'ppp' + num;
}

async function L2TPSetup(iface, obj) {
	await nm.Init(iface, GetL2TP_NetName(obj.page), 'ppp', null, null, null, {
		obj: obj,
		ssend: ''
	});
}

module.exports = {
	LANSetup,
	TUNSetup,
	L2TPSetup
};
