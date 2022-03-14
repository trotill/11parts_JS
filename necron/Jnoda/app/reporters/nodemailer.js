/**
 * Created by i7 on 15.01.2020.
 */
const nodemailer = require('nodemailer');
const nm = require('./../base/network_manager.js');
const ex = require('./../../../exec');
const c = require('../../../backCore');
let mailer = {};
let subject = '';
let from = '';
let recipients = '';
let mailer_cfg = {};
let crit_err_cntr = 0;
let mail_snd_tout = {};
let login;
const order_sz = 10;

let mail_unsended = [];
function run_mail_worker() {
	mail_snd_tout = setInterval(() => {
		mail_unsended.forEach((mail) => {
			send_mail(mail);
		});
		mail_unsended = [];
	}, 10000);
}

function setup(objd) {
	console.log('nodemailer', objd);
	clearInterval(mail_snd_tout);

	if (Object.entries(mailer).length !== 0) {
		mailer = {};
	}

	if (
		!(
			objd['repEnable'] === 'true' &&
			objd['repEmailEnable'] === 'true' &&
			objd['repEmail_nm'] === 'true'
		)
	) {
		console.log('nodemailer switch off');
		nm.AddIptablesRule('nodemailer', () => {
			ex.ExecNoOutSync(
				c.IPTABLES + ' -A INPUT  -p tcp --sport ' + objd['repEmail_nm_SMTP_port'] + ' -j DROP'
			);
		});
		return;
	}

	let sec = false;
	if (objd['repEmail_nm_SMTP_secure'] === 'true') sec = true;
	if (Object.entries(mailer).length === 0) {
		console.log('nodemailer switch on');
		nm.AddIptablesRule('nodemailer', () => {
			ex.ExecNoOutSync(
				c.IPTABLES + ' -A INPUT  -p tcp --sport ' + objd['repEmail_nm_SMTP_port'] + ' -j ACCEPT'
			);
		});
		login = objd['repEmail_nm_SMTP_user'];
		mailer_cfg = {
			host: objd['repEmail_nm_SMTP_host'],
			port: parseInt(objd['repEmail_nm_SMTP_port']),
			secure: sec,
			auth: {
				user: objd['repEmail_nm_SMTP_user'],
				pass: objd['repEmail_nm_SMTP_passwd']
			}
		};
		console.log('nodemailer cfg', mailer_cfg);
		mailer = nodemailer.createTransport(mailer_cfg);
		run_mail_worker();
	}
	subject = objd['repEmail_nm_SMTP_subj'];
	from = objd['repEmail_nm_SMTP_from'];
	let recip = '';
	objd['repEmail_recipients'].forEach((ercpt) => {
		recip += ercpt[0] + ',';
	});

	recipients = recip.slice(0, -1);
}

let busy = false;
function send_mail(data) {
	console.log('send_mail', data);
	if (Object.entries(mailer).length === 0) {
		console.log('Skip send over smtp email, not created nodemailer');
		return;
	}

	let recpt = '';
	if (data.recipients) {
		data.recipients.forEach((recipient) => {
			recpt += recipient + ',';
		});
		recpt = recpt.slice(0, -1);
	} else {
		recpt = recipients;
	}

	if (recpt.length === 0) return;

	let html = '';
	let text = '';

	if (from === undefined) from = login;

	const mailOptions = {
		from: from,
		to: recpt,
		subject: data.subject ? data.subject : subject
	};
	if (data.html) {
		html = data.html;
		mailOptions['html'] = html;
	} else {
		if (data.text) {
			text = data.text;
			mailOptions['text'] = text;
		} else {
			mailOptions['text'] = 'device';
		}
	}

	if (data.attachments) {
		if (Array.isArray(data.attachments)) {
			const attach = [];
			for (const idx in data.attachments) {
				attach[idx] = {
					path: data.attachments[idx]
				};
			}
			mailOptions['attachments'] = attach;
		}
	}
	console.log('mailer_cfg', mailer_cfg);
	console.log('mailOptions', mailOptions);
	if (busy) {
		console.log('nodemailer busy, message send later');
		if (mail_unsended.length >= order_sz) {
			console.log('oreder overflow, remove oldest message in order');
			mail_unsended.shift();
		}
		mail_unsended.push(data);
		return;
	}

	try {
		busy = true;
		mailer.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log('nodemailer error', error);
				if (error.code === 'EDNS' && error.errno === 'ETIMEOUT') {
					crit_err_cntr++;
					if (crit_err_cntr >= 5) {
						console.log('nodemailer critical error, is hung');
					}
				}
				if (mail_unsended.length >= order_sz) {
					mail_unsended.shift();
				}
				mail_unsended.push(data);
			} else {
				console.log('nodemailer sent: ' + info.response);
			}
			busy = false;
		});
	} catch (e) {
		console.log('nodemailer catch error');
		setTimeout(() => {
			send_mail(data);
		}, 30000);
	}
}

module.exports = {
	setup,
	send_mail
};
