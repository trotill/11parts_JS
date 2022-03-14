/**
 * Created by i7 on 09.03.2017.
 */
const c = require('../../../backCore.js');
const { glob } = require('../../Jnoda_global.js');
const logger = c.getLogger();
const lan = require('./lan.js');
const wlan = require('./wlan.js');
const net = require('./net_func');
const ex = require('./../../../exec.js');
const dhc = require('./dhcp_srv.js');
const br = require('./bridge.js');
const nat = require('./iptables.js');
const afw = require('./afirewall.js');
const afow = require('./aforwarding.js');
const dev = require('./device.js');
const gsm = require('./gsm.js');
const nm = require('./network_manager.js');
const sn = require('./snmp.js');
const ntp = require('./ntp.js');
const stat = require('./stat.js');
const jf = require('./../../Jnoda_func.js');
const iw = require('./iwlist');
const av = require('./avahi.js');
const ssdp = require('./ssdpd.js');
const pftp = require('./proftpd.js');
const sshd = require('./sshd.js');
const wsrv = require('./websrv.js');
const fs = require('fs');
let inited = false;

function cnoda(obj /*, ssend*/) {
	if (obj.action === 'event') {
		if (obj.event.cnvalue !== undefined) {
			const ev = obj.event.cnvalue;
			const oname = Object.keys(ev)[0];
			glob.event[oname] = obj.event.cnvalue[oname];
		}
	}
}

function CheckDeviceDevID(page) {
	return fs.existsSync(c.DEVID_CACHE_PATH + '/devid.' + page, 'utf8');
}

function GetDeviceExInfo(page) {
	const devid = fs.readFileSync(c.DEVID_CACHE_PATH + '/devid.' + page, 'utf8');
	let exinfo = {};
	let devexfn = c.PRJ_DEV_PATH + '/' + devid;

	if (fs.existsSync(devexfn, 'utf8') === true) {
		exinfo = JSON.parse(fs.readFileSync(devexfn, 'utf8').replace(/\r|\n/g, ''));
	} else {
		devexfn = c.DEVICES_PATH + '/' + devid;
		if (fs.existsSync(devexfn, 'utf8')) {
			exinfo = JSON.parse(fs.readFileSync(devexfn, 'utf8').replace(/\r|\n/g, ''));
		}
	}

	console.log('GetDeviceExInfo', page, 'exinfo', exinfo);
	return exinfo;
}

async function apply(obj, ssend, agent) {
	if (obj.d['type'] === undefined) {
		console.log("Error apply[base], obj.d['type']=undefined", obj.d);
		return;
	}
	if (obj.d['type'] === 'settings') {
		console.log(`apply settings ${obj.d.page}`);
		let extra = jf.ExtractSettingType(obj.d.page);
		let iface;
		switch (extra.type) {
			case 'project_indirect':
				{
					if (obj['d']['indScript'] !== undefined) {
						let script = obj['d']['indScript'];
						require(script).setup(obj);
					}
				}
				break;
			case 'ethernet_network':
				{
					iface = 'eth' + extra.n;
					if (CheckDeviceDevID(obj.d.page)) {
						await lan.LANSetup(iface, obj.d, GetDeviceExInfo(obj.d.page));
					}
				}
				break;
			case 'tap_network':
				{
					iface = 'tap' + extra.n;
					if (CheckDeviceDevID(obj.d.page))
						await lan.LANSetup(iface, obj.d, GetDeviceExInfo(obj.d.page));
				}
				break;
			case 'tun_network':
				{
					iface = 'tun' + extra.n;
					if (CheckDeviceDevID(obj.d.page)) await lan.TUNSetup(iface, obj.d);
				}
				break;
			case 'wifi_network':
				{
					iface = 'wlan' + extra.n;
					if (CheckDeviceDevID(obj.d.page)) wlan.WLANSetup(iface, obj.d);
				}
				break;
			case 'gsm_network':
				iface = 'gsm' + extra.n;
				if (CheckDeviceDevID(obj.d.page)) gsm.GSM_Setup(iface, obj.d, agent);
				break;
			case 'l2tp_network':
				{
					iface = 'l2tp' + extra.n;
					if (CheckDeviceDevID(obj.d.page)) await lan.L2TPSetup(iface, obj.d);
				}
				break;
			case 'dhcp_server':
				{
					if (typeof obj.d['dhEnable'] !== 'undefined') {
						obj.d['dhIface'] = 'br0';
						if (obj.d['dhEnable'] === 'true') dhc.RunDHCP_Server(obj.d);
						else dhc.StopDHCP_Server(obj.d);
					}
				}
				break;

			case 'router':
				if (obj.d['natIF']) {
					if (obj.d?.['natIF'] && obj.d['natIF'].length !== 0) {
						let intnet = obj.d['natIF'][obj.d['natIF'].length - 1];
						if (intnet === 'br0' && obj.d['brIface']) {
							await br.SetBr(obj);
						} else {
							nm.ConfigInternalIface(intnet);
						}
					}
				}
				break;
			case 'avahi':
				av.setup(obj.d);
				break;
			case 'ssdpd':
				ssdp.setup(obj.d);
				break;
			case 'aforwarding':
				await afow.Init(obj.d);
				break;
			case 'afirewall':
				await afw.Init(obj.d);
				break;
			case 'websrv':
				wsrv.setup(obj.d, ssend);
				break;
			case 'snmp':
				{
					sn.snmp(obj.d, ssend);
				}
				break;
			case 'ntp':
				{
					await ntp.ntp(obj.d, ssend);
				}
				break;
			case 'device':
				{
					//deprecated
					dev.setup(obj.d, ssend);
				}
				break;
			case 'proftpd':
				{
					pftp.setup(obj.d, ssend);
				}
				break;
			case 'sshd': {
				sshd.setup(obj.d, ssend);
			}
		}
	} else if (obj.d['type'] === 'nm') {
		logger.debug('nm.Run(obj.d.if);', obj.d.if);
		nm.Run(obj.d.if);
		logger.debug('try process send');
		inited = true;
		glob.EventEmitter.emit('ready', {});
	}
}

