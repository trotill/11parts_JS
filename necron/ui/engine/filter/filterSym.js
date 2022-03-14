import { u } from '../_core';
import { genError, initFilter } from './filterEng';

let symTab = {
	zpn: (str) => /^([0-9]*)$/.test(str),
	n: (str) => /^(([-]?[1-9]{1}[0-9]*)|(0?))$/.test(str),
	f: (str) => /^[-]?(([1-9][0-9]*)|(0))(([.][0-9]+)|())$/.test(str),
	er: (str) => /^[a-zA-Zа-яА-Я ]*$/.test(str),
	en: (str) => /^[a-zA-Z0-9]*$/.test(str),
	ern: (str) => /^[a-zA-Zа-яА-Я0-9]*$/.test(str),
	erns: (str) => /^[a-zA-Zа-яА-Я0-9-._ @#$%&*!'"=+\?/\]\[()]*$/.test(str),
	ens: (str) => /^[a-zA-Z0-9-_ @#$%&*!'"=+\.\?/\]\[()]*$/.test(str),
	hex: (str) => str.match(/(0x[0-9A-F]*$)/g) != null,
	url: (str) => /^[0-9a-z-_а-я:.]*$/.test(str),
	eEnp: (str) => /^[0-9a-z-_A-Z.]*$/.test(str)
};

export let sym = (arr, { Obj, fltsett, value }) => {
	let xid = 'sym' + Obj.id;
	let result = value;
	let error = [];
	let fltSymName = arr[0];
	if (u(symTab[fltSymName])) {
		if (symTab[fltSymName](result) === false) {
			genError(xid, Obj, 'sym', fltsett, [arr[0]]);
			error.push('len');
		} else {
			initFilter(xid, fltsett, Obj.contentClass);
		}
	} else {
		alert('incorrect sym filt ' + fltSymName);
	}
	return error;
};
