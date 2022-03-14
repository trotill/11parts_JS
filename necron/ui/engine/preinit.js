/**
 * Created by i7 on 10.05.2017.
 */

import {
	createEventToEventListeners,
	initIO,
	SendActionSocketIO,
	sendUserWebEvent
} from './event.js';
import './__cookies';
import './_cache';
import './__lang';
import { linkElements } from './uiLink';

import { DeleteWaitOverlay, runui, updateObject } from './_util.js';
import { global } from './___global.js';
import {
	eventCallbackDefRegistration,
	globalCallbackDefRegistration,
	systemCallbackDefRegistration
} from './eventIoHandlerCore';
import { CheckCookSupport, createCookie, readCookie } from './__cookies';
import { registerBasedActionSender } from './eventSendAction';
import { getLangLibrary } from './fetch';
import { initSystemMessageArea } from '../visual/component/shared/base/systemMessage';
import { initErrorMessageArea } from '../visual/component/shared/base/sharedMessage';

function sendKeepAlive() {
	if (global.SRV_OBJ.AuthState === 0) return;
	if (global.unblockKeepalive) {
		if (global.cache.pageCnt === undefined) global.cache.pageCnt = 0;
		// console.log("send keepalive");
		SendActionSocketIO({
			action: 'keepalive',
			data: {
				client: global.SRV_OBJ.client,
				ts: Math.floor(Date.now() / 1000),
				hashT: global.cache.hashT,
				PageRegionName: global.SRV_OBJ.PageRegionName,
				pageCnt: global.cache.pageCnt //кол. закешированных страниц
			}
		});
	}
}

export function CheckJSON_Str(text) {
	if (text[0] === '{') return text;
	else return '';
}

function ConfigUI() {
	updateObject(global.ui_collection, global.SRV_OBJ.UI);
}

function AddDrawField() {
	const tagMain = document.createElement('div');
	tagMain.className = global.TAG_MAIN;
	tagMain.id = global.TAG_MAIN;
	document.body.appendChild(tagMain);

	const tagOverlay = document.createElement('div');
	tagOverlay.id = global.TAG_OVERLAY;
	document.body.appendChild(tagOverlay);

	const tagMessage = document.createElement('div');
	tagMessage.id = global.TAG_MESSAGE;
	document.body.appendChild(tagMessage);

	const tagSystemMessage = document.createElement('div');
	tagSystemMessage.id = global.TAG_SYSTEM_MESSAGE;
	document.body.appendChild(tagSystemMessage);
}

//spec - type array [odm,onrdy]
export function ReloadSpecialPage(spec) {
	for (let n = 0; n < spec.length; n++) {
		let sp = spec[n];
		if (!global.page_info.sorted_type[sp])
			//нет списка станиц для перезагрузки
			continue;
		for (let i = 0; i < global.page_info.sorted_type[sp].length; i++) {
			let sppage = global.page_info.sorted_type[sp][i];
			console.log(
				'sppage=global.page_info.sorted_type[sp][i]',
				sppage,
				global.page_info.sorted_type[sp][i]
			);
			if (sppage === global.SRV_OBJ.PageName) {
				global.callback.BuildPage();
				return;
			}
		}
	}
}

function bruteNavi(nav, cback) {
	for (const sec in nav) {
		if (nav[sec].items) {
			const items = nav[sec].items;
			for (const itemn in items) {
				const item = items[itemn];
				cback(nav, item, itemn);
			}
		}
	}
}
export function RemoveHiddenFromNavi(nnavi) {
	let newNavi = {};
	for (const sec in nnavi) {
		newNavi[sec] = {};
		if (nnavi[sec].items) {
			newNavi[sec].items = {};
			newNavi[sec].name = nnavi[sec].name;
			const items = nnavi[sec].items;
			for (const itemn in items) {
				const item = items[itemn];
				if (item.style !== 'hidden') newNavi[sec].items[itemn] = item;
			}
		}
	}
	return newNavi;
}

export function SortedPageInNaviOnStyle(nnavi) {
	global.page_info.sorted_style = [];
	bruteNavi(nnavi, (nav, item, itemn) => {
		if (global.page_info.sorted_style[item.style] === undefined)
			global.page_info.sorted_style[item.style] = [];
		global.page_info.sorted_style[item.style].push(itemn);
	});
}
export function SortedPageInNaviOnType(nnavi) {
	global.page_info.sorted_type = [];
	bruteNavi(nnavi, (nav, item, itemn) => {
		if (global.page_info.sorted_type[item.type] === undefined)
			global.page_info.sorted_type[item.type] = [];
		global.page_info.sorted_type[item.type].push(itemn);
	});
}

export function PageExistInNavi(pname, nav) {
	for (const sec in nav) {
		if (nav[sec].items) {
			const items = nav[sec].items;
			for (const itemn in items) {
				if (itemn === pname) return true;
			}
		}
	}
	return false;
}

