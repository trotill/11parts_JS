import { setGlobalCallback, global } from './___global.js';
import { AddWaitOverlay, DeleteWaitOverlay, reGenSettingsInfo, runui } from './_util';
import { emitEvent, SendActionSocketIO, sendUserWebEvent, SockIO_EventReInit } from './event';
import { elDownloadRemoteFile, elFileChunk } from './electronWEB';
import { u, nu, t, requestData, GenSettingsStruct } from './_core';
import {
	PageExistInNavi,
	ReloadSpecialPage,
	RemoveHiddenFromNavi,
	SortedPageInNaviOnStyle
} from './preinit';

import {
	showSystemMessage,
	hideSystemMessage
} from '../visual/component/shared/base/systemMessage';

function downloadURL(url) {
	const hiddenIFrameID = 'hiddenDownloader';
	let iframe = document.getElementById(hiddenIFrameID);
	if (iframe === null) {
		iframe = document.createElement('iframe');
		iframe.id = hiddenIFrameID;
		iframe.style.display = 'none';
		document.body.appendChild(iframe);
	}
	iframe.src = url;
}
export function downloadURL_NewWin(url) {
	window.open(url);
}

export function eventIoHandlerCore(event) {
	//Неизменяемые обработчики, недоступные проектоориентированному ПО
	switch (event.d.action) {
		case 'webevent': {
			if (event.d['webevent'].iface === undefined) event.d['webevent'].iface = '';
			let idx = event.d['webevent'].req + event.d['webevent'].iface;
			emitEvent(idx, event.d['webevent'].result);
			return 'ok';
		}
		case 'download': {
			let param = event.d.download;
			if (global.SRV_OBJ.client === 'electron') {
				elDownloadRemoteFile([param.fullPath]);
			} else {
				if (param.opts) {
					if (param.opts.openNew) downloadURL_NewWin(param.folder + '/' + param.file);
					else window.location.replace(param.folder + '/' + param.file);
				} else downloadURL(param.folder + '/' + param.file); //Для совместимости
			}
			return 'ok';
		}

		case 'fwErrIntEv': {
			//эвент из компонента фронта, окончание загрузки прошивки
			runui('flymsg', t('FW_NOT_UPLOADED'), '', () => {});
			return 'ok';
		}

		case 'versionIntEv': {
			let evt = event.d.versionIntEv;
			if (evt.version === 'cnodakgV1') {
				global.api.systemInteractive.cnodakgV1SignDialog();
			}
			return 'ok';
		}
		case 'resetToFactoryIntEv': {
			runui(
				'flyconfirm',
				t('FACTORY_WARN'),
				'',
				function () {},
				function () {
					let iVal = document.getElementById('resetToFactoryConfirm').value;
					if (iVal === 'confirm') {
						SendActionSocketIO({
							action: 'resetToFactory',
							sub: ['jnoda'],
							data: 'resetToFactory'
						});
						runui('flymsg', t('FACTORY_RB'), '');
					} else {
						runui('flymsg', t('FACTORY_RB_ERRCFRM'), '');
					}
				},
				undefined,
				{
					inputId: 'resetToFactoryConfirm'
				}
			);
			return 'ok';
		}
		case 'powerMonitorIntEv': {
			//display idle/active state
			emitEvent('powerMonitor', event);
			return 'ok';
		}
		case 'sendIPCIntEv': {
			if (global.SRV_OBJ.client === 'electron') {
				let evData = event.d['sendIPCIntEv'];
				if (evData.evt) delete evData.evt; //обьект клика мышки огромен, лучше его удалить

				electronIpcSend('web', evData);
			}
			return 'ok';
		}
		case 'openURLIntEv': {
			let evData = event.d['openURLIntEv'];
			window.location.replace(evData.url);
			return 'ok';
		}
		case 'cadmSetCfgSucErrIntEv': {
			//эвент из компонента фронта, окончание загрузки клонирования
			return '';
		}
		case 'cadmSetCfgSucIntEv': {
			//эвент из компонента фронта, окончание загрузки клонирования

			return 'ok';
		}
		case 'settingsAckIntEv': {
			//отправляется при приходе всех ack

			return '';
		}
		case 'settingsAckErrIntEv': {
			//отправляется при ошибке таймаута ожидания ack при сохр. settings

			return '';
		}
		case 'fwSucIntEv': {
			//эвент из компонента фронта, окончание загрузки прошивки

			runui(
				'flymsgslide',
				t('FW_UPLOADED'),
				'', //datestr
				5000,
				{}
			);

			let evData = event.d['fwSucIntEv'];
			let fname;
			fname = evData.fname;
			if (global.SRV_OBJ.client === 'electron') {
				fname = p.basename(fname);
			}
			let set = GenSettingsStruct('save', { type: 'settings', page: 'update', fw: fname });
			requestData(global.SRV_OBJ.PagePrefix, '', set, () => {}, undefined);
			return 'ok';
		}
		case 'userWebEvent': {
			//Эвент из бэкенда
			if (event.d.userWebEvent.userEvent === undefined) {
				alert('incorrect userEvent ' + event);
				return 'err';
			}
			if (event.d.userWebEvent.args === undefined) {
				alert('incorrect userEvent args' + event);
				return 'err';
			}

			emitEvent(event.d.userWebEvent.userEvent, event.d.userWebEvent.args);
			return 'ok';
		}

		case 'fileChunk': {
			return elFileChunk(event);
		}

		case 'syncPageCache': {
			//синхронизация конфигов и buildObj с сервером
			if (event.d.syncPageCache.pageMap) {
				global.cache.pageMap = JSON.parse(event.d.syncPageCache.pageMap);
				reGenSettingsInfo(global.cache.pageMap);
			}
			let sz = JSON.stringify(event.d.syncPageCache).length;
			console.log('eventFromUI.d.syncPageCache size', sz);
			global.cache.cacheAdm.syncPageCache(event.d.syncPageCache);
			if (!global.inited) {
				emitEvent('syncPageCache', {});
			}
			return 'ok';
		}
		case 'reCalcTotalHash': {
			global.cache.cacheAdm.reCalcTotalHash();
			return 'ok';
		}
		case 'reqAllHash': {
			//отправка кэшей страниц и конфигов по запросу
			global.cache.cacheAdm.reqAllHash();
			return 'ok';
		}
		case 'settResult': {
			return global.api.setting.settResult(event.d[event.d.action], () => {});
		}

		case 'cnoda': {
			//system on ready

			if (u(event.d.cnoda.type)) {
				if (event.d.cnoda.type === 'settings') {
					let msg = event.d.cnoda.data.msg;
					let setting = event.d.cnoda.data.page;
					if (u(global.cache.savedAck[setting])) {
						global.cache.savedAck[setting] = {
							ack: 'ok',
							msg: msg
						};
					}
					return 'ok';
				}
			}
			return '';
		}
	}
	return '';
}

