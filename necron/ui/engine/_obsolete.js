import { global } from './___global.js';
import { GetVersionPage, BuildJSON_Settings_no_flt } from './_core';
import { runui } from './_util';
import { SendActionSocketIO } from './event';
import { checkErrorFltController } from './filter/filterEng';
import { post } from './fetch';

export async function httpRequest(set) {
	const success = (data) => {
		console.log('post success', data);
		if (data.respType === 'eval') {
			eval('(' + data.eval + ')')();
		}
		if (set.action === 'auth') {
			if (data.respType === 'save_ack' && data.result.ack === 'aok') {
				location.reload();
			} else {
				let msg;
				if (global['LANG_LIB'].__keywords[data.result['ack']]) {
					msg = global['LANG_LIB'].__keywords[data.result['ack']];
					runui('flymsg', msg, '', () => {
						location.reload();
					});
				} else {
					msg = data.result['ack'];
					console.log('!!!Hide message', msg);
				}
			}
		}
	};
	await post(set, success);
}

export function downloadSuccessAction(arr, group, item) {
	// try {
	let action = arr.action;
	if (action === undefined) return;

	if (action[group] === undefined) {
		action[group] = {};
		action[group]['params'] = undefined;
	}

	//debugger;
	let contentClass = arr.contentClass;
	global.callback[action.sender](
		'.' + global.TAG_PAGE,
		action[group][item],
		action[group]['params'],
		contentClass
	);
	//}
	//catch(e){}
}

export function BuildJSON_SendAction(PastTo, action, params, contentClass) {
	//!!!OBSOLETE, use eventControllerLink!!!

	const vers = GetVersionPage(global.SRV_OBJ.PageName);

	console.log('version=', vers, ' page_name=', global.SRV_OBJ.PageName);
	const page = {
		PageName: global.SRV_OBJ.PageName,
		version: vers
	};

	//debugger;
	if (params === undefined) {
		params = {};
		params.send_setting === false;
		params['socket_id'] = {};
	}

	params['settings'] = {};
	if (params.send_setting === true) {
		//Поиск настроек в global.settings и их синхронизация, используется в Wizard
		//  debugger;
		const pmcs = params.merge_cached_settings; //Возможно не используется!!!
		if (pmcs !== undefined) {
			const tset = BuildJSON_Settings(action, contentClass).settings;
			for (const pxn in global.settings[pmcs]) {
				console.log('merge_cached from global', pxn, 'value', global.settings[pmcs][pxn]);
				params['settings'][pxn] = global.settings[pmcs][pxn];
			}
			for (const tpxn in tset) {
				params['settings'][tpxn] = tset[tpxn];
				console.log('merge_cached from BuildObj', tpxn, 'value', global.settings[pmcs][tpxn]);
			}
			//подмена на синхронизированный page
			page.PageName = params.settings.page = pmcs;
		} else {
			let multiSett = BuildJSON_Settings(action, contentClass).settings;
			let mergeSett = {};
			for (let set in multiSett) {
				for (let s in multiSett[set]) {
					mergeSett[s] = multiSett[set][s];
				}
			}
			params['settings'] = mergeSett;
		}
	}

	params['socket_id'] = global.socket.id;
	const set = {
		page: page,
		type: 'action',
		data: params,
		action: action
	};

	console.log('send action ', set);

	if (action === 'rmcookies') {
		if (global.SRV_OBJ.client === 'web') {
			httpRequest(set);
		}
	} else {
		SendActionSocketIO({
			action: 'eventObsolete',
			data: set
		});
	}
}

export function BuildJSON_Settings(action, contentClass) {
	if (checkErrorFltController(contentClass) === true) {
		return undefined;
	}

	return BuildJSON_Settings_no_flt(action, contentClass);
}
