/**
 * Created by Ilya on 03.04.2018.
 */

const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const EventEmitter = require('events');
const emi = new EventEmitter.EventEmitter();
const nm = require('./network_manager.js');

let ntp_id = '';
let spawn_ntp = undefined;
let hwtimer = 0;
function ntp(obj /*ssend*/) {
	if (obj.tzone) {
		let ltfile = c.GSETTINGS_STOR + '/localtime';
		let tzone = '/usr/share/zoneinfo/' + obj.tzone;
		if (fs.existsSync(ltfile)) {
			let a = Buffer.from(fs.readFileSync(ltfile));
			let b = Buffer.from(fs.readFileSync(tzone));
			if (Buffer.compare(a, b) !== 0) {
				console.log('NTP timezone remove ', ltfile);
				ex.ExecNoOutSync('rm ' + ltfile);
			} else {
				console.log('NTP timezone NO remove ', ltfile);
			}
		}
		ex.ExecNoOutSync('ln -s ' + tzone + ' ' + ltfile);
	}
	if (hwtimer !== 0) clearInterval(hwtimer);

	if (obj.ntpen === 'true') {
		let cfgname = '/var/run/ntpd.conf';
		nm.AddIptablesRule('ntp', () => {
			ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT -p udp -m udp --dport 123 -j ACCEPT');
			ex.ExecNoOutSync(
				c.IPTABLES + ' -A OUTPUT -p udp -m udp --sport 123 --dport 1:65535 -j ACCEPT'
			);
		});

		let ntpcfg = fs.createWriteStream(cfgname);
		{
			obj.ntpsrv.forEach((ntpsrvN) => {
				ntpcfg.write('server ' + ntpsrvN[0] + '\n');
			});
			ntpcfg.write('restrict default kod nomodify notrap nopeer noquery\n');
			ntpcfg.write('restrict 127.0.0.1\n');
			ntpcfg.end();
		}

		ntpcfg.once('close', () => {
			//logger.debug(" stream.once('close', function () {");
			emi.emit('ntpclose');
		});

		emi.once('ntpclose', () => {
			///etc/Cnoda/subagent.json
			console.log('Start ntpd, sync time');
			spawn_ntp = ex.ExecSpawnAsync('ntpd', ['-gnq', '-c', cfgname], null, null, () => {
				if (spawn_ntp) {
					console.log('Start service ntpd');
					ex.ExecNoOutSync('hwclock --systohc --utc'); //hwclock --systohc > /dev/null
					ntp_id = ex.Service('ntpd', '-gn -c ' + cfgname, 'restart');
					hwtimer = setInterval(() => {
						ex.ExecNoOutSync('hwclock --systohc --utc');
						console.log('Sync hwclock');
					}, 86400);
				}
			});
		});
	} else ex.ServiceCtrl(ntp_id, 'stop');
	// ex.DeinitService(ntp_id);
}

module.exports = {
	ntp
};
