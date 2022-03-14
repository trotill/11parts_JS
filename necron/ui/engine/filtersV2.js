import { genError, initFilter, initFilterEng } from './filter/filterEng';
import { sym } from './filter/filterSym';
import { clean, checkErrorFltController, findErrorInfo } from './filter/filterEng';

let ip = (arr, { Obj, fltsett, value }) => {
	let xid;
	let error = [];

	let ipformat =
		/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	let result = value.match(ipformat);
	xid = 'ip' + Obj.id;
	if (result == null) {
		genError(xid, Obj, 'ip', fltsett);
		error.push('ip');
	} else {
		initFilter(xid, fltsett, Obj.contentClass);
	}

	return error;
};
let mac = (arr, { Obj, fltsett, value }) => {
	let xid;
	let error = [];

	let result = value.match(/([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})/g);
	xid = 'mac' + Obj.id;
	if (result == null) {
		genError(xid, Obj, 'mac', fltsett);
		error.push('mac');
	} else {
		initFilter(xid, fltsett, Obj.contentClass);
	}

	return error;
};

let hhmm = (arr, { Obj, fltsett, value }) => {
	let xid;
	let error = [];
	let hhmmformat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
	let result = value.match(hhmmformat);
	xid = 'hhmm' + Obj.id;
	if (result == null) {
		genError(xid, Obj, 'hhmm', fltsett);
		error.push('hhmm');
	} else {
		initFilter(xid, fltsett, Obj.contentClass);
	}
	return error;
};

let email = (arr, { Obj, fltsett, value }) => {
	let xid;
	let error = [];
	let emformat =
		// eslint-disable-next-line no-control-regex
		/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
	let result = value.match(emformat);
	xid = 'email' + Obj.id;
	if (result == null) {
		genError(xid, Obj, 'email', fltsett);
		error.push('email');
	} else {
		initFilter(xid, fltsett, Obj.contentClass);
	}
	return error;
};

let phone = (arr, { Obj, fltsett, value }) => {
	let xid;
	let error = [];
	let phformat = /^((\+7)+([0-9]){10})$/;
	let result = value.match(phformat);
	xid = 'phone' + Obj.id;
	if (result == null) {
		genError(xid, Obj, 'phone', fltsett);
		error.push('phone');
	} else {
		initFilter(xid, fltsett, Obj.contentClass);
	}
	return error;
};

let minmax = (arr, { Obj, fltsett, value }) => {
	//alert('XFL_minmax eventFromUI',eventFromUI);
	let xid;
	let result = parseFloat(value);
	let error = [];
	xid = 'minmax' + Obj.id;
	if (arr.length === 2) {
		//если 2 то в массиве мин и макс значение
		let min = parseFloat(arr[0]);
		let max = parseFloat(arr[1]);

		if (result !== parseFloat(value) || result < min || result > max) {
			genError(xid, Obj, 'minmax', fltsett, [result, [min, max]]);
			error.push('minmax');
		} else {
			initFilter(xid, fltsett, Obj.contentClass);
		}
	} else {
		for (let n = 0; n < arr.length; n++) {
			if (arr[n] !== result) {
				genError(xid, Obj, 'invalid', fltsett, [result, arr]);
				error.push('minmax');
			} else {
				initFilter(xid, fltsett, Obj.contentClass);
			}
		}
	}
	return error;
};

let len = (arr, { Obj, fltsett, value }) => {
	let error = [];
	if (arr.length === 2) {
		//если 2 то в массиве мин и макс кол символов
		//alert('eventFromUI'+eventFromUI);
		let xid = 'len' + Obj.id;
		let result = value;
		let min = parseInt(arr[0]);
		let max = parseInt(arr[1]);
		if (result.length < min || result.length > max) {
			genError(xid, Obj, 'len', fltsett, [result.length, min, max]);
			error.push('len');
		} else {
			initFilter(xid, fltsett, Obj.contentClass);
		}
	} else alert('Error XFL_len params>2');
	return error;
};

let XFL = {
	ip,
	mac,
	hhmm,
	email,
	phone,
	minmax,
	len,
	sym
};

function check(Obj, value) {
	if (!Obj['flt']) return [];
	if (Array.isArray(value)) return [];
	if (value === undefined) {
		alert(`Value ${Obj.id} is undefined, logic error!!!`);
		return [];
	}
	//if (typeof value === 'number'){

	//}

	let Filter = Obj['flt'];
	let fltsett = {};
	if (Obj['fltsett']) fltsett = Obj['fltsett'];

	if (!Obj.contentClass) alert('Error: filerV2 check, contentClass===undefined!!!');

	let result = [];
	for (let name in Filter) {
		if (XFL[name]) {
			console.log('connect filter ', name);

			result.push(...XFL[name](Filter[name], { Obj, fltsett, value }));
			//eval('this.XFL_' + name)(tagUI, Filter[name],Obj,this,fltsett);
		} else {
			if (name === 'chain') {
				console.log('deprecated filter chain for', Obj.id);
				let chainElement = Filter['chain'][0];
				result.push(...XFL[chainElement]([], { Obj, fltsett, value }));
			} else {
				alert(`undefined filter [${name}]`);
			}
		}
	}
	return result;
}

export { check, clean };
export default {
	check,
	clean,
	checkErrorFltController,
	findErrorInfo,
	initFilterEng
};