export function eventCallbackDefRegistrationDoReg(action, cback) {
	global.callback.action.event[action] = cback;
}

export function systemCallbackDefRegistrationDoReg(action, cback) {
	global.callback.action.system[action] = cback;
}
export function eventCallbackGet(event) {
	let action = event.d.action;
	if (global.callback.action.event[action]) return global.callback.action.event[action](event);
	else return '';
}

export function systemCallbackGet(event) {
	let action = event.d.action;
	if (global.callback.action.system[action]) return global.callback.action.system[action](event);
	else return '';
}

export function globalCallbackDefRegistration() {
	setGlobalCallback('CreateNaviGroup', window.eparts.prjApi.JS_CreateNaviGroup);

	//Obsolete
	setGlobalCallback('AddHeaderTips', () => {});
	setGlobalCallback('DelAllTips', () => {});
	setGlobalCallback('AddTips', () => {});
	setGlobalCallback('DelTips', () => {});
	setGlobalCallback('CnodaRespHandler', undefined);
	//Obsolete

	setGlobalCallback('ReBuildNavi_core', window.eparts.prjApi.JS_ReBuildNavi_core);
	setGlobalCallback('BuildPage', window.eparts.prjApi.JS_BuildPage);
	setGlobalCallback('SendAction', window.eparts.prjApi.BuildJSON_SendAction);

	setGlobalCallback('EventIO_HandlerExtend', window.eparts.prjApi.JS_EventIO_HandlerExtend);
	setGlobalCallback('SystemIO_HandlerExtend', window.eparts.prjApi.JS_SystemIO_HandlerExtend);
	setGlobalCallback('GoToNaviItem', window.eparts.prjApi.JS_GoToNaviItem);

	setGlobalCallback('InitMain', window.eparts.prjApi.InitMain);
	setGlobalCallback('ShowAuthPage', window.eparts.prjApi.ShowAuthPage);
	setGlobalCallback('ShowMainPage', window.eparts.prjApi.ShowMainPage);
}
export function systemCallbackDefRegistration() {
	systemCallbackDefRegistrationDoReg('cnoda', (event) => {
		let data = event.d.cnoda;
		let res;
		if (typeof data === 'object') {
			if (data['activation']) {
				// if (data.activation.stat==="activation"){
				emitEvent('activation', data.activation);
				sendUserWebEvent('activation', data.activation);
				return;
				// alert("needLicense");
				//  }
			}
			if (data['cnodakgV1']) {
				// if (data.activation.stat==="activation"){
				emitEvent('cnodakgV1', data.cnodakgV1);
				return;
				// alert("needLicense");
				//  }
			}
			if (data['forceLogout']) {
				let group = data['forceLogout']['group'];
				if (group === global.SRV_OBJ.group) {
					if (global.SRV_OBJ.client === 'web') {
						location.href = '/';
					}
				} else {
					if (group.length === 0) {
						if (global.SRV_OBJ.client === 'web') {
							location.href = '/';
						}
					}
				}
				return;
			}
			if (data['uprep']) {
				switch (data['uprep']['msg']) {
					case 'check':
						res =
							t('found firmware file') +
							' [' +
							data['uprep']['arg'][0] +
							']' +
							', ' +
							t('check firmware');
						showSystemMessage(res);
						break;
					case 'select_version':
						{
							let vers = data['uprep']['arg'][0];
							let fw = data['uprep']['arg'][1];
							res =
								t('select version') + '[' + vers + ']' + ',' + t('firmware file') + ' [' + fw + ']';
							showSystemMessage(res);
						}
						break;
					case 'finalize':
						global.doUpdate = true;
						res = t('finalize update file') + ' ' + data['uprep']['arg'][0];
						showSystemMessage(res);
						break;
					case 'check_ok':
						global.doUpdate = true;
						res = t('firmware file') + ' [' + data['uprep']['arg'][0] + '] ' + t('is correct');
						showSystemMessage(res);
						break;
					case 'check_err':
						global.doUpdate = false;
						res = t('firmware file') + ' [' + data['uprep']['arg'][0] + '] ' + t('is bad');
						showSystemMessage(res);
						break;
					default:
						// global.doUpdate=true;
						showSystemMessage(
							'.' + global.TAG_MAIN,
							event.d.action + data['uprep']['msg'],
							JSON.stringify(event.d.cnoda)
						);
				}
			} else showSystemMessage(JSON.stringify(event.d.cnoda));
		} else
			switch (data) {
				case 'uprep_wcheck_ok':
					{
						global.doUpdate = true;
					}
					break;
				case 'uprep_wcheck_err':
					{
						global.doUpdate = false;
					}
					break;
				case 'uprep_start_search':
					runui('slidemsg', t(event.d.cnoda));
					break;

				case 'uprep_end_search':
					runui('slidemsg', t(event.d.cnoda));
					break;

				case 'hide_system':
					global.doUpdate = false;
					hideSystemMessage();
					break;

				case 'lic_error':
					runui('slidemsg', t(event.d.cnoda));
					break;
				default:
					showSystemMessage(t(event.d.cnoda));
					break;
			}
	});
}
export function eventCallbackDefRegistration() {
	eventCallbackDefRegistrationDoReg('message', (event) => {
		let ts = Math.floor(Date.now() / 1000);
		let timeev = new Date(ts * 1000);
		let timestr = timeev.toLocaleDateString() + ' [' + timeev.toLocaleTimeString() + ']';
		runui('flymsg', t(event.d['message']), timestr, () => {});
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('cnoda', (event) => {
		let ts = Math.floor(Date.now() / 1000);
		let timeev = new Date(ts * 1000);
		let timestr = timeev.toLocaleDateString() + ' [' + timeev.toLocaleTimeString() + ']';
		if (nu(event.d.cnoda.data)) {
			runui('flymsg', t('CNODA_DATA_ERROR'), timestr, () => {});
			return '';
		}

		let msg = event.d.cnoda.data.msg;
		if (msg !== 'wait' && msg !== 'ok' && msg !== '') {
			runui('flymsg', t(msg), timestr, () => {
				if (msg === 'secure_changed') {
					location.reload();
				}
			});
		}
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('busy', (event) => {
		let prio = event.d[event.d.action].prio;
		if (prio) {
			if (global.busy_prio < prio) global.busy_prio = prio;
		}

		if (typeof event.d[event.d.action].message == 'undefined') {
			if (global['LANG_LIB'].__keywords) AddWaitOverlay(t('Please_wait_dev_busy'));
			else AddWaitOverlay(t('busy'));
		} else {
			AddWaitOverlay(t(event.d[event.d.action].message));
		}
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('needconf', () => {
		let ts = Math.floor(Date.now() / 1000);
		let timeev = new Date(ts * 1000);
		let timestr = timeev.toLocaleDateString() + ' [' + timeev.toLocaleTimeString() + ']';
		runui(
			'flymsg',
			'.' + global.TAG_MAIN,
			global.LANG_LIB.__keywords.NeedConf,
			timestr,
			function () {}
		);
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('ready', (event) => {
		let prio = event.d[event.d.action].prio;
		if (prio) {
			if (global.busy_prio <= prio) {
				global.busy_prio = 0;
				//удаляем оверлей если наконец то пришел приретеный ready
				DeleteWaitOverlay();
			}
		}

		SockIO_EventReInit();
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('server', (event) => {
		global.SRV_OBJ.server = event.d.server;
		console.log('Server info ', global.SRV_OBJ.server);
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('reload', () => {
		ReloadSpecialPage(global.page_info.spec_pages);
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('add', (event) => {
		let ts = Math.floor(Date.now() / 1000);
		let timeev = new Date(ts * 1000);
		let timestr = timeev.toLocaleDateString() + ' [' + timeev.toLocaleTimeString() + ']';
		if (event.d['add'].dev_name)
			runui(
				'flymsg',
				global['LANG_LIB'].__keywords.Add +
					' ' +
					event.d['add'].dev_name +
					' ' +
					global['LANG_LIB'].__keywords.device,
				timestr,
				function () {
					ReloadSpecialPage(global.page_info.spec_pages);
					//location.reload();
				}
			);
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('remove', (event) => {
		let ts = Math.floor(Date.now() / 1000);
		let timeev = new Date(ts * 1000);
		let timestr = timeev.toLocaleDateString() + ' [' + timeev.toLocaleTimeString() + ']';
		if (event.d['remove'].dev_name)
			runui(
				'flymsg',
				global['LANG_LIB'].__keywords.Remove +
					' ' +
					event.d['remove'].dev_name +
					' ' +
					global['LANG_LIB'].__keywords.device,
				timestr,
				function () {
					ReloadSpecialPage(global.page_info.spec_pages);
					//location.reload();
				}
			);
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('nnavi', (event) => {
		let RegionName = global.SRV_OBJ.PageRegionName + '.' + global.SRV_OBJ.group;
		let virtRegionName = undefined;

		if (global.LOCAL.virtGroup)
			virtRegionName = global.SRV_OBJ.PageRegionName + '.' + global.LOCAL.virtGroup;

		if (event.d.PageRegionName === RegionName || event.d.PageRegionName === virtRegionName) {
			global.cache.pageMap = event.d.nnavi;
			SortedPageInNaviOnStyle(event.d.nnavi);
			SortedPageInNaviOnStyle(event.d.nnavi);
			let resultNavi = RemoveHiddenFromNavi(event.d.nnavi);
			if (PageExistInNavi(global.SRV_OBJ.PageName, resultNavi) === false) {
				global.callback.GoToNaviItem(global.page_info.default_page);
			}
			global.callback.ReBuildNavi_core(resultNavi);
		}
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('mosquitto_ready', () => {
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('jnodaReady', () => {
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('settingsAckIntEv', (event) => {
		let actions = event.d.settingsAckIntEv;
		for (let sett in actions) {
			if (actions[sett].msg.length !== 0 && actions[sett].msg !== 'ok') {
				runui('flymsg', t(actions[sett].msg), '', () => {});
			}
		}
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('settingsAckErrIntEv', () => {
		let ts = Math.floor(Date.now() / 1000);
		let timeev = new Date(ts * 1000);
		let timestr = timeev.toLocaleDateString() + ' [' + timeev.toLocaleTimeString() + ']';
		runui('flymsg', t('SEND_SETTINGS_ERROR'), timestr, () => {});
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('needAuth', () => {
		if (global.SRV_OBJ.client === 'web') {
			location.href = '/';
		}
		return 'ok';
	});
	eventCallbackDefRegistrationDoReg('activationIntEv', (event) => {
		if (event.d.activationIntEv.stat === 'needLicense') {
			if (nu(global.LOCAL.deviceUID)) {
				global.api.systemInteractive.licDialog(event.d.activationIntEv.uid);
			}
			global.LOCAL.deviceUID = event.d.activationIntEv.uid;
		}

		if (event.d.activationIntEv.stat === 'needPrivate') {
			if (nu(global.LOCAL.needPrivate)) {
				global.api.systemInteractive.privateDialog(event.d.activationIntEv.uid);
			}
			global.LOCAL.needPrivate = false;
		}

		return 'ok';
	});
}
