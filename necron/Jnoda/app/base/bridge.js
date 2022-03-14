/**
 * Created by i7 on 21.03.2017.
 */

const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();
const nm = require('./network_manager');
const lan = require('./lan');

async function SetBr(obj) {
	let param = {
		Iface: [''],
		IP: '',
		Ms: '',
		Gw: '',
		dhDNS: '',
		dhDNSex: '',
		usedns: 'false'
	};

	param.Iface = obj.d['brIface'];
	param.IP = !obj.d['brIP'] ? '' : obj.d['brIP'];

	if (obj.d['Mode']) {
		if (obj.d['Mode'] === 'dhcp') param.IP = '';
	}

	param.Ms = obj.d['brMs'] ? obj.d['brMs'] : (param.Ms = '');
	param.Gw = !obj.d['brGw'] ? param.IP : obj.d['brGw'];

	if (obj.d['brDNS']) {
		param.usedns = 'true';
		param.dhDNS = obj.d['brDNS'];
		if (obj.d['brDNSex']) {
			param.dhDNSex = obj.d['brDNSex'];
		} else param.dhDNSex = param.dhDNS;
	}

	nm.ConfigInternalIface(c.BRIDGE_NAME);
	logger.debug('Create bridge for ', param.Iface, ' with IP-', param.IP);
	await ex.ExecPromise('ifconfig ' + c.BRIDGE_NAME + ' down');
	await ex.ExecPromise('ip addr flush dev ' + c.BRIDGE_NAME);
	await ex.ExecPromise('brctl delbr ' + c.BRIDGE_NAME);
	await ex.ExecPromise('brctl addbr ' + c.BRIDGE_NAME);

	if (param.IP.length !== 0) {
		await lan.LANSetup(
			c.BRIDGE_NAME,
			{
				Mode: 'stip',
				Ip: param.IP,
				Ms: param.Ms,
				Gw: param.Gw,
				dhDNS: param.dhDNS,
				dhDNSex: param.dhDNSex,
				usedns: param.usedns
			},
			undefined
		);
	} else {
		await lan.LANSetup(
			c.BRIDGE_NAME,
			{
				Mode: 'dhcp',
				dhDNS: param.dhDNS,
				dhDNSex: param.dhDNSex,
				usedns: param.usedns
			},
			undefined
		);
	}
	await nm.StartIfaceNM({ iface: c.BRIDGE_NAME, inten: 0, linken: 1 });
	await nm.RestartAllLanIfaces(['br0']);
}

module.exports = {
	SetBr
};
