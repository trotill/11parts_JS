/**
 * Created by i7 on 28.10.2017.
 */

const c = require('../../../backCore');
const sh = require('../../../shared');
const fs = require('fs');
const priv = require('../../../private.js');

function ReadDevid(setting_name) {
	const sn = c.DEVID_CACHE_PATH + '/' + 'devid.' + setting_name;
	// console.log("Check",setting_name);
	if (fs.existsSync(sn) === true) {
		return fs.readFileSync(sn, 'utf8');
	} else return 'undef';
}

function GetDevDescriton(devid) {
	if (devid === 'undef') return 'undef';

	const devipath = c.PRJ_DEV_PATH + '/' + devid;
	if (!fs.existsSync(devipath, 'utf8')) {
		const devipath2 = c.DEVICES_PATH + '/' + devid;
		if (!fs.existsSync(devipath2, 'utf8')) {
			return 'undef';
		}
	}

	return JSON.parse(fs.readFileSync(devipath, 'utf8')).desc;
}
function GenWanInfo(net) {
	const ifs_obj = {
		iface: '',
		iftype: '',
		setting_name: '',
		show_name: '',
		device: '',
		device_id: '',
		link_state: '',
		internet_state: '',
		ip_addr: '',
		ip_mask: '',
		mac_addr: '',
		gw_addr: '',
		rx_byte: '',
		tx_byte: '',
		ext_info: {}
	};

	const ifeth_obj = {
		Mode: '',
		FakeMac: ''
	};
	const ifwifi_obj = {
		Mode: '',
		Ssid: '',
		Sec: ''
	};

	//  var iface=
	const ifnum = net.match(/\d+$/g, '')[0];
	const iftype = net.replace(/\d+$/g, '');

	//console.log("net ",net);
	//console.log("ifnum ",ifnum);
	//console.log("iftype ",iftype);
	ifs_obj.iface = net;
	ifs_obj.link_state =
		'{"iface":"' + net + '","req":"connect","req_t":1000,"name":["Link"],"value":["lnk"]}';

	ifs_obj.internet_state =
		'{"iface":"' + net + '","req":"connect","req_t":1000,"name":["Link"],"value":["int"]}';
	ifs_obj.ip_addr =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["IP"],"value":["ip"]}';
	ifs_obj.ip_mask =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["Mask"],"value":["mask"]}';
	ifs_obj.mac_addr =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["MAC"],"value":["mac"]}';
	ifs_obj.rx_byte =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["RXB"],"value":["rxbytes"]}';
	ifs_obj.tx_byte =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["TXB"],"value":["txbytes"]}';
	ifs_obj.gw_addr =
		'{"iface":"' + net + '","req":"waninfo","req_t":1000,"name":["GW"],"value":["gw"]}';
	ifs_obj.iftype = iftype;

	let devid;

	switch (iftype) {
		case 'tap':
		case 'eth':
			if (iftype === 'eth') {
				ifs_obj.show_name = 'Ethernet' + ifnum;
				ifs_obj.setting_name = 'ethernet_network' + ifnum;
			} else if (iftype === 'tap') {
				ifs_obj.show_name = 'TAP network' + ifnum;
				ifs_obj.setting_name = 'tap_network' + ifnum;
			}

			devid = ReadDevid(ifs_obj.setting_name);
			if (devid === 'undef') break;

			//console.log('devinfo',devinfo);
			//console.log('ifs_obj.setting_name+devid',ifs_obj.setting_name+'.'+devid);
			if (sh.GetValJSON_F(ifs_obj.setting_name + '.' + devid, 'Mode') === 'stip')
				ifeth_obj.Mode = 'static IP';
			else ifeth_obj.Mode = 'dynamic IP';

			ifeth_obj.FakeMac = sh.GetValJSON_F(ifs_obj.setting_name + '.' + devid, 'FakeMac');
			//console.log('ifeth_obj',ifeth_obj);
			ifs_obj.ext_info = ifeth_obj;
			break;
		case 'wlan':
			{
				ifs_obj.show_name = 'WiFi' + ifnum;
				ifs_obj.setting_name = 'wifi_network' + ifnum;
				devid = ReadDevid(ifs_obj.setting_name);
				if (devid === 'undef') break;
				//devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + "/" + devid, 'utf8'));
				let wifiinfo = JSON.parse(c.GetSetting('settings.' + ifs_obj.setting_name + '.' + devid));
				// var wifiinfo = JSON.parse(fs.readFileSync(c.SETTINGS_STOR[0] +'settings.'+ ifs_obj.setting_name+'.'+devid+'.set', 'utf8'));
				//console.log("wifiinfo ",wifiinfo);
				ifwifi_obj.Mode = wifiinfo.d.Mode;
				ifwifi_obj.Ssid = wifiinfo.d.Ssid;
				//ifwifi_obj.WDS=wifiinfo.WDS;
				ifwifi_obj.Sec = wifiinfo.d.Sec;
				//ifwifi_obj.Sv=wifiinfo.Sv;
				//ifwifi_obj.Sm=wifiinfo.Sm;
				ifs_obj.ext_info = ifwifi_obj;
			}
			break;
		case 'tun':
			ifs_obj.show_name = 'TUN network' + ifnum;
			ifs_obj.setting_name = 'tun_network' + ifnum;
			devid = ReadDevid(ifs_obj.setting_name);
			if (devid === 'undef') break;
			//devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + "/" + devid, 'utf8'));
			ifs_obj.ext_info = {};
			break;
		case 'gsm':
			ifs_obj.show_name = 'GSM' + ifnum;
			ifs_obj.setting_name = 'gsm_network' + ifnum;
			devid = ReadDevid(ifs_obj.setting_name);
			if (devid === 'undef') break;
			//  devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + "/" + devid, 'utf8'));
			ifs_obj.ext_info = {};
			break;
		case 'l2tp':
			ifs_obj.show_name = 'L2TP' + ifnum;
			ifs_obj.setting_name = 'l2tp_network' + ifnum;
			devid = ReadDevid(ifs_obj.setting_name);
			if (devid === 'undef') break;
			// devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + "/" + devid, 'utf8'));
			ifs_obj.ext_info = {};
			break;
		default:
			ifs_obj.show_name = 'Undef device';
			ifs_obj.setting_name = 'undef' + ifnum;
			//  devinfo['desc']='undef';
			devid = 'undef';
			ifs_obj.ext_info = {};
			break;
	}

	ifs_obj.device = GetDevDescriton(devid); //devinfo.desc;
	ifs_obj.device_id = devid;

	// console.log('ifs_obj ',ifs_obj);
	return ifs_obj;
}

