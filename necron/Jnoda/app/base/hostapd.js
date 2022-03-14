/**
 * Created by i7 on 19.03.2017.
 */

const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();

function StartHostApd(iface, confname) {
	const sw_pth = c.CACHE_PATH + '/' + iface;
	return ex.Service(sw_pth + '.hostapd', '-dd ' + confname, 'restart');
}

function GetAP_Info(iface, res) {
	let conn = 0;
	const mac_list = [];
	const sw_pth = c.CACHE_PATH + '/' + iface;
	try {
		let s = ex.ExecWOutSync(sw_pth + '.hostapd_cli -i ' + iface + ' get_config');
		//logger.debug("get_config "+s);
		res.bssid = /bssid=([0-9,a-f.:]*)/.exec(s)[1];
		res.ssid = /\nssid=([^\s]*)/.exec(s)[1];
		conn = 1;
		s = ex.ExecWOutSync('hostapd_cli -i ' + iface + ' all_sta') + '';
		if (s.length !== 0) {
			const lines = s.split('\n'); //_.split(s, '\n');
			let ps;
			lines.forEach(function (line) {
				try {
					ps = '';
					ps = /dot11RSNAStatsSTAAddress=([0-9,a-f.:]*)/.exec(line)[1];
				} catch (err) {
					logger.debug('hostapd, parse line error');
				}

				if (ps !== '') mac_list.push(ps);
			});
		}
	} catch (err) {
		logger.debug('error hostapd');
	}

	res.mac = mac_list;
	if (conn === 0) {
		res.connst = 0;
	} else res.connst = 1;

	return res;
}

module.exports = {
	StartHostApd,
	GetAP_Info
};
