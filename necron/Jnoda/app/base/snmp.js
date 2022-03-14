/**
 * Created by Ilya on 29.03.2018.
 */
const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();
const sh = require('./../../../shared');
const cnevent = {};
let brip;
//if (nm==undefined) {
const nm = require('./network_manager.js');
const stripJsonComments = require('strip-json-comments');
//  console.log("NMNMNM undef");
//}
//var spawn = require('child_process').spawn;

const exec = require('child_process').exec;

const EventEmitter = require('events');
const emi = new EventEmitter.EventEmitter();

let agent_cfg = '';
const subagent_conf_def = '/usr/share/snmp/subagent.json';
const subagent_conf = c.CACHE_PATH + '/subagent.json';
const server_cfg_def =
	'master agentx\n\
                disk  / 100M\n\
                load  1 2 2\n\
                syslocation  "russia"\n\
                syscontact  "11-parts.com"\n\
                sysservices 78\n';

let trap_settings = {
	trap_rules: {},
	trap_ip: [],
	trap_time: '20',
	trap_sel: 'false'
};

let trap_cyclic_timer;
let trap_sender = () => {};

function prepareTrapTable(sa_conf) {
	result = {};
	sa_conf.node.forEach((nodeN) => {
		RegTrapEvent(nodeN[0], undefined);
		result[nodeN[0]] = {};
		result[nodeN[0]] = {
			oid: nodeN[3],
			type: 's'
		};
		if (sa_conf.node[x][1] !== 'OCTET_STR') result[nodeN[0]].type = 'i';
	});

	return result;
}
function FillTrapSettings(obj) {
	for (let rule in obj.trap_rules) {
		let trname = obj.trap_rules[rule][0];
		let trontime = obj.trap_rules[rule][1];
		let tronevent = obj.trap_rules[rule][2];
		trap_settings.trap_rules[trname] = {
			ontime: trontime,
			onevent: tronevent
		};
	}

	for (let ip in obj.trap_ip) {
		trap_settings.trap_ip[ip] = obj.trap_ip[ip][0];
	}

	trap_settings.trap_time = obj.trap_ctime;
	trap_settings.trap_sel = obj.trap_sel;
	console.log('trap_settings ', trap_settings);
}

