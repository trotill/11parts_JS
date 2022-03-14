/**
 * Created by Ilya on 29.11.2019.
 */
const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const nm = require('./../base/network_manager.js');
const logger = c.getLogger();
let mosquitto_id;

function add_debug_websockets() {
	var port = 1885;
	nm.AddIptablesRule('mosquitto_ws', function () {
		ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT  -p tcp --dport ' + port + ' -j ACCEPT');
		ex.ExecNoOutSync(c.IPTABLES + ' -A OUTPUT  -p tcp --dport ' + port + ' -j ACCEPT');
	});
	return '\nlistener ' + port + '\n\
protocol websockets\n\
allow_anonymous true\n';
}
function setup(obj) {
	if (obj?.mosEnable === 'true') {
		console.log('Mosquitto config');
		if (!obj.mosPort) obj.mosPort = '1884';

		if (!obj.mosLocPort) obj.mosLocPort = '1883';

		if (!obj.mosSecureEn) obj.mosSecureEn = 'false';

		if (!obj.mosUseExt) obj.mosUseExt = 'false';

		let mos_cfg =
			'per_listener_settings true\n' +
			'listener ' +
			obj.mosLocPort +
			' localhost\n' +
			'allow_anonymous true\n';

		if (obj.mosUseExt === 'true') {
			mos_cfg += '\nlistener ' + obj.mosPort;
			if (obj.mosSecureEn === 'true') {
				var mosq_passwd = c.GSETTINGS_STOR + 'passwd_mosq.set';
				mos_cfg += '\npassword_file ' + mosq_passwd + '\n' + 'allow_anonymous false\n';
			} else mos_cfg += '\nallow_anonymous true\n';

			nm.AddIptablesRule('mosquitto', () => {
				ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT  -p tcp --dport ' + obj.mosPort + ' -j ACCEPT');
				ex.ExecNoOutSync(c.IPTABLES + ' -A OUTPUT  -p tcp --dport ' + obj.mosPort + ' -j ACCEPT');
			});
		} else {
			nm.AddIptablesRule('mosquitto', () => {
				ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT  -p tcp --dport ' + obj.mosPort + ' -j DROP');
				ex.ExecNoOutSync(c.IPTABLES + ' -A OUTPUT  -p tcp --dport ' + obj.mosPort + ' -j DROP');
			});
		}

		const cfg_file = c.CACHE_PATH + '/mosquitto.conf';

		fs.writeFileSync(cfg_file, mos_cfg, 'utf-8');

		mosquitto_id = ex.Service('mosquitto', '-c ' + cfg_file, 'start');
		console.log('mosquitto restart\n');
		logger.info('Restart Mosquitto');
	} else {
		logger.info('Disable Mosquitto');
		ex.ServiceCtrl(mosquitto_id, 'stop');
		nm.AddIptablesRule('mosquitto', () => {
			ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT  -p tcp --dport ' + obj.mosPort + ' -j DROP');
			ex.ExecNoOutSync(c.IPTABLES + ' -A OUTPUT  -p tcp --dport ' + obj.mosPort + ' -j DROP');
		});
	}
}

module.exports = {
	setup
};
