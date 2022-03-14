/**
 * Created by Ilya on 18.02.2020.
 */
let fs = require('fs');
let ex = require('./../../../exec');
let c = require('../../../backCore');
let nm = require('./network_manager.js');
let sshd_id;
const logger = c.getLogger();

function setup(obj) {
	if (sshd_id) {
		ex.ServiceCtrl(sshd_id, 'stop');
	}
	if (obj.sshEnable === 'true') {
		logger.info('Enable SSHD');
		let cfg =
			'Port ' +
			obj.sshPort +
			'\n' +
			'Protocol ' +
			obj.sshProtocol +
			'\n' +
			'HostKey ' +
			obj.sshHostKey +
			'\n' +
			'UsePrivilegeSeparation ' +
			obj.sshUsePrivilegeSeparation +
			'\n' +
			'SyslogFacility ' +
			obj.sshSyslogFacility +
			'\n' +
			'LogLevel ' +
			obj.sshLogLevel +
			'\n' +
			'LoginGraceTime ' +
			obj.sshLoginGraceTime +
			'\n' +
			'PermitRootLogin ' +
			obj.sshPermitRootLogin +
			'\n' +
			'StrictModes ' +
			obj.sshStrictModes +
			'\n';

		('AllowUsers ');
		for (let n in obj.AllowUsers) {
			cfg += obj.AllowUsers[n][0] + ' ';
		}
		cfg += '\n';
		cfg += 'RSAAuthentication ' + obj.sshRSAAuthentication + '\n';
		cfg += 'PubkeyAuthentication ' + obj.sshPubkeyAuthentication + '\n';
		cfg += 'AuthorizedKeysFile ' + obj.sshAuthorizedKeysFile + '\n';
		let pubkeys = '';
		for (let n in obj.sshPublicKeys) {
			pubkeys += obj.sshPublicKeys[n][0] + '\n';
		}

		if (fs.existsSync(obj.sshAuthorizedKeysFile)) {
			fs.readFile(obj.sshAuthorizedKeysFile, 'utf8', (err, data) => {
				if (err) throw err;
				if (data !== pubkeys) {
					fs.writeFile(obj.sshAuthorizedKeysFile, pubkeys, 'utf8', () => {});
				}
			});
		} else {
			fs.writeFile(obj.sshAuthorizedKeysFile, pubkeys, 'utf8', () => {});
		}

		cfg += obj.sshAdditions;
		cfg +=
			'PermitEmptyPasswords ' +
			obj.sshPermitEmptyPasswords +
			'\n' +
			'ChallengeResponseAuthentication ' +
			obj.sshChallengeResponseAuthentication +
			'\n' +
			'PasswordAuthentication ' +
			obj.sshPasswordAuthentication +
			'\n' +
			'PrintLastLog ' +
			obj.sshPrintLastLog +
			'\n';

		if (obj.sshSubsystemSFTP.length !== 0) {
			cfg += 'Subsystem      sftp        ' + obj.sshSubsystemSFTP + '\n';

			if (obj.sshChrootDirectory) {
				cfg +=
					'Match Group *\n' +
					'   ChrootDirectory ' +
					obj.sshChrootDirectory +
					'\n' +
					'   ForceCommand internal-sftp -d /default\n';
			}
		}

		let ssh_cfg_file = c.CACHE_PATH + '/openssh.cfg';
		fs.writeFile(ssh_cfg_file, cfg, 'utf8', (err) => {
			if (err) throw err;
			else {
				nm.AddIptablesRule('sshd', function () {
					ex.ExecNoOutSync(c.IPTABLES + ` -A INPUT -p tcp --dport ${obj.sshPort} -j ACCEPT`);
				});
				sshd_id = ex.Service('/usr/sbin/sshd', `-D -e -f ${ssh_cfg_file}`, 'restart');
				logger.info('SSHD running');
			}
		});
	} else {
		logger.info('Disable SSHD');
		nm.AddIptablesRule('sshd', function () {
			ex.ExecNoOutSync(c.IPTABLES + ` -A INPUT -p tcp --dport ${obj.sshPort} -j DROP`);
		});
	}
}

module.exports = {
	setup
};
