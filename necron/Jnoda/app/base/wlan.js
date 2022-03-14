/**
 * Created by i7 on 12.03.2017.
 */

const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();
const hapd = require('./hostapd');
const nm = require('./network_manager');

let modem = [];
let serid_hapd = {};
let modem_ifdb = {};
const EventEmitter = require('events');
let hapd_emi = []; //= new EventEmitter.EventEmitter();

function WLANSetupClientAuto(obj) {
	logger.debug('WLANSetupClientAuto', obj);
	if (!obj.Driver) obj.Driver = 'wext';

	if (!modem[obj.IF]) {
		console.log('WLANSetupClientAuto error, modem[obj.IF]==undefined, modem', modem);
		logger.debug('WLANSetupClientAuto error, modem[obj.IF]==undefined, modem', modem);
		return 0;
	}
	modem[obj.IF].WPASupp_DHCP(obj);
	return modem[obj.IF].GenerateWPASuppConfig(obj);
}
let ost = {};
function WLANSetupDeduct_InBridge(obj) {
	logger.debug('WLANSetupDeduct_InBridge', obj);
	let osf = '/sys/class/net/' + obj.IF + '/operstate';
	if (fs.existsSync(osf) === false) return;

	let operstate = fs.readFileSync(osf, 'utf8');

	console.log('operstate', operstate, 'ost', ost);
	if (operstate === 'up\n') {
		if (ost[obj.IF] === false) {
			ost[obj.IF] = true;
			console.log('brctl addif ' + c.BRIDGE_NAME + ' ' + obj.IF);
			ex.ExecNoOutAsync('brctl addif ' + c.BRIDGE_NAME + ' ' + obj.IF);
		}
	} else {
		ost[obj.IF] = false;
		ex.ExecNoOutAsync('brctl delif ' + c.BRIDGE_NAME + ' ' + obj.IF);
	}
}
function WLANSetupClientDown_InBridge(obj) {
	logger.debug('WLANSetupClientDown_InBridge', obj);
	ex.ExecNoOutSync('ifconfig ' + obj.IF + ' down');
	ex.ExecNoOutAsync('brctl delif ' + c.BRIDGE_NAME + ' ' + obj.IF);
}

function WLANSetupClientDown(obj) {
	logger.debug('WLANSetupClientDown', obj);
	ex.ExecNoOutSync('ifconfig ' + obj.IF + ' down');
}

function WLANSetupApDown(obj) {
	logger.debug('WLANSetupApDown', obj);
	ex.ExecNoOutSync('ifconfig ' + obj.IF + ' down');
	ex.ExecNoOutAsync('brctl delif ' + c.BRIDGE_NAME + ' ' + obj.IF);
}
function WLANSetupApAuto(obj) {
	logger.debug('WLANSetupApAuto', obj);

	if (!modem[obj.IF]) {
		console.log('WLANSetupApAuto error, modem[obj.IF]==undefined');
		return 0;
	}
	modem[obj.IF].GenerateHostAPDConfig(obj, obj.IF, hapd_emi[obj.IF]);
	hapd_emi[obj.IF].once('hostapd', (confname) => {
		//logger.debug("EMI");
		ex.ExecNoOutSync('ifconfig ' + obj.IF + ' up');
		// ex.ExecNoOutSync("brctl addif "+c.BRIDGE_NAME+" "+obj.IF);
		serid_hapd[obj.devid] = hapd.StartHostApd(obj.IF, confname);
	});

	return 0;
}

