/**
 * Created by i7 on 21.01.2020.
 */
const c = require('../../../backCore');
const ex = require('./../../../exec');
const fs = require('fs');
const { glob } = require('../../Jnoda_global.js');
const eventhandler = '/var/run/smsd_recv.sh';
const smsd_dir = c.CACHE_PATH + '/sms';
const in_dir = smsd_dir + '/in';
const out_dir = smsd_dir + '/out';
const chk_dir = smsd_dir + '/chk';
const shared_dir = smsd_dir + '/shared';
const infofile = smsd_dir + '/smsd.working';
const pidfile = smsd_dir + '/smsd.pid';
const logger = c.getLogger();

let data = "'$DATA'";

let evcnoda =
	c.CNODA_PATH +
	'/evcnoda \'{"t":[' +
	c.JSON_PACK_TYPE_SEND_EVENT +
	',' +
	c.PROTO_VERS +
	'],"d":{"action":"smsd","smsd":{"smsinfile":"' +
	data +
	'"}}}\'';
let rcv_script =
	'#!bin/sh\n' +
	'if [ "$1" != "RECEIVED" ]; then exit; fi;\n\n' +
	'DATA=$2\n' +
	evcnoda +
	'\n' +
	'exit 0\n\n';

let cfg_init =
	'devices = GSM1\n' +
	'logfile = /var/run/smsd.log\n' +
	'loglevel = 7\n\n' +
	'incoming = ' +
	in_dir +
	'\n' +
	'outgoing= ' +
	out_dir +
	'\n' +
	'checked= ' +
	chk_dir +
	'\n' +
	'infofile= ' +
	infofile +
	'\n' +
	'failed=' +
	shared_dir +
	'\n' +
	'sent=' +
	shared_dir +
	'\n' +
	'incoming_utf8 = yes\n' +
	'pidfile= ' +
	pidfile +
	'\n\n' +
	'[GSM1]\n' +
	'eventhandler = ' +
	eventhandler +
	'\n';

let smsd_id = {};
let recipients = [];

function devact_evt(data) {
	console.log('\n\n\n\ndevact_evt', data, '\n\n\n\n\n');

	if (data.action === 'add' && data.conf.plug === 'usb') {
		ex.ServiceCtrl(smsd_id, 'restart');
	}
}
function setup(objd) {
	console.log('smsd', objd);
	if (objd.repEnable === 'true' && objd.repSMSEnable === 'true' && objd.repSMS_smsd === 'true') {
		console.log('smsd switch on');
		let cfg = cfg_init;
		if (!fs.existsSync(smsd_dir)) {
			ex.ExecWOutSync('install -d ' + smsd_dir);
			ex.ExecWOutSync('install -d ' + in_dir);
			ex.ExecWOutSync('install -d ' + out_dir);
			ex.ExecWOutSync('install -d ' + chk_dir);
			ex.ExecWOutSync('install -d ' + shared_dir);
		}
		let inyesno = 'yes';
		let pin = objd.repSMS_smsd_pin;
		if (objd.repSMS_smsd_incoming === 'false') inyesno = 'no';

		cfg += 'device =' + objd.repSMS_smsd_tty + '\n' + 'incoming=' + inyesno + '\n';
		if (pin.length !== 0) cfg += 'pin=' + pin + '\n';

		recipients = [];
		for (const idx = 0; idx < objd['repSMS_sms_recipients'].length; idx++) {
			recipients.push(objd['repSMS_sms_recipients'][idx][0]);
		}

		const smsd_cfg = c.CACHE_PATH + '/smsd.conf';

		fs.writeFileSync(eventhandler, rcv_script, 'utf-8');
		ex.ExecNoOutAsync('chmod augo+xwr ' + eventhandler);
		fs.writeFileSync(smsd_cfg, cfg, 'utf-8');
		smsd_id = ex.Service('smsd', '-t -c' + smsd_cfg, 'restart');
		logger.info('Restart SMSD');
		glob.EventEmitter.on('devact', devact_evt);
	} else {
		try {
			glob.EventEmitter.removeListener('devact', devact_evt);
		} catch (e) {
			console.log('SMSD error remove listenr');
		}

		console.log('smsd switch off');
		logger.info('Disable SMSD');
		ex.ServiceCtrl(smsd_id, 'stop');
	}
}

function send_sms(data) {
	/* sendsms format
     To: +79117088473

     test
     */
	console.log('send_sms ', data);
	if (ex.ServiceState(smsd_id) === 'restart' || ex.ServiceState(smsd_id) === 'start') {
		let recpt;
		recpt = data.recipients === undefined ? recipients : data.recipients;
		console.log('recpt ', recpt);
		recpt.forEach((recptItem, n) => {
			console.log('sendsms ' + recptItem + ' ' + data.text);
			let smsdata = 'To: ' + recptItem + '\n\n';
			smsdata += data.text + '\n';
			fs.writeFile(
				out_dir + '/sendsms' + n + '_' + Math.floor(Math.random() * Math.floor(99999)),
				smsdata,
				'utf-8'
			);
			fs.writeFile(c.CACHE_PATH + '/sms_last_send', smsdata, 'utf-8');
		});
	}
}

module.exports = {
	setup,
	send_sms
};
