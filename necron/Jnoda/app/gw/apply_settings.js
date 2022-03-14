/**
 * Created by Ilya on 28.02.2018.
 */

const c = require('../../../backCore.js');
const v = require('./../base/vpn.js');
const jf = require('./../../Jnoda_func.js');

const irem = { 0: {}, 1: {} };

function cnoda_event(obj) {
	const vname = Object.keys(obj.cnvalue);

	for (const paramname in vname) {
		const oname = vname[paramname];

		if (oname === 'remote_info') {
			const pjs = JSON.parse(obj.cnvalue[oname].replace(/'/g, '"'));
			irem[pjs['id']] = pjs;
		}
	}
}

function cnoda(obj) {
	if (obj.action === 'event') {
		cnoda_event(obj.event);
	}
}
function apply(obj, ssend) {
	if (obj.d['type'] === 'settings') {
		const extra = jf.ExtractSettingType(obj.d.page);
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

function info(obj, send) {
	const respfull = {};
	let resp = '';

	respfull['req'] = obj.req;
	respfull['iface'] = obj.iface;
	switch (obj.req) {
		case 'gw_pair':
			resp = { pdet1: irem[0].paired ? 'yes' : 'none', pdet2: irem[1].paired ? 'yes' : 'none' };
			break;
		case 'gw_status0':
			{
				if (irem[0].remote === undefined) break;
				let ir0 = irem[0].remote;
				let net0 = irem[0].net;
				resp = {
					nlnk0: irem[0].paired ? 'yes' : 'none',
					rsrx0: ir0.rx,
					rstx0: ir0.tx,
					rsspd0: ir0.speed,
					ntx0: net0.tx,
					nrx0: net0.rx,
					srx0: irem[0].ser.rx,
					stx0: irem[0].ser.tx
				};
			}
			break;
		case 'gw_status1':
			{
				if (irem[1].remote === undefined) break;
				let ir1 = irem[1].remote;
				let net1 = irem[1].net;
				resp = {
					nlnk1: irem[1].paired ? 'yes' : 'none',
					rsrx1: ir1.rx,
					rstx1: ir1.tx,
					rsspd1: ir1.speed,
					ntx1: net1.tx,
					nrx1: net1.rx,
					srx1: irem[1].ser.rx,
					stx1: irem[1].ser.tx
				};
			}
			break;
	}

	respfull['result'] = resp;

	if (resp !== '') send(c.GenResponseEventObj({ action: 'webevent', webevent: respfull }));
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
