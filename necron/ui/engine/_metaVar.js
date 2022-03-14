import { global, MetaVar } from './___global.js';
import { u, nu } from './_core';

export function initMetaVar(contentClass) {
	global.MetaVar[contentClass] = [];
}

export function setMarkInMetaVar(contentClass, id, value) {
	if (!global.MetaVar[contentClass][id]) global.MetaVar[contentClass][id] = { mark: value };
	else global.MetaVar[contentClass][id]['mark'] = value;
}

export function initMetaVarIfUndef(contentClass) {
	if (nu(contentClass)) return;

	if (nu(global.MetaVar[contentClass])) global.MetaVar[contentClass] = [];
}

export function GetAllMeta(contentClass) {
	//console.log("Found meta vars ",MetaVar);
	return MetaVar[contentClass];
}

export function CheckMetaChange(contentClass) {
	for (let id in global.MetaVar[contentClass]) {
		if (global.MetaVar[contentClass][id].changed) {
			return true;
		}
	}
	return false;
}

export function setMetaChange(id, stat, contentClass) {
	global.MetaVar[contentClass][id].changed = stat;
}
export function metaIsChange(id, contentClass) {
	return (
		u(global.MetaVar[contentClass][id].changed) && global.MetaVar[contentClass][id].changed === true
	);
}

export function SetMetaSeoc(id, seoc, contentClass) {
	//send evt on change, 1 - send in any case, 0 - send if changed only
	global.MetaVar[contentClass][id]['seoc'] = seoc;
}

export function SetMetaBaseUI(Obj, value) {
	if (u(Obj.table)) {
		SetMetaTableForce(value, Obj.table.tabId, Obj.table.row, Obj.table.col, Obj.contentClass);
	} else
		SetMetaForce(
			{
				id: Obj.id,
				value: value
			},
			Obj.contentClass
		);
}
export function clearMetaTable({ contentClass, Id, row }) {
	MetaVar[contentClass][Id].value[row] = undefined;
}
function SetMetaTableForce(value, tabId, row, col, contentClass) {
	if (!MetaVar[contentClass][tabId]) {
		MetaVar[contentClass][tabId] = {};
	}
	if (!Array.isArray(MetaVar[contentClass][tabId].value)) {
		MetaVar[contentClass][tabId].value = [];
		MetaVar[contentClass][tabId].value[row] = [];
	} else {
		if (nu(MetaVar[contentClass][tabId].value[row])) MetaVar[contentClass][tabId].value[row] = [];
	}
	try {
		MetaVar[contentClass][tabId].value[row][col] = value;
	} catch (r) {
		// eslint-disable-next-line no-debugger
		debugger;
	}
}
export function GetMetaForce(id, contentClass) {
	return { ...global.MetaVar[contentClass][id] };
}
export function SetMetaForce(arg, contentClass) {
	let params = { ...arg };
	if (nu(global.MetaVar[contentClass][params.id]))
		global.MetaVar[contentClass][params.id] = {
			ovsz: 0, //if value array then 1
			ovch: 1, //if new value is different from old, then 1
			seoc: 0 //send evt on change, 1 - send in any case, 0 - send if changed only
		};
	if (nu(global.MetaVar[contentClass][params.id].changed))
		global.MetaVar[contentClass][params.id].changed = false;

	if (Array.isArray(global.MetaVar[contentClass][params.id]['value']))
		//if value array then 1
		global.MetaVar[contentClass][params.id]['ovsz'] =
			global.MetaVar[contentClass][params.id]['value'].length;
	else global.MetaVar[contentClass][params.id]['ovsz'] = 0;

	if (MetaVar[contentClass][params.id]['value'] !== params.value)
		//if new value is different from old, then 1
		global.MetaVar[contentClass][params.id]['ovch'] = 1;
	else global.MetaVar[contentClass][params.id]['ovch'] = 0;

	global.MetaVar[contentClass][params.id]['value'] = params.value;
}

export function existMeta(id, contentClass) {
	return global.MetaVar[contentClass][id] !== undefined;
}
export function SetMeta(arr, contentClass) {
	if (arr.id) global.MetaVar[contentClass][arr.id] = arr; //{'id':arr.id,'value':arr.value};//value;
}

export function ClearAllMeta(contentClass) {
	global.MetaVar[contentClass] = [];
}

export function DeleteDublicatesInMeta(data, contentClass) {
	console.log('data', data);
	if (data != null) {
		data.forEach((dataI) => {
			if (dataI.id === undefined) return;

			if (MetaVar[contentClass][dataI.id]) {
				console.log('Delete meta id ', MetaVar[contentClass][dataI.id]);
				MetaVar[contentClass][dataI.id] = {};
				delete MetaVar[contentClass][dataI.id];
			}
		});
	}
}