function BuildObjWAN(tree, wans) {
	wans.forEach((wan, i) => {
		tree.push({
			type: 'switch',
			value: false,
			id: 'show_det' + i,
			name: wan.show_name,
			data: [
				{
					type: 'label',
					id: 'show_name' + i,
					value: wan.show_name,
					name: 'Device'
				},
				{
					type: 'label',
					id: 'device' + i,
					value: wan.device + '/' + wan.device_id,
					name: 'Name/ID'
				},
				{
					type: 'label',
					id: 'link_state' + i,
					rvalue: wan.link_state,
					name: 'Link status'
				},
				{
					type: 'label',
					id: 'internet_state' + i,
					rvalue: wan.internet_state,
					name: 'Internet status'
				},
				{
					type: 'label',
					id: 'ipaddr' + i,
					rvalue: wan.ip_addr,
					name: 'IP address'
				},
				{
					type: 'label',
					id: 'ipmask' + i,
					rvalue: wan.ip_mask,
					name: 'IP mask'
				},
				{
					type: 'label',
					id: 'gw_addr' + i,
					rvalue: wan.gw_addr,
					name: 'Gateway IP'
				},
				{
					type: 'label',
					id: 'mac_addr' + i,
					rvalue: wan.mac_addr,
					name: 'MAC address'
				},
				{
					type: 'label',
					id: 'rx_byte' + i,
					rvalue: wan.rx_byte,
					name: 'RX bytes'
				},
				{
					type: 'label',
					id: 'tx_byte' + i,
					rvalue: wan.tx_byte,
					name: 'TX bytes'
				}
			]
		});
		const l = tree.length - 1;
		switch (wan.iftype) {
			case 'tap':
			case 'eth':
				tree[l].data.push({
					type: 'label',
					id: 'ipMode' + i,
					value: wan.ext_info.Mode,
					name: 'IP mode'
				});
				break;
			case 'wlan':
				tree[l].data.push({
					type: 'label',
					id: 'wifiMode' + i,
					value: wan.ext_info.Mode,
					name: 'WIFI mode'
				});
				tree[l].data.push({
					type: 'label',
					id: 'extSsid' + i,
					value: wan.ext_info.Ssid,
					name: 'SSID'
				});

				tree[l].data.push({
					type: 'label',
					id: 'Sec' + i,
					value: wan.ext_info.Sec,
					name: 'Secure type'
				});

				break;
		}
	});
}

function BuildObjGenWAN(tree) {
	tree.push({
		type: 'delim',
		id: 'seWan',
		name: 'WAN'
	});
	tree.push({
		name: 'Current WAN',
		type: 'tfield',
		id: 'currwan',
		rvalue: '{"iface":"","req":"waninfo","req_t":1000,"name":["swan"],"value":["srcwan"]}',
		isRo: true
	});
}

