const c = require('../../backCore');
const ex = require('./../../exec.js');

module.exports = {
	execute: (obj) => {
		let ds = obj.d['ovpn_srv_regen'].vpn;
		console.log('obj', obj, 'obj.data', obj.d, 'obj.data.socket_id', obj.sid);

		ds.ca_passwd =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		ds.pem_srv_passwd =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		c.SaveSignSetting('settings.vpn', c.GenSystemPack(ds, obj.sid));

		process.send(
			c.GenResponseEventObj(
				{ action: 'busy', busy: { message: 'OPEN_VPN_REGEN_KEY_SERT_SRV' } },
				obj.sid
			)
		);
		let vpn = require('../app/base/vpn.js');
		vpn.ovpn_regen_srv({
			ca_passwd: ds.ca_passwd,
			pem_srv_passwd: ds.pem_srv_passwd
		});

		console.log('sh /var/run/rovn_s.sh');
		ex.ExecSpawnAsync('sh', [c.CACHE_PATH + '/rovn_s.sh'], null, null, () => {
			process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, obj.sid));
			console.log(
				'Send ',
				c.GenResponseEventObj(
					{ action: 'ovpn_srv_regen', ovpn_srv_regen: {}, sid: obj.sid },
					obj.sid
				)
			);
			process.send(
				c.GenResponseEventObj(
					{
						action: 'message',
						message: 'OVPN_REGEN_SRV_READY'
					},
					obj.sid
				)
			);
		});
	}
};
