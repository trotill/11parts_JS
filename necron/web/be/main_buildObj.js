/**
 * Created by i7 on 09.10.2017.
 */
const fs = require('fs');

const c = require('../../backCore');
const logger = c.getLogger();
const ex = require('../../exec.js');

let { glob } = require('./main_global.js');

function CorrectSecItemForUnconf(sec_item, name_item) {
	let exist = false;
	if (sec_item.type === 'user' || sec_item.type === 'dev' || sec_item.type === 'odm') {
		if (sec_item.type === 'dev') {
			let devid = c.DEVID_CACHE_PATH + '/' + 'devid.' + name_item;
			console.log('Read', devid);
			if (fs.existsSync(devid)) {
				let id = fs.readFileSync(devid, 'utf8');
				exist = c.FindSetting('settings.' + name_item + '.' + id);
			} else {
				console.log('Not found', devid);
			}
		} else {
			exist = c.FindSetting('settings.' + name_item);
		}
	} else {
		exist = true;
	}
	return exist;
}

function PageMAP_ToUnconfigured() {
	let result = c.NO_ERROR;
	for (let region in glob.world_map.world.regions) {
		for (let groupName in glob.world_map.world.regions[region].regmap) {
			let mapfname = c.GenPageRegsInCacheMAP_Name(`${region}.${groupName}`); //c.CACHE_PATH + "/" + c.PAGE_REGS;
			let map;
			try {
				map = JSON.parse(fs.readFileSync(mapfname, 'utf8'));
			} catch (e) {
				console.log('Error parse ', mapfname);
				return c.ERROR;
			}

			let need_nnavi = false;
			for (let key in map) {
				//secxx
				if (map[key].items) {
					for (let item in map[key].items) {
						let old_st = map[key].items[item].style;
						if (CorrectSecItemForUnconf(map[key].items[item], item) === false) {
							result = c.ERROR;
							logger.debug('unconf ', 'settings.' + item);
							map[key].items[item].style = 'unconf';
							console.log('------###Change to unconf unconfigured', item);
						}
						if (old_st !== map[key].items[item].style) {
							need_nnavi = true;
						}
					}
				}
			}
			let data = JSON.stringify(map);
			if (need_nnavi) {
				console.log('Send new map to web ui', `${region}.${groupName}`);
				glob.web.SendEventIO_Broadcast(
					c.GenResponseEventObj({
						action: 'nnavi',
						nnavi: data,
						PageRegionName: `${region}.${groupName}`
					})
				);
			}
			fs.writeFileSync(mapfname, data, 'utf-8');
		}
	}

	return result;
}

function SearchSecForDynMarker(map, marker) {
	let result = [];

	for (let sec in map) {
		if (map[sec].dynamic) {
			for (let mk in map[sec].dynamic) {
				if (mk === marker) {
					result.push({ obj: map[sec], objname: sec });
				}
			}
		}
	}
	return result;
}

const old_map = {};
const onrdy_pages = {};
function RebuildOnrdyPages() {
	console.log('RebuildOnrdyPages in ', onrdy_pages);
	for (const idx in onrdy_pages) {
		const itm = require(onrdy_pages[idx].buildObj);
		console.log('Build onrdy ', onrdy_pages[idx].buildObj);
		itm.Build();
	}
}

function CleanAllMap(world_map) {
	for (let region in world_map.world.regions) {
		for (let groupName in world_map.world.regions[region].regmap) {
			let mapfname = c.GenPageRegsInCacheMAP_Name(`${region}.${groupName}`);
			if (fs.existsSync(mapfname)) {
				fs.unlinkSync(mapfname);
			}
			console.log('Delete map', mapfname);
		}
	}
}

function RebuildBuildObj_DependOnMAP(map) {
	for (let key in map) {
		//secxx
		if (map[key].items) {
			for (let item in map[key].items) {
				//logger.debug("Gen new page ",item);
				let type = map[key].items[item].type;
				if (type === 'user' || type === 'user_ro' || type === 'sec') {
					console.log('Reg page', c.BUILDOBJ_PATH + '/' + item + '.js');
					let page_path = c.BUILDOBJ_PATH + '/' + item + '.js';

					if (glob.enable_rebuild_odm) {
						if (require.cache[require.resolve(page_path)]) {
							console.log('Force rebuild page', page_path);
							delete require.cache[require.resolve(page_path)];
						}
					}
					if (fs.existsSync(page_path)) {
						require(page_path).Build();
						logger.debug('Gen new page ', page_path);
					} else {
						logger.debug('Skip gen new page ', page_path, 'not found buildObj');
					}
				} else {
					if (type === 'onrdy')
						onrdy_pages[key] = {
							buildObj: c.BUILDOBJ_PATH + '/' + item + '.js'
						};
				}
			}
		}
	}
}