function Build() {
	console.log('---------------------------------------------------------------------State ');
	const natIF = sh.GetValJSON_F('router', 'natIF');
	const wan = [];
	const show_if = [];
	const show_name = [];

	let gwi;
	for (let wif = 0; wif < natIF.length - 1; wif++) {
		gwi = GenWanInfo(natIF[wif]);
		if (gwi.device_id !== 'undef') wan.push(gwi);

		show_if.push(natIF[wif] + 'spd');
		show_name.push('WAN(' + natIF[wif] + ')');
	}

	//console.log("show_name ",show_name);
	//console.log("lan ",lan);

	let sn = priv.GetPrivateValue('sys.sn.sn');
	if (!sn) sn = '00000000';

	const data_vers = [
		{
			type: 'label',
			id: 'swvers',
			svalue: [
				'{"readfile":"distro","sep":"","value":"swvers"}',
				'{"readfile":"distro","sep":".","value":"swbuild"}'
			],
			name: 'Software version'
		},
		{
			type: 'label',
			id: 'hwvers',
			svalue: ['{"readfile":"distro","sep":"","value":"hwvers"}'],
			name: 'Hardware version'
		},
		{
			type: 'label',
			id: 'hwmsnyy',
			value: sn,
			name: 'Serial number'
		},
		{
			type: 'delim',
			id: 'stNet',
			name: 'Networks'
		},
		{
			type: 'graph_line',
			name: 'Net speed',
			id: 'netstat',
			style: 'line',
			xname: 'Time',
			yname: 'kb/s (rx+tx)',
			points: 30,
			css: 'height:auto',
			rvalue:
				'{"iface":"","req":"sarnet","req_t":0,"name":' +
				JSON.stringify(show_name) +
				',"value":' +
				JSON.stringify(show_if) +
				'}'
		}
	];
	//console.log("BuildObjGenWAN ");
	//console.log("BuildObjGenWAN ",data_vers);
	if (natIF.length >= 2 && show_if.length !== 0) {
		//[...,br0]
		BuildObjGenWAN(data_vers);
		BuildObjWAN(data_vers, wan);
	}

	data_vers.push({
		type: 'delim',
		id: 'seSys',
		name: 'System'
	});
	let cpu_cnt;
	try {
		cpu_cnt = sh.GetValJSON_F('distro', 'cpu_count');
		if (cpu_cnt === '') cpu_cnt = 0;
	} catch (e) {
		cpu_cnt = 0;
	}

	data_vers.push({
		name: 'CPU temperature',
		type: 'tfield',
		id: 'cputemp',
		rvalue: '{"iface":"","req":"cpu_t_imx6","value":"cputemp","req_t":1000}',
		isRo: true
	});
	//console.log("M1!!!! ");
	let cpuinfo = {
		iface: '',
		req: 'sarcpu',
		req_t: 0,
		name: ['Average'],
		value: ['allload']
	};
	for (var cp = 0; cp < cpu_cnt; cp++) {
		cpuinfo.name.push('Core' + cp);
		cpuinfo.value.push(cp + 'load');
	}

	//   console.log("M2!!!! ");
	data_vers.push({
		type: 'graph_bar',
		name: 'CPU load (%)',
		id: 'cpustat',
		style: 'horizontalBar',
		xname: 'Load',
		yname: 'Cpu',
		xscale: 100,
		css: 'height:20%',
		rvalue: JSON.stringify(cpuinfo)
	});
	data_vers.push({
		type: 'graph_bar',
		name: 'CPU0 freq',
		id: 'cpufreq_imx',
		style: 'horizontalBarStacked',
		xname: 'Freq',
		yname: 'Freq',
		css: 'height:1%',
		//  colors: ['#0373fb','#424243'],
		rvalue:
			'{"iface":"","req":"cpufreq0_imx6","req_t":1000,"name":["Current (MHz)","Max (Mhz)"],"value":["curr","max"]}'
	});
	//  console.log("M3!!!! ");
	data_vers.push({
		type: 'graph_bar',
		name: 'RAM use (MByte)',
		id: 'sarram',
		style: 'horizontalBarStacked',
		xname: 'kByte',
		yname: 'Time',
		css: 'height:20%',
		colors: ['#0373fb', '#424243'],
		rvalue:
			'{"iface":"","req":"sarram","req_t":1000,"name":["Used memory","Total memory"],"value":["memused","memtotal"]}'
	});

	// console.log("M4!!!! ");
	data_vers.push({
		type: 'label',
		id: 'uptime',
		rvalue: '{"iface":"","req":"uptime","req_t":30000,"name":["ut"],"value":["uptime"]}',
		name: 'work time (d h:m)',
		past: {
			jq: '.router_footer',
			type: 'appendTo'
		}
	});

	data_vers.push({
		type: 'label',
		id: 'ltime',
		rvalue: '{"iface":"","req":"life_time","req_t":30000,"name":["lt"],"value":["ltime"]}',
		name: 'total time (d h:m)',
		past: {
			jq: '.router_footer',
			type: 'appendTo'
		}
	});

	return data_vers;
	//console.log("State finish!!!! ",JSON.stringify({vers:data_vers}));
}

module.exports = {
	Build
};
