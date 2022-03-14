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
	if (!sn) sn = '00000000';

	const disp = JSON.parse(c.GetSetting('settings.display'));
	const net = JSON.parse(c.GetSetting('settings.ethernet_network0.native_eth100'));

	sa_conf.node[0][4] = disp.d.description;

	sa_conf.node[1][4] = distro.d.hwmanuf;
	sa_conf.node[2][4] = distro.d.hwmodel;
	sa_conf.node[3][4] = sn;

	sa_conf.node[4][4] = distro.d.swvers;
	sa_conf.node[5][4] = net.d.host_name;
	sa_conf.node[6][4] = GetOperTime();
	sa_conf.node[7][4] = GetTotalOperTime();

	sa_conf.node[8][4] = GetSourceTemp(); //total_opertime
	sa_conf.node[9][4] = disp.d.brightness;
	sa_conf.node[10][4] = disp.d.contrast;
	sa_conf.node[11][4] = disp.d.sharpness;

	sa_conf.node[12][4] = disp.d.saturation;
	sa_conf.node[13][4] = disp.d.set_source;

	if (sa_conf.node[13][4] === '0') sa_conf.node[16][4] = disp.d.source_description1;
	//source_description
	else sa_conf.node[16][4] = disp.d.source_description2; //source_description

	sa_conf.node[14][4] = disp.d.source_description1;
	sa_conf.node[15][4] = disp.d.source_description2;

	sa_conf.ex = {};
	for (var x = 0; x < sa_conf.node.length; x++) {
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
