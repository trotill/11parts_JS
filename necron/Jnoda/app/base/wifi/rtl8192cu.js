/**
 * Created by i7 on 12.03.2017.
 */
const fs = require('fs');
const ex = require('./../../../../exec');
const c = require('../../../../backCore');
const logger = c.getLogger();

const APDriver = 'rtl871xdrv';

const EventEmitter = require('events');
const wpa_emi = new EventEmitter.EventEmitter();

const stconf =
	'beacon_int=100\n\
logger_syslog=-1\n\
logger_syslog_level=2\n\
logger_stdout=-1\n\
logger_stdout_level=2\n\
ctrl_interface=/var/run/hostapd\n\
ctrl_interface_group=0\n\
dtim_period=2\n\
max_num_sta=255\n\
rts_threshold=2347\n\
fragm_threshold=2346\n\
macaddr_acl=0\n\
wmm_enabled=1\n\
wmm_ac_bk_cwmin=4\n\
wmm_ac_bk_cwmax=10\n\
wmm_ac_bk_aifs=7\n\
wmm_ac_bk_txop_limit=0\n\
wmm_ac_bk_acm=0\n\
wmm_ac_be_aifs=3\n\
wmm_ac_be_cwmin=4\n\
wmm_ac_be_cwmax=10\n\
wmm_ac_be_txop_limit=0\n\
wmm_ac_be_acm=0\n\
wmm_ac_vi_aifs=2\n\
wmm_ac_vi_cwmin=3\n\
wmm_ac_vi_cwmax=4\n\
wmm_ac_vi_txop_limit=94\n\
wmm_ac_vi_acm=0\n\
wmm_ac_vo_aifs=2\n\
wmm_ac_vo_cwmin=2\n\
wmm_ac_vo_cwmax=3\n\
wmm_ac_vo_txop_limit=47\n\
wmm_ac_vo_acm=0\n\
eapol_key_index_workaround=0\n\
eap_server=0\n\
own_ip_addr=127.0.0.1\n\
wpa_key_mgmt=WPA-PSK\n';

function GenerateHostAPDConfig(obj, iface, hapd_emi) {
	// logger.debug("Generate hostapd conf...");

	const o = {
		ssid: 'IoTrouter',
		region: 'RU',
		mode: '11bgn',
		wide: 'auto',
		ch: 'auto',
		ssid_visible: 1,
		wds: 0,
		sec_type: 'WPA',
		sec_vers: 'WPA2',
		sec_algo: 'AES',
		genkey_interval: '86400',
		password: 'admin',
		mac_flt: 0
	};
	// obj['s'].d['wMode']
	o.ssid = obj['Ssid'];
	o.region = obj['Reg'];
	o.mode = obj['M'];
	o.wide = obj['W'];
	o.ch = obj['Ch'];
	o.ssid_visible = obj['Bct'];
	o.wds = obj['WDS'];
	o.sec_type = obj['Sec'];
	o.sec_vers = obj['Sv'];
	o.sec_algo = obj['Sm'];
	o.genkey_interval = obj['KeyInt'];
	o.password = obj['Passwd'];

	let wfreq;
	if (o.wide === 'auto') wfreq = '[HT40-]';
	else if (o.wide === '20') {
		wfreq = '';
	} else if (o.wide === '40') {
		wfreq = '[HT40+]';
	}

	let conf_name = c.CACHE_PATH + '/' + iface + '.' + c.HOSTAPD_CONF;
	let stream = fs.createWriteStream(conf_name);
	stream.once('open', (/*fd*/) => {
		stream.write(stconf + '\n');
		stream.write('ssid=' + o.ssid + '\n');
		stream.write('wpa_passphrase=' + o.password + '\n');
		stream.write('driver=' + APDriver + '\n');
		stream.write('interface=' + iface + '\n');
		stream.write('wpa_group_rekey=' + o.genkey_interval + '\n');
		if (APDriver !== 'rtl871xdrv') stream.write('ieee80211h=1\nieee80211d=1\n');
		else logger.debug('old ' + APDriver + ' disable language support!!!');

		stream.write('country_code=' + o.region + '\n');

		if (o.ssid_visible === 'true') stream.write('ignore_broadcast_ssid=0\n');
		else stream.write('ignore_broadcast_ssid=2\n');

		if (o.ch === 'auto') {
			if (APDriver !== 'rtl871xdrv') stream.write('channel=0\n');
			else stream.write('channel=10\n');
		} else stream.write('channel=' + o.ch + '\n');

		switch (o.sec_type) {
			case 'WPA':
			case 'WPAe':
				stream.write('auth_algs=1\n');
				if (o.sec_vers === 'WPA') {
					stream.write('wpa=1\n');
					if (o.sec_algo === 'TKIP') stream.write('wpa_pairwise=TKIP\n');
					else stream.write('wpa_pairwise=CCMP\n');
				} else {
					stream.write('wpa=2\n');
					if (o.sec_algo === 'TKIP') stream.write('rsn_pairwise=TKIP\n');
					else stream.write('rsn_pairwise=CCMP\n');
				}

				break;
			case 'NO':
				stream.write('auth_algs=0\n');
			//WPA
		}

		switch (o.mode) {
			case '11b':
				stream.write('hw_mode=b\n');
				stream.write('ht_capab=' + wfreq + '\n');
				break;
			case '11g':
				stream.write('hw_mode=g\n');
				stream.write('ht_capab=' + wfreq + '\n');
				break;
			case '11ac':
				stream.write('ieee80211ac=1\n');
				stream.write('vht_oper_chwidth=1\n');
				stream.write(
					'vht_capab=[MAX-MPDU-11454][RXLDPC][SHORT-GI-80][TX-STBC-2BY1][RX-STBC-1][MAX-A-MPDU-LEN-EXP7][RX-ANTENNA-PATTERN][TX-ANTENNA-PATTERN]\n'
				);
				stream.write('ht_capab=' + wfreq + '\n');
				break;
			case '11n':
			case '11bg':
			case '11bgn':
			default:
				stream.write('hw_mode=g\n');
				stream.write('ieee80211n=1\n');
				stream.write('wme_enabled=1\n');
				stream.write('ht_capab=' + wfreq + '[SHORT-GI-40][DSSS_CCK-40]\n');
		}
		stream.end();
	});
	stream.once('close', () => {
		hapd_emi.emit('hostapd', conf_name);
	});

	return 0;
}