function AddPageToMAP(page_name, page_ui_name, dyn_marker, src_map) {
	let new_map = JSON.parse(JSON.stringify(src_map));

	if (page_name) {
		//Dynamic page only!!!
		console.log('add page to map', page_name, page_ui_name, dyn_marker);
		const dyn_sections = SearchSecForDynMarker(new_map, dyn_marker);

		dyn_sections.forEach((dynSect) => {
			const mitem = dynSect.obj.dynamic[dyn_marker];
			mitem.mname = page_ui_name;
			if (new_map[dynSect.objname]['items'] === undefined) {
				new_map[dynSect.objname]['items'] = {};
			}
			if (CorrectSecItemForUnconf(mitem, page_name))
				new_map[dynSect.objname]['items'][page_name] = mitem;
			else {
				console.log('------###Skip add', page_name, 'to map');
			}
		});
	}
	return new_map;
}

function InitMAP(world_map) {
	let map;
	let mapFileName;

	for (let region in world_map.world.regions) {
		for (let groupName in world_map.world.regions[region].regmap) {
			mapFileName = c.GenPageRegsInCacheMAP_Name(`${region}.${groupName}`); //получить имя карты
			try {
				map = JSON.parse(fs.readFileSync(mapFileName, 'utf8'));
			} catch (e) {
				map = world_map.world.regions[region].regmap[groupName];
			}

			RebuildBuildObj_DependOnMAP(map);

			let map_str = JSON.stringify(map, 'utf8');
			if (old_map[region] !== map_str) {
				old_map[region] = map_str;
			}
			console.log('create map', mapFileName);
			fs.writeFileSync(mapFileName, map_str, 'utf-8');
		}
	}
}

function AddToMAP(world_map, page_name, page_ui_name, dyn_marker, region, groupName) {
	let map;
	let new_map;
	let changed = false;
	let mapfn = `${region}.${groupName}`;
	let mapfname = c.GenPageRegsInCacheMAP_Name(mapfn); //получить имя карты

	try {
		map = JSON.parse(fs.readFileSync(mapfname, 'utf8'));
	} catch (e) {
		map = world_map.world.regions[region].regmap[groupName];
	}
	console.log('##source map', mapfn);
	new_map = AddPageToMAP(page_name, page_ui_name, dyn_marker, map);

	let data = JSON.stringify(new_map);
	if (old_map[mapfn] !== data) {
		old_map[mapfn] = data;
		changed = true;
	}
	console.log('AddToMAP:write map', mapfname);
	fs.writeFileSync(mapfname, data, 'utf-8');
	return { changed: changed, new_map: new_map };
}

function RemoveMAP_Files() {
	ex.ExecNoOutSync('rm ' + c.CACHE_PATH + '/*.map.json');
	console.log('Remove all map.json');
}

