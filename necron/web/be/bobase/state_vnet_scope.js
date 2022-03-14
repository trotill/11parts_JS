const c = require('../../../backCore');
const sh = require('../../../shared');
const fs = require('fs');
const priv = require('../../../private.js');

let lan_giface = 'br0';

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
	let devinfo = { desc: 'undef' };
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

			devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + ifs_obj.setting_name, 'utf8');

			// console.log('devid',devid);
			devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8'));
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
				devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + ifs_obj.setting_name, 'utf8');
				devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8'));
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
			devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + ifs_obj.setting_name, 'utf8');
			devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8'));
			ifs_obj.ext_info = {};
			break;
		case 'gsm':
			ifs_obj.show_name = 'GSM' + ifnum;
			ifs_obj.setting_name = 'gsm_network' + ifnum;
			devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + ifs_obj.setting_name, 'utf8');
			devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8'));
			ifs_obj.ext_info = {};
			break;
		case 'l2tp':
			ifs_obj.show_name = 'L2TP' + ifnum;
			ifs_obj.setting_name = 'l2tp_network' + ifnum;
			devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + ifs_obj.setting_name, 'utf8');
			devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8'));
			ifs_obj.ext_info = {};
			break;
		default:
			ifs_obj.show_name = 'Undef device';
			ifs_obj.setting_name = 'undef' + ifnum;

			devid = 'undef';
			ifs_obj.ext_info = {};
			break;
	}

	ifs_obj.device = devinfo.desc;
	ifs_obj.device_id = devid;

	// console.log('ifs_obj ',ifs_obj);
	return ifs_obj;
}

function GenLanInfo(net) {
	const ifs_obj = {
		iface: '',
		iftype: '',
		setting_name: '',
		show_name: '',
		device: '',
		device_id: '',
		link_state: '',
		mac_addr: '',
		rx_byte: '',
		tx_byte: '',
		ext_info: {}
	};

	const ifwifi_obj = {
		Mode: '',
		Ssid: '',
		Sv: '',
		FreqMode: ''
	};

	//  var iface=
	const ifnum = net.match(/\d+$/g, '')[0];
	const iftype = net.replace(/\d+$/g, '');

	// console.log("lan net ",net);
	// console.log("lan ifnum ",ifnum);
	// console.log("lan iftype ",iftype);
	ifs_obj.iface = net;
	ifs_obj.link_state =
		'{"iface":"' + net + '","req":"connect","req_t":1000,"name":["Link"],"value":["lnk"]}';
	ifs_obj.mac_addr =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["MAC"],"value":["mac"]}';
	ifs_obj.rx_byte =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["RXB"],"value":["rxbytes"]}';
	ifs_obj.tx_byte =
		'{"iface":"' + net + '","req":"ifconf","req_t":1000,"name":["TXB"],"value":["txbytes"]}';
	ifs_obj.iftype = iftype;
	let devinfo = { desc: 'undef' };
	let devid;

	switch (iftype) {
		case 'tap':
		case 'eth':
			if (iftype === 'eth') {
				ifs_obj.show_name = 'Ethernet' + ifnum;
				ifs_obj.setting_name = 'ethernet_network' + ifnum + '.lan';
			} else if (iftype === 'tap') {
				ifs_obj.show_name = 'TAP network' + ifnum;
				ifs_obj.setting_name = 'tap_network' + ifnum + '.lan';
			}
			devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + ifs_obj.setting_name, 'utf8');
			devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8'));
			break;
		case 'wlan':
			{
				ifs_obj.show_name = 'WiFi' + ifnum;
				ifs_obj.setting_name = 'wifi_network' + ifnum + '.lan';
				devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/' + 'devid.' + ifs_obj.setting_name, 'utf8');
				devinfo = JSON.parse(fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8'));
				let wifiinfo = JSON.parse(c.GetSetting('settings.' + ifs_obj.setting_name + '.' + devid));
				// var wifiinfo = JSON.parse(fs.readFileSync(c.SETTINGS_STOR[0] +'settings.'+ ifs_obj.setting_name+'.'+devid+'.set', 'utf8'));
				//console.log("wifiinfo ",wifiinfo);
				ifwifi_obj.Mode = wifiinfo.d.Mode;
				ifwifi_obj.Ssid = wifiinfo.d.Ssid;

				if (wifiinfo.d.Sv === 'WPAWPA2') {
					ifwifi_obj.Sv = 'WPA and WPA2';
				} else {
					ifwifi_obj.Sv = wifiinfo.d.Sv;
				}
				if (typeof wifiinfo.d.M != 'undefined') {
					if (wifiinfo.d.M === 'ac') ifwifi_obj.FreqMode = 'ac (5GHz)';
					else ifwifi_obj.FreqMode = 'bgn (2.4GHz)';
				} else ifwifi_obj.FreqMode = 'bgn (2.4GHz)';

				ifs_obj.ext_info = ifwifi_obj;
			}
			break;

		default:
			{
				ifs_obj.show_name = 'Undef device';
				ifs_obj.setting_name = 'undef' + ifnum;
				devid = 'undef';
				ifs_obj.ext_info = {};
			}
			break;
	}

	ifs_obj.device = devinfo.desc;
	ifs_obj.device_id = devid;

	// console.log('lan ifs_obj ',ifs_obj);
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

