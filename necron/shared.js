/**
 * Created by i7 on 30.11.2017.
 */

const c = require('./backCore');
let fs = require('fs');
let ex = require('./exec.js');
let { glob } = require('./web/be/main_global.js');

function ExtrudeString(MathStart, MathEnd, Buff) {
	//console.log('MathStart',MathStart,'MathEnd',MathEnd,'Buff',Buff);

	let re = new RegExp(MathStart, 'i');
	let result = Buff.match(re);

	if (result === undefined || result === null) return undefined;

	// console.log("result.index ", result);

	let regexp = new RegExp(MathEnd, 'ig');
	regexp.lastIndex = result.index + 1;

	let start = result.index;

	let end;
	try {
		end = regexp.exec(Buff).index;
	} catch (e) {
		return undefined;
	}
	let str = Buff.slice(start, end);

	let resBuff = Buff.slice(end);
	// console.log("ret ", {str:str,buf:resBuff});
	return { str: str, buf: resBuff };
}

//View global lets
function letsList(this_obj) {
	return Object.getOwnPropertyNames(this_obj);
}

function GetValJSON_F(file, param) {
	let result;

	if (glob.cache.pages[file]) {
		if (glob.cache.pages[file].setting) {
			result = JSON.parse(glob.cache.pages[file].setting).d;
			console.log('GetValJSON_F from cache', file, ' param ', param);
			return result[param];
		}
	}

	try {
		result = JSON.parse(c.GetSetting('settings.' + file)).d;
		return result[param];
	} catch (e) {
		console.log('error GetValJSON_F file', file, 'param', param);
		return '';
	}
}

function GetSettingDevid(setting_name) {
	//Obsolete
	let devid = '';
	let did;
	let set;
	if (fs.existsSync(c.GSETTINGS_STOR + 'settings.' + setting_name + '.set')) {
		return JSON.parse(c.GetSetting('settings.' + setting_name));
	}

	try {
		did = fs.readFileSync(c.DEVID_CACHE_PATH + '/devid.' + setting_name, 'utf8');
		devid = '.' + did;
	} catch (e) {
		devid = '';
	}

	try {
		set = JSON.parse(c.GetSetting('settings.' + setting_name + devid));
	} catch (e) {
		set = undefined;
	}
	return set;
}

function DynamicSettingsGetter(data) {
	if (data[0]) {
		let valcnt = data.length;
		for (let z = 0; z < valcnt; z++) {
			console.log('DynamicSettingsGetter parse', data[z]);
			let json = JSON.parse(data[z]); //json_decode($data[$z],TRUE);
			if (typeof json.readfile != 'undefined') {
				//  GV.logger.debug("json.req ",json.req);
				// GV.logger.debug("json.value ",json.value);

				let gv = GetValJSON_F(json.readfile, json.value);

				if (gv !== '') json.value = gv;
				else return [];

				if (valcnt > 1) data[z] = json.sep + json.value;
				else data = json.sep + json.value;
				// console.log("json.readfile",json.readfile,"json.value",json.value,"gv",gv,"data",data);
			} else return [];
		}
	} else return [];

	//  console.log("return data",data);
	return data;
}

function Merge_settings_buildObj(nobj, setd) {
	nobj.forEach((nobjItem) => {
		if (!nobjItem.id)
			//если у элемента buildObj нет id, то пропускаем процедуру
			return;

		const nobj_id = nobjItem.id; //зафиксировали id

		if (nobjItem.svalue) {
			//если есть svalue
			if (!setd[nobj_id]) {
				//если нет id  в settings
				if (!nobjItem.value)
					//то присваиваем дефолтное значение из buildObj
					setd[nobj_id] = '';
				else setd[nobj_id] = nobjItem.value;
			}
		} else {
			if (nobj_id) {
				if (nobjItem.value || nobjItem.value === '') {
					//Синхронизация переменных
					if (!setd[nobj_id]) {
						setd[nobj_id] = nobjItem.value;
						//console.log('setd[nobj_id]===undefined setd[',nobj_id,']',setd[nobj_id]);
					}
				}

				if (nobjItem.cvalue) {
					//Синхронизация констант
					if (!setd[nobj_id]) {
						setd[nobj_id] = nobjItem.cvalue;
						//console.log('setd[nobj_id]===undefined setd[',nobj_id,']',setd[nobj_id]);
					}
				}

				if (nobjItem.data) {
					//Синхронизация переключателя switch

					setd = Merge_settings_buildObj(nobjItem.data, setd);
					// console.log('nobjItem.data',nobjItem.data);
					//  console.log('nobj',nobj);
				}
				if (nobjItem.spage) {
					//Синхронизация дерева tab, combobox
					for (let key in nobjItem.spage) {
						setd = Merge_settings_buildObj(nobjItem.spage[key], setd);
					}
				}
			}
		}
	});

	return setd;
}
function Merge_buildObj_settings(nobj, setd) {
	//!!!OBSOLETE!!! not used

	nobj.forEach((nobjItem) => {
		if (!nobjItem.id) return;

		let nobj_id = nobjItem.id;

		if (nobjItem.svalue) {
			let tmpval = DynamicSettingsGetter(nobjItem.svalue);
			if (tmpval.length !== 0) {
				nobjItem.value = tmpval;
				delete nobjItem.svalue;
			}
		} else {
			if (nobj_id) {
				if (setd && setd[nobj_id]) {
					nobjItem.value = setd[nobj_id];
				}
				if (nobjItem.data) {
					nobjItem.data = Merge_buildObj_settings(nobjItem.data, setd);
				}
				if (nobjItem.spage) {
					for (let key in nobjItem.spage) {
						nobjItem.spage[key] = Merge_buildObj_settings(nobjItem.spage[key], setd);
					}
				}
			}
		}
	});

	return nobj;
}

function GetSettingName(PageName) {
	return PageName;
}

function RemoveBuildObjFromCacheDir() {
	ex.ExecNoOutSync('rm ' + c.BUILDOBJ_CACHE_PATH + '/buildObj.*');
	let pages_path = fs.readdirSync(c.BUILDOBJ_PATH);
	pages_path.forEach((page) => {
		let page_path = c.BUILDOBJ_PATH + '/' + page;
		if (!fs.lstatSync(page_path).isFile()) return;

		if (require.cache[require.resolve(page_path)]) {
			console.log('Force remove from cache', require.resolve(page_path));
			delete require.cache[require.resolve(page_path)];
		}
	});
}

function Get_FirstVersionFromObj(obj) {
	return Object.keys(obj)[0];
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
	return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param sources
 */
function mergeDeep(target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return mergeDeep(target, ...sources);
}

module.exports = {
	letsList,
	ExtrudeString,
	GetValJSON_F,
	GetSettingDevid,
	Merge_buildObj_settings,
	Merge_settings_buildObj,
	GetSettingName,
	RemoveBuildObjFromCache: RemoveBuildObjFromCacheDir,
	Get_FirstVersionFromObj,
	mergeDeep
};
