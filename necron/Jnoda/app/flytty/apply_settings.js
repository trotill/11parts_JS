/**
 * Created by Ilya on 28.02.2018.
 */

const c = require('../../../backCore.js');
const v = require('./../base/vpn.js');
const jf = require('./../../Jnoda_func.js');
const { glob } = require('../../Jnoda_global.js');
const exec = require('child_process').exec;
const nm = require('./../base/network_manager.js');

function cnoda_event() {}

function cnoda(obj) {
	if (obj.action === 'event') {
		cnoda_event(obj.event);
	}
}

let relay_tmr_id;
function relay_restart(data, ssend, ssid) {
	if (relay_tmr_id) clearTimeout(relay_tmr_id);
	relay_setup(data, ssend, ssid);
}

function nat_accept() {
	// arg { ifext: 'wwan0', ifint: 'br0' }
	//["-t nat -A POSTROUTING -o","@arg2","-j MASQUERADE"]
	//  ex.ExecNoOutSync(c.IPTABLES+" -t nat -A POSTROUTING -o "+arg.ifext+" -j MASQUERADE");
	//  ex.ExecNoOutSync(c.IPTABLES+" -t nat -A POSTROUTING -o "+arg.ifint+" -j MASQUERADE");
}

function nat_deny() {
	//["-t nat -A POSTROUTING -o","@arg2","-j MASQUERADE"]
	// ex.ExecNoOutSync(c.IPTABLES+" -t nat -D POSTROUTING -o "+arg.ifext+" -j MASQUERADE");
	// ex.ExecNoOutSync(c.IPTABLES+" -t nat -A POSTROUTING -o "+arg.ifext+" -j MASQUERADE");
	// ex.ExecNoOutSync(c.IPTABLES+" -t nat -A POSTROUTING -o "+arg.ifint+" -j MASQUERADE");
}
function relay_setup(data, ssend, ssid) {
	if (data.rlRouter === 'true' && data.rlPingIP.length !== 0 && data.rlPingIP[0].length !== 0) {
		if (data.trycnt === undefined) data.trycnt = 0;

		if (data.pingIP_cntr === undefined) data.pingIP_cntr = 0;

		if (data.pingIP_max === undefined) {
			data.pingIP_max = data.rlPingIP.length;
		}
		console.log('nm.GetSourceWANInfo()', nm.GetSourceWANInfo());

		let winfo = { iface: 'eth0' };

		if (data.rlIface === 'auto' || data.rlIface === undefined) {
			winfo = nm.GetSourceWANInfo();
			if (winfo === undefined) {
				winfo = { iface: 'eth0' };
			}
		} else {
			winfo = { iface: data.rlIface };
		}

		let netinfo = nm.GetIfconfig(winfo.iface);
		if (netinfo === '' || netinfo.ip === '') {
			relay_tmr_id = setTimeout(function () {
				relay_setup(data, ssend);
			}, data.rlDelayPing);
			return;
		}
		console.log('ping -I ' + netinfo.ip + '  -c 1 -w 1 ' + data.rlPingIP[data.pingIP_cntr][0]);
		let e = exec('ping -I ' + netinfo.ip + '  -c 1 -w 1 ' + data.rlPingIP[data.pingIP_cntr][0]);

		e.on('close', function (code) {
			if (code === 0) {
				console.log('relay_setup ping on');
				nm.AddIptablesRule('flynat', nat_deny);
				c.send_to_cnoda(
					ssend,
					c.ConvToCSrvFormat(
						c.JSON_PACK_TYPE_SEND_EVENT,
						{
							action: 'br_ping_on',
							br_ping: 1
						},
						ssid
					)
				);
				relay_tmr_id = setTimeout(function () {
					relay_setup(data, ssend);
				}, data.rlDelayPing);
				data.trycnt = 0;
			} else {
				console.log('relay_setup try ping', data.trycnt);

				data.trycnt++;
				data.pingIP_cntr++;
				if (data.pingIP_cntr >= data.pingIP_max) data.pingIP_cntr = 0;

				if (data.trycnt > parseInt(data.rlTryPing)) {
					data.trycnt = 0;
					console.log('relay_setup ping off');
					nm.AddIptablesRule('flynat', nat_accept);
					c.send_to_cnoda(
						ssend,
						c.ConvToCSrvFormat(
							c.JSON_PACK_TYPE_SEND_EVENT,
							{
								action: 'br_ping_off',
								br_ping: 0
							},
							ssid
						)
					);
				}
				relay_tmr_id = setTimeout(function () {
					relay_setup(data, ssend);
				}, data.rlDelayPing);
			}
		});
		//}
	} else {
		nm.AddIptablesRule('flynat', nat_accept);
	}
}
async function apply(obj, ssend) {
	if (obj.d['type'] === 'settings') {
		var extra = jf.ExtractSettingType(obj.d.page);
		switch (extra.type) {
			case 'vpn':
				{
					await v.setup(obj.d, ssend);
				}
				break;
			case 'relayctrl': {
				relay_restart(obj.d, ssend, obj.ssid);
				break;
			}
		}
	}
}

function async_plug() {}

function async_unplug() {}

function info(obj, send) {
	const respfull = {};
	const resp = {};

	respfull['req'] = obj.req;
	if (!glob.event[obj.req]) return;

	respfull['iface'] = obj.iface; //irem
	resp[obj.req] = glob.event[obj.req];
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
