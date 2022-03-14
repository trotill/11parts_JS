/**
 * Created by Ilya on 15.11.2019.
 */

const fs = require('fs');
const c = require('../../../backCore');

function Build() {
	return [
		{
			type: 'delim',
			id: 'ftpDm',
			name: 'Proftpd config'
		},
		{
			type: 'label',
			id: 'ftpServerName',
			svalue: ['{"readfile":"websrv","sep":"","value":"hostname"}'],
			name: 'FTP server name'
		},
		{
			type: 'switch',
			value: false,
			id: 'ftpEnable',
			name: 'Enable FTP daemon'
		},
		{
			name: 'Port',
			type: 'tfield',
			id: 'ftpPort',
			value: '21',
			flt: { minmax: ['21', '65535'] }
		},
		{
			name: 'Max users',
			type: 'tfield',
			id: 'ftpMaxInst',
			value: '32',
			flt: { minmax: ['1', '1000'] }
		}
	];
}

function SaveSettings(obj) {
	console.log('SaveSettings proftpd', obj);
	const passwd_fn = c.GSETTINGS_STOR + 'passwd_pftpd.set';
	let stat = 'ok';
	if (fs.existsSync(passwd_fn) === false) {
		stat = 'PFTPD_NOT_FOUND_PASSWD_FILE';
	}
	return { stat: stat, result: obj };
}

module.exports = {
	Build,
	SaveSettings
};
