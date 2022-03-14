/**
 * Created by i7 on 06.10.2017.
 */
const c = require('../../backCore');
const fs = require('fs');
const logger = c.getLogger();

const DevicesList = {};
const SWeightList = {};

function GetStringWeight(str) {
	let n = 0;
	for (const ch of str) {
		n += ch.charCodeAt();
	}
	return n;
}

//port - ports must by differents and any
function ForceAddToDevList(devid, port, oclass, devp) {
	const dev = {
		class: oclass,
		type: '',
		order_num: 0,
		interface: '',
		interface_opts: '',
		id: '',
		dev: '',
		dev_opts: {},
		dev_default_param: {},
		dev_name: '',
		devp: ''
	};

	let cdev;
	//try {
	console.log(`ForceAddToDevList devid ${devid} port ${port} oclass ${oclass} devp ${devp}`);
	if (fs.existsSync(c.PRJ_DEV_PATH + '/' + devid, 'utf8')) {
		cdev = JSON.parse(fs.readFileSync(c.PRJ_DEV_PATH + '/' + devid, 'utf8').replace(/\r|\n/g, ''));
		logger.debug('found favorite file', c.PRJ_DEV_PATH + '/' + devid);
	} else {
		if (fs.existsSync(c.DEVICES_PATH + '/' + devid, 'utf8')) {
			cdev = JSON.parse(
				fs.readFileSync(c.DEVICES_PATH + '/' + devid, 'utf8').replace(/\r|\n/g, '')
			);
			logger.debug('found favorite file', c.DEVICES_PATH + '/' + devid);
		} else {
			logger.debug('Device ' + devid + ' not found or incorrect json format');
			return c.ERROR;
		}
	}

	dev.devp = devp;
	for (const key in cdev) {
		// logger.debug("key ",key);
		switch (key) {
			case 'desc':
				dev.dev_name = cdev[key];
				break;
			case 'dev':
				dev.dev = cdev[key];
				break;
			case 'type':
				dev.type = cdev[key];
				break;
			case 'opts':
				dev.opts = cdev[key];
				break;
			case 'interface':
				dev.interface = cdev[key];
				break;
			case 'id':
				dev.id = devid;
				break;
			case 'def_param':
				dev.dev_default_param = cdev[key];
				break;
		}
	}

	dev['idx'] = devid;
	DevicesList[devid] = dev;
	SWeightList[devid] = GetStringWeight(port);
	logger.debug('DevicesList ', DevicesList);
	return devid;
}

