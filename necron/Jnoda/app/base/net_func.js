/**
 * Created by i7 on 12.03.2017.
 */
const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();
const os = require('os');

async function GetLinkState(iface) {
	let connect_state = 1;
	let operstate;
	let carrier;

	try {
		carrier = await ex.readFilePromise(`/sys/class/net/${iface}/carrier`);
		if (carrier !== '1\n') {
			connect_state = 0;
		} else {
			operstate = await ex.readFilePromise(`/sys/class/net/${iface}/operstate`);
			if (operstate !== 'up\n' && operstate !== 'unknown\n') {
				connect_state = 0;
			}
		}
	} catch (err) {
		connect_state = 0;
	}

	logger.debug(
		'Get_linkState ' + iface + ' carrier ',
		carrier,
		' operstate ',
		operstate,
		' link_state ',
		connect_state
	);

	return connect_state;
}

async function GetConnectState_Carrier(iface) {
	let connect_state = 1;
	let contents;

	try {
		contents = await ex.readFilePromise(`/sys/class/net/${iface}/carrier`);
		if (contents !== '1\n') {
			connect_state = 0;
		}
	} catch (err) {
		connect_state = 0;
	}

	return connect_state;
}

async function GetWiFiSignalPoll(iface) {
	let obj = {
		rssi: '',
		bssid: '',
		ssid: '',
		key_mgmt: '',
		wpa_state: ''
	};

	try {
		let result = await ex.ExecPromise('wpa_cli signal_poll -i ' + iface);
		let str = result.stdout;
		obj.rssi = /RSSI=([0-9]*)/.exec(str)[1];
		result = await ex.ExecPromise('wpa_cli status -i ' + iface);
		str = result.stdout;
		obj.bssid = /bssid=([0-9,a-f.:]*)/.exec(str)[1];
		obj.ssid = /\nssid=([^\s]*)/.exec(str)[1];
		obj.key_mgmt = /key_mgmt=([^\s]*)/.exec(str)[1];
		obj.wpa_state = /wpa_state=([^\s]*)/.exec(str)[1];
	} catch (err) {
		logger.debug('error GetWiFiSignalPoll');
	}

	return obj;
}

async function ParseIfconfigEth(iface, cst) {
	const obj = { ip: '', mac: '', mask: '', bcast: '', mtu: '', rxbytes: '0', txbytes: '0' };
	obj.mtu = 0;
	obj.rxbytes = 0;
	obj.txbytes = 0;
	let setDefIface = () => {
		obj.ip = '';
		obj.mac = '';
		obj.bcast = '';
		obj.mask = '';
	};
	if (cst === 1) {
		const res = os.networkInterfaces();
		if (res[iface]) {
			const ifaceInfo = res[iface].find((info) => {
				if (info.family === 'IPv4') {
					return true;
				}
			});
			if (ifaceInfo) {
				obj.ip = ifaceInfo.address;
				obj.mask = ifaceInfo.netmask;
				obj.ipv = 4;
				obj.mac = ifaceInfo.mac;
				const addr_splitted = obj.ip.split('.');
				const netmask_splitted = obj.mask.split('.');
				obj.bcast = addr_splitted.map((e, i) => (~netmask_splitted[i] & 0xff) | e).join('.');
			} else {
				setDefIface();
			}
		} else {
			setDefIface();
		}
	}

	return obj;
}

function num2dot(num) {
	let d = num % 256;
	for (var i = 3; i > 0; i--) {
		num = Math.floor(num / 256);
		d = (num % 256) + '.' + d;
	}
	return d;
}

//Convert int to dotted net mask
let IntToDotNetMask = (bitCount) => {
	let mask = [];
	for (let i = 0; i < 4; i++) {
		let n = Math.min(bitCount, 8);
		mask.push(256 - Math.pow(2, 8 - n));
		bitCount -= n;
	}
	return mask.join('.');
};

async function FillResolve(dns) {
	//dns - array DNS ip
	console.log('FillResolve ', dns);
	logger.debug('FillResolve ', dns);

	let resolv_f = c.CACHE_PATH + '/resolv.conf';
	let resolv = '';
	for (let z = 0; z < dns.length; z++) {
		resolv += 'nameserver ' + dns[z] + '\n';
	}

	await new Promise((resolve) =>
		fs.writeFile(resolv_f, resolv, (err) => {
			if (err) {
				logger.debug('error save resolv.conf', err);
			} else logger.debug('resolv.conf updated!!');
			resolve();
		})
	);
}

let DotNetMaskToInt = (netmask) =>
	netmask
		.split('.')
		.map(Number)
		.map((part) => (part >>> 0).toString(2))
		.join('')
		.split('1').length - 1;

module.exports = {
	GetLinkState,
	GetLinkState_Carrier: GetConnectState_Carrier,
	ParseIfconfigEth,
	ParseIfconfigPPP: ParseIfconfigEth,
	ParseIfconfigTun: ParseIfconfigEth,
	GetWiFiSignalPoll,
	num2dot,
	IntToDotNetMask,
	DotNetMaskToInt,
	FillResolve
};
