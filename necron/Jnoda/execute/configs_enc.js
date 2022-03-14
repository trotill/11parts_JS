/**
 * Created by Ilya on 11.03.2020.
 */

const c = require('../../backCore');
const ex = require('./../../exec.js');
const fs = require('fs');

module.exports = {
	execute: (obj) => {
		console.log('config enc, obj', obj);
		//cadm_reconf_device

		let sett = obj.d[obj.d.action].cfg_admin;
		let sid = obj.sid;

		let keys = '';
		for (const z in sett.cadmKeyItems) {
			let sname = 'settings.' + sett.cadmKeyItems[z][0];
			let field = sett.cadmKeyItems[z][1];
			let sdata_str = c.GetSetting(sname);
			let res = { d: {} };
			res.d[field] = '';

			res = JSON.parse(sdata_str);
			console.log('res', res, 'sett', sname);
			if (res?.d?.[field]) keys = keys + res.d[field];
			else console.log('Error found field', field, 'in ', sname, 'config');
		}
		keys += sett.cadmPasswd;

		let resfname = c.CACHE_PATH_WEB + '/' + sett.cadmFname;

		let addargs = '';
		if (sett.cadmPbkdf2 === 'true') addargs += '-pbkdf2 ';

		//Не использовать в tar --exclude, этой опции нет в busybox версии!!!

		let exclude = '';
		for (let z in sett.cadmExcludeItems) {
			let ename = sett.cadmExcludeItems[z][0];
			exclude += `! -name "${ename}" `;
		}
		let cmd = `find ${c.GSETTINGS_STOR} -type f -maxdepth 1 ${exclude}| tar -cz -T - | openssl enc -aes-256-cbc -e ${addargs}-k "${keys}"> /${resfname}`;
		console.log(cmd);
		ex.ExecNoOutSync(cmd);

		if (fs.existsSync(resfname)) {
			process.send(
				c.GenResponseEventObj(
					{
						action: 'download',
						download: { folder: 'cache', file: sett.cadmFname, fullPath: resfname }
					},
					sid
				)
			);
			process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
		} else {
			process.send(
				c.GenResponseEventObj({ action: 'message', message: 'ERROR_TRY_AGAIN', sid: sid }, sid)
			);
			process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
		}
		//tar cz /www/pages/sys | openssl enc -aes-256-cbc -e -kfile /www/pages/sys/settings.distro.set> /enc.tar.gz.enc
		console.log('gen key', keys);
	}
};
