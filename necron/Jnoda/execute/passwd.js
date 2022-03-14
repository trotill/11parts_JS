/**
 * Created by Ilya on 25.11.2019.
 */

const c = require('../../backCore');
const ex = require('./../../exec.js');
const fs = require('fs');

module.exports = {
	execute: (obj) => {
		let ds = obj.d[obj.d.action].passwd;
		let sid = obj.sid;
		console.log('passwd obj', obj, 'obj.d', obj.d, 'obj.d.passwd.passwd', ds);
		process.send(c.GenResponseEventObj({ action: 'busy', busy: { message: 'PASSWD_REGEN' } }));
		let prname = '';
		if (ds.pwFnpref) {
			prname = ds.pwFnpref;
		}

		let passwd_fn = c.GSETTINGS_STOR + 'passwd' + prname + '.set';
		let group_fn = c.GSETTINGS_STOR + 'group' + prname + '.set';
		let fperm = '0440';
		if (ds.pwFile_perm !== undefined) {
			fperm = ds.pwFile_perm;
		}
		let result = '';
		let pfnr;
		let rows;
		if (ds.pwRemove_pwd === 'true') {
			if (fs.existsSync(passwd_fn)) {
				pfnr = fs.readFileSync(passwd_fn, 'utf8');
				rows = pfnr.split('\n');
				result = '';
				for (let n = 0; n < rows.length; n++) {
					if (rows[n].indexOf(ds.pwLogin) !== 0) {
						if (rows[n].length !== 0) {
							result += rows[n] + '\n';
						}
						// break;
					}
				}
			}
			fs.writeFileSync(passwd_fn, result, 'utf-8');
			//fperm
		}
		if (ds.pwRemove_grp === 'true') {
			result = '';
			if (fs.existsSync(group_fn)) {
				gnr = fs.readFileSync(group_fn, 'utf8');
				rows = gnr.split('\n');
				for (let n = 0; n < rows.length; n++) {
					if (rows[n].indexOf(ds.pwGroup) !== 0) {
						if (rows[n].length !== 0) {
							result += rows[n] + '\n';
						}
					}
				}
			}
			fs.writeFileSync(group_fn, result, 'utf-8');
		}
		if (ds.pwCreate_pwd === 'true') {
			let salt =
				Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			let pass = ex.ExecWOutSync('openssl passwd -6 -salt ' + salt + ' ' + ds.pwPasswd).toString();
			pass = pass.replace(/(\r\n|\n|\r)/gm, '');

			let lastlogin = ds.pwLogin;
			if (ds.pwLastLogin !== undefined) {
				lastlogin = ds.pwLastLogin;
			}

			let str =
				ds.pwLogin +
				':' +
				pass +
				':' +
				ds.pwGroup_id +
				':' +
				ds.pwGroup_id +
				'::' +
				ds.pwRoot_folder +
				':' +
				ds.pwCommand;

			result = '';
			if (fs.existsSync(passwd_fn)) {
				pfnr = fs.readFileSync(passwd_fn, 'utf8');
				rows = pfnr.split('\n');

				for (let n = 0; n < rows.length; n++) {
					if (rows[n].indexOf(lastlogin)) {
						if (rows[n].length) result += rows[n] + '\n';
					}
				}
			}
			result += str;
			fs.writeFileSync(passwd_fn, result, 'utf-8');
		}
		if (ds.pwCreate_grp === 'true') {
			result = '';
			let grp_str = ds.pwGroup + ':x:' + ds.pwGroup_id + ':';
			if (fs.existsSync(group_fn)) {
				gnr = fs.readFileSync(group_fn, 'utf8');
				rows = gnr.split('\n');

				for (var n = 0; n < rows.length; n++) {
					if (rows[n].indexOf(ds.pwGroup)) {
						if (rows[n].length) result += rows[n] + '\n';
					}
				}
			}
			result += grp_str;
			fs.writeFileSync(group_fn, result, 'utf-8');
		}

		if (ds.pwGroup_id && ds.pwRoot_folder && ds.pwRoot_folder.length && ds.pwGroup_id.length) {
			ex.ExecNoOutSync(`install -D ${ds.pwRoot_folder}`);
			ex.ExecNoOutSync(`chown ${ds.pwGroup_id}.${ds.pwGroup_id} ${ds.pwRoot_folder}`);
		}

		process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
	}
};
