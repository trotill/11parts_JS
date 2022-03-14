/**
 * Created by Ilya on 14.02.2019.
 */

import { global, mobXstore, updateWizLogicParam } from '../../../../engine/___global.js';
import { SetMetaForce } from '../../../../engine/_metaVar';
import { isObject, nu, requestData, t } from '../../../../engine/_core';
import { BuildObj, deleteBuildedObj } from '../../../../engine/_buildEng';
import { PastControllerReact } from '../../../../engine/_pastController';
import { CleanGlobalSettings, ExtractArrayValuesRaw } from '../../../../engine/value_extractor';
import { wiz_load_obj, wiz_sysevent } from './wizard_func';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect } from 'react';
import * as React from 'react';
import { checkErrorFltController } from '../../../../engine/filter/filterEng';
import { createElement } from '../componentType';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

function WizCreateNaviHeader({ Obj }: createElement): any {
	runInAction(() => {
		mobXstore.system.wizNavi.ButtId = Obj.mbutt;
		mobXstore.system.wizNavi.ButtText = Obj.nbutt;
		mobXstore.system.wizNavi.Style = Obj.class;
	});
	return 'WizNaviHeader';
}

function checkTransition(sysEvent: any) {
	for (const act in sysEvent) {
		if (act === 'load_obj') return 1;
	}
	return 0;
}

function __wiz_event_handler(e: any) {
	console.log('Event', e.type, 'this', this); //,'arr ',e_arr);

	let uiCfg: boolean;
	const wlp = global.cache.wizLogicParam;
	const contentClass = wlp.contentClass;
	let ignTrig = 0;
	// debugger;

	//debugger;
	global.wizardEmitter.emitEvent(e.type, wlp as any);

	if (wlp.ignflt !== undefined) {
		for (let z = 0; z < wlp.ignflt.length; z++) {
			if (wlp.ignflt[z] === e.type) {
				ignTrig = 1;
			}
		}
	}
	if (ignTrig) uiCfg = true;
	else uiCfg = !checkErrorFltController(contentClass);

	// console.log("UI CFG",uicfg.settings);//
	// debugger;
	if (uiCfg) {
		//если планируется переход на другую страницу, то удалить получение эвента
		if (wlp.sysevent === undefined) {
			document.removeEventListener(e.type, __wiz_event_handler);
		} else {
			if (checkTransition(wlp.sysevent[e.type] === 1))
				document.removeEventListener(e.type, __wiz_event_handler);
		}

		const settings: any = global.settings;
		for (const evkey in wlp.event) {
			if (evkey === e.type) {
				for (const pgkey in wlp.event[evkey]) {
					if (settings[pgkey] === undefined) settings[pgkey] = {};
					ExtractArrayValuesRaw(wlp.event[evkey][pgkey]);
					//debugger;
					for (const setkey in wlp.event[evkey][pgkey]) {
						//if (Array.isArray(wlp.eventFromUI[evkey][pgkey][setkey])){
						//   if (global.settings[pgkey][setkey]==undefined)
						//      global.settings[pgkey][setkey]=wlp.eventFromUI[evkey][pgkey][setkey];
						//  MergeTwoArray(global.settings[pgkey][setkey],wlp.eventFromUI[evkey][pgkey][setkey]);
						// }
						//else
						if (isObject(wlp.event[evkey][pgkey][setkey])) {
							if (wlp.event[evkey][pgkey][setkey].rdvar !== undefined) {
								const value = eval(wlp.event[evkey][pgkey][setkey].rdvar);
								settings[pgkey][setkey] = value;
								SetMetaForce(
									{
										id: setkey,
										value: value
									},
									wlp.contentClass
								);
							} else alert('Undefined wiz value [' + setkey + ']');
						} else {
							settings[pgkey][setkey] = wlp.event[evkey][pgkey][setkey];
							SetMetaForce(
								{
									id: setkey,
									value: wlp.event[evkey][pgkey][setkey]
								},
								wlp.contentClass
							);
						}
					}
				}
			}
		}
		//  debugger;

		console.log('global.settings', settings);
		if (wlp.sysevent !== undefined) {
			let nodet = 1;
			let sev;
			for (sev in wlp.sysevent) {
				if (sev === e.type) {
					nodet = 0;
					break;
				}
			}
			if (nodet === 0) {
				for (const page in wlp.event[sev]) {
					if (nu(wlp.pages[page])) {
						alert(`No found page [${page}] in pages array!!!`);
						return;
					}
				}
				wiz_sysevent({
					action: wlp.sysevent[sev],
					actidx: 0,
					event_type: e.type,
					contentClass: contentClass
				});
			} else wiz_load_obj(e.type);
		} else {
			wiz_load_obj(e.type);
		}
	}
	//
}