function SearchDublicateDevp(devp) {
	for (const dev in DevicesList) {
		if (DevicesList[dev].devp === devp) return true;
	}
	return false;
}
function UpdateDevList(json_obj, BuildDevices, world_map) {
	let dev = {
		class: 'dev',
		type: '',
		order_num: 0,
		interface: '',
		interface_opts: '',
		id: '',
		dev: '',
		dev_opts: {},
		dev_default_param: {},
		dev_name: ''
	};

	let objidx = '';
	let action = 'none';
	let obj;
	//console.log("Event UpdateDevList",json_obj);
	if (json_obj.d.netadd) {
		let ev = json_obj.d.netadd;
		let net_interface = ev.devp;
		console.log('Event UpdateDevList ev', ev);
		if (SearchKnownNetwork(world_map.world.allow_ifaces, net_interface)) {
			if (SearchDublicateDevp(ev.devp)) {
				logger.debug('skip dublicate devp in DevicesList', ev.devp);
				return { action: 'none' };
			}
			const id = 'net.' + ev.devp;
			logger.debug('json_obj', json_obj);
			logger.debug('Device ' + ev.devp + ' add');
			ForceAddToDevList(id, ev.type + ev.port, 'net', ev.devp);

			action = 'add';
			obj = DevicesList[id];
		} else {
			logger.debug('ignore interface type', net_interface);
			console.log('ignore interface type', net_interface);
		}
	}
	if (json_obj.d.netremove) {
		let ev = json_obj.d.netremove;
		let net_interface = ev.devp;
		if (SearchKnownNetwork(world_map.world.allow_ifaces, net_interface)) {
			let id = 'net.' + ev.devp;

			if (DevicesList[id] && BuildDevices[DevicesList[id].type]) {
				RemoveDeviceBuilobjID(
					BuildDevices[DevicesList[id].type].pname + DevicesList[id].order_num,
					BuildDevices[DevicesList[id].type]
				);
				RemoveDeviceBuilobj(
					BuildDevices[DevicesList[id].type].pname + DevicesList[id].order_num,
					BuildDevices[DevicesList[id].type]
				);
			}
			logger.debug('Device ' + ev.devp + ' remove');
			obj = DevicesList[id];
			delete DevicesList[id];
			delete SWeightList[id];
			action = 'remove';
			logger.debug('delete ', id);
			logger.debug('DevicesList ', DevicesList);
			logger.debug('SWeightList ', SWeightList);
		} else logger.debug('ignore interface type', net_interface);
	}

	if (json_obj.d.usbadd) {
		let ev = json_obj.d.usbadd;

		if (ev.vendor !== '') {
			dev.id = 'usb.' + ev.vendor + '.' + ev.product;
			objidx = dev.id + '@' + ev.devp;
			dev['idx'] = objidx;

			dev.interface = 'usb';
			dev.interface_opts = { usbport: ev.devp, control: 0, data: 0 };
			dev.devp = ev.devp;
			let favdev;
			let devid_info = c.PRJ_DEV_PATH + '/' + dev.id;
			logger.debug('check', devid_info);
			if (!fs.existsSync(devid_info, 'utf8')) {
				devid_info = c.DEVICES_PATH + '/' + dev.id;
				logger.debug('check', devid_info);
				if (!fs.existsSync(devid_info, 'utf8')) {
					devid_info = '';
					const gsmf = c.GSMX_DATA_PATH + '/' + ev.vendor + '-' + ev.product;
					logger.debug('not found favorite file', devid_info);
					logger.debug('try search in gsmx', gsmf);

					if (fs.existsSync(gsmf, 'utf8')) {
						var gf = fs.readFileSync(gsmf, 'utf8').replace(/\r|\n/g, '');
						gf = gf.replace(/}}/g, '}');
						gf = gf.replace(/,}/g, '}');

						let gsmx = {};
						try {
							gsmx = JSON.parse(gf);
							logger.debug('found gsmx ', gsmx);
						} catch (e) {
							logger.debug('not parse data for gsmx ', gf);
						}

						if (typeof gsmx.control !== 'undefined') {
							dev.interface_opts.control = gsmx.control;
						}
						if (typeof gsmx.data !== 'undefined') {
							dev.interface_opts.data = gsmx.data;
						}
						dev.type = 'gsm';
						dev.dev_name = gsmx.desc;
						DevicesList[objidx] = dev;
						SWeightList[objidx] = GetStringWeight(ev.devp);
						action = 'add';
						obj = dev;
					} else {
						logger.debug('not found gsmx file ', gsmf);
					}
				}
			}

			if (devid_info.length !== 0) {
				logger.debug('read', devid_info);
				favdev = JSON.parse(fs.readFileSync(devid_info, 'utf8').replace(/\r|\n/g, ''));

				if (favdev?.interface_opts?.control) {
					dev.interface_opts.control = favdev.interface_opts.control;
				}
				if (favdev?.interface_opts?.data) {
					dev.interface_opts.data = favdev.interface_opts.data;
				}

				dev.type = favdev.type;
				dev.dev = favdev.dev;

				dev.dev_opts = favdev.opts;
				dev.dev_default_param = favdev.def_param;
				dev.dev_name = favdev.desc;
				logger.debug('found favorite file', devid_info);
				DevicesList[objidx] = dev;
				SWeightList[objidx] = GetStringWeight(ev.devp);
				action = 'add';
				obj = dev;
			}

			logger.debug('DevicesList ', DevicesList);
			logger.debug('SWeightList ', SWeightList);
		}
	}
	logger.debug('get eventFromUI ', json_obj.d);
	console.log('get eventFromUI ', json_obj.d);

	if (json_obj.d.usbremove) {
		let ev = json_obj.d.usbremove;
		dev.id = undefined;

		if (ev.vendor !== '') dev.id = 'usb.' + ev.vendor + '.' + ev.product;
		else {
			for (let d in DevicesList) {
				if (DevicesList[d].devp === ev.devp) {
					dev.id = DevicesList[d].id;
					console.log('Found dev id in DevicesList', dev.id);
				}
			}
		}
		if (dev.id) {
			objidx = dev.id + '@' + ev.devp;

			action = 'remove';
			if (BuildDevices[DevicesList[objidx].type]) {
				RemoveDeviceBuilobjID(
					BuildDevices[DevicesList[objidx].type].pname + DevicesList[objidx].order_num,
					BuildDevices[DevicesList[objidx].type]
				);
				RemoveDeviceBuilobj(
					BuildDevices[DevicesList[objidx].type].pname + DevicesList[objidx].order_num,
					BuildDevices[DevicesList[objidx].type]
				);
			}
			obj = DevicesList[objidx];
			delete DevicesList[objidx];
			delete SWeightList[objidx];
			logger.debug('delete ', objidx);
			logger.debug('DevicesList ', DevicesList);
			logger.debug('SWeightList ', SWeightList);
		}
	}

	let keysSorted = Object.keys(SWeightList).sort(function (a, b) {
		return SWeightList[a] - SWeightList[b];
	});
	let stype = {};

	keysSorted.forEach((key) => {
		if (!stype[DevicesList[key].type]) {
			stype[DevicesList[key].type] = { n: 0 };
		}

		DevicesList[key].order_num = stype[DevicesList[key].type].n;
		stype[DevicesList[key].type].n++;
	});

	return {
		action: action,
		[action]: obj
	};
}

