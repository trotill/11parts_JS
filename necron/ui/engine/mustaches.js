/**
 * Created by i7 on 17.06.2020.
 */
import { global } from './___global.js';
import { t } from './_core';
import Mustache from 'mustache';

export function t_must(str) {
	let view = global.LANG_LIB.__keywords;
	let nat = t(str);
	if (nat === str) {
		return Mustache.render(str, view);
	} else return nat;
}
