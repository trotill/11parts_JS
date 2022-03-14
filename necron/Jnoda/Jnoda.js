/**
 * Created by i7 on 05.03.2017.
 */
const { glob } = require('./Jnoda_global.js');

require('./../server_setup.js').Fill_glob(glob);
if (glob.websrv.cfg.webJnodaLogEn === 'true') glob.log_disabled = false;

console.log('Jnoda Select Version', glob.version);
console.log('Jnoda glob.websrv', glob.websrv);
console.log('Jnoda glob.cnoda_cfg', glob.cnoda_cfg);

const eve = require('events');
glob.EventEmitter = new eve.EventEmitter();

//glob.eventFromUI.emit('devact',{action:action,conf:netdm.net_conf});
/* glob.EventEmitter_format = {
	devact: {
		action: 'add/remove',
		conf: {
			apn: 'internet',
			atic: '',
			atid: '',
			cdev: '/dev/ttyUSB2',
			ddev: '/dev/ttyUSB1',
			dev_opts: { def_mode: 'MBIM', modes: '[Object]' },
			edrv: 'cdc_mbim',
			eif: 'wwan0',
			mmode: 'MBIM',
			oname: 'MTS',
			page: 'gsm_network0',
			plug: 'usb',
			pset: 'auto',
			type: 'settings',
			usbplug: 'usb.19d2.0602'
		}
	}
};*/

const c = require('../backCore');

let fs = require('fs');
let ec = require('./EventCollector.js');
let exe = require('./Execute.js');
let loer = require('./../logger.js');
c.setLogger(new loer.Logger(c.JNODA_LOG_FILE, 'trace', 'Jn '));
const logger = c.getLogger();
let nm = require('./app/base/network_manager.js');
let jf = require('./Jnoda_func.js');
glob.net_set = jf.ReadNetworkSetting();
console.log('glob.net_set', glob.net_set);
let dgram = require('dgram');
let ex = require('./../exec.js');

const srecv = dgram.createSocket('udp4');
const ssend = dgram.createSocket('udp4');

let apps = [];
let inited = false;
let apply_db = [];
let cfg = fs.readFileSync(`${c.JNODA_PATH}/Config.json`).toString();
glob.config = JSON.parse(cfg);
console.log('glob.config', glob.config);
for (let n = 0; n < glob.config.apps.length; n++) {
	apps[n] = require('./app/' + glob.config.apps[n] + '/apply_settings');
}

ex.ExecNoOutSync('hostname ' + glob.websrv.cfg.hostname);
/*fs.readFile(`${c.JNODA_PATH}/Config.json`,(err,data)=>{
    if (err) throw err;
    glob.config=JSON.parse(data,'utf8');
    console.log('glob.config',glob.config);
    for (var n=0;n<glob.config.apps.length;n++)
    {
        apps[n]=require('./app/'+glob.config.apps[n]+'/apply_settings')
    }
});*/

function check_init() {
	let status = true;
	apps.forEach((app) => {
		if (!app.inited && app.inited !== undefined) {
			//status = false;
			console.log('Fix it, status not observe');
		}
	});

	return status;
}
function apply(apps, json_obj, ssend, agent) {
	apps.forEach((app) => {
		if (json_obj['d']) {
			if (json_obj.d['type']) app.apply(json_obj, ssend, agent);
			else console.log('apply error params - type, skip', json_obj);
		} else console.log('apply error params - d, skip', json_obj);
	});
}

function cnoda(apps, json_obj, ssend) {
	apps.forEach((app) => {
		app.cnoda(json_obj, ssend);
	});
}

function info(apps, req, SendEventDeviceToWeb) {
	apps.forEach((app) => {
		app.info(req, SendEventDeviceToWeb);
	});
}

function SetToDefault(apps, args) {
	if (!args) args = { netdown: true };

	console.log('*** SetToDefault ***');
	apps.forEach((app) => {
		app.SetToDefault(args);
	});
}

function async_plug(apps, evs) {
	apps.forEach((app) => {
		app.async_plug(evs);
	});
}

