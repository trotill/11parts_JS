import { global } from './___global.js';

function AddWaitOverlay(msg, timeout, PastTo) {
	runui('add_overlay', msg, PastTo, timeout);
}

function DeleteWaitOverlay(PastTo) {
	if (global.busy_prio !== 0)
		//Если приоритетный ready не пришел, игнорим overlay
		return;

	runui('del_overlay', PastTo);
}

function runui(uiname, ...args) {
	if (global.ui_collection[uiname]) {
		console.log('ui ', uiname);
		if (window.eparts.elements?.[global.ui_collection[uiname]]?.create) {
			return window.eparts.elements[global.ui_collection[uiname]].create(...args);
		} else {
			alert(`runui ${uiname}:${global.ui_collection[uiname]} problem, check link`);
		}
	} else {
		console.log('Error: not found component ', uiname);
		alert('Error: not found component ' + uiname);
	}
	return undefined;
}

function reGenSettingsInfo(pageMap) {
	global.LOCAL.SettingInfo = {};
	for (const sec in pageMap) {
		reGenSettingsInfoSection(pageMap[sec]);
	}
}
function reGenSettingsInfoSection(navi_obj) {
	for (const key in navi_obj.items) {
		global.LOCAL.SettingInfo[key] = {
			mname: navi_obj.items[key].mname,
			mbutt: navi_obj.items[key].mbutt
		};

		if (navi_obj.items[key]?.options?.default_page === 1) {
			global.LOCAL.SettingInfo['undefined'] = {
				mname: navi_obj.items[key].mname,
				mbutt: navi_obj.items[key].mbutt
			};
		}
	}
}

function updateObject(target, source) {
	//для мержа обьектов extend и assign не подходят, т.к. требуется дополнить и переопределить если есть что
	for (let elem in source) {
		if (!target[elem]) {
			target[elem] = {};
		}
		if (source[elem] instanceof Object) {
			if (Array.isArray(source[elem])) {
				target[elem] = source[elem];
			} else {
				target[elem] = this.updateObject(target[elem], source[elem]);
			}
		} else {
			target[elem] = source[elem];
		}
	}
	return target;
}

export {
	AddWaitOverlay,
	DeleteWaitOverlay,
	runui,
	updateObject,
	reGenSettingsInfo,
	reGenSettingsInfoSection
};
