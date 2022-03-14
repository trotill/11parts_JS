/**
 * Created by i7 on 26.03.2017.
 */
const ex = require('./../../../exec');
const c = require('../../../backCore');

const logger = c.getLogger();

const stripJsonComments = require('strip-json-comments');

let conf = undefined;

//arg1/2/3 need for eval func!!!
async function iptables(group, arg1, arg2, arg3) {
	const arg = {
		arg1,
		arg2,
		arg3
	};
	if (!conf) {
		let ipt = await c.GetSettingPromise('iptables');
		conf = JSON.parse(stripJsonComments(ipt.toString()).replace(/\n|\r/g, ''));
		console.log('read iptable conf', conf);
	}
	if (!conf[group]) return c.ERROR;

	for (const idx in conf[group]) {
		const elem = conf[group][idx];
		let cmd = c.IPTABLES;
		elem.forEach((elemItem) => {
			let val = elemItem;
			if (elemItem.includes('@')) {
				let tmp = val.replace(/@/g, '');
				val = arg[tmp];
			}
			cmd += ' ' + val;
		});
		console.log(group, 'command', cmd);
		await ex.ExecPromise(cmd);
	}

	return c.NO_ERROR;
	//console.log('conf ', JSON.parse(conf));
}

async function FireWallTun(ifint, ifext) {
	await iptables('firewall_tun', ifext, ifint);
}

async function DebugTun(ifext) {
	await ex.ExecPromise('modprobe nf_conntrack_ftp');
	await iptables('debug', ifext);
}

async function CleanIptables() {
	await iptables('deinit');
}

async function ConfigIptables(ifext, ifint) {
	logger.debug('nat set ifext ', ifext);
	logger.debug('nat set ifint ', ifint);
	if (c.DISABLED_NAT_RULES === 1) {
		logger.debug('ConfigNAT Force Disabled NAT');
		return c.NO_ERROR;
	}
	if (!ifext || !ifint) return c.ERROR;

	await ex.ExecPromise('echo 1 > /proc/sys/net/ipv4/ip_forward');
	await iptables('init', ifint, ifext);

	if (c.DEBUG === 1) await DebugTun(ifext);

	return c.NO_ERROR;
}

async function ConfigLastrules(ifext, ifint) {
	await iptables('lastrules', ifint, ifext);
}

module.exports = {
	ConfigNAT: ConfigIptables,
	ConfigLastrules,
	CleanNAT: CleanIptables,
	iptables
};
