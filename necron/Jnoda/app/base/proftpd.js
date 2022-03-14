/**
 * Created by Ilya on 22.11.2019.
 */
let fs = require('fs');
let ex = require('./../../../exec');
let c = require('../../../backCore');
let nm = require('./network_manager.js');
const logger = c.getLogger();
let proftpd_id;

let cf =
	'ServerType         standalone\n\
DefaultServer            on\n\
DefaultAddress      0.0.0.0\n\
UseIPv6                on\n\
Umask                022\n\
User                nobody\n\
Group                nogroup\n\
AllowOverwrite        no\n\
RequireValidShell off\n\
AuthOrder mod_auth_file.c\n';

function setup(obj) {
	//ex.DeinitService(proftpd_id);

	let defroot = '/var/run/disks/shared/DB0/JDB/';
	let chmod_lim = 'DenyAll';
	let write_lim = 'DenyAll';

	let distro = JSON.parse(c.GetSetting('settings.distro'));

	if (distro.d) {
		let distd = distro.d;
		if (distd.ftpDefroot) defroot = distd.ftpDefroot;

		if (distd.ftpChmodlim) chmod_lim = distd.ftpChmodlim;

		if (distd.ftpWritelim) write_lim = distd.ftpWritelim;
	}
	if (obj.ftpEnable === 'true') {
		console.log('Proftpd config');

		let tmp_passwd = c.CACHE_PATH + '/passwd_pftpd.set';
		let tmp_group = c.CACHE_PATH + '/group_pftpd.set';

		let cfg =
			cf +
			'ServerName    "' +
			obj.ftpServerName +
			'"\n\
Port    ' +
			obj.ftpPort +
			'\n\
MaxInstances    ' +
			obj.ftpMaxInst +
			'\n\
PassivePorts 50000 50010\n\
DefaultRoot     ' +
			defroot +
			'\n\
<Limit SITE_CHMOD>\n\
  ' +
			chmod_lim +
			'\n\
</Limit>\n\
<Limit WRITE>\n\
  ' +
			write_lim +
			'\n\
</Limit>\n\
AuthUserFile    ' +
			tmp_passwd +
			'\n\
AuthGroupFile   ' +
			tmp_group +
			'\n\
';

		let sys_passwd = c.GSETTINGS_STOR + 'passwd_pftpd.set';
		if (fs.existsSync(sys_passwd)) {
			let pfnr = fs.readFileSync(sys_passwd, 'utf8');
			fs.writeFileSync(tmp_passwd, pfnr, 'utf-8');
		}

		let sys_group = c.GSETTINGS_STOR + 'group_pftpd.set';
		if (fs.existsSync(sys_group)) {
			let pfnr = fs.readFileSync(sys_group, 'utf8');
			fs.writeFileSync(tmp_group, pfnr, 'utf-8');
		}

		ex.ExecNoOutAsync('chmod 0440 ' + tmp_passwd);
		ex.ExecNoOutAsync('chmod 0440 ' + tmp_group);
		let cfg_file = c.CACHE_PATH + '/proftpd.conf';
		fs.writeFileSync(cfg_file, cfg, 'utf-8');
		//"-A INPUT  -p tcp -m tcp --dport 2121 -m conntrack --ctstate ESTABLISHED,NEW -j ACCEPT"
		nm.AddIptablesRule('proftpd', () => {
			ex.ExecNoOutSync(
				c.IPTABLES +
					' -A INPUT -p tcp -m tcp --dport ' +
					obj.ftpPort +
					' -m conntrack --ctstate ESTABLISHED,NEW -j ACCEPT'
			);
			ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT -p tcp --dport 50000:50400 -j ACCEPT');
		});
		//proftpd -c /proftpd.conf -n
		proftpd_id = ex.Service('proftpd', '-c ' + cfg_file + ' -n', 'restart');
		console.log('\n\nproftpd restart\n\n', 'proftpd ' + cfg);
		logger.info('Restart proftpd');
	} else {
		logger.info('Disable proftpd');
		ex.ServiceCtrl(proftpd_id, 'stop');
		ex.ExecNoOutSync(
			c.IPTABLES +
				' -A INPUT -p tcp -m tcp --dport ' +
				obj.ftpPort +
				' -m conntrack --ctstate ESTABLISHED,NEW -j DROP'
		);
	}
}

module.exports = {
	setup
};