let Trap = trap_sender;
let snmpd_id;
let snmpagnt_id;
function snmp(obj) {
	trap_settings = {
		trap_rules: {},
		trap_ip: [],
		trap_time: '20',
		trap_sel: 'false'
	};

	if (obj.snEnable === 'true') {
		let snmp3_add_conteng = '';
		let snmp3_add_contname = '';

		if (obj.eng_id && obj.eng_id.length > 0) snmp3_add_conteng = '-e ' + obj.eng_id;

		//console.log("snmp obj obj",obj,"obj.context_name.length",obj.context_name.length);

		if (obj.context_name && obj.context_name.length > 0)
			snmp3_add_contname = '-n ' + obj.context_name;

		let sa_conf = JSON.parse(
			stripJsonComments(fs.readFileSync(subagent_conf_def, 'utf8')).replace(/\n|\r/g, '')
		);

		sa_conf.agentx_enable = obj.agentx_en === 'true';

		sa_conf.ex = prepareTrapTable(sa_conf);
		FillTrapSettings(obj);

		fs.writeFileSync(subagent_conf, JSON.stringify(sa_conf));

		//console.log()
		//var agentconf=c.CACHE_PATH+"/agent.conf";

		let agentconf = c.CACHE_PATH + '/agent.conf';

		if (fs.existsSync('/etc/rc11p.start.d/')) {
			//сборка с systemd, использует overlayfs
			if (!fs.existsSync('/etc/snmp')) {
				fs.mkdirSync('/etc/snmp');
			}
			try {
				fs.lstatSync('/etc/snmp/agent.conf');
			} catch (e) {
				fs.symlinkSync(`${c.CACHE_PATH}/agent.conf`, '/etc/snmp/agent.conf');
			}
		}
		//console.log("sa_conf ",sa_conf);
		if (sa_conf.agentx_enable === true) {
			console.log('sa_conf.agentx_enable==true');
			let snmpconf = c.CACHE_PATH + '/snmpd.conf';
			let server_cfg = server_cfg_def;
			if (obj.protov === '1' || obj.protov === '2')
				server_cfg += 'rwcommunity  ' + obj.com_name + '\n';
			else {
				if (obj.iscrypto === 'false')
					server_cfg += `createUser ${obj.user_name} ${obj.authenc} ${obj.authpwd}\n`;
				else
					server_cfg += `createUser ${snmp3_add_conteng} ${snmp3_add_contname} ${obj.user_name} ${obj.authenc} ${obj.authpwd} ${obj.encrypt} ${obj.encpwd}\n`;

				server_cfg += 'rwuser ' + obj.user_name + '\n';
			}

			console.log('write  ', snmpconf);
			fs.writeFileSync(snmpconf, server_cfg);
			snmpd_id = ex.Service('snmpd', '-f -c ' + snmpconf, 'restart');
		}

		let agent = fs.createWriteStream(agentconf);
		nm.AddIptablesRule('snmp', () => {
			ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT -p udp -m udp --dport 162 -j ACCEPT');
			ex.ExecNoOutSync(
				c.IPTABLES + ' -A OUTPUT -p udp -m udp --sport 162 --dport 1:65535 -j ACCEPT'
			);
			ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT -p udp -m udp --dport 161 -j ACCEPT');
			ex.ExecNoOutSync(
				c.IPTABLES + ' -A OUTPUT -p udp -m udp --sport 161 --dport 1:65535 -j ACCEPT'
			);
		});

		agent.once('open', () => {
			console.log('open ', agentconf);
			agent.write(agent_cfg + '\n');
			agent.write('view    systemview    included   .' + sa_conf.share_oid + '\n');
			agent.write('com2sec ' + obj.user_name + ' default ' + obj.com_name + '\n');
			if (obj.trap_iface !== 'wan') {
				brip = sh.GetValJSON_F('router', 'brIP');
			}
			if (obj.protov === '1' || obj.protov === '2') {
				agent.write('group AdminGroup  v1 ' + obj.user_name + '\n');
				agent.write('group AdminGroup  v2c ' + obj.user_name + '\n');
				agent.write('view all    included  .1  ff.ff.ff\n');
				if (obj.com_acc === 'rw')
					agent.write('access AdminGroup  ""    any       noauth    exact    all   all   all\n');
				else agent.write('access AdminGroup  ""    any       noauth    exact    all   none none\n');

				trap_sender = (param_name, message) => {
					let vers = obj.protov;
					let ips = obj.trap_ip;
					if (sa_conf.ex[param_name] === undefined) {
						console.log('ERROR, undefined SNMP params', param_name);
						return;
					}
					let oid = sa_conf.ex[param_name].oid;
					let type = sa_conf.ex[param_name].type;
					let sip = '';
					if (obj.trap_iface === 'wan') {
						let swi = nm.GetSourceWANInfo();
						if (swi && swi.info.stat.ip) {
							sip = '--clientaddr=' + swi.info.stat.ip;
						}
					} else {
						if (brip) sip = '--clientaddr=' + brip;
					}

					for (let x = 0; x < ips.length; x++) {
						let send;
						if (vers === '1') {
							send = ` -v 1 ${sip} -c ${obj.com_name} ${ips[x][0]} '${oid}' '' 6 6 '55' '${oid}' ${type} "${message}"`;
							console.log('Send trap v1, snmptrap ' + send);
							logger.debug('send trap v1 ' + param_name + ' to ' + ips[x][0]);
							exec('snmptrap' + send);
						}
						if (vers === '2') {
							send = ` -v 2c ${sip} -c ${obj.com_name} ${ips[x][0]} 0 ${oid} ${oid} ${type} "${message}"`;
							console.log('Send trap v2, snmptrap ' + send);
							logger.debug('send trap v2 ' + param_name + ' to ' + ips[x][0]);
							exec('snmptrap' + send);
						}
					}
				};
			} else {
				if (obj.iscrypto === 'false')
					agent.write(
						`createUser ${snmp3_add_conteng} ${snmp3_add_contname} ${obj.user_name} ${obj.authenc} ${obj.authpwd}\n`
					);
				else {
					agent.write(
						`createUser ${snmp3_add_conteng} ${snmp3_add_contname} ${obj.user_name} ${obj.authenc} ${obj.authpwd} ${obj.encrypt} ${obj.encpwd}\n`
					);
				}
				agent.write('rwuser ' + obj.user_name + '\n');
				if (obj.ro_access) {
					obj.ro_access.forEach((ro_accessN) => {
						agent.write(`rouser ${obj.user_name} auth ${ro_accessN[0]}\n`);
					});
				}
				trap_sender = (param_name, message) => {
					let ips = obj.trap_ip;
					let oid = sa_conf.ex[param_name].oid;
					let type = sa_conf.ex[param_name].type;
					let sip = '';
					if (obj.trap_iface === 'wan') {
						let swi = nm.GetSourceWANInfo();
						if (swi && swi.info.stat.ip) {
							sip = '--clientaddr=' + swi.info.stat.ip;
						}
					} else {
						if (brip) sip = '--clientaddr=' + brip;
					}

					ips.forEach((ipsN) => {
						let send;
						if (obj.iscrypto === 'true')
							send = ` -v 3 ${sip} -a ${obj.authenc} -A ${obj.authpwd} -x ${obj.encrypt} -X ${obj.encpwd} -l authPriv -u ${obj.user_name} ${snmp3_add_contname} ${snmp3_add_conteng} ${ipsN[0]} 0 ${oid} ${oid} ${type} "${message}"`;
						else
							send = ` -v 3 ${sip} -a ${obj.authenc} -A ${obj.authpwd} -l authNoPriv -u ${obj.user_name} ${snmp3_add_contname} ${snmp3_add_conteng} ${ipsN[0]} 0 ${oid} ${oid} ${type} "${message}"`;
						// console.log('Send trap v2, snmptrap ' + send);
						logger.debug(
							'send trap v3 ' + param_name + ' to ' + ipsN[0] + ' \ncommand:snmptrap',
							send
						);
						//  console.log("snmptrap "+send);
						exec('snmptrap' + send);
					});
				};
			}
			agent.write('dontLogTCPWrappersConnects yes\n');
			//  logger.debug("GenConfigDnsMasq succ!!");
			agent.end();
		});

		agent.once('close', function () {
			//logger.debug(" stream.once('close', function () {");
			emi.emit('snmpagent', agentconf);
		});

		emi.once('snmpagent', function () {
			///etc/Cnoda/subagent.json
			snmpagnt_id = ex.Service(c.CNODA_PATH + '/snmpagnt', '--conf=' + subagent_conf, 'restart');
		});

		if (trap_settings.trap_sel === 'true') {
			Trap = (name, value) => {
				console.log('Send trap ', name, ' val ', value);
				trap_sender(name, value);
			};
			clearInterval(trap_cyclic_timer);
			trap_cyclic_timer = setInterval(() => {
				for (let trn in trap_settings.trap_rules) {
					if (trap_settings.trap_rules[trn].ontime === 'true') {
						Trap(trn, cnevent[trn]);
					}
				}
			}, trap_settings.trap_time * 1000);
		} else {
			Trap = function (name, value) {
				console.log('Block trap ', name, ' val ', value);
			};
		}
	} else {
		ex.ServiceCtrl(snmpd_id, 'stop');
		ex.ServiceCtrl(snmpagnt_id, 'stop');
	}
}

function SendTrap(name, value) {
	if (
		trap_settings.trap_rules[name] &&
		trap_settings.trap_rules[name].onevent === 'true' &&
		trap_settings.trap_sel === 'true'
	) {
		Trap(name, value);
	} else console.log('trap not sended, name', name, ' value ', value);
}

function RegTrapEvent(idx, cne) {
	cnevent[idx] = cne;
}

function SetTrapEvent(idx, cne) {
	cnevent[idx] = cne;
}

function GetTrapEventVal(idx) {
	return cnevent[idx];
}

module.exports = {
	snmp,
	SendTrap,
	RegTrapEvent,
	GetTrapEventVal,
	SetTrapEvent
};
