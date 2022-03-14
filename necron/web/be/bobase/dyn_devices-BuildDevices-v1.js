/**
 * Created by i7 on 02.06.2019.
 */
const c = require('../../../backCore');
const logger = c.getLogger();

const gsm = require('./../../../Jnoda/app/base/gsm');

const u = require('./../../../utils');

const version = {
	tun: 'v1U',
	tap: 'v1U',
	gsm: 'v1',
	ethlan: 'v1br'
};
function GenConf(dev, conf, iswan) {
	//console.log('GenConf',dev,'conf',conf,'iswan',iswan);
	return require('./dyn_devices-GenConf-v1.js').GenConf(dev, conf, iswan);
}

function BuildObjWiFiAP(bobjname, dev) {
	let snum;
	if (dev.order_num === 0) snum = '';
	else snum = dev.order_num.toString();
	const wifi_ap = [
		{
			type: 'delim',
			id: 'wiWap',
			name: 'WiFi' + snum + ' access point'
		},
		{
			name: 'WiFi mode',
			type: 'tfield',
			id: 'Mode',
			value: 'ap',
			isRo: true
		},
		{
			type: 'br'
		},
		{
			name: 'SSID',
			type: 'tfield',
			id: 'Ssid',
			value: 'IoT',
			flt: { len: ['3', '29'], sym: ['en'] }
		},
		{
			type: 'br'
		},
		{
			type: 'switch',
			value: false,
			id: 'swapn',
			name: 'Show APN',
			data: [
				{
					name: 'WiFi APN',
					type: 'table',
					id: 'apn_tab',
					edit: false,
					css: 'max-height: 400px; overflow: auto;',
					tabh: [
						//"SSID", "RSSI",
						'SSID',
						'Quality',
						'Encrypt',
						'Channel'
					],
					rvalue: [
						'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"aplist","req_t":10000,"value":[1,3,4,2]}'
					],
					jvalue: {
						css: 'overflow:auto; color:#000000;text-align:left;max-width:100px'
					}
				}
			]
		},
		{
			type: 'br'
		},
		{
			type: 'switch',
			value: false,
			id: 'Bct',
			name: 'broadcast SSID'
		},
		{
			name: 'Region',
			type: 'sbox',
			value: 'RU',
			id: 'Reg',
			tabidx: 1,
			items_name: ['Russia', 'US'],
			items_val: ['RU', 'US']
		},
		{
			type: 'br'
		},
		{
			name: 'Password',
			type: 'tfield',
			id: 'Passwd',
			value: '',
			flt: { len: ['8', '63'], sym: ['en'] }
		},
		{
			type: 'br'
		},
		{
			type: 'switch',
			value: false,
			id: 'WDS',
			name: 'WDS'
		},
		{
			type: 'delim',
			id: 'wiWps',
			name: 'WiFi phy settings'
		},
		{
			name: 'WiFi mode',
			type: 'sbox',
			value: '11b',
			id: 'M',
			tabidx: 1,
			items_name: ['11b', '11g', '11n', '11bg', '11bgn'],
			items_val: ['11b', '11g', '11n', '11bg', '11bgn']
		},
		{
			name: 'WiFi channel width',
			type: 'sbox',
			value: 'auto',
			id: 'W',
			tabidx: 1,
			items_name: ['Auto', '20MHz', '40MHz'],
			items_val: ['auto', '20', '40']
		},
		{
			type: 'br'
		},
		{
			name: 'WiFi channel num',
			type: 'sbox',
			value: 'auto',
			id: 'Ch',
			tabidx: 1,
			items_name: ['Auto', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
			items_val: ['auto', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']
		},
		{
			type: 'delim',
			id: 'wiWss',
			name: 'WiFi secure settings'
		},
		{
			name: 'Secure type',
			type: 'sbox',
			value: 'WPAe',
			id: 'Sec',
			tabidx: 1,
			items_name: ['WPA enterprise', 'WPA personal', 'No secure'],
			items_val: ['WPAe', 'WPA', 'NO']
		},
		{
			name: 'WPA  version',
			type: 'sbox',
			value: 'WPA',
			id: 'Sv',
			tabidx: 1,
			items_name: ['WPA', 'WPA2'],
			items_val: ['WPA', 'WPA2']
		},
		{
			type: 'br'
		},
		{
			name: 'Secure mode',
			type: 'sbox',
			value: 'AES',
			id: 'Sm',
			tabidx: 1,
			items_name: ['AES', 'TKIP'],
			items_val: ['AES', 'TKIP']
		},
		{
			type: 'br'
		},
		{
			name: 'Key update interval',
			type: 'tfield',
			id: 'KeyInt',
			value: '86400',
			flt: { minmax: ['8', '100000'] }
		}
	];

	u.createBuildObj({ ap: GenConf(dev, wifi_ap, 0) }, bobjname + dev.order_num + '.lan');
}

function BuildObjWiFiClient(bobjname, dev) {
	let snum;
	if (dev.order_num === 0) snum = '';
	else snum = dev.order_num.toString();

	const wifi_client = [
		{
			type: 'delim',
			id: 'wiCm',
			name: 'WiFi' + snum + ' client mode'
		},
		{
			name: 'WiFi mode',
			type: 'tfield',
			id: 'Mode',

			value: 'client',
			isRo: true
		},
		{
			name: 'MAC address',
			type: 'tfield',
			id: 'shMac',
			rvalue:
				'{"iface":"' +
				dev.type +
				dev.order_num +
				'","req":"ifconf","req_t":1000,"name":["MAC"],"value":["mac"]}',
			isRo: true
		},
		{
			name: 'IP address',
			type: 'tfield',
			id: 'shIP',
			rvalue:
				'{"iface":"' +
				dev.type +
				dev.order_num +
				'","req":"ifconf","req_t":1000,"name":["IP"],"value":["ip"]}',
			isRo: true
		},
		{
			type: 'br'
		},
		{
			type: 'var',
			id: 'dhcp_en',
			value: 'true',
			name: 'udh'
		},
		{
			name: 'SSID',
			type: 'tfield',
			id: 'Ssid',
			value: '',
			flt: { len: ['3', '40'] }
		},
		{
			type: 'br'
		},
		/*В новой версии удалена эта таблица, т.к. multiform не поддерж. эвенты и не позволяет выбрать APN по клику
		 для этой штуки нужно разработать отдельный компонент
		{
			type: 'switch',
			value: false,
			id: 'swapn',
			name: 'Show APN',
			data: [
				{
					name: 'WiFi APN',
					type: 'table',
					id: 'apn_tab',
					edit: false,
					//css: 'max-height: 400px; overflow: auto;',
					value: [[]],
					tabh: [
						//"SSID", "RSSI",
						'SSID',
						'Quality',
						'Encrypt',
						'Channel'
					],
					rvalue: [
						'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"aplist","req_t":10000,"value":[1,3,4,2]}'
					],
					jvalue: {
						obj: [
							{
								name: 'SSID',
								type: 'tfield',
								showname: false,
								value: '',
								//css: 'width:100%',
								isRo: true
							},
							{
								name: 'Quality',
								type: 'tfield',
								showname: false,
								value: '',
								isRo: true,
								stylize: {
									changeclass: {
										inputRo: 'inputBase_inputW90'
									}
								}
								//css: 'width:100%'
							},
							{
								name: 'Encrypt',
								type: 'tfield',
								showname: false,
								value: '',
								isRo: true,
								stylize: {
									changeclass: {
										inputRo: 'inputBase_inputW90'
									}
								}
								//css: 'width:100%'
							},
							{
								name: 'Channel',
								type: 'tfield',
								showname: false,
								value: '',
								isRo: true,
								stylize: {
									changeclass: {
										inputRo: 'inputBase_inputW90'
									}
								}
								//css: 'width:100%'
							}
						]
					}
				}
			]
		},*/
		{
			type: 'br'
		},
		{
			name: 'Password',
			type: 'tfield',
			id: 'Passwd',
			value: '',
			isSec: true,
			flt: { len: ['8', '63'] }
		},
		{
			type: 'br'
		},
		{
			name: 'Secure type',
			type: 'var',
			value: 'WPA',
			cvalue: 'WPA',
			id: 'Sec'
		}
		/*{
            name: 'Secure type',
            type: 'sbox',
            value: 'WPAe',
            id: 'Sec',
            tabidx: 1,
            items_name:  [
                "WPA/WPA2 enterprise","WPA/WPA2 personal","No secure",
            ],
            items_val:  [
                "WPAe","WPA","NO",
            ],
        },*/
	];

	u.createBuildObj({ Client: GenConf(dev, wifi_client, 1) }, bobjname + dev.order_num);
}

function BuildObjEthLan(bobjname, dev) {
	const staticip = require('./dyn_devices-ethlan-' + version['ethlan'] + '.js').a(bobjname, dev);
	u.createBuildObj({ LAN: GenConf(dev, staticip, 0) }, bobjname + dev.order_num + '.lan');
}

function BuildObjTUN(bobjname, dev) {
	const r = require('./dyn_devices-tun-' + version['tun'] + '.js').a(bobjname, dev);
	u.createBuildObj({ IP: GenConf(dev, r, 1) }, bobjname + dev.order_num);
}

function BuildObjTUN_Lan(bobjname, dev) {
	const r = require('./dyn_devices-tun-' + version['tun'] + '.js').a(bobjname, dev);
	u.createBuildObj({ LAN: GenConf(dev, r, 0) }, bobjname + dev.order_num + '.lan');
}

function BuildObjPPP(bobjname, dev) {
	const staticip = [
		{
			type: 'delim',
			id: 'etCon',
			name: 'VPN' + dev.order_num + ' network'
		},
		{
			type: 'switch',
			value: false,
			id: 'usedns',
			name: 'DNS settings',
			data: [
				{
					name: 'Primary DNS IP',
					type: 'tfield',
					id: 'dhDNS',
					flt: { chain: ['ip'] },
					value: '8.8.8.8'
				},
				{
					name: 'Alternate DNS IP',
					type: 'tfield',
					id: 'dhDNSex',
					flt: { chain: ['ip'] },
					value: '192.168.0.1'
				}
			]
		}
	];

	u.createBuildObj({ tun: GenConf(dev, staticip, 1) }, bobjname + dev.order_num);
}

function BuildObjTap(bobjname, dev) {
	const r = require('./dyn_devices-tap-' + version['tap'] + '.js').a(bobjname, dev);
	u.createBuildObj({ IP: GenConf(dev, r, 1) }, bobjname + dev.order_num);
}

function BuildObjEth(bobjname, dev) {
	// console.log("!!!!!!DEV!!!!!!!",dev);
	const ipconf = [
		{
			type: 'delim',
			id: 'etCon',
			name: 'Ethernet' + dev.order_num + ' config'
		},
		{
			name: 'MAC address',
			type: 'tfield',
			id: 'shMac',
			rvalue:
				'{"iface":"' +
				dev.type +
				dev.order_num +
				'","req":"ifconf","req_t":1000,"name":["MAC"],"value":["mac"]}',
			isRo: true
		},
		{
			name: 'IP mode',
			type: 'sbox',
			value: 'stip',
			id: 'Mode',
			tabidx: 1,
			items_name: ['Static IP', 'DHCP'],
			items_val: ['stip', 'dhcp'],
			spage: {
				stip: [
					{
						name: 'IP address',
						type: 'tfield',
						id: 'Ip',
						value: '',
						flt: { ip: [] }
					},
					{
						name: 'IP Mask',
						type: 'tfield',
						id: 'Ms',
						value: '255.255.255.0',
						flt: { chain: ['ip'] }
					},
					{
						name: 'Gateway IP',
						type: 'tfield',
						id: 'Gw',
						value: '192.168.0.1',
						flt: { chain: ['ip'] }
					},
					{
						type: 'br'
					},
					{
						type: 'switch',
						value: false,
						id: 'FakeMac',
						name: 'Fake MAC address',
						data: [
							{
								type: 'delim',
								id: 'delimMac',
								name: 'Input MAC address'
							},
							{
								name: 'MAC address',
								type: 'tfield',
								id: 'Mac',
								flt: { len: ['17', '17'], chain: ['mac', 'upreg'] },
								value: '00:80:0F:95:19:0F'
							}
						]
					}
				],
				dhcp: [
					{
						name: 'IP address',
						type: 'tfield',
						id: 'shIP',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["IP"],"value":["ip"]}',
						isRo: true
					},
					{
						type: 'switch',
						value: false,
						id: 'FakeMac',
						name: 'Fake MAC address',
						data: [
							{
								type: 'delim',
								id: 'delimMac',
								name: 'Input MAC address'
							},
							{
								name: 'MAC address',
								type: 'tfield',
								id: 'Mac',
								flt: { len: ['17', '17'], chain: ['mac', 'upreg'] },
								value: '00:80:0F:95:19:0F'
							}
						]
					}
				]
			}
		},
		{
			type: 'switch',
			value: false,
			id: 'usedns',
			name: 'DNS settings',
			data: [
				{
					name: 'Primary DNS IP',
					type: 'tfield',
					id: 'dhDNS',
					flt: { chain: ['ip'] },
					value: '8.8.8.8'
				},
				{
					name: 'Alternate DNS IP',
					type: 'tfield',
					id: 'dhDNSex',
					flt: { chain: ['ip'] },
					value: '192.168.0.1'
				}
			]
		},
		{
			type: 'switch',
			value: false,
			id: 'UseAltIP',
			name: 'Add second static IP',
			data: [
				{
					name: 'IP',
					type: 'tfield',
					value: '',
					id: 'exIp',
					flt: { chain: ['ip'] }
				}
			]
		}
	];

	u.createBuildObj({ IP: GenConf(dev, ipconf, 1) }, bobjname + dev.order_num);
}

function BuildObjGSM(bobjname, dev) {
	logger.debug('Generate GSM modem settings');

	console.log('bobjname', bobjname, ' dev ', dev);

	const web = [
		{
			type: 'delim',
			id: 'gsmU',
			name: 'USB modem'
		},
		{
			name: 'Operator Name',
			type: 'tfield',
			id: 'oname',
			flt: { len: ['2', '20'], sym: ['ern'] },
			value: ''
		},
		{
			type: 'br',
			id: 'bse3'
		}
	];

	let info = dev.interface === 'usb' ? gsm.dynFillInfo(dev) : {};

	const newweb = require('./dyn_devices-gsm-' + version['gsm'] + '.js').a({
		dev: dev,
		gsm: gsm,
		info: info,
		cfgobj: web
	});

	u.createBuildObj({ gsm: GenConf(dev, newweb, 1) }, bobjname + dev.order_num);
}

function BuildDevices() {
	return {
		wlan: {
			pname: 'wifi_network', //page name
			mname: 'WiFi', //show name
			BuildObj: {
				//<dynamic>:<BuildObj name>
				wan: BuildObjWiFiAP,
				lan: BuildObjWiFiClient
			},
			dep_cfg: {
				//settings.router.set
				confname: 'router',
				fieldlink: {
					//link field name with dynamic
					wan: 'natIF', //<dynamic>:d.<dev array>
					lan: 'brIface' //<dynamic>:d.<dev array>
				},
				nameadd: {
					//link dynamic with name addition setting.name.set -> setting.name.lan.set
					wan: '',
					lan: '.lan'
				}
			}
		},
		gsm: {
			pname: 'gsm_network',
			mname: '3G/LTE',
			BuildObj: {
				wan: BuildObjGSM
			},
			dep_cfg: {
				//settings.router.set
				confname: 'router',
				fieldlink: {
					wan: 'natIF' //<dynamic>:d.<dev array>
				},
				nameadd: {
					//link dynamic with name addition setting.device.set -> setting.device.lan.set
					wan: ''
				}
			}
		},
		eth: {
			pname: 'ethernet_network',
			mname: 'Ethernet',
			BuildObj: {
				lan: BuildObjEthLan,
				wan: BuildObjEth
			},
			dep_cfg: {
				//settings.router.set
				confname: 'router',
				fieldlink: {
					wan: 'natIF', //<dynamic>:d.<dev array>
					lan: 'brIface' //<dynamic>:d.<dev array>
				},
				nameadd: {
					//link dynamic with name addition setting.name.set -> setting.name.lan.set
					wan: '',
					lan: '.lan'
				}
			}
		},
		tap: {
			pname: 'tap_network',
			mname: 'TAP network',
			BuildObj: {
				lan: BuildObjEthLan,
				wan: BuildObjTap
			},
			dep_cfg: {
				//settings.router.set
				confname: 'router',
				fieldlink: {
					wan: 'natIF', //<dynamic>:d.<dev array>
					lan: 'brIface' //<dynamic>:d.<dev array>
				},
				nameadd: {
					//link dynamic with name addition setting.name.set -> setting.name.lan.set
					wan: '',
					lan: '.lan'
				}
			}
		},
		tun: {
			pname: 'tun_network',
			mname: 'TUN network',
			BuildObj: {
				wan: BuildObjTUN,
				lan: BuildObjTUN_Lan
			},
			dep_cfg: {
				//settings.router.set
				confname: 'router',
				fieldlink: {
					wan: 'natIF', //<dynamic>:d.<dev array>
					lan: 'brIface'
				},
				nameadd: {
					//link dynamic with name addition setting.name.set -> setting.name.lan.set
					wan: '',
					lan: '.lan'
				}
			}
		},
		l2tp: {
			pname: 'l2tp_network',
			mname: 'L2TP network',
			BuildObj: {
				wan: BuildObjPPP
			},
			dep_cfg: {
				//settings.router.set
				confname: 'router',
				fieldlink: {
					wan: 'natIF' //<dynamic>:d.<dev array>
				},
				nameadd: {
					//link dynamic with name addition setting.name.set -> setting.name.lan.set
					wan: ''
				}
			}
		}
	};
}

module.exports = {
	BuildDevices: BuildDevices,
	version: version
};
