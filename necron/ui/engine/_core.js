/**
 * Created by i7 on 05.02.2017.
 */
import { global } from './___global.js';
import { GetAllMeta, initMetaVar, initMetaVarIfUndef } from './_metaVar';
import { emitEvent, SendActionSocketIO, sendUserWebEvent } from './event';
import { BuildObj, deleteBuildedObj } from './_buildEng';
import {
	GetDefaultPage,
	RemoveHiddenFromNavi,
	SortedPageInNaviOnStyle,
	SortedPageInNaviOnType
} from './preinit';
import { ExtractSetting, SyncSettingsWithMetaVarValues } from './value_extractor';
import { AddWaitOverlay, DeleteWaitOverlay } from './_util';
import { readCookie } from './__cookies';
import { httpRequest } from './_obsolete';

global.exampleformat.PastController = {
	past: {
		type: 'appendTo',
		jq: '.graphy_sga_state_conc_graph_ts-stylize-layouty_sga_y_sga_state_2_col0_row0-pctrl'
	}
};
global.exampleformat.PastControllerType = ['appendTo', 'append', 'insertAfter', 'insertBefore'];

function t(v) {
	if (v === undefined) {
		return '';
	}
	if (v.length === 0 || nu(v)) return v;

	if (!global.lng_kword_present) return v;

	if (nu(global.LANG_LIB.__keywords[v])) return v;
	else return global.LANG_LIB.__keywords[v];
}

function TranslateNavi(sectdata, sectname) {
	const mname = global['LANG_LIB'].__mname;
	const sections = global['LANG_LIB'].__sections;
	if (sections[sectname]) {
		sectdata.name = sections[sectname];
		if (sectdata.items) {
			for (const pagename in sectdata.items) {
				if (sectdata.items[pagename].mname) {
					if (mname[sectdata.items[pagename].mname]) {
						sectdata.items[pagename].mname = mname[sectdata.items[pagename].mname];
					} else {
						if (mname[pagename]) {
							sectdata.items[pagename].mname = mname[pagename];
						}
					}
				}
			}
		}
	}
}

function GetDefaultPageName(region) {
	for (const idx in region) {
		const item = region[idx].items;
		for (const pname in item) {
			if (item[pname]?.options?.default_page === 1) {
				return pname;
			}
		}
	}

	return '';
}

function SearchPageInMAP(search_pname, region) {
	if (search_pname === '' || search_pname === 'undefined') return false;

	for (const idx in region) {
		const item = region[idx].items;
		//console.log('sobj ',sobj);
		for (const pname in item) {
			if (search_pname === pname) return true;
		}
	}
	return false;
}
export function BuildNavi(data) {
	const region = $.extend(true, {}, data); //Unlink data
	console.log('BuildNavi ', region);

	const cook_pagename = readCookie('PageName');
	if (cook_pagename) global.SRV_OBJ.PageName = cook_pagename;
	else global.SRV_OBJ.PageName = global.page_info.default_page;

	if (SearchPageInMAP(global.SRV_OBJ.PageName, region) === false)
		global.SRV_OBJ.PageName = GetDefaultPageName(region);

	for (const navi in region) {
		TranslateNavi(region[navi], navi);
		global.callback.CreateNaviGroup(region[navi], navi);
	}
}

//Функция создает обьект, который отправляется на сервер, а затем возвращается после дейсвия в обработчик requestData - eval
//где затем исполнится. Используется в response параметре BuildJSON_SendAction
export function GenEvalResponse(response) {
	return { respType: 'eval', eval: 'function (){' + response + '}' };
}

