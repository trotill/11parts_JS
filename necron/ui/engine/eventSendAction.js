import { BuildJSON_Settings } from './_obsolete';
import { MetaVar, setGlobalCallback } from './___global';
import { nu } from './_core';
import { checkErrorFltController } from './filter/filterEng';

function SendAction_ConstSettingProvider(arg) {
	return arg.arr.ConstSetting;
}

function SendAction_SettingProvider(arg) {
	return BuildJSON_Settings(arg.action_id, arg.contentClass).settings;
}

function SendAction_IdProvider(arg) {
	return arg.param.id;
}

function SendAction_ArgProvider(arg) {
	return arg;
}

function SendAction_DnkProvider(arg) {
	return arg.param.data;
}

function SendAction_ChangedMetaVarProvider(arg) {
	let chtree = {};
	let pchtree;
	let contentClass = arg.contentClass;
	if (checkErrorFltController(contentClass) === true) {
		return undefined;
	}

	for (let v in MetaVar[contentClass]) {
		if (MetaVar[contentClass][v].changed === true) {
			let value = MetaVar[contentClass][v].value;
			let splr = v.split('_');
			pchtree = chtree;
			for (let n = 0; n < splr.length; n++) {
				if (nu(pchtree[splr[n]])) {
					if (n < splr.length - 1) {
						pchtree[splr[n]] = {};
						pchtree = pchtree[splr[n]];
					} else {
						pchtree[splr[n]] = value;
					}
				} else pchtree = pchtree[splr[n]];
			}
		}
	}

	if (Object.keys(chtree).length === 0) return undefined;

	return chtree;
}

export function registerBasedActionSender() {
	setGlobalCallback('ConstSettingProvider', SendAction_ConstSettingProvider);
	setGlobalCallback('SettingProvider', SendAction_SettingProvider);
	setGlobalCallback('SettingsProvider', SendAction_SettingProvider); //OBSOLETE
	setGlobalCallback('IdProvider', SendAction_IdProvider);
	setGlobalCallback('ArgProvider', SendAction_ArgProvider);
	setGlobalCallback('DnkProvider', SendAction_DnkProvider);
	setGlobalCallback('ChangedMetaVarProvider', SendAction_ChangedMetaVarProvider);
}
