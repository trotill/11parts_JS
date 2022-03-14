/**
 * Created by i7 on 12.08.2018.
 */
const priv = require('../../private.js');
const snmp = require('./../app/base/snmp.js');
const c = require('../../backCore.js');

function GetCPUTemp() {
	return '20';
}

function GetBoardTemp() {
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

	let disp = JSON.parse(c.GetSetting('settings.display'));

	let net = JSON.parse(c.GetSetting('settings.ethernet_network0.native_eth100'));

	sa_conf.node[0][4] = disp.d.description;

	sa_conf.node[1][4] = distro.d.hwmanuf;
	sa_conf.node[2][4] = distro.d.hwmodel;
	sa_conf.node[3][4] = sn;

	sa_conf.node[4][4] = distro.d.swvers;
	sa_conf.node[5][4] = net.d.Ip;
	sa_conf.node[6][4] = net.d.host_name;

	sa_conf.node[7][4] = GetOperTime();
	sa_conf.node[8][4] = GetTotalOperTime();

	sa_conf.node[9][4] = GetBoardTemp(); //total_opertime

	sa_conf.node[10][4] = disp.d.brightness;
	sa_conf.node[11][4] = disp.d.contrast;

	sa_conf.node[12][4] = disp.d.set_source;

	switch (disp.d.set_source) {
		case '0':
			sa_conf.node[13][4] = disp.d.source_description1;
			break;
		case '1':
			sa_conf.node[13][4] = disp.d.source_description2;
			break;
		case '2':
			sa_conf.node[13][4] = disp.d.source_description3;
			break;
		case '3':
			sa_conf.node[13][4] = disp.d.source_description4;
			break;
		case '4':
			sa_conf.node[13][4] = disp.d.source_description5;
			break;
		default:
			sa_conf.node[13][4] = disp.d.source_description1;
	}
	sa_conf.node[14][4] = disp.d.source_description1;
	sa_conf.node[15][4] = disp.d.source_description2;

	sa_conf.node[16][4] = sa_conf.node[14][4];

	sa_conf.node[17][4] = disp.d.set_source;

	sa_conf.node[18][4] = 0;
	sa_conf.node[19][4] = GetCPUTemp();

	sa_conf.node[20][4] = disp.d.source_description3;
	sa_conf.node[21][4] = disp.d.source_description4;
	sa_conf.node[22][4] = disp.d.source_description5;

	sa_conf.ex = {};
	sa_conf.node.forEach((nod) => {
		snmp.RegTrapEvent(nod[0], nod[4]);
		sa_conf.ex[nod[0]] = {
			oid: nod[3],
			type: 's'
		};
		if (sa_conf.node[x][1] !== 'OCTET_STR') sa_conf.ex[nod[0]].type = 'i';
	});

	return sa_conf;
}

module.exports = {
	FillSubagentConf
};
