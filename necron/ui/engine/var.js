/**
 * Created by i7 on 06.05.2018.
 */

import { MetaVar, getGlobalCallback, getGlobalVar } from './___global.js';
import { u, nu, t } from './_core';
import { CheckJSON_Str } from './preinit';
import moment from 'moment';

function svalueDefaultSrcChvar(arg) {
	let result = '';

	if (arg.default) return arg.default;

	if (arg.mode) {
		switch (arg.mode) {
			case 'translate':
				{
					result = '';
				}
				break;
			case 'rep':
				{
					if (arg.eval) {
						result = getGlobalCallback(arg.eval)('');
					} else {
						result = arg.value[0];
					}
				}
				break;
			case '*':
				{
					result = arg.value;
				}
				break;
			case '/':
				{
					result = 0;
				}
				break;
			case '+':
				{
					result = arg.value;
				}
				break;
			case 'time': {
				if (arg.format === 'hh:mm') result = '00:00';
			}
		}
	}
	return result;
}

function svalueChvar(arg, value) {
	let def_value = arg.default;
	if (value === '' && def_value) return def_value;

	if (arg.mode) {
		switch (arg.mode) {
			case 'translate': {
				if (value === '') return '';

				return t(value);
			}

			case 'rep': {
				let pos = '0';
				if (arg.eval) {
					return getGlobalCallback(arg.eval)(value);
				} else {
					if (!Array.isArray(arg.value)) {
						//взять массив из переменной о перестроить
						//переопределение rep по переменным
						let v = getGlobalVar(arg.value);
						if (u(v)) {
							arg.value = v;
							arg.replace = getGlobalVar(arg.replace);
						} else alert('Sval eval rep error');
					}
					if (value === '') return t(arg.replace[0]);

					if ((pos = arg.value.indexOf(value)) !== -1) {
						return t(arg.replace[pos]);
					} else return value;
				}
			}

			case '*': {
				if (value === '') return arg.value;

				return parseInt(value) * arg.value;
			}

			case '/': {
				if (value === '') return 0;

				return (parseInt(value) / arg.value).toFixed(2);
			}

			case 'time': {
				if (value === '') return '00:00';

				let sec_num = value;
				let hours = Math.floor(sec_num / 3600);
				let minutes = Math.floor((sec_num - hours * 3600) / 60);

				if (hours < 10) {
					hours = '0' + hours;
				}
				if (minutes < 10) {
					minutes = '0' + minutes;
				}

				return hours + ':' + minutes;
			}

			case '+': {
				if (value === '') return arg.value;

				return parseInt(value) + arg.value;
			}

			case 'edit': {
				return value;
			}

			case 'z': {
				return value;
			}

			case 'date_one': {
				if (arg.format === undefined) arg.format = 'DD/MM/YYYY';
				return moment(parseInt(value)).format(arg.format);
			}
		}
	}
	return '...';
}

export function valueController(arr, contentClass) {
	if (arr.value === undefined) {
		if (MetaVar[contentClass]?.[arr.id]?.value) {
			arr.value = MetaVar[contentClass][arr.id].value;
		} else arr.value = '---';
	}
}

export function cValueController(arr) {
	if (arr.cvalue) {
		arr.value = arr.cvalue;
	}
}
/*
 arr={
   value:0,
   svalue:['{"chvar":{"mode":"*","value":0.1}}']
 }
 */

export function svalueController(arr) {
	if (!arr.svalue) {
		return {
			value: arr.value
		};
	}

	if (!Array.isArray(arr.svalue)) {
		alert('svalue must by array!!! ' + arr);
		return arr;
	}

	let result;
	if (Array.isArray(arr.value)) {
		arr.evalue = [];
		arr.value = arr.value.map((valueIdx) => {
			let res = svalueControllerSingle({
				value: valueIdx,
				svalue: arr.svalue
			});

			if (res.evalue) {
				if (!arr.evalue) arr.evalue = [];
			}

			if (!res.evalue) arr.evalue[arr.evalue.length] = undefined;
			else arr.evalue.push(res.evalue);
			return res.value;
		});
		result = arr;
	} else result = svalueControllerSingle(arr);

	let nval;
	if (arr.format) {
		if (Array.isArray(result.evalue)) {
			nval = [];
			for (let n = 0; n < result.evalue.length; n++) {
				if (nu(result.evalue[n]) || isNaN(result.evalue[n])) {
					if (n > 0) result.evalue[n] = result.evalue[n - 1];
					else {
						switch (arr.format) {
							case 'int':
								result.evalue[n] = 0;
								break;
							case 'float':
								result.evalue[n] = 0.0;
								break;
							case 'string':
								result.evalue[n] = '';
								break;
						}
					}
				}
				switch (arr.format) {
					case 'int':
						nval.push(parseInt(result.evalue[n]));
						break;
					case 'float':
						nval.push(parseFloat(result.evalue[n]));
						break;
					case 'string':
						nval.push(result.evalue[n]);
						break;
				}
			}
		} else {
			if (nu(result.evalue) || isNaN(result.evalue)) {
				switch (arr.format) {
					case 'int':
						result.evalue = 0;
						break;
					case 'float':
						result.evalue = 0.0;
						break;
					case 'string':
						result.evalue = '';
						break;
				}
			}
			switch (arr.format) {
				case 'int':
					nval = parseInt(result.evalue);
					break;
				case 'float':
					nval = parseFloat(result.evalue);
					break;
				case 'string':
					nval = result.evalue;
					break;
			}
		}
		result.evalue = nval;
	}
	return result;
}
function svalueControllerSingle(arr) {
	if (arr.value !== 0 && !arr.value)
		return {
			value: undefined
		};

	if (arr.svalue !== 0 && !arr.svalue) {
		return {
			value: arr.value
		};
	}
	// console.log('svalue controller',arr);
	let savedval = arr.value;
	arr.value = '';
	arr.evalue = '';
	arr.svalue.forEach((svalueIdx) => {
		if (CheckJSON_Str(svalueIdx) === '') {
			alert('Incorrect svalue var format (sCS)', svalueIdx);
			return;
		}
		let sval = JSON.parse(svalueIdx);
		// console.log('parsed svalue', sval);
		if (sval.rdvar) {
			arr.evalue = arr.value += getGlobalVar(sval.rdvar);
		} else if (sval.cvar) {
			arr.evalue = arr.value += sval.cvar;
		} else if (sval.chvar) {
			arr.evalue += svalueChvar(sval.chvar, savedval);
			if (savedval === '') savedval = svalueDefaultSrcChvar(sval.chvar);
			arr.value = savedval;
		}
	});
	let res = {
		value: arr.value
	};
	if (u(arr.evalue)) {
		res['evalue'] = arr.evalue;
	}

	return res;
}
