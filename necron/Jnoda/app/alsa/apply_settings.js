/**
 * Created by Ilya on 28.02.2018.
 */

const jf = require('./../../Jnoda_func.js');
const ex = require('./../../../exec.js');

function setup(objD) {
	console.log('Alsa setup', objD);
	if (objD.alsaMasterVol && objD.alsaMasterVol <= 100 && objD.alsaMasterVol >= 0) {
		console.log('amixer sset Master ' + objD.alsaMasterVol);
		ex.ExecNoOutSync('amixer sset Master ' + objD.alsaMasterVol);
	}
	if (objD.alsaPcmVol && objD.alsaPcmVol <= 100 && objD.alsaPcmVol >= 0) {
		ex.ExecNoOutSync('amixer sset PCM ' + objD.alsaPcmVol);
	}
}

function cnoda(/*obj, ssend*/) {}
function apply(obj, ssend) {
	if (obj.d['type'] === 'settings') {
		const extra = jf.ExtractSettingType(obj.d.page);
		switch (extra.type) {
			case 'alsa':
				{
					setup(obj.d, ssend);
				}
				break;
		}
	}
}

function async_plug(/*obj*/) {}

function async_unplug(/*obj*/) {}

function info(obj) {
	const respfull = {};
	respfull['req'] = obj.req;
	respfull['iface'] = obj.iface;
}

function SetToDefault() {}

module.exports = {
	apply,
	info,
	cnoda,
	async_plug,
	async_unplug,
	SetToDefault
};
