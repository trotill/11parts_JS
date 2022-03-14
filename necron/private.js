/**
 * Created by Ilya on 21.05.2018.
 */

const c = require('./backCore');
const fs = require('fs');

let priv = { none: 'none' };
let ovPriv = {};

if (fs.existsSync(c.CACHE_PATH + '/private')) {
	//Obsolete
	ovPriv = JSON.parse(fs.readFileSync(c.CACHE_PATH + '/private'));
}

let settPriv = JSON.parse(c.GetSetting('private'));
if (Object.keys(settPriv).length > 0 || Object.keys(ovPriv).length > 0) {
	priv = Object.assign(settPriv, ovPriv);
}

function GetVal(obj, n, gpr) {
	if (n === obj.length - 1) {
		return gpr[obj[n]];
	} else {
		return gpr[obj[n]] ? GetVal(obj, n + 1, gpr[obj[n]]) : undefined;
	}
}
function GetPrivateValue(name) {
	let ret = undefined;
	if (priv['none']) return ret;

	let s = name.split('.');
	let n = 0;
	ret = GetVal(s, n, priv);
	console.log('Private var ', name, 'value', ret);
	return ret;
}

module.exports = {
	GetPrivateValue
};
