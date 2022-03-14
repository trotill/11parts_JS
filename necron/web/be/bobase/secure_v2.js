/**
 * Created by i7 on 28.10.2017.
 */

const { MD5 } = require('./util/md5.js');

function Build() {
	return [
		{
			type: 'delim',
			id: 'seChan',
			name: 'Input your data'
		},
		{
			type: 'var',
			id: 'slog',
			svalue: ['{"rdvar":"global.SRV_OBJ.login"}'],
			name: 'Login'
		},
		{
			name: 'Source password',
			type: 'tfield',
			id: 'spass',
			isSec: true,
			value: '',
			flt: { len: [4, 63], sym: ['en'] },
			errMsg: 'incorrect symbol'
		},
		{
			name: 'Group',
			type: 'var',
			id: 'group',
			svalue: ['{"rdvar":"global.LOCAL.virtGroup"}']
		},
		{
			type: 'var',
			id: 'sgroup',
			name: 'Group',
			svalue: ['{"rdvar":"global.LOCAL.virtGroup"}']
		},
		{
			name: 'New user name',
			type: 'tfield',
			id: 'nlog',
			isDig: false,
			svalue: ['{"rdvar":"global.SRV_OBJ.login"}'],
			flt: { len: [4, 63], sym: ['en'] }
		},
		{
			name: 'New password',
			type: 'tfield',
			id: 'npass',
			isDig: false,
			isSec: true,
			value: '',
			flt: { len: [4, 63], sym: ['en'] }
		},
		{
			name: 'Copy New password',
			type: 'tfield',
			id: 'cnpass',
			isDig: false,
			isSec: true,
			value: '',
			flt: { len: [4, 63], sym: ['en'] }
		}
	];
}

function ChangeUserPasswd(data) {
	return {
		type: 'changepasswdV2',
		sourcePasswd: data.spass,
		sourceLogin: data.slog,
		newLogin: data.nlog,
		newPasswd: MD5(data.npass + data.nlog),
		newGroup: data.group,
		sourceGroup: data.sgroup
	};
}

function SaveSettings(obj) {
	let arr = {};
	let stat;
	console.log('SaveSettings secure', obj);
	if (obj.npass !== obj.cnpass) {
		stat = 'SECURE_DIFF_PASSWD';
	} else {
		arr = ChangeUserPasswd(obj);
		stat = 'ok'; //ChangeUserPasswd($obj['settings']['data']
	}
	console.log('Secure, remove after uglify', arr);
	return { stat: stat, result: arr };
}

module.exports = {
	Build,
	SaveSettings
};