let builded = {};
function processServerData(data, PastTo, Request, success_callback) {
	// DeleteWaitOverlay();
	let strData = JSON.stringify(data);
	console.log('getev', data, 'str', strData);

	initMetaVarIfUndef(Request.contentClass);
	if (data.respType === 'eval') {
		eval('(' + data.eval + ')')();
	}

	//На запрос buildObj от wizard приходит buildWiz ответ
	//На запрос buildObj от одиночн. стр. приходит buildObj ответ
	if (data.respType === 'buildObj' || data.respType === 'buildWiz') {
		//добавдение страницы в кэш
		if (data.respType === 'buildObj') {
			global.settings = {}; //если грузится одиночная стр., то удалаяем накопленные настройки, если визард, то копим дальше
			initMetaVar(Request.contentClass);
		}

		if (u(global.dnk.root.exchange) && global.dnk.inited === false) {
			window.eparts.elements.dnk_root.global();
			if (global.version === 'dbg') {
				//send wordbook
				let x_lang = {
					x: {
						srclang: global.LANG_SRC,
						deflang: global.SRV_OBJ.world.lang,
						wordbook: {}
					}
				};
				x_lang.x.wordbook[global.LANG_SRC] = global.LANG_LIB;
				emitEvent(global.dnk.root.tx_evt_name, x_lang);
			}
			global.dnk.inited = true;
		}

		console.log('buildObj ', data);

		if (builded[Request.contentClass]) deleteBuildedObj(builded[Request.contentClass]);

		builded[Request.contentClass] = BuildObj(PastTo, data.result, {
			contentClass: Request.contentClass,
			parent_data: {
				id: PastTo
			}
		});
		if (success_callback) success_callback(builded[Request.contentClass]);
	}

	if (data.respType === 'buildNavi') {
		console.log('buildNavi ', data);
		if (global.page_info.default_page === '') {
			global.page_info.default_page = GetDefaultPage(data.result);
		}
		let resultNavi = data.result;
		SortedPageInNaviOnType(resultNavi);
		SortedPageInNaviOnStyle(resultNavi);
		resultNavi = RemoveHiddenFromNavi(resultNavi);
		BuildNavi(resultNavi);
		if (success_callback) success_callback();
	}

	if (data.respType === 'loadSet') {
		if (nu(data.setting.d)) {
			data.setting.d = {
				type: 'settings',
				page: Request.setting_name
			};
		}
		global.settings[data.setting_name] = data.setting.d;
		SyncSettingsWithMetaVarValues(Request.contentClass);
		console.log('loadset global ', global);
	}
}

function requestDataSettingsWaitAck(ajax_succ_callback, cb_context) {
	if (ajax_succ_callback) {
		AddWaitOverlay(t('Please_wait_resp'));
		let waitCntr = 0;
		let checkAck = () => {
			for (let setName in global.cache.savedAck) {
				if (global.cache.savedAck[setName].ack.length === 0) return false;
			}
			return true;
		};
		let checkMsg = () => {
			for (let setName in global.cache.savedAck) {
				if (
					global.cache.savedAck[setName].msg.length === 0 ||
					global.cache.savedAck[setName].msg !== 'ok'
				)
					return false;
			}
			return true;
		};
		let checkOkay = () => {
			//ожидание всех подтверждений
			if (waitCntr < 10) {
				if (checkAck()) {
					sendUserWebEvent('settingsAck', global.cache.savedAck);
					DeleteWaitOverlay();
					ajax_succ_callback(cb_context, checkMsg());
				} else
					setTimeout(() => {
						checkOkay();
					}, 1000);
			} else {
				sendUserWebEvent('settingsAckErr', global.cache.savedAck);
				DeleteWaitOverlay();
				ajax_succ_callback(cb_context, false);
			}
			waitCntr++;
		};
		checkOkay();
	}
}

//ajax_succ_callback - функция вызывается всегда при получении ответа ajax
//success_callback - функция вызывается когда данные приняты сервером
export function requestData(
	url,
	PastToArg,
	Request,
	ajax_succ_callback,
	success_callback,
	cb_context
) {
	let PastTo = PastToArg;

	console.log('requestData', Request);
	console.log('to url', url);
	console.log('MQR requestData Request', Request);

	if (Request.type === 'settings') {
		if (global.cache.okdec !== 0) {
			global.cache.okdec = 0;
		}

		let settArray = [];
		if (!Array.isArray(Request.settings)) {
			settArray[0] = Request.settings;
		} else settArray = Request.settings;

		console.log('MQR requestData addSettingArrayToCache', {
			settArray: settArray,
			Request: Request
		});

		global.unblockKeepalive = false;
		global.cache.cacheAdm.addSettingArrayToCache(settArray, Request.socket_id);

		global.cache.savedAck = {};
		settArray.forEach((sett) => {
			global.cache.savedAck[sett.page] = {
				ack: '',
				msg: ''
			};
		});

		SendActionSocketIO({
			action: 'settings',
			data: {
				client: global.SRV_OBJ.client,
				ts: Math.floor(Date.now() / 1000),
				hashT: global.cache.hashT,
				PageRegionName: global.SRV_OBJ.PageRegionName,
				pageCnt: global.cache.pageCnt, //кол. закешированных страниц
				settArray,
				settAct: Request.action
			}
		});
		global.unblockKeepalive = true;

		requestDataSettingsWaitAck(ajax_succ_callback, cb_context);
		return;
	}
	if (Request.type === 'loadSet') {
		let pName = Request.setting_name;
		console.log('MQR 1');
		if (global.cache?.pages?.[pName]?.setting) {
			//Если есть страница, не важно, есть setting или нет
			console.log('MQR requestData loadSet from cache', global.cache.pages[pName].setting);
			processServerData(
				{
					respType: 'loadSet',
					setting: global.cache.pages[pName].setting,
					setting_name: pName
				},
				PastTo,
				Request,
				success_callback
			);
		}
	}

	if (Request.type === 'buildNavi') {
		processServerData(
			{ result: global.cache.pageMap, respType: 'buildNavi' },
			PastTo,
			Request,
			success_callback
		);
	}

	if (Request.type === 'buildObj') {
		//выгрузка из кэша для быстой загрузки
		const pName = Request.settings.PageName;
		if (!pName) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
		if (global.cache.pages[pName]) {
			console.log('MQR 2');

			//Подгрузка настроек для buildObj
			if (global.cache.pages[pName].setting) {
				console.log('MQR requestData buildObj(Sett) from cache', global.cache.pages[pName].setting);
				processServerData(
					{
						respType: 'loadSet',
						setting: global.cache.pages[pName].setting,
						setting_name: pName
					},
					PastTo,
					Request,
					success_callback
				);
			}

			if (global.cache.pages[pName].buildObj) {
				//Построение buildObj
				console.log('MQR requestData buildObj(Bo) from cache', global.cache.pages[pName].buildObj);
				let wizChild = 'buildWiz';
				global.cache.pages[pName].buildObj.find((buildObjItem) => {
					if (buildObjItem?.type === 'wizlogic' && buildObjItem?.ppos === 'main') {
						wizChild = 'buildObj';
						return true;
					}
					return false;
				});

				processServerData(
					{
						respType: wizChild,
						result: global.cache.pages[pName].buildObj
					},
					PastTo,
					Request,
					success_callback
				);
			}
		} else {
			global.cache.cacheAdm.reqAllHash();
			//debugger;
		}
	}

	if (ajax_succ_callback) ajax_succ_callback(cb_context);
}