function WPASupp_DHCP(obj) {
	ex.Service('udhcpc', '-f -i ' + obj.IF + ' -s ' + c.UDHCPC_CONFIG, 'restart');
}

function GenerateWPASuppConfig(obj) {
	let iface = obj.IF;

	ex.ExecNoOutSync('ifconfig ' + iface + ' down');
	ex.ExecNoOutSync('ip addr flush dev ' + iface);

	let wpa_conf;
	let sw_pth = c.CACHE_PATH + '/' + obj.IF;
	if (obj.Sec === 'WPA') {
		if (obj.Passwd.length >= 8) {
			logger.debug('Correct passwd WPA');

			let out = ex.ExecWOutSync(
				c.CACHE_PATH + '/' + iface + '.' + 'wpa_passphrase ' + obj.Ssid + ' ' + obj.Passwd
			);
			if (out !== '') {
				wpa_conf = c.CACHE_PATH + '/' + iface + '.' + 'wpa_supplicant.conf';
				let stream = fs.createWriteStream(wpa_conf);
				stream.once('open', function (/*fd*/) {
					stream.write('ctrl_interface=/var/run/wpa_supplicant\n');
					stream.write('ctrl_interface_group=0\nupdate_config=1\n\n' + out + '\n');
					stream.end();
				});
				stream.once('close', () => {
					wpa_emi.emit('wpa_supl', wpa_conf);
				});
			} else {
				logger.debug('Incorrect passwd WPA');
				require('../../../EventCollector').SendMessageToWeb('Incorrect password WPA');
				return -1;
			}

			wpa_emi.once('wpa_supl', (wpa_conf) => {
				ex.ExecNoOutSync('ifconfig ' + iface + ' up');
				ex.Service(
					sw_pth + '.wpa_supplicant',
					'-i' + iface + ' -Dwext' + ' -c' + wpa_conf,
					'restart'
				);
			});
		}
	}
	return 0;
}

module.exports = {
	GenerateWPASuppConfig,
	WPASupp_DHCP,
	GenerateHostAPDConfig
};
