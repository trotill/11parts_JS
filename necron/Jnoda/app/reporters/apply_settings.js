/**
 * Created by Ilya on 28.02.2018.
 */

const jf = require('./../../Jnoda_func.js');
const nom = require('./nodemailer.js');
const smsd = require('./smsd.js');
const SerialPortGSM = require('./serialport-gsm.js');

function cnoda_event(obj) {
	console.log('reports cnoda_event', obj);
	if (obj.nodemailer) {
		try {
			nom.send_mail(obj.nodemailer);
		} catch (e) {
			console.log('ERROR NODEMAILER!!!');
		}
	}
	if (obj.smsd) {
		smsd.send_sms(obj.smsd);
	}
	if (obj.SerialPortGSM) {
		SerialPortGSM.send_sms(obj.SerialPortGSM);
	}
	if (obj.cnvalue) {
		if (obj.cnvalue.SerialPortGSM_breakcall) {
			SerialPortGSM.breakcall();
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
		var extra = jf.ExtractSettingType(obj.d.page);
		switch (extra.type) {
			case 'reporters':
				{
					nom.setup(obj.d, ssend);
					smsd.setup(obj.d, ssend);
					SerialPortGSM.setup(obj.d, ssend);
				}
				break;
		}
	}
}

function async_plug() {}

function async_unplug() {}

function info() {}

function SetToDefault() {}

module.exports = {
	apply,
	info,
	cnoda,
	async_plug,
	async_unplug,
	SetToDefault
};
