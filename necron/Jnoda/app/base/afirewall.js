/**
 * Created by i7 on 20.08.2018.
 */
let nm = require('./network_manager.js');
let ipt = require('./iptables.js');
let c = require('../../../backCore');
let ex = require('./../../../exec');

let saved_param;

async function MACaccess(MACtab, iface, ruls) {
	for (t = 0; t < MACtab.length; t++) {
		if (ruls === 'drop')
			await ex.ExecPromise(
				c.IPTABLES + ' -i ' + iface + ' -I INPUT -m mac --mac-source ' + MACtab[t][0] + ' -j DROP'
			);
		else {
			await ex.ExecPromise(
				c.IPTABLES +
					' -i ' +
					iface +
					' -I mac_accept -m mac --mac-source ' +
					MACtab[t][0] +
					' -j ACCEPT'
			);
		}
	}
}

async function MAC_blk(args) {
	if (args.ifext === undefined || args.ifint === undefined) return;

	let ifext = args.ifext;
	let ifint = args.ifint;
	MACaccess(saved_param.tMACtab, ifext, saved_param.tMACblk);
	MACaccess(saved_param.tMACtab, ifint, saved_param.tMACblk);
}

async function SharedRules(args) {
	if (args.ifext === undefined || args.ifint === undefined) return;

	let ifext = args.ifext;
	let ifint = args.ifint;
	for (let n = 0; n < saved_param.rules.length; n++) {
		let name = saved_param.rules[n][0];
		let st = saved_param.rules[n][1];
		if (st === 'true') await ipt.iptables(name, ifext, ifint);
	}
}

async function CfgPortInOut(args) {
	if (args.ifext === undefined || args.ifint === undefined) return;

	let pn = saved_param.port_inout;
	for (let n = 0; n < pn.length; n++) {
		let iface = pn[n][0] === 'wan' ? args.ifext : args.ifint;
		let proto = pn[n][1];
		let rule = pn[n][2];
		let inout = pn[n][3] === 'in' ? 'INPUT -i' : 'OUTPUT -o';
		let port = pn[n][4];

		if (rule === 'drop')
			await ex.ExecPromise(
				c.IPTABLES + ' -I ' + inout + ' ' + iface + ' -p ' + proto + ' --dport ' + port + ' -j DROP'
			);
		else
			await ex.ExecPromise(
				c.IPTABLES +
					' -A ' +
					inout +
					' ' +
					iface +
					' -p ' +
					proto +
					' --dport ' +
					port +
					' -j ACCEPT'
			);
	}
}

async function CfgPortForward(args) {
	if (args.ifext === undefined || args.ifint === undefined) return;

	let pn = saved_param.port_inout;
	for (let n = 0; n < pn.length; n++) {
		let iface =
			pn[n][0] === 'wanbr'
				? '-i ' + args.ifext + ' -o ' + args.ifint
				: '-i ' + args.ifint + ' -o ' + args.ifext;
		let proto = pn[n][1];
		let rule = pn[n][2];
		let port = pn[n][4];

		if (rule === 'drop')
			await ex.ExecPromise(
				c.IPTABLES + ' -I FORWARD ' + iface + ' -p ' + proto + ' --dport ' + port + ' -j DROP'
			);
		else
			await ex.ExecPromise(
				c.IPTABLES + ' -A FORWARD ' + iface + ' -p ' + proto + ' --dport ' + port + ' -j ACCEPT'
			);
	}
}

function Init(obj) {
	saved_param = obj;
	if (obj.rules === undefined) obj.rules = [];

	if (obj.tMACtab.length !== 0) nm.AddIptablesRule('MAC_blk', MAC_blk);

	nm.AddIptablesRule('SH_rules', SharedRules);
	nm.AddIptablesRule('PoIO', CfgPortInOut);
	nm.AddIptablesRule('PoFW', CfgPortForward);
}

module.exports = {
	Init
};