function async_plug(obj) {
	const req = obj.req.replace(/[0-9]/g, '');
	switch (req) {
		case 'sarnet':
			stat.RunSarnet();
			break;
		case 'sarcpu':
			stat.RunSarcpu();
			break;
		case 'log': //openvpn client log
			stat.ReadLog(obj, 'start');
			break;
		default:
	}
}

function async_unplug(obj) {
	const req = obj.req.replace(/[0-9]/g, '');
	switch (req) {
		case 'sarnet':
			stat.StopSarnet();
			break;
		case 'sarcpu':
			stat.StopSarcpu();
			break;
		case 'log':
			stat.ReadLog(obj, 'stop');
			break;
	}
}

async function info(obj, send) {
	const respfull = {};
	let resp = '';

	let args = '';
	if (obj.args) args = obj.args;

	let iface = '';
	if (obj.iface) iface = obj.iface;

	respfull['req'] = obj.req;
	respfull['iface'] = obj.iface;
	let cst;
	switch (obj.req) {
		case 'rommem':
			resp = await stat.RomMem();
			break;
		case 'rommem_ex':
			resp = await stat.RomMemEx(obj.args);
			break;
		case 'sarram':
			jf.BuildEventReader(respfull, send, ex.ExecSpawnAsync('cat', ['/proc/meminfo']), stat.Sarram);
			break;
		case 'aplist':
			//Hard events, get via eventFromUI

			jf.BuildEventReader(
				respfull,
				send,
				ex.ExecSpawnAsync('iwlist', [obj.iface, 'scan']),
				iw.parseOutput
			);

			break;
		case 'cpufreq0':
			jf.BuildEventReader(
				respfull,
				send,
				ex.ExecSpawnAsync('cat', ['/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq']),
				stat.Freq_imx6
			);
			break;
		case 'cpufreq0_imx6':
			jf.BuildEventReader(
				respfull,
				send,
				ex.ExecSpawnAsync('cat', ['/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_cur_freq']),
				stat.Freq_imx6
			);
			break;
		case 'cpu_t_imx6':
			jf.BuildEventReader(
				respfull,
				send,
				ex.ExecSpawnAsync('cat', ['/sys/class/hwmon/hwmon0/temp1_input']),
				stat.Cpu_t_imx6
			);
			break;
		case 'uptime':
			jf.BuildEventReader(respfull, send, ex.ExecSpawnAsync('cat', ['/proc/uptime']), stat.Uptime);
			break;
		case 'life_time':
			resp = stat.Life_time();
			// jf.BuildEventReader(respfull,send,ex.ExecSpawnAsync("cat",[c.GSETTINGS_STOR+"settings.total_operating_time.set"]),stat.Life_time);
			break;
		case 'dtime':
			jf.BuildEventReader(respfull, send, ex.ExecSpawnAsync('date', ['+' + args]), stat.Dtime);
			break;
		case 'hostap_mac':
			{
				const list = wlan.HostAP.mac;
				cst = await net.GetLinkState(iface);
				cst = wlan.HostAP.connst;
				resp = list;
			}
			break;

		case 'hostap_info':
			{
				const hapinfo = { ssid: wlan.HostAP.ssid, bssid: wlan.HostAP.bssid };
				cst = await net.GetLinkState(iface);
				cst = wlan.HostAP.connst;
				resp = hapinfo;
			}
			break;

		case 'spoll':
			{
				let spoll = {};
				cst = await net.GetLinkState(iface);
				if (cst === 1) {
					spoll = await net.GetWiFiSignalPoll(iface);
				}
				resp = spoll;
			}
			break;

		case 'dhcpltab':
			{
				resp = dhc.GetLeases();
			}
			break;
		case 'waninfo':
			resp = nm.GetWANInfo(iface);
			break;
		case 'ifconf':
			resp = nm.GetIfconfig(iface); //net.ParseIfconfig(iface,cst);
			break;
		case 'connect':
			{
				const connect = { lnk: 'fault', int: 'fault', atime: '' };
				if ((await nm.GetLink(iface)) === 1) connect.lnk = 'success';
				if ((await nm.GetInternet(iface)) === 1) connect.int = 'success';
				resp = connect;
			}
			break;

		case 'memusage':
			resp = process.memoryUsage();
			resp.rss = Math.round((resp.rss / 1024 / 1024) * 100) / 100 + 'Mb';
			resp.heapTotal = Math.round((resp.heapTotal / 1024 / 1024) * 100) / 100 + 'Mb';
			resp.heapUsed = Math.round((resp.heapUsed / 1024 / 1024) * 100) / 100 + 'Mb';
			break;
	}

	//Light events, get on demand
	respfull['result'] = resp;
	const str = c.GenResponseEventObj({ action: 'webevent', webevent: respfull });

	if (resp !== '') send(str);
}

function SetToDefault(args) {
	logger.debug('base:SetToDefault');
	if (args.netdown === true) nm.StopAll();
	nat.CleanNAT();
}

module.exports = {
	apply,
	info,
	cnoda,
	async_plug,
	async_unplug,
	SetToDefault,
	inited
};
