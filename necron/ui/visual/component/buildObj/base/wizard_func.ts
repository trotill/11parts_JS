/**
 * Created by Ilya on 05.03.2019.
 */

import { global } from '../../../../engine/___global.js';
import { BuildJSONF_SaveSettingsGlobal, nu, t } from '../../../../engine/_core';
import { CleanGlobalSettings } from '../../../../engine/value_extractor';
import { AddWaitOverlay, runui } from '../../../../engine/_util';
import { downloadSuccessAction } from '../../../../engine/_obsolete';
import { runRegistered } from '../../../../engine/registerUI';

global.LOCAL.wizCmdArray = [
	'clean_nm',
	'save_nm',
	'save_rb',
	'save',
	'apply',
	'apply_one_nm',
	'apply_one',
	'apply_nm',
	'update_page',
	'load_obj',
	'logout'
];
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function wiz_load_obj(type: any): any {
	alert('wiz_load_obj need refact');
	while (0) {
		//runRegistered('messageErr', 'closeAny', {});
		//JS_CloseAnyFieldErrMessage();
		//const obj = $('.ACKnowledge_box');
		//obj.remove();
		//global.SRV_OBJ.PageName = type;
		//alert('delete LoadObj in v2!!!');
	}
	//global.callback.LoadObj();
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function wiz_sysevent(actData: any): any {
	//action - ['save','load_obj']
	/*
     {
     actions:wlp.sysevent[sev],
     actidx:0
     }
     */
	const contentClass = actData.contentClass;
	if (actData.action[actData.actidx] !== undefined) {
		const actIdx = actData.action[actData.actidx];
		let actTarget;
		let actMsg: string;
		if (global.api.util.isStringCustom(actIdx)) {
			actTarget = actIdx;
		} else {
			actTarget = Object.keys(actIdx)[0];
			if (actData.action[actData.actidx][actTarget].msg !== undefined) {
				actMsg = actData.action[actData.actidx][actTarget].msg;
			}
		}
		switch (
			actTarget //(actdata.action[actdata.actidx]) {
		) {
			case 'clean_nm':
				CleanGlobalSettings();
				actData.actidx++;
				wiz_sysevent(actData);
				break;
			case 'save_nm': //save witchout message
				AddWaitOverlay(t('Please_wait_resp'));
				BuildJSONF_SaveSettingsGlobal(
					'save',
					function (context: any, result: boolean) {
						// wiz_cnoda_ok_adapter(function(){
						if (result) {
							actData.actidx++;
							//DeleteWaitOverlay();
							wiz_sysevent(actData);
						}
						//  });
					},
					contentClass
				);
				break;
			case 'save_rb': //save with message need reboot
				//  AddWaitOverlay(t('Please_wait_resp'));
				BuildJSONF_SaveSettingsGlobal(
					'save',
					function (context: any, result: boolean) {
						// wiz_cnoda_ok_adapter(function(){
						// DeleteWaitOverlay();
						if (result) {
							const flyMsg = actMsg !== undefined ? t(actMsg) : t('NEED_REBOOT');
							runui('flymsg', flyMsg, null, function () {
								actData.actidx++;

								wiz_sysevent(actData);
							});
						}
						// });
					},
					contentClass
				);
				break;
			case 'save': //save with message
				BuildJSONF_SaveSettingsGlobal(
					'save',
					(context: any, result: boolean) => {
						//AddWaitOverlay(t('Please_wait_resp'));
						// wiz_cnoda_ok_adapter(function(){
						//DeleteWaitOverlay();
						// DeleteWaitOverlay();
						if (result) {
							const flyMsg = actMsg !== undefined ? t(actMsg) : t('wiz_saved');
							runui('flymsg', flyMsg, null, function () {
								actData.actidx++;

								wiz_sysevent(actData);
							});
						}
						// });
					},
					contentClass
				);
				break;
			case 'apply': //применить перезапустив Cnoda и Jnoda
				BuildJSONF_SaveSettingsGlobal(
					'apply',
					function (context: any, result: boolean) {
						// wiz_cnoda_ok_adapter(function(){
						if (result) {
							const flyMsg = actMsg !== undefined ? t(actMsg) : t('wiz_applied');
							runui('flymsg', flyMsg, null, function () {
								actData.actidx++;
								wiz_sysevent(actData);
							});
						}
						//  });
					},
					contentClass
				);
				break;
			case 'apply_one_nm':
				{
					//применить без вывода сообщения об успехе
					let cmd = 'apply_one';
					if (
						global.page_info.sorted_style['unconf'] !== undefined &&
						global.page_info.sorted_style['unconf'].length === 1 &&
						global.SRV_OBJ.PageName === global.page_info.sorted_style['unconf'][0]
					) {
						cmd = 'apply';
					}
					BuildJSONF_SaveSettingsGlobal(
						cmd,
						function (context: any, result: boolean) {
							//  wiz_cnoda_ok_adapter(function () {
							if (result) {
								actData.actidx++;
								wiz_sysevent(actData);
							}
							//  });
						},
						contentClass
					);
				}
				break;
			case 'apply_one':
				{
					//применить и вывести сообщение об успехе
					let cmd = 'apply_one';
					if (
						global.page_info.sorted_style['unconf'] !== undefined &&
						global.page_info.sorted_style['unconf'].length === 1 &&
						global.SRV_OBJ.PageName === global.page_info.sorted_style['unconf'][0]
					) {
						cmd = 'apply';
					}
					BuildJSONF_SaveSettingsGlobal(
						cmd,
						function (context: any, result: boolean) {
							//   wiz_cnoda_ok_adapter(function () {
							if (result) {
								const flyMsg = actMsg !== undefined ? t(actMsg) : t('wiz_applied');
								runui('flymsg', flyMsg, null, function () {
									actData.actidx++;
									wiz_sysevent(actData);
								});
							}
							//  });
						},
						contentClass
					);
				}
				break;
			case 'apply_one_rb':
				{
					//применить и вывести сообщение требуется перезагрузка
					let cmd = 'apply_one';
					if (
						global.page_info.sorted_style['unconf'] !== undefined &&
						global.page_info.sorted_style['unconf'].length === 1 &&
						global.SRV_OBJ.PageName === global.page_info.sorted_style['unconf'][0]
					) {
						cmd = 'apply';
					}
					BuildJSONF_SaveSettingsGlobal(
						cmd,
						function (context: any, result: boolean) {
							//   wiz_cnoda_ok_adapter(function () {
							if (result) {
								const flyMsg = actMsg !== undefined ? t(actMsg) : t('NEED_REBOOT');
								runui('flymsg', flyMsg, null, function () {
									actData.actidx++;
									wiz_sysevent(actData);
								});
							}
							//  });
						},
						contentClass
					);
				}
				break;
			case 'apply_nm': //применить перезапустив Cnoda и Jnoda без вывода сообщения об успехе
				BuildJSONF_SaveSettingsGlobal(
					'apply',
					function (context: any, result: boolean) {
						//  wiz_cnoda_ok_adapter(function(){
						if (result) {
							actData.actidx++;
							wiz_sysevent(actData);
						}
						//  });
					},
					contentClass
				);
				break;
			case 'update_page':
				global.SRV_OBJ.PageName = '';
				location.reload();
				actData.actidx++;
				wiz_sysevent(actData);
				break;
			case 'load_obj':
				wiz_load_obj(actData.event_type);
				actData.actidx++;
				wiz_sysevent(actData);
				break;
			case 'logout':
				//alert("logout");
				// ClearFltError();
				if (global.logoutEn === false) break;

				//try {
				//Logout();
				//} catch (e) {
				alert('Logout functon undefined');
				//}
				break;
			default: {
				for (const key in global.cache.wizEvent as any) {
					if (key === actData.action[actData.actidx]) {
						console.log('Found wizevent', key);
						switch (global.cache.wizEvent[key].type) {
							case 'wizevent':
								{
									downloadSuccessAction(global.cache.wizEvent[key], 'finish', 'success');
									actData.actidx++;
									wiz_sysevent(actData);
								}
								break;
							case 'wizevent_msg':
								{
									if (global.cache.wizEvent[key].id === 'msg_warn') {
										runui(
											'flymsg',
											t(global.cache.wizEvent[key].value),
											'',
											function () {
												actData.actidx++;
												wiz_sysevent(actData);
												//alert("FYes");
											},
											undefined,
											undefined
										);
									} else alert(`Undef wizevent_msg id ${global.cache.wizEvent[key].id}`);
									// flymsg(PastTo, Message, DateStr, FClose,FYes,FNo);
								}
								break;
							default: {
								//обработчик пользовательских колбэков, можно создавать любые действия
								/*  Пример:
                                     {
                                        type:"backWizButt",
                                        id:'backWizButt',
                                        handler:"backWizButt"
                                    }
                                 */
								//actdata.action[actdata.actidx];
								if (global.cache.wizEvent[key].handler !== undefined) {
									try {
										global.wizardCallback[global.cache.wizEvent[key].handler]({
											userEvent: actTarget,
											wizevent: global.cache.wizEvent[key]
										});
									} catch (e) {
										alert('Not define callback for __wizevent ' + key);
									}
									actData.actidx++;
									wiz_sysevent(actData);
								}
								// alert('Undef wizevent key', key);
							}
						}
					}
				}
				//console.log("Error: undef wizard sysevent");
			}
		}
	}
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function wizConvBuildObjToWiz(pageName: string, buildObj: any): any {
	//const version = Object.keys(buildObj)[0];
	if (buildObj[0].type === 'wizlogic') return buildObj;

	if (buildObj[0].type === 'wizinfo') return buildObj;

	const wizResult = [];
	const tagBase = pageName.replace('.', '-');
	const wizLogic: any = {
		type: 'wizlogic',
		id: tagBase + 'MwizOnce',
		event: {
			//здесь перечисляются события, по которым будут меняться парамтры в крнфиге страницы
		},
		sysevent: {},
		pages: {
			//здесь перечисляются конфиги страниц, которые будут изменены. Если этого не требуется, страницу нужно в любом случае записать
		}, //текущая страница
		navi: [], //страницы на которые будет условный переход
		ppos: 'main' //позиция страницы, main - точка входа в wizard, medium - промежуточная, exit - конечная, выход из Wizard
	};
	wizLogic.pages[pageName] = buildObj;
	const SettingInfo: any = global.LOCAL.SettingInfo;
	if (nu(SettingInfo[pageName])) {
		SettingInfo[pageName] = {
			mbutt: []
		};
	}
	const mbutt = SettingInfo[pageName].mbutt;

	const newActElement = [];
	const wizNaviHeader: any = {
		type: 'wiznavi_header',
		id: tagBase + 'Nwiz',
		name: '',
		value: '',
		mbutt: [],
		nbutt: [],
		class: {},
		past: {
			type: 'appendTo',
			jq: '#keyblock'
		}
	};

	const wizCmdArray: any = global.LOCAL.wizCmdArray;
	for (let n = 0; n < mbutt.length; n++) {
		if (wizCmdArray.indexOf(mbutt[n]) !== -1) {
			//Поиск в привелегированных действиях
			wizLogic.navi.push(mbutt[n]);
			wizLogic.sysevent[mbutt[n]] = [mbutt[n]];
			wizNaviHeader.mbutt.push(mbutt[n]);
			wizNaviHeader.class[mbutt[n]] = 'mbuttWiz' + mbutt[n];
		} else {
			//создается новое действие, для кастомной обработки
			const newAct = '_wna' + mbutt[n];
			wizLogic.navi.push(newAct);
			wizLogic.sysevent[newAct] = [newAct];
			newActElement.push({
				type: newAct,
				id: newAct,
				handler: newAct
			});
			wizNaviHeader.mbutt.push(newAct);
			wizNaviHeader.class[newAct] = 'mbuttWiz' + newAct;
		}
	}

	wizNaviHeader.nbutt = wizNaviHeader.mbutt;
	wizResult.push(wizLogic);
	wizResult.push(wizNaviHeader);
	return wizResult.concat(newActElement);

	//global.LOCAL.wizCmdArray
}
