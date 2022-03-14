const c = require('../../../backCore');
const ex = require('../../../exec');
const fs = require('fs');
let { glob } = require('../main_global.js');

const Ifaces = {
	eth0: ['ethernet_network0', 'Ethernet', true, 'WL', 'eth'],
	eth1: ['ethernet_network1', 'Ethernet1', true, 'WL', 'eth'],
	eth2: ['ethernet_network2', 'Ethernet2', true, 'WL', 'eth'],
	eth3: ['ethernet_network3', 'Ethernet3', true, 'WL', 'eth'],
	//usb0: ['eth2', 'ethernet_network2', 'RNDIS Ethernet', true, cWLN, 'eth'],
	tap0: ['tap_network0', 'TAP network', true, 'WL', 'tap'],
	tap1: ['tap_network1', 'TAP network1', true, 'WL', 'tap'],
	tun0: ['tun_network0', 'TUN network', true, 'W', 'tun'],
	tun1: ['tun_network1', 'TUN network1', true, 'W', 'tun'],
	wlan0: ['wifi_network0', 'WiFi', true, 'WL', 'wlan'],
	wlan1: ['wifi_network1', 'WiFi1', true, 'WL', 'wlan'],
	gsm0: ['gsm_network0', 'GSM', true, 'W', 'gsm'],
	gsm1: ['gsm_network1', 'GSM1', true, 'W', 'gsm'],
	gsm2: ['gsm_network2', 'GSM2', true, 'W', 'gsm'],
	gsm3: ['gsm_network3', 'GSM3', true, 'W', 'gsm'],
	l2tp0: ['l2tp_network0', 'L2TP network', true, 'W', 'l2tp']
};

function Build() {
	const routerSettD = JSON.parse(glob.cache.pages['router'].setting).d;
	let natIF = routerSettD.natIF;
	let brIface = routerSettD.brIface;

	console.log('Regen select_wan buildObj routerSettD', routerSettD);
	let networkName = [];
	let networkVal = [];
	for (let iface in Ifaces) {
		let ifName = Ifaces[iface][1] + ' [' + iface + ']';
		networkName.push(ifName);
		networkVal.push(iface);
	}
	let lanWanName = ['is WAN', 'bridge parts'];
	let lanWanVal = ['wan', 'lan'];

	let tabValue = [];

	let z = 1;
	natIF.forEach((natIFitem) => {
		z++;
		let wan = natIFitem;
		if (wan !== 'br0') {
			let ifName = wan;
			let type = 'wan';

			tabValue.push([ifName, type, z]);
		}
	});

	brIface.forEach((brIfaceItem) => {
		let ifName = brIfaceItem;
		let type = 'lan';
		tabValue.push([ifName, type, z]);
	});

	const page = [
		{
			type: 'delim',
			id: 'seSew',
			name: 'Configure interface'
		},
		{
			name: 'Network table',
			type: 'table',
			id: 'selWanTab',
			edit: true,
			tabh: ['Network', 'Type', 'Prio'],
			value: tabValue,
			jvalue: {
				obj: [
					{
						name: '',
						type: 'sboxradio',
						tabidx: 1,
						value: 'eth0',
						//  id:"ipt_side",
						items_name: networkName,
						items_val: networkVal
					},
					{
						name: '',
						type: 'sboxradio',
						tabidx: 1,
						value: 'wan',
						items_name: lanWanName,
						items_val: lanWanVal
					},
					{
						name: '',
						type: 'tfield',
						value: 100,
						flt: { minmax: [1, 100] },
						fltsett: { event: false },
						stylize: {
							changeclass: {
								input: 'inputBase_inputTab'
							}
						}
					}
				]
			}
		}
	];

	console.log('Regen select_wan buildObj result', page);
	return page;
}

function SaveSettings(obj) {
	console.log('SaveSettings obj', obj);
	selWanTab = obj.selWanTab;
	let natIF = [];
	let brIface = [];
	let selWanTabPrio = [];

	let minIdx = 0;
	let minIdxLast = 0;

	selWanTab.forEach(() => {
		let minPrio = 1000;
		selWanTab.forEach((selWanTabItem, idx) => {
			let prio = parseInt(selWanTabItem[2]);
			//    console.log("minPrio",minPrio,"prio",prio,"minIdxLast",minIdxLast);
			if (minPrio > prio && prio > minIdxLast) {
				minPrio = prio;
				minIdx = idx;
			}
		});
		if (minPrio !== 1000) {
			minIdxLast = minPrio;
			selWanTabPrio.push(selWanTab[minIdx]);
		}
	});

	if (selWanTab.length !== selWanTabPrio.length) {
		return { stat: 'SELWAN_ERROR_PRIO', result: obj };
	}
	//console.log("iface prio",selWanTabPrio);
	//console.log("iface selWanTabPrio[0]",selWanTabPrio[0]);
	selWanTabPrio.forEach((selWanTabPrioItem) => {
		let net = selWanTabPrioItem;
		console.log('net', net);
		let iface = net[0];
		let wanLan = net[1];
		if (wanLan === 'wan') {
			natIF.push(iface);
			console.log('natIF', natIF);
		}
		if (wanLan === 'lan') {
			brIface.push(iface);
		}
	});

	natIF.push('br0');
	let routerSett = JSON.parse(glob.cache.pages['router'].setting);
	routerSett['d']['brIface'] = brIface;
	routerSett['d']['natIF'] = natIF;

	console.log('Save new router.set', routerSett);
	const rfname = c.CACHE_PATH + '/settings.router.set';
	fs.writeFileSync(rfname, JSON.stringify(routerSett), 'utf-8');
	ex.ExecNoOutSync(c.SaveSignSettingForBash(rfname, 'settings.router'));

	return { stat: 'ok', result: obj };
}

module.exports = {
	Build,
	SaveSettings
};
