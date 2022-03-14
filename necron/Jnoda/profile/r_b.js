/**
 * Created by i7 on 12.08.2018.
 */
const priv = require('../../private.js');
const snmp = require('./../app/base/snmp.js');
const c = require('../../backCore.js');

function GetSourceTemp() {
	return '20';
}

function GetOperTime() {
	return '10';
}

function GetTotalOperTime() {
	return '0';
}

function FillSubagentConf(obj, sa_conf) {
	sa_conf.agentx_enable = obj.agentx_en === 'true';

	const distro = JSON.parse(c.GetSetting('settings.distro'));
	let sn = priv.GetPrivateValue('sys.sn.sn');
	if (sn === undefined) sn = '00000000';

	const net = JSON.parse(c.GetSetting('settings.device'));
	if (net.d === undefined) net['d'] = 'noname';

	sa_conf.node[0][4] = '11-parts demo';
	sa_conf.node[1][4] = distro.d.hwmanuf;
	sa_conf.node[2][4] = distro.d.hwmodel;
	sa_conf.node[3][4] = sn;
	sa_conf.node[4][4] = distro.d.swvers;
	sa_conf.node[5][4] = net.d.hostname;
	sa_conf.node[6][4] = GetOperTime();
	sa_conf.node[7][4] = GetTotalOperTime();
	sa_conf.node[8][4] = GetSourceTemp(); //total_opertime

	sa_conf.ex = {};
	for (var x = 0; x < sa_conf.node.length; x++) {
		console.log('sa_conf.node[x][0]', sa_conf.node[x][0]);
		snmp.RegTrapEvent(sa_conf.node[x][0], sa_conf.node[x][4]);
		sa_conf.ex[sa_conf.node[x][0]] = {};
		sa_conf.ex[sa_conf.node[x][0]] = {
			oid: sa_conf.node[x][3],
			type: 's'
		};
		if (sa_conf.node[x][1] !== 'OCTET_STR') sa_conf.ex[sa_conf.node[x][0]].type = 'i';
	}

	return sa_conf;
}

module.exports = {
	FillSubagentConf
};
