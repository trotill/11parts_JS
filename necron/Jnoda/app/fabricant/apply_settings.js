/**
 * Created by Ilya on 28.02.2018.
 */

const v = require('./../base/vpn.js');
const jf = require('./../../Jnoda_func.js');

function cnoda_event() {}

function cnoda(obj) {
	if (obj.action === 'event') {
		cnoda_event(obj.event);
	}
}
function apply(obj, ssend) {
	if (obj.d['type'] === 'settings') {
		var extra = jf.ExtractSettingType(obj.d.page);
		switch (extra.type) {
			case 'vpn':
				{
					v.setup(obj.d, ssend);
				}
				break;
		}
	}
}

function async_plug() {}

function async_unplug() {}

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