function RebuildMAP_ForDevEngine(BuildDevice, DeviceInList, setting) {
	let sysname = DeviceInList.type + DeviceInList.order_num;
	let numpref = '';

	if (DeviceInList.order_num !== 0) numpref = DeviceInList.order_num;
	let emptyAll = true;
	for (let region in glob.world_map.world.regions) {
		for (let groupName in glob.world_map.world.regions[region].regmap) {
			let mapfn = `${region}.${groupName}`;
			console.log('RebuildMAP_ForDevEngine mapfn', mapfn);
			for (let dynamic in BuildDevice.dep_cfg.fieldlink) {
				// console.log("setting",setting);
				if (
					setting.d[BuildDevice.dep_cfg.fieldlink[dynamic]] === undefined ||
					setting.d[BuildDevice.dep_cfg.fieldlink[dynamic]].length === 0
				) {
					console.log(
						`Field ${dynamic} is empty or undefined, skip config, DeviceInList ${JSON.stringify(
							DeviceInList
						)}`
					);
					continue;
				}
				emptyAll = false;
				let dev_array = setting.d[BuildDevice.dep_cfg.fieldlink[dynamic]];
				///List brIp or natIf

				for (let device in dev_array) {
					if (BuildDevice.dep_cfg.fieldlink[dynamic] === 'natIF') {
						if (dev_array[device] === dev_array[dev_array.length - 1]) {
							continue;
						}
					}
					if (sysname === dev_array[device]) {
						console.log(
							'RebuildMAP_ForDevEngine map AddToMAP',
							BuildDevice.pname + DeviceInList.order_num + BuildDevice.dep_cfg.nameadd[dynamic]
						);
						let res = AddToMAP(
							glob.world_map,
							BuildDevice.pname + DeviceInList.order_num + BuildDevice.dep_cfg.nameadd[dynamic],
							BuildDevice.mname + numpref,
							dynamic,
							region,
							groupName
						);

						if (res.changed) {
							logger.debug(
								'Page registrator, reg page ' +
									BuildDevice.pname +
									DeviceInList.order_num +
									BuildDevice.dep_cfg.nameadd[dynamic] +
									' send nnavi map ' +
									mapfn
							);
							glob.web.SendEventIO_Broadcast(
								c.GenResponseEventObj({
									action: 'nnavi',
									nnavi: res.new_map,
									PageRegionName: mapfn
								})
							);
						}
					}
				}
			}
		}
	}
	if (emptyAll)
		//если пересоздания MAP не произошло, пересоздать принудительно, статичный MAP
		StaticGen();
}
function RebuildMAP_ForDevices(BuildDevices, DevicesList) {
	//НЕ ТРОГАТЬ!!!!
	RemoveMAP_Files();
	//При удалении устройства, нужно пересоздать MAP со всеми устр., т.к. удаление не поддерживается.

	console.log('DevicesList', DevicesList);

	for (let dlidx in DevicesList) {
		let DeviceInList = DevicesList[dlidx];
		if (!BuildDevices[DeviceInList.type]) continue;

		let BuildDevice = BuildDevices[DeviceInList.type];

		let setting;
		console.log(
			`glob.cache.pages[${BuildDevice.dep_cfg.confname}]`,
			glob.cache.pages[BuildDevice.dep_cfg.confname]
		);
		if (glob.cache.pages?.[BuildDevice.dep_cfg.confname]?.setting) {
			setting = JSON.parse(glob.cache.pages[BuildDevice.dep_cfg.confname].setting);
		} else {
			try {
				setting = JSON.parse(c.GetSetting('settings.' + BuildDevice.dep_cfg.confname), 'utf8');
			} catch (e) {
				continue;
			}
		}
		console.log('Run RebuildMAP_ForDevEngine');
		RebuildMAP_ForDevEngine(BuildDevice, DeviceInList, setting);
	}
	//console.log("new world.regions.gw.regmap", world_map.world.regions.gw.regmap);
}

function AddToMAP_OneDevice(BuildDevice, dev) {
	try {
		const setting = JSON.parse(c.GetSetting('settings.' + BuildDevice.dep_cfg.confname), 'utf8');
		RebuildMAP_ForDevEngine(BuildDevice, dev, setting);
	} catch (e) {
		console.log('error parse JSON from read', 'settings.' + BuildDevice.dep_cfg.confname);
	}
}

//отправляет содержимое router.set (<confname>.set) в jnoda для переинициализации
//это используется например когда нужно новое устр. ввести в состав bridge
function GetConfnameContent(item) {
	const confname = item.dep_cfg.confname;
	const setting = JSON.parse(c.GetSetting('settings.' + confname), 'utf8');
	if (setting) {
		return { action: 'rst_set', rst_set: { req: 'apply', apply: setting } };
	}
	return undefined;
}

function StaticGen() {
	InitMAP(glob.world_map);
}

function SyncDefaultSettings() {
	const files = fs.readdirSync(c.DEFSETTINGS_STOR);
	const path = require('path');

	files.forEach(function (file) {
		const ext = path.extname(file);
		if (ext === '.set' || ext === '.crc') {
			const np = c.GSETTINGS_STOR + '/' + file;
			if (fs.existsSync(np) === false) {
				ex.ExecNoOutAsync('cp ' + c.DEFSETTINGS_STOR + '/' + file + ' ' + np);
				logger.debug('Recovery default setting file', file, 'to', np);
				console.log('Recovery default setting file', file, 'to', np);
			}
		}
	});
}

function CreateTmpDirs() {
	ex.ExecNoOutSync(`install -d ${c.BUILDOBJ_CACHE_PATH}`);
	console.log(`install -d ${c.BUILDOBJ_CACHE_PATH}`);
	ex.ExecNoOutSync(`install -d ${c.DEVID_CACHE_PATH}`);
	console.log(`install -d ${c.DEVID_CACHE_PATH}`);
}

module.exports = {
	StaticGen,
	RebuildMAP_ForDevices,
	AddToMAP_OneDevice,
	PageMAP_ToUnconfigured,
	RebuildOnrdyPages,
	CleanAllMap,
	CreateTmpDirs,
	GetConfnameContent,
	SyncDefaultSettings
};