function BuildObjLAN(tree, lans) {
	lans.forEach((lan, i) => {
		tree.push({
			type: 'switch',
			value: false,
			id: 'show_detl' + i,
			name: lan.show_name,
			data: [
				{
					type: 'label',
					id: 'show_namel' + i,
					value: lan.show_name,
					name: 'Device'
				},
				{
					type: 'label',
					id: 'devicel' + i,
					value: lan.device + '/' + lan.device_id,
					name: 'Name/ID'
				},
				{
					type: 'label',
					id: 'linkl' + i,
					rvalue: lan.link_state,
					name: 'Link status'
				},
				{
					type: 'label',
					id: 'mac_addrl' + i,
					rvalue: lan.mac_addr,
					name: 'MAC address'
				},
				{
					type: 'label',
					id: 'rx_bytel' + i,
					rvalue: lan.rx_byte,
					name: 'RX bytes'
				},
				{
					type: 'label',
					id: 'tx_bytel' + i,
					rvalue: lan.tx_byte,
					name: 'TX bytes'
				},
				{
					name: 'IP address',
					type: 'label',
					id: 'brip',
					rvalue: `{"iface":"${lan_giface}","req":"ifconf","req_t":1000,"name":["IP"],"value":["ip"]}`
				}
			]
		});

		const l = tree.length - 1;

		switch (lan.iftype) {
			case 'wlan':
				tree[l].data.push({
					type: 'label',
					id: 'wifiModel' + i,
					value: lan.ext_info.Mode,
					name: 'WIFI mode'
				});

				tree[l].data.push({
					type: 'label',
					id: 'extSsidl' + i,
					value: lan.ext_info.Ssid,
					name: 'SSID'
				});

				tree[l].data.push({
					type: 'label',
					id: 'FreqModel' + i,
					value: lan.ext_info.FreqMode,
					name: 'Freq'
				});

				tree[l].data.push({
					type: 'label',
					id: 'Svl' + i,
					value: lan.ext_info.Sv,
					name: 'WPA  version'
				});

				break;
		}
	});
}

function Build() {
	console.log('---------------------------------------------------------------------State ');
	const natIF = sh.GetValJSON_F('router', 'natIF');
	const wan = [];
	const lan = [];
	const lan_if = sh.GetValJSON_F('router', 'brIface');
	const show_if = [];
	const show_name = [];
	// console.log("natIF ",natIF);
	// console.log("brIface ",lan_if);

	lan_giface = natIF[natIF.length - 1];
	for (let wif = 0; wif < natIF.length - 1; wif++) {
		//console.log("ifaces[wif] ",wan_if[wif]);
		//wan_if.push();

		try {
			wan.push(GenWanInfo(natIF[wif]));
		} catch (e) {
			console.log('Error GenWanInfo');
		}
		show_if.push(natIF[wif] + 'spd');
		show_name.push('WAN(' + natIF[wif] + ')');
	}

	lan_if.forEach((lan) => {
		show_if.push(lan + 'spd');
		show_name.push('LAN(' + lan + ')');
		try {
			lan.push(GenLanInfo(lan));
		} catch (e) {
			console.log('Error GenLanInfo');
		}
	});

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
	if (natIF.length >= 2) {
		//[...,br0]
		BuildObjWAN(data_vers, wan);
	}

	// try {
	//  console.log("!!!!!!!!!!LAN");
	// console.log("BuildObjGenLAN ");
	//BuildObjGenLAN(data_vers);
	//console.log("BuildObjLAN ");
	BuildObjLAN(data_vers, lan);
	// console.log("LAN data_vers ",data_vers);
	//}catch(e){}
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
		id: 'cpu_temp',
		rvalue:
			'{"iface":"","args":"","req":"cpu_temp","req_t":1000,"name":["cpu_temp"],"value":["cpu_temp"]}',
		// rvalue: '{"iface":"","req":"cpu_t_imx6","value":"cputemp","req_t":1000}',
		isRo: true
	});
	//console.log("M1!!!! ");
	const cpuinfo = {
		iface: '',
		req: 'sarcpu',
		req_t: 0,
		name: ['Average'],
		value: ['allload']
	};
	for (let cp = 0; cp < cpu_cnt; cp++) {
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