function NetEventSendToJNODA(dev_event, page_basen, BuildDevice) {
	if (dev_event.action === 'none') return undefined;

	const action = dev_event.action;
	console.log('NetEventSendToJNODA param', dev_event[action]);
	const device = dev_event[action].type + dev_event[action].order_num; //dev_event[action].devp;//type+dev_event[action].order_num;

	//Read router.set
	//Find device

	const router = JSON.parse(c.GetSetting('settings.router'), 'utf8');

	if (Object.keys(router).length === 0) {
		console.log('Error parse settings.router');
		return undefined;
	}

	console.log('settings.router', router);
	const devid = dev_event[action].id;
	const pagename = page_basen + dev_event[action].order_num;

	// if (router!={}) {
	for (const type_role in BuildDevice.dep_cfg.fieldlink) {
		const network_role = BuildDevice.dep_cfg.fieldlink[type_role]; ///get natIf or brIface array
		const type_role_add = BuildDevice.dep_cfg.nameadd[type_role];
		const dev_group = router.d[network_role];
		for (const ifn in dev_group) {
			console.log('device == dev_group[ifn] ', device, dev_group[ifn]);
			if (device !== dev_group[ifn]) continue;
			if (network_role === 'natIF' && device === dev_group[dev_group.length - 1]) {
				console.log('skip last natIF', device);
				//skip br iface in last natIF
				continue;
			}

			console.log('Parse ', 'settings.' + pagename + type_role_add + '.' + devid);

			const psett = JSON.parse(
				c.GetSetting('settings.' + pagename + type_role_add + '.' + devid),
				'utf8'
			);
			if (Object.keys(psett).length === 0) {
				console.log('Error parse ', 'settings.' + pagename + type_role_add + '.' + devid);
				return undefined;
			}

			const nm_conf = {
				inten: 0,
				linken: 1,
				iface: device
			};
			if (network_role === 'natIF') nm_conf.inten = 1;

			return c.PackToJnodaEvent({
				action: 'devact',
				devact: {
					net_conf: psett,
					nm_conf: nm_conf,
					act: action
				}
			});
		}
	}
	return undefined;
}

function CreateDeviceBuilobjID(id, pagename, BuildDevice) {
	for (const prefix in BuildDevice.dep_cfg.nameadd) {
		console.log('###prefix', prefix);

		const fname = c.DEVID_CACHE_PATH + '/devid.' + pagename + BuildDevice.dep_cfg.nameadd[prefix];
		console.log('###fname', fname, 'id', id);
		fs.writeFileSync(fname, id, 'utf-8');
	}
}

function RemoveDeviceBuilobj(pagename, BuildDevice) {
	console.log('BuildDevice', BuildDevice);
	for (const prefix in BuildDevice.dep_cfg.nameadd) {
		const fname =
			c.BUILDOBJ_CACHE_PATH +
			'/buildObj.' +
			pagename +
			BuildDevice.dep_cfg.nameadd[prefix] +
			'.json';
		console.log('remove buildObj', fname);
		try {
			fs.unlinkSync(fname);
		} catch (e) {
			console.log('error: remove buildObj', fname);
		}
	}
}

function RemoveDeviceBuilobjID(pagename, BuildDevice) {
	console.log('BuildDevice', BuildDevice);
	for (const prefix in BuildDevice.dep_cfg.nameadd) {
		const fname = c.DEVID_CACHE_PATH + '/devid.' + pagename + BuildDevice.dep_cfg.nameadd[prefix];
		console.log('remove device id', fname);
		try {
			fs.unlinkSync(fname);
		} catch (e) {
			console.log('error: remove device id', fname);
		}
	}
}

function SearchKnownNetwork(known_nets, found_net) {
	return known_nets.includes(found_net);
}

module.exports = {
	UpdateDevList,
	DevicesList,
	ForceAddToDevList,
	NetEventSendToJNODA,
	CreateDeviceBuilobjID,
	SearchKnownNetwork
};