function BuildJSONF_LoadSetting_WizLogic(
	setting_name: string,
	ajax_succ_callback: any,
	cb_context: any,
	contentClass: string
) {
	const reqObj: any = {
		type: 'loadSet',
		setting_name: setting_name,
		contentClass: contentClass
	};
	console.log('Request setting obj', reqObj);
	const PagePrefix: string = global.SRV_OBJ.PagePrefix;
	requestData(PagePrefix, '', reqObj, ajax_succ_callback, undefined, cb_context);
}

const buildPageData: any = {};
function WizLogicCleanup(contentClass: string, wizBlockId: string, parentBlockId: string): any {
	if (buildPageData[contentClass] === undefined) return;
	deleteBuildedObj(buildPageData[contentClass]);
	deleteBuildedObj({ [wizBlockId]: parentBlockId });
}
function WizLogic({ PastTo, Id, Obj }: createElement): string {
	const blockId = '#' + Id;
	WizLogicCleanup(Obj.contentClass, blockId, PastTo);
	if (Obj.ppos !== undefined) {
		if (Obj.ppos === 'main') CleanGlobalSettings();
	}
	updateWizLogicParam(Obj);
	//global.cache.wizLogicParam = Obj;

	const WizLogicElement = observer(() => {
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
				console.log('Remove', Id);
			};
		}, []);
		// let PastTo=props.param.PastTo;
		return (
			<div className="wizlogic_block" id={Id}>
				{mobXstore.element.doRender(blockId)}
			</div>
		);
	});
	PastControllerReact({
		PastTo,
		Obj: Obj,
		Id: blockId,
		ReactElement: <WizLogicElement key={Id} />
	});

	if (Obj.navi !== undefined) {
		for (let n = 0; n < Obj.navi.length; n++) {
			console.log('addEventListener ', Obj.navi[n]);
			document.addEventListener(Obj.navi[n], __wiz_event_handler, false);
		}
	}
	if (Obj.pages !== undefined) {
		for (const key in Obj.pages) {
			const settings: any = global.settings;
			if (settings[key] === undefined) {
				//console.log('MQR BuildJSONF_LoadSetting_WizLogic',key);

				BuildJSONF_LoadSetting_WizLogic(
					key,
					function (context: any) {
						//console.log('MQR JS_WizLogic BuildJSONF_LoadSetting_WizLogic context',context,'id',id);
						// SyncSettingsWithMetaVarValues();
						//console.log('MQR JS_WizLogic blockId',context.blockId,'context.page',context.page,'arr.contentClass',arr.contentClass);
						buildPageData[Obj.contentClass] = {
							...buildPageData[Obj.contentClass],
							...BuildObj(context.divPastTo, context.page, {
								contentClass: Obj.contentClass,
								parent_data: {
									id: Id
								}
							})
						};
					},
					{ divPastTo: blockId, page: Obj.pages[key] },
					Obj.contentClass
				);
			} else {
				// arr.pages[key].value=global.settings[key]
				buildPageData[Obj.contentClass] = {
					...buildPageData[Obj.contentClass],
					...BuildObj(blockId, Obj.pages[key], {
						contentClass: Obj.contentClass,
						parent_data: {
							id: Id
						}
					})
				};
			}
		}
	}
	return blockId;
}

//компонент используется только в sysevent, для фоновой отправки действия при нажатии на кнопку
//или другой контрол
function WizEvent({ Id, Obj }: createElement): any {
	let wizEvent: any = global.cache.wizEvent;
	wizEvent = wizEvent ?? {};
	wizEvent[Id] = Obj;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createWizEvent = (PastTo: any, Id: any, Obj: any): string => {
	return WizEvent({ PastTo, Id, Obj });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createWizLogic = (PastTo: any, Id: any, Obj: any): string => {
	return WizLogic({ PastTo, Id, Obj });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createWizInfo = (PastTo: any, Id: any, Obj: any): string => {
	alert('Need develop "WizInfo({ PastTo, Id, Obj })"');
	return null;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createWizCreateNaviCheckbox = (PastTo: any, Id: any, Obj: any): string => {
	alert('Need develop "WizCreateNaviCheckbox({ PastTo, Id, Obj })"');
	return null;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createWizCreateNavi = (PastTo: any, Id: any, Obj: any): string => {
	alert('Need develop "WizCreateNavi({ PastTo, Id, Obj })"');
	return null;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createWizCreateNaviHeader = (PastTo: any, Id: any, Obj: any): string => {
	return WizCreateNaviHeader({ PastTo, Id, Obj });
};
export default {
	wizEvent: {
		create: createWizEvent
	},
	wizLogic: {
		create: createWizLogic,
		cleanup: WizLogicCleanup
	},
	wizInfo: {
		create: createWizInfo
	},
	wizNaviCheckbox: {
		create: createWizCreateNaviCheckbox
	},
	wizNavi: {
		create: createWizCreateNavi
	},
	wizNaviHeader: {
		create: createWizCreateNaviHeader
	}
};
