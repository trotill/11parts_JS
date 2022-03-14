/**
 * Created by i7 on 20.08.2018.
 */
let nm = require('./network_manager.js');
let ipt = require('./iptables.js');
let c = require('../../../backCore');
const logger = c.getLogger();

let saved_param;

async function ConfigRedir(args) {
	if (c.DISABLED_NAT_RULES === 1 || saved_param.PortRed === 'false') {
		logger.debug(
			'ConfigRedir Force Disabled NAT ifext',
			args.ifext,
			' table ',
			saved_param.tNRedir
		);
		return 0;
	}

	let table = saved_param.tNRedir;
	for (t = 0; t < table.length; t++) {
		await ipt.iptables(
			'redirect',
			args.ifext,
			table[t][0],
			table[t][1],
			table[t][2],
			table[t][2] + ':' + table[t][1]
		);
	}
}

async function ConfigDMZ(args) {
	if (c.DISABLED_NAT_RULES === 1 || saved_param.enDMZ === 'false') {
		logger.debug('ConfigDMZ Force Disabled NAT ifext', args.ifext, ' destip ', saved_param.ipDMZ);
		return 0;
	}
	await ipt.iptables('DMZ', args.ifext, saved_param.ipDMZ, args.ifint);
}

function Init(obj) {
	saved_param = obj;

	nm.AddIptablesRule('CFG_DMZ', ConfigDMZ);
	nm.AddIptablesRule('CFG_REDIR', ConfigRedir);
}

module.exports = {
	Init
};
