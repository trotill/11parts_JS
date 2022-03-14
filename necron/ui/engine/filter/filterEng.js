import { global } from '../___global';
import { runui } from '../_util';

let XFL_ErrTab = {};
let XFL_Info = {};
function clean(contentClass) {
	XFL_ErrTab[contentClass] = {};
	XFL_Info[contentClass] = {};
}

function findErrorInfo(id, contentClass) {
	let result = [];
	for (let xid in XFL_Info[contentClass]) {
		if (XFL_Info[contentClass][xid].XFL.id === id) {
			if (XFL_Info[contentClass][xid].XFL.er === '1') result.push(XFL_Info[contentClass][xid]);
		}
	}
	return result;
}

function showErrMsg(contentClass) {
	for (let item in XFL_ErrTab[contentClass]) {
		console.log('XFL_ErrTab[item].er', XFL_ErrTab[contentClass][item].er);
		if (XFL_ErrTab[contentClass][item].er === '1') {
			let msg = genMessage(XFL_ErrTab[contentClass][item]);
			if (msg.length !== 0) runui('errmsg', XFL_ErrTab[contentClass][item], msg);
		}
	}
}

function checkErrorFltController(contentClass) {
	for (let item in XFL_ErrTab[contentClass]) {
		if (XFL_ErrTab[contentClass][item].er === '1') {
			showErrMsg(contentClass);
			return true;
		}
	}
	return false;
}

function genMessage(XFL_ErrTab) {
	let msg = '';
	let p = XFL_ErrTab.p;
	let ui_name = XFL_ErrTab.name;

	if (ui_name.length === 0) ui_name = global['LANG_LIB'].__keywords.noname;

	switch (XFL_ErrTab.msg) {
		case 'hhmm':
			msg = ui_name + ') ' + global['LANG_LIB'].__keywords.xfl_hhmm;
			break;
		case 'email':
			msg = ui_name + ') ' + global['LANG_LIB'].__keywords.xfl_email;
			break;
		case 'phone':
			msg = ui_name + ') ' + global['LANG_LIB'].__keywords.xfl_phone;
			break;
		case 'ip':
			msg = ui_name + ') ' + global['LANG_LIB'].__keywords.xfl_ip;
			break;
		case 'mac':
			msg = ui_name + ') ' + global['LANG_LIB'].__keywords.xfl_mac;
			break;
		case 'len':
			{
				let s = '';
				if (p[0] > p[2]) s = global['LANG_LIB'].__keywords.xfl_ln_max + p[2] + ' )';
				if (p[0] < p[1]) s = global['LANG_LIB'].__keywords.xfl_ln_min + p[1] + ' )';

				msg = ui_name + ') ' + global['LANG_LIB'].__keywords.xfl_ln_elen + s;
			}
			break;
		case 'minmax':
			{
				let s = p[0];
				if (parseFloat(p[0]) > parseFloat(p[1][1]))
					s += global['LANG_LIB'].__keywords.xfl_mm_max + p[1][1] + ')';
				if (parseFloat(p[0]) < parseFloat(p[1][0]))
					s += global['LANG_LIB'].__keywords.xfl_mm_min + p[1][0] + ')';

				msg = ui_name + ') ' + global['LANG_LIB'].__keywords.xfl_mm_enum + s;
			}
			break;
		case 'sym':
			msg = ui_name + ') ' + global['LANG_LIB'].__keywords['xfl' + [p[0]]];
			break;
	}

	return global['LANG_LIB'].__keywords.field + ' (' + msg;
}

function addErrorInfo(xid, type, fltsett, contentClass) {
	let xfl_sett = fltsett;
	if (xfl_sett['event'] !== undefined && xfl_sett['event'] === false) return;

	if (type === 'e') {
		let GMsg = genMessage(XFL_ErrTab[contentClass][xid]);
		if (GMsg.length === 0) return;
		XFL_Info[contentClass][xid] = { xid: xid, XFL: XFL_ErrTab[contentClass][xid], msg: GMsg };
	} else XFL_Info[contentClass][xid] = { xid: xid, XFL: XFL_ErrTab[contentClass][xid], msg: '' };
}

let genError = (xid, Obj, msg, fltsett, p = []) => {
	XFL_ErrTab[Obj.contentClass][xid] = { er: '1', id: Obj.id, msg: msg, name: Obj.name, p: p };
	addErrorInfo(xid, 'e', fltsett, Obj.contentClass);
};

function clearError(xid, contentClass) {
	XFL_ErrTab[contentClass][xid].er = '0';
	addErrorInfo(xid, '', {}, contentClass);
}

let initFilter = (xid, fltsett, contentClass) => {
	if (xid in XFL_ErrTab[contentClass] && XFL_ErrTab[contentClass][xid].er === '1') {
		addErrorInfo(xid, '', fltsett, contentClass);
	}
	if (XFL_ErrTab[contentClass][xid] === undefined) XFL_ErrTab[contentClass][xid] = [];
	XFL_ErrTab[contentClass][xid]['er'] = '0';
	clearError(xid, contentClass);
};

function initFilterEng(contentClass) {
	clean(contentClass);
}
export { genError, initFilter, initFilterEng, clean, checkErrorFltController, findErrorInfo };
