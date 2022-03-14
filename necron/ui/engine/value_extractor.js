/**
 * Created by Ilya on 06.11.2018.
 */

import { global } from './___global.js';
import { existMeta, GetAllMeta, SetMeta } from './_metaVar';

export function CleanGlobalSettings() {
	global.settings = {};
}

export function ExtractArrayValuesRaw(ev) {
	//тоже самое что ExtractArrayValues, но без подстановки поля value, используется в wizard
	let pname_arr = [];
	for (const pname in ev) {
		const tp = pname.split('*');
		if (tp.length > 1) {
			let ev_value = ev[pname];

			if (!ev[tp[0]]) ev[tp[0]] = [];

			if (tp.length > 2) {
				if (!ev[tp[0]][tp[1]]) ev[tp[0]][tp[1]] = [];

				ev[tp[0]][tp[1]][tp[2]] = ev_value; //ev[pname];
				if (tp.length > 3) {
					if (!ev[tp[0]][tp[1]][tp[2]]) ev[tp[0]][tp[1]][tp[2]] = [];
					ev[tp[0]][tp[1]][tp[2]][tp[3]] = ev_value; //ev[pname];
				}
			}

			pname_arr.push(pname);
			console.log('detect array ', tp, 'mod ev', ev);
		}
	}
	for (let n = 0; n < pname_arr.length; n++) delete ev[pname_arr[n]];
	console.log('new ev', ev);
}

export function SyncSettingsWithMetaVarValues(contentClass) {
	for (let sett in global.settings) {
		for (let field in global.settings[sett]) {
			if (!existMeta(field, contentClass))
				SetMeta(
					{
						id: field,
						value: global.settings[sett][field]
					},
					contentClass
				);
		}
	}
}
export function ExtractArrayValues(ev) {
	let pname_arr = [];
	for (let pname in ev) {
		let tp = pname.split('*');
		if (tp.length > 1) {
			let ev_value = ev[pname].value;

			if (!ev[tp[0]]) ev[tp[0]] = { value: [] };

			if (tp.length > 2) {
				if (!ev[tp[0]].value[tp[1]]) ev[tp[0]].value[tp[1]] = [];

				ev[tp[0]].value[tp[1]][tp[2]] = ev_value;
				if (tp.length > 3) {
					if (!ev[tp[0]].value[tp[1]][tp[2]]) ev[tp[0]].value[tp[1]][tp[2]] = [];
					ev[tp[0]].value[tp[1]][tp[2]][tp[3]] = ev_value;
				}
			}

			pname_arr.push(pname);
			console.log('detect array ', tp, 'mod ev', ev);
		}
	}
	for (let n = 0; n < pname_arr.length; n++) delete ev[pname_arr[n]];
	console.log('new ev', ev);
}

function ExtractSettingValueCorrect(value) {
	if (value === null || value === undefined) return undefined;
	if (Array.isArray(value)) {
		let tmpValue = [];
		for (let n = 0; n < value.length; n++) {
			let val = ExtractSettingValueCorrect(value[n]);
			if (val) tmpValue.push(val);
		}
		return tmpValue;
	} else return value;
}
export function ExtractSetting(contentClass) {
	let MVar = GetAllMeta(contentClass);
	let result = {};
	for (let sett in global.settings) {
		for (let settVar in global.settings[sett]) {
			if (MVar[settVar]) {
				if (!result[sett]) result[sett] = {};
				if (settVar === 'type' || settVar === 'page') {
					result[sett][settVar] = global.settings[sett][settVar];
					continue;
				}
				let settValue = ExtractSettingValueCorrect(MVar[settVar].value);
				if (settValue !== undefined) {
					result[sett][settVar] = settValue;
					global.settings[sett][settVar] = settValue;
				} else {
					alert('Ooops, error, setting ' + sett + ' has undefined value');
				}
			}
		}
	}
	return result;
}

//заполняет value UI обьекта значением из global.settings
export function FillSettingsToBuildObjValue(arr) {
	let arrid = arr.id.split('*');
	let ID = arrid[0];
	let sett_value;
	let fnd = 0;

	for (let name_sett in global.settings) {
		for (let ns_item_name in global.settings[name_sett]) {
			if (ns_item_name === ID) {
				sett_value = global.settings[name_sett][ns_item_name];
				if (sett_value.length !== 0) {
					fnd = 1;
					break;
				}
			}
		}
		if (fnd) break;
	}

	if (fnd === 1) {
		if (arrid.length > 1) {
			//найдены разделители *, это таблица
			//debugger;
			if (arrid.length === 2) arr.value = sett_value[arrid[1]];
			if (arrid.length === 3) arr.value = sett_value[arrid[1]][arrid[2]];
			if (arrid.length === 4) arr.value = sett_value[arrid[1]][arrid[2]][arrid[3]];
		} else {
			arr.value = sett_value;
		}
	}
}