function WLAN_SWInit(iface, modem_name) {
	console.log(`WLAN_SWInit ${iface} modem name ${modem_name}`);
	let modem_def_path = './wifi/' + modem_name + '.js';
	modem[iface] = require(modem_def_path);

	let sw_pth = c.CACHE_PATH + '/' + iface;
	console.log(
		`modem[${iface}]=${JSON.stringify(
			modem[iface]
		)}, modem_def_path=${modem_def_path} , sw_pth=${sw_pth}`
	);
	// try {
	let wpaSupplicantLink = sw_pth + '.wpa_supplicant';
	let wpaPassPhraseLink = sw_pth + '.wpa_passphrase';
	let wpaSupplicant = c.DEVICES_PATH + '/wifi/' + modem_name + '/wpa_supplicant';
	let wpaPassPhrase = c.DEVICES_PATH + '/wifi/' + modem_name + '/wpa_passphrase';
	if (fs.existsSync(wpaSupplicantLink)) {
		fs.unlinkSync(wpaSupplicantLink);
		fs.unlinkSync(wpaPassPhraseLink);
	}
	if (!fs.existsSync(wpaSupplicant)) {
		wpaSupplicant = '/usr/bin/wpa_supplicant';
		wpaPassPhrase = '/usr/bin/wpa_passphrase';
		logger.debug('no found wlan wpa_supplicant, use', wpaSupplicant);
	}

	try {
		fs.symlinkSync(wpaSupplicant, wpaSupplicantLink);
		fs.symlinkSync(wpaPassPhrase, wpaPassPhraseLink);
	} catch (e) {
		logger.debug('error symlick wlan');
	}

	let hostapdLink = sw_pth + '.hostapd';
	let hostapdCliLink = sw_pth + '.hostapd_cli';
	let hostapd = c.DEVICES_PATH + '/wifi/' + modem_name + '/hostapd';
	let hostapdCli = c.DEVICES_PATH + '/wifi/' + modem_name + '/hostapd_cli';
	if (fs.existsSync(hostapdLink)) {
		fs.unlinkSync(hostapdLink);
		fs.unlinkSync(hostapdCliLink);
	}

	if (!fs.existsSync(hostapd)) {
		hostapd = '/usr/bin/hostapd';
		hostapdCli = '/usr/bin/hostapd_cli';
		logger.debug('no found wlan hostapd, use', hostapd);
	}

	try {
		fs.symlinkSync(hostapd, hostapdLink);
		fs.symlinkSync(hostapdCli, hostapdCliLink);
	} catch (e) {
		logger.debug('error symlick wlan');
	}

	let modemModuleLink = sw_pth + '.' + modem_name + '.ko';
	if (fs.existsSync(modemModuleLink)) fs.unlinkSync(modemModuleLink);

	let modemModule = c.DEVICES_PATH + '/wifi/' + modem_name + '/' + modem_name + '.ko';
	if (fs.existsSync(modemModule)) {
		try {
			fs.symlinkSync(modemModule, modemModuleLink);
		} catch (e) {
			logger.debug('error symlick wlan');
		}

		logger.debug('found wlan driver', modemModule);
		ex.ExecWOutSync('insmod ' + modemModuleLink);
	} else {
		logger.debug('not found wlan driver', iface);
	}
}

function DeinitAP(id) {
	logger.debug('WLAN DeinitAP', id);
	let iface = modem_ifdb[id];
	if (modem[iface]) {
		ex.ServiceCtrl(serid_hapd[id], 'stop'); //ex.DeinitService(serid_hapd[id]);
	}
}
function DeinitClient(id) {
	logger.debug('WLAN DeinitClient', id);
	let iface = modem_ifdb[id];
	console.log(`modem[${iface}]=${JSON.stringify(modem[iface])}`);
	if (modem?.[iface]?.DeinitSupplicant) {
		modem[iface].DeinitSupplicant(id);
	} else {
		console.log(`error DeinitSupplicant for id=${id} and iface=${iface}`);
	}
}
function WLANConfig(iface, obj) {
	obj['IF'] = iface;

	logger.debug('WLAN WLANConfig', iface, obj);
	hapd_emi[iface] = new EventEmitter.EventEmitter();
	let devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + obj.page, 'utf8');
	obj['devid'] = devid;
	if (obj.dhcp_en === undefined) obj.dhcp_en = 'true';

	modem_ifdb[devid] = iface;
	if (obj['Mode'] === 'client_in_br') {
		logger.debug("WLAN obj['Mode'] === client_in_br");
		DeinitAP(devid);
		ost[obj.IF] = false;
		nm.Init(
			iface,
			iface,
			'ethdhcp',
			WLANSetupClientAuto,
			WLANSetupDeduct_InBridge,
			WLANSetupClientDown_InBridge,
			{ obj: obj, ssend: '' }
		);
	} else if (obj['Mode'] === 'client') {
		logger.debug("WLAN obj['Mode'] === client");
		DeinitAP(devid);
		nm.Init(iface, iface, 'ethdhcp', WLANSetupClientAuto, null, WLANSetupClientDown, {
			obj: obj,
			ssend: ''
		});
	} else if (obj['Mode'] === 'ap') {
		//APDriver
		logger.debug("WLAN obj['Mode'] === ap");
		DeinitClient(devid);
		ost[obj.IF] = false;
		nm.Init(iface, iface, 'eth', WLANSetupApAuto, WLANSetupDeduct_InBridge, WLANSetupApDown, {
			obj: obj,
			ssend: ''
		});
	} else {
		logger.debug('WLAN error mode!!!');
	}

	console.log('\n\n\n\n\n!!!@@@###devid', devid, '\n\n\n\n\n\n');
	switch (devid) {
		case 'usb.0bda.8178':
			//modem = require('./wifi/rtl8192cu');
			WLAN_SWInit(iface, 'rtl8192cu');
			logger.debug('WLAN found init js script for ', devid);
			break;
		case 'usb.2001.3319':
		case 'usb.0bda.818b':
			console.log('Detect rtl8192eu');
			//modem = require('./wifi/rtl8192cu');
			WLAN_SWInit(iface, 'rtl8192eu');
			logger.debug('WLAN found init js script for ', devid);
			break;
		case 'usb.0bda.8812':
			//modem = require('./wifi/rtl8192cu');
			WLAN_SWInit(iface, 'rtl8812au');
			logger.debug('WLAN found init js script for ', devid);
			break;
		default:
			WLAN_SWInit(iface, 'unrecognized');
			logger.debug('WLAN is unrecognized');
			break;
	}
}

module.exports = {
	WLANSetup: WLANConfig
};