function async_unplug(apps, evs) {
	apps.forEach((app) => {
		app.async_unplug(evs);
	});
}

srecv.on('error', function (err) {
	logger.info('srecv error:' + err.stack);
	srecv.close();
});
ssend.on('error', function (err) {
	logger.info('ssend error:' + err.stack);
	ssend.close();
});

srecv.on('listening', function () {
	const address = srecv.address();
	logger.info('server listening ' + address.address + ':' + address.port);
	srecv.setMulticastTTL(128);

	srecv.addMembership(c.GROUP_ADDR, c.BUS_IP);
});

function apply_setting_filter(json_obj, message) {
	if (json_obj.d['type'] === 'settings') {
		if (!json_obj.d.page) return true;
		const extra = jf.ExtractSettingType(json_obj.d.page);
		if (!apply_db[extra.type]) {
			apply_db[extra.type] = message;
		} else {
			if (apply_db[extra.type] === message) return false;
		}
	}
	return true;
}

srecv.on('message', (message) => {
	// console.log('A: Epic Command Received. Preparing Relay.');

	const json_obj = JSON.parse(message.toString());
	//console.log('Received ' + remote.address + ':' + remote.port+' size='+message.length);
	logger.debug('Input JSON: ', json_obj);

	switch (json_obj.req) {
		case 'apply':
			if (inited) {
				logger.debug('apply succ');
				if (apply_setting_filter(json_obj[json_obj.req], message))
					apply(apps, json_obj[json_obj.req], ssend, 'apply');
				else logger.debug('ignore apply');
			}
			break;

		case 'init':
			if (inited === false) {
				SetToDefault(apps);
				inited = true;
				logger.debug('Do init');
			} else logger.debug('Ignore init');
			break;
		case 'exit':
			logger.debug('Do exit');
			logger.debug('Jnoda.js is down');
			Exit();
			break;
	}
});

function SendTimerEventDeviceToWeb(req) {
	if (inited) {
		info(apps, req, ec.SendEventDeviceToWeb);
	}
}

function SendAsyncEventDeviceToWeb(pack) {
	if (inited) {
		ec.SendEventDeviceToWeb(pack);
	}
}

function AsyncEventPlug(evs) {
	console.log('AsyncEventPlug ', evs.req);
	async_plug(apps, evs);
}

function AsyncEventUnPlug(evs) {
	console.log('AsyncEventUnPlug ', evs.req);
	async_unplug(apps, evs);
}

glob.EventEmitter.on('ready', () => {
	if (check_init()) {
		logger.debug('Jnoda inited, send jnoda ready');
		setTimeout(() => {
			process.send(c.GenResponseEventObj({ action: 'jnodaReady', jnodaReady: {} }));
			process.send(
				c.GenResponseEventObj({
					action: 'ready',
					ready: { from: 'jnoda', prio: 100, message: 'JNODA_INITED' }
				})
			);
			process.send(
				c.GenResponseEventObj({
					action: 'ready',
					ready: { from: 'websrv_ReStart_JNoda', prio: 100, message: '' }
				})
			);
		}, 500);
	}
});

glob.EventEmitter.on('exit', () => {
	Exit();
});

