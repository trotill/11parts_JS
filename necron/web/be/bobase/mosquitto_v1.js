/**
 * Created by Ilya on 15.11.2019.
 */

const fs = require('fs');
const c = require('../../../backCore');
const ex = require('./../../../exec.js');
function Build() {
	return [
		{
			type: 'delim',
			id: 'mosDm',
			name: 'Mosquitto MQTT config'
		},
		{
			type: 'switch',
			value: false,
			id: 'mosEnable',
			name: 'mosquitto'
		},
		{
			name: 'Port',
			type: 'tfield',
			id: 'mosPort',
			value: '1884',
			flt: { minmax: ['21', '65535'] }
		},
		{
			name: 'Localhost Port',
			type: 'tfield',
			id: 'mosLocPort',
			value: '1883',
			flt: { minmax: ['21', '65535'] }
		},
		{
			type: 'switch',
			value: false,
			id: 'mosSecureEn',
			name: 'secure',
			data: [
				{
					name: 'Login',
					type: 'tfield',
					id: 'mosLogin',
					value: 'admin',
					flt: { sym: ['ens'] }
				},
				{
					name: 'Password',
					type: 'tfield',
					id: 'mosPassword',
					value: 'admin',
					flt: { sym: ['ens'] }
				}
			]
		},
		{
			type: 'switch',
			value: false,
			id: 'mosUseExt',
			name: 'Use from networks'
		}
	];
}

function SaveSettings(obj) {
	console.log('SaveSettings mosquitto', obj);

	let stat = 'ok';

	if (obj.mosSecureEn === 'true') {
		// if ((fs.existsSync(passwd_fn) == false)) {
		//   stat = "MOSQ_NOT_FOUND_PASSWD_FILE";
		// }
		const passwd_fn = c.GSETTINGS_STOR + 'passwd_mosq.set';
		const data = obj.mosLogin + ':' + obj.mosPassword;
		if (
			obj.mosLogin.length !== 0 &&
			obj.mosPassword.length !== 0 &&
			obj.mosLogin !== 'empty' &&
			obj.mosPassword !== 'empty'
		) {
			fs.writeFileSync(passwd_fn, data, 'utf-8');
			//mosquitto_passwd -U passwordfile
			ex.ExecNoOutSync('mosquitto_passwd -U ' + passwd_fn);
		}
		obj.mosLogin = 'empty';
		obj.mosPassword = 'empty';
	}
	return { stat: stat, result: obj };
}

module.exports = {
	Build,
	SaveSettings
};