export function GetVersionPage() {
	return 1;
}

export function BuildJSON_Auth(PastTo) {
	let MD5 = global.callback.md5;

	let ev = {};
	let MVar = GetAllMeta(PastTo);
	ev['login'] = {
		value: MVar.login.value,
		name: 'login'
	};
	ev['password'] = {
		value: MD5(MVar.password.value + MVar.login.value),
		name: 'password'
	};

	let page = {
		PageRegionName: global.SRV_OBJ.PageRegionName,
		version: 'v',
		data: ev,
		page: 'main'
	};
	let set = {
		settings: page,
		type: 'settings',
		action: 'auth'
	};
	console.log('set ', set);

	httpRequest(set);
}

export function GenSettingsStruct(action, sett) {
	return {
		settings: sett,
		type: 'settings',
		action: action,
		socket_id: global.clientId
	};
}
export function BuildJSON_Settings_no_flt(action, contentClass) {
	const ev = ExtractSetting(contentClass);
	console.log('ev ', ev);

	const set = GenSettingsStruct(action, ev);
	console.log('set ', set);

	return set;
}

export function BuildJSONF_LoadNavi(PastTo, vers, callb) {
	let PageRegionName;

	if (!global.SRV_OBJ.PageRegionName) PageRegionName = 'undefined';
	else PageRegionName = global.SRV_OBJ.PageRegionName;

	let reqobj = {
		type: 'buildNavi',
		settings: {
			version: vers,
			PageRegionName: PageRegionName,
			PageName: global.SRV_OBJ.PageName
		}
	};

	console.log('Request buildNavi obj', reqobj);
	requestData(global.SRV_OBJ.PagePrefix, PastTo, reqobj, callb);
}

//use in typescript
function BuildJSONF_SaveSettingsGlobal(action, success_cb, contentClass) {
	let set;

	let settings = [];
	ExtractSetting(contentClass);
	for (const sndset in global.settings) {
		settings.push(global.settings[sndset]);
	}
	set = GenSettingsStruct(action, settings);
	console.log('send global setting ', set);
	requestData(global.SRV_OBJ.PagePrefix, '', set, success_cb, undefined);
}

export function BuildJSONF_LoadObjEng(
	PastTo,
	vers,
	ajax_succ_callback,
	success_callback,
	cb_context,
	PageName
) {
	let page = {
		PageName: PageName,
		version: vers
	};
	let contentClass = PastTo;
	let reqobj = {
		type: 'buildObj',
		settings: page,
		contentClass: contentClass
	};
	global.cache.contentClass[PageName] = contentClass;
	console.log('Request buildObj obj', reqobj);

	requestData(
		global.SRV_OBJ.PagePrefix,
		PastTo,
		reqobj,
		ajax_succ_callback,
		success_callback,
		cb_context
	);
}

function AssertS(obj) {
	if (obj === undefined) return '';
	else return obj;
}

function isObject(obj) {
	if (obj === Object(obj)) {
		return !Array.isArray(obj);
	}
	return false;
}

function u(v) {
	return v !== undefined;
}

function nu(v) {
	return v === undefined;
}

export { t, nu, u, isObject, AssertS, BuildJSONF_SaveSettingsGlobal };