process.on('message', async (data) => {
	logger.debug('Jnoda data ', JSON.stringify(data));

	if (!data?.d?.action) {
		console.log('jnoda: data.d.action==undefined Jnoda data ', data);
		logger.debug('data.d.action==undefined Jnoda data ', data);
		return;
	}
	if (data.d.action === 'shutdown') {
		console.log('jnoda:got shutdown');
		if (c.process_shutdown === 0) {
			console.log('jnoda:do shutdown');
			glob.EventEmitter.emit('exit', {});
			c.process_shutdown = 1;
		} else {
			console.log('jnoda:continues shutdown');
		}
	}

	if (data.d.action === 'busy') {
		logger.debug('resend busy');
		process.send(
			c.GenResponseEventObj({
				action: 'busy',
				busy: { prio: 10, message: 'Please_wait_dev_busy', from: 'over jnoda' }
			})
		);
	}
	if (data.d.action === 'ready') {
		logger.debug('resend ready');
		process.send(
			c.GenResponseEventObj({
				action: 'ready',
				ready: { prio: 11, message: '', from: 'over jnoda' }
			})
		);
	}

	if (data.d.action === 'rst_set') {
		//restart setting
		const json_obj = data.d['rst_set'];
		console.log('rst_set ', json_obj[json_obj.req]);
		apply(apps, json_obj[json_obj.req], ssend, 'rst_set');
		process.send(
			c.GenResponseEventObj({
				action: 'ready',
				ready: { prio: 100, message: 'APPLY_ONE', from: 'settings_apply_one' }
			})
		);
	}

	if (data.d.action === 'devact') {
		const netdm = data.d['devact'];
		const action = netdm.act;
		logger.debug('Jnoda devact ', action, ' ', netdm.net_conf);

		glob.EventEmitter.emit('devact', { action: action, conf: netdm.net_conf });
		if (action === 'add') {
			apply(apps, netdm.net_conf, ssend, 'add');
			await nm.StartIfaceNM(netdm.nm_conf);
		}
		if (action === 'remove') {
			console.log('stop iface', netdm.nm_conf);
			await nm.StopIfaceNM(netdm.nm_conf);
		}
	}
	if (data.d.action === 'upd_evmap') {
		logger.debug('Jnoda eventmap ', data.d[data.d.action]);
		const Pack = ec.PackEventReq(data.d[data.d.action]);
		logger.debug('Pack eventmap ', Pack);
		ec.StartEventRequesters(Pack, {
			tmr_sender: SendTimerEventDeviceToWeb,
			async_sender: SendAsyncEventDeviceToWeb,
			async_plug: AsyncEventPlug,
			async_unplug: AsyncEventUnPlug
		});
	}
	if (data.d.action === 'execute') {
		exe.Run(data.d.execute, (json_act) => {
			c.send_to_cnoda(ssend, json_act);
		});
	}

	if (data.t[0] === c.JSON_PACK_TYPE_FROM_CNODA) {
		if (data.d.action === 'event') {
			if (inited) {
				cnoda(apps, data.d, ssend);
			}
		}
	}
});

function CheckDeinitAll() {
	if (ex.CheckDeinitAllServices() === false) {
		setTimeout(CheckDeinitAll, 200);
	} else {
		console.log('Jnoda.js is down');
		// eslint-disable-next-line no-undef
		process.exit(0);
	}
}

function ExitWODefault() {
	console.log('*** ExitWODefault ***');
	CheckDeinitAll();
}

function Exit() {
	logger.destructor().then(() => {
		SetToDefault(apps);
		ExitWODefault();
	});
}

process.on('error', function (err) {
	logger.debug('jnoda error', err);
	console.log('jnoda error', err);
});

process.on('SIGINT', function () {
	logger.debug('*** GOT SIGINT ***');
	console.log('*** Jnoda GOT SIGINT ***');
	logger.destructor().then(() => {
		ExitWODefault();
	});
});

process.on('SIGTERM', function () {
	logger.debug('*** GOT SIGTERM ***');
	console.log('*** Jnoda GOT SIGTERM ***');
	Exit();
});

process.on('uncaughtException', function (err) {
	console.log('UNCAUGHT EXCEPTION - keeping process alive:', err); // err.message is "foobar"
	Exit();
});

ssend.bind(c.BUS_PORT_SEND, c.BUS_IP);
srecv.bind(c.BUS_PORT_RCV, c.GROUP_ADDR);

logger.info('Jnoda.js run');

InitProcessMsg();
InitMe();
let inited_tmr = null;

function InitProcessMsg() {
	process.send(c.GenResponseEventObj({ action: 'init_process', init_process: {} }));
}
function InitMe() {
	let str;
	if (inited === false) {
		str = c.GenRequestInitMe();
		ssend.send(str, 0, str.length, c.BUS_PORT_SEND, c.GROUP_ADDR);
	} else {
		clearInterval(inited_tmr);
	}
}

clearInterval(inited_tmr);
inited_tmr = setInterval(function () {
	InitMe();
}, 2000);
