const c = require('../../backCore');
const ex = require('./../../exec.js');

module.exports = {
	execute: (obj) => {
		let ds = obj.d['ovpn_clnt_regen_get'].vpn;
		process.send(
			c.GenResponseEventObj(
				{ action: 'busy', busy: { message: 'OPEN_VPN_REGEN_KEY_SERT_CLNT' } },
				obj.sid
			)
		);

		let vpn = require('../app/base/vpn.js');

		let client_name = vpn.ovpn_regen_clnt({
			ca_passwd: ds.ca_passwd,
			pem_client_passwd: ds.pem_client_passwd
		});

		if (c.FindSetting('ca.crt') === false) {
			process.send(
				c.GenResponseEventObj({
					action: 'message',
					message: 'ERR_OPEN_VPN_REGEN_KEY_SERT',
					sid: obj.data.socket_id
				})
			);
			process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, obj.sid));
			return;
		}
		ds['client_name'] = client_name;
		ex.ExecSpawnAsync('sh', [c.CACHE_PATH + '/rovn_c.sh'], null, null, () => {
			const fname = vpn.ovpn_regen_clnt_cfg(ds);
			if (fname !== '') {
				let fullPath = c.CACHE_PATH_WEB + '/' + fname;
				console.log('Get openVPN cli cfg', fullPath);
				process.send(
					c.GenResponseEventObj(
						{
							action: 'download',
							download: { folder: 'cache', file: fname, fullPath: fullPath },
							sid: obj.sid
						},
						obj.sid
					)
				);
				process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, obj.sid));

				setTimeout(function () {
					//logger.debug('rm ',c.CACHE_PATH_WEB+'/'+fname);
					//  ex.ExecNoOutSync('rm '+c.CACHE_PATH_WEB+'/'+fname);
					//  process.send(c.GenResponseEventObj({
					//     action: 'message',
					//     message: 'SECURE_OVPN_FILE_DELETE'
				}, ds.client_cfg_ttl);
			} else {
				process.send(
					c.GenResponseEventObj(
						{
							action: 'message',
							message: 'ERROR_TRY_AGAIN',
							sid: obj.sid
						},
						obj.sid
					)
				);
				process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, obj.sid));
			}
		});
	}
};
