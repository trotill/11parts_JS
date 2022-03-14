/**
 * Created by Ilya on 15.11.2019.
 */
const c = require('../../../backCore');

function Build() {
	return [
		{
			type: 'delim',
			id: 'pwdDM',
			name: 'Create password in passwd format '
		},
		{
			type: 'switch',
			value: false,
			id: 'pwCreate_pwd',
			name: 'Add user',
			invert: ['pwRemove_pwd']
		},
		{
			type: 'switch',
			value: true,
			id: 'pwRemove_pwd',
			name: 'Remove user',
			invert: ['pwCreate_pwd']
		},
		{
			type: 'switch',
			value: false,
			id: 'pwCreate_grp',
			name: 'Add group',
			invert: ['pwRemove_grp']
		},
		{
			type: 'switch',
			value: true,
			id: 'pwRemove_grp',
			name: 'Remove group',
			invert: ['pwCreate_grp']
		},
		{
			name: 'Command',
			type: 'tfield',
			id: 'pwCommand',
			value: '/bin/false',
			flt: { sym: ['ens'] }
		},
		{
			name: 'File prefix',
			type: 'var',
			id: 'pwFnpref',
			value: ''
		},
		{
			name: 'Password',
			type: 'tfield',
			id: 'pwPasswd',
			value: '',
			flt: { sym: ['ens'] }
		},
		{
			name: 'File permission',
			type: 'tfield',
			id: 'pwFile_perm',
			value: '0440'
		},
		{
			name: 'LastLogin',
			type: 'tfield',
			id: 'pwLastLogin',
			value: '',
			flt: { sym: ['ens'] }
		},
		{
			name: 'NewLogin',
			type: 'tfield',
			id: 'pwLogin',
			value: '',
			flt: { sym: ['ens'] }
		},
		{
			name: 'Root folder',
			type: 'tfield',
			id: 'pwRoot_folder',
			value: '',
			flt: { sym: ['ens'] }
		},
		{
			name: 'Group ID',
			type: 'tfield',
			id: 'pwGroup_id',
			value: '2000',
			flt: { minmax: ['1100', '60000'] }
		},
		{
			name: 'Group Name',
			type: 'tfield',
			id: 'pwGroup',
			value: 'Proftpd',
			flt: { sym: ['en'] }
		},
		{
			type: 'button_a',
			value: false,
			id: 'pwAddAcc',
			name: 'Accept command',
			action: {
				sender: 'SendAction',
				finish: {
					success: 'passwd',
					params: {
						noda: 'Jnoda',
						send_setting: true
					}
				}
			}
		}
	];
}

function SaveSettingsV2({ obj, ctx }) {
	console.log('SaveSettings passwd', obj);
	ctx.webGlobal.io_events.emit(
		'to_jnoda',
		c.GenResponseEventObj({
			action: 'execute',
			execute: {
				d: {
					action: 'passwd',
					passwd: {
						passwd: obj
					}
				},
				sid: 'empty'
			}
		})
	);
	const newobj = {};
	for (const key in obj) {
		if (key !== 'pwPasswd' && key !== 'pwFnpref') newobj[key] = obj[key];
	}
	return { stat: 'ok', result: newobj };
}

module.exports = {
	Build,
	SaveSettingsV2
};
