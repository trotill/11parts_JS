/**
 * Created by i7 on 18.02.2020.
 */
/**
 * Created by i7 on 17.12.2019.
 */

function Build() {
	return [
		{
			type: 'switch',
			value: false,
			id: 'sshEnable',
			name: 'Enable sshd daemon'
		},
		{
			name: 'Port',
			type: 'tfield',
			id: 'sshPort',
			value: '2222'
		},
		{
			name: 'Protocol',
			type: 'var',
			id: 'sshProtocol',
			value: '2'
		},
		{
			name: 'HostKey',
			type: 'tfield',
			id: 'sshHostKey',
			value: '/etc/ssh/ssh_host_rsa_key'
		},
		{
			name: 'UsePrivilegeSeparation',
			type: 'sbox',
			value: 'yes',
			id: 'sshUsePrivilegeSeparation',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'SyslogFacility',
			type: 'var',
			id: 'sshSyslogFacility',
			value: 'AUTH'
		},
		{
			name: 'LogLevel',
			type: 'var',
			id: 'sshLogLevel',
			value: 'INFO'
		},
		{
			name: 'LoginGraceTime',
			type: 'tfield',
			id: 'sshLoginGraceTime',
			value: '60'
		},
		{
			name: 'PermitRootLogin',
			type: 'sbox',
			value: 'yes',
			id: 'sshPermitRootLogin',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'StrictModes',
			type: 'sbox',
			value: 'yes',
			id: 'sshStrictModes',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'AllowUsers',
			type: 'table',
			id: 'sshAllowUsers',
			edit: true,
			tabh: ['Users'],
			jvalue: {
				obj: [
					{
						name: 'Users',
						type: 'tfield',
						showname: false,
						flt: { len: ['2', '63'], sym: ['ens'] },
						fltsett: { event: false }, //eventFromUI disable
						value: 'ilya_gorchakov',
						css: 'width:100%'
					}
				]
			}
		},
		{
			name: 'Public Keys',
			type: 'table',
			id: 'sshPublicKeys',
			edit: true,
			tabh: ['Keys'],
			jvalue: {
				obj: [
					{
						name: '',
						type: 'efield',
						showname: false,
						value: '',
						css: 'font-size: 12px;',
						rows: 11
					}
				]
			}
		},
		{
			name: 'RSAAuthentication',
			type: 'sbox',
			value: 'yes',
			id: 'sshRSAAuthentication',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'PubkeyAuthentication',
			type: 'sbox',
			value: 'yes',
			id: 'sshPubkeyAuthentication',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'AuthorizedKeysFile',
			type: 'tfield',
			id: 'sshAuthorizedKeysFile',
			value: '/var/run/ssh_authorized_keys'
		},
		{
			name: 'additions',
			type: 'var',
			id: 'sshAdditions',
			value: '',
			cvalue:
				'IgnoreRhosts yes\n' +
				'RhostsRSAAuthentication no\n' +
				'HostbasedAuthentication no\n' +
				'PrintMotd no\n' +
				'TCPKeepAlive no\n' +
				'ClientAliveCountMax 3\n' +
				'ClientAliveInterval 20\n' +
				'MaxStartups 5:30:20\n' +
				'AcceptEnv LANG LC_*\n' +
				'UsePAM yes\n'
		},
		{
			name: 'PermitEmptyPasswords',
			type: 'sbox',
			value: 'no',
			id: 'sshPermitEmptyPasswords',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'ChallengeResponseAuthentication',
			type: 'sbox',
			value: 'no',
			id: 'sshChallengeResponseAuthentication',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'PasswordAuthentication',
			type: 'sbox',
			value: 'yes',
			id: 'sshPasswordAuthentication',
			tabidx: 1,
			items_name: ['Yes', 'No'],
			items_val: ['yes', 'no']
		},
		{
			name: 'PrintLastLog',
			type: 'var',
			id: 'sshPrintLastLog',
			value: 'yes'
		},
		{
			name: 'Subsystem sftp (empty - not use)',
			type: 'tfield',
			id: 'sshSubsystemSFTP',
			value: 'internal-sftp'
		},
		{
			name: 'ChrootDirectory (for sftp, for all users, empty - not use)',
			type: 'tfield',
			id: 'sshChrootDirectory',
			value: ''
		}
	];
}

function SaveSettings(ssh) {
	console.log('Save', ssh);
	return { stat: 'ok', result: ssh };
}

module.exports = {
	Build,
	SaveSettings
};