export function GetDefaultPage(nnavi) {
	const nav = nnavi;
	//console.log('GetDefaultPage ',nav);
	for (const sec in nav) {
		if (nav[sec].items) {
			const items = nav[sec].items;
			for (const itemn in items) {
				const item = items[itemn];
				if (item.options) {
					if (item.options.default_page && item.options.default_page === 1) return itemn;
				}
			}
		}
	}
	return null;
}

function linkGlobalCallbacks() {
	globalCallbackDefRegistration();
	eventCallbackDefRegistration();
	systemCallbackDefRegistration();
	registerBasedActionSender();
}

function ConfigScreenScheme() {
	let screen_scheme = global.SRV_OBJ.world.screen_scheme;
	global.SRV_OBJ.ClientScreen = '';
	global.window.width = window.innerWidth;
	global.window.height = window.innerHeight;

	for (let scr in screen_scheme) {
		if (
			global.window.width >= screen_scheme[scr].min_width &&
			global.window.height >= screen_scheme[scr].min_height
		) {
			global.SRV_OBJ.ClientScreen = scr;
			break;
		}
	}
	if (global.SRV_OBJ.ClientScreen === '') {
		for (let scr in screen_scheme) {
			if (
				global.window.height >= screen_scheme[scr].min_width &&
				global.window.width >= screen_scheme[scr].min_height
			) {
				global.SRV_OBJ.ClientScreen = scr;
				break;
			}
		}
		if (global.SRV_OBJ.ClientScreen !== '') global.SRV_OBJ.ClientScreen = 'rotate90';
	}
}

function GoToMainPage() {
	document.location.href = window.location.protocol + '//' + window.location.host;
}

function LoadStageTwo() {
	global.callback.InitMain();

	if (CheckCookSupport() === false) {
		runui('flymsg', global['LANG_LIB'].__keywords.cookies_problem, '', () => {
			GoToMainPage();
		});
		return;
	}

	if (global.SRV_OBJ.ClientScreen === '') {
		runui(
			'flymsg',
			`${global.window.width}x${global.window.height} ${global['LANG_LIB'].__keywords.screen_problem}`,
			'',
			function () {
				GoToMainPage();
			}
		);
		return;
	}

	if (global.SRV_OBJ.ClientScreen === 'rotate90') {
		runui(
			'flymsg',
			`${global.window.width}x${global.window.height} ${global['LANG_LIB'].__keywords.screenProblemCrossXY}`,
			'',
			function () {
				GoToMainPage();
			}
		);
		return;
	}

	if (global.SRV_OBJ.AuthState === 1) {
		if (global.SRV_OBJ.PageRegionName === '') {
			global.callback.ShowMainPage();
		} else {
			createEventToEventListeners('syncPageCache', () => {
				global.inited = true;
				window.eparts.prjApi.ShowSlavePage();
				VersionAdm();
			});
			sendKeepAlive();
			setInterval(() => {
				//  console.log("busy_prio",global.busy_prio);
				if (!global.clientId) return;
				sendKeepAlive();
			}, global.keepalive);
		}
	} else {
		if (global.SRV_OBJ.PageRegionName !== '') GoToMainPage();
		else global.callback.ShowAuthPage();
	}

	DeleteWaitOverlay();
	initSystemMessageArea();
	initErrorMessageArea();
}

function electronInit() {
	global.electron.require.webLogic = nodeRequire('./web/webLogic.js');
	global.electron.require.electron = nodeRequire('electron');
	createCookie('cooc', 'ok', 1);
}

function VersionAdm() {
	sendUserWebEvent('version', {
		version: global.SRV_OBJ.version
	});
}
async function fe_init(saved_obj) {
	await linkElements();
	console.log('saved_obj ', saved_obj);
	global.SRV_OBJ = saved_obj; //JSON.parse(saved_obj);

	if (global.SRV_OBJ.client === 'electron') {
		electronInit();
	}
	//if browser not support Date.now, then need this
	if (!Date.now) {
		Date.now = function now() {
			return new Date().getTime();
		};
	}

	ConfigUI();
	initIO();

	linkGlobalCallbacks();
	console.log('document info', document.URL);
	AddDrawField();
	ConfigScreenScheme();

	let cook_lang = readCookie('lang');

	if (!cook_lang) {
		cook_lang = global.SRV_OBJ.world.lang; //set default language
	}
	global['LANG_SRC'] = cook_lang;
	global.version = global.SRV_OBJ.version;
	global.LOCAL.virtGroup = global.SRV_OBJ.group;
	if (global.SRV_OBJ.auth_opts?.prolong_cook) global.api.storagesEng.runProlongCook();

	if (global.SRV_OBJ.client === 'app') return;
	try {
		global.LANG_LIB = await getLangLibrary(global.LANG_SRC, global.SRV_OBJ.PageRegionName);
		console.log('Load was performed.');
		global.lng_kword_present = true;
		LoadStageTwo();
	} catch (e) {
		alert(`error load lang lib for [${cook_lang}]`);
	}
}

export { fe_init };
export default fe_init;
