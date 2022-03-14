/**
 * Created by i7 on 12.03.2017.
 */
const fs = require('fs');
const ex = require('./../../../../exec');
const c = require('../../../../backCore');
const logger = c.getLogger();

var APDriver = 'rtl871xdrv';

const EventEmitter = require('events');
const wpa_emi = new EventEmitter.EventEmitter();
const serid = {};
const stconf =
	'beacon_int=100\n\
manufacturer=Realtek\n\
model_name=rtl8192eu\n\
device_name=rtl8192eu\n\
model_number=WLAN_CU\n\
serial_number=12345\n\
device_type=6-0050F204-1\n\
os_version=01020300\n\
config_methods=label display push_button keypad\n\
wps_state=2\n\
eap_server=1\n\
wpa_key_mgmt=WPA-PSK\n\
bridge=br0\n\
max_num_sta=8\n\
wme_enabled=1';

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
		mac_flt: 0,
		sec_algo_wpa: 'TKIP',
		sec_algo_wpa2: 'CCMP'
	};

	o.ssid = obj['Ssid'];
	o.region = obj['Reg'];
	o.mode = obj['M'];
	o.wide = obj['W'];
	o.ch = obj['Ch'];
	o.ssid_visible = obj['Bct'];
	o.sec_vers = obj['Sv'];
	o.sec_algo = obj['Sm'];
	o.genkey_interval = obj['KeyInt'];
	o.password = obj['Passwd'];
	o.sec_algo_wpa = obj['SmWPA'];
	o.sec_algo_wpa2 = obj['SmWPA2'];

	let wfreq;
	if (o.wide === '40+' || o.wide === 'auto') wfreq = '[HT40+]';
	else if (o.wide === '20') {
		wfreq = '';
	} else if (o.wide === '40-') {
		wfreq = '[HT40-]';
	}

	const conf_name = c.CACHE_PATH + '/' + iface + '.' + c.HOSTAPD_CONF;
	const stream = fs.createWriteStream(conf_name);
	stream.once('open', (/*fd*/) => {
		stream.write(stconf + '\n');
		stream.write('ssid=' + o.ssid + '\n');
		stream.write('wpa_passphrase=' + o.password + '\n');

		stream.write('driver=' + APDriver + '\n');
		stream.write('interface=' + iface + '\n');
		stream.write('wpa_group_rekey=' + o.genkey_interval + '\n');

		stream.write('ctrl_interface=' + c.CACHE_PATH + '/' + obj.IF + '.hostapd_ctrl\n');
		stream.write('macaddr_acl=0\n');
		stream.write('country_code=' + o.region + '\n');

		if (o.ssid_visible === 'true') stream.write('ignore_broadcast_ssid=0\n');
		else stream.write('ignore_broadcast_ssid=2\n');

		if (o.sec_algo_wpa === 'TKIP') stream.write('wpa_pairwise=TKIP\n');
		//sets encryption used by WPA
		else stream.write('wpa_pairwise=CCMP\n');

		if (o.sec_algo_wpa2 === 'TKIP') stream.write('rsn_pairwise=TKIP\n');
		//sets encryption used by WPA
		else stream.write('rsn_pairwise=CCMP\n');

		if (o.sec_vers === 'WPA') {
			stream.write('wpa=1\n');
		}

		if (o.sec_vers === 'WPA2') {
			stream.write('wpa=2\n');
		}

		if (o.sec_vers === 'WPAWPA2') {
			stream.write('wpa=3\n');
		}

		stream.write('ieee80211n=1\n');
		stream.write('ht_capab=' + wfreq + '[SHORT-GI-20][SHORT-GI-40]\n');
		if (o.ch !== 'auto') {
			stream.write('channel=' + o.ch + '\n');
		}

		switch (o.mode) {
			case 'ac':
				stream.write('hw_mode=a\n');
				if (o.ch === 'auto') {
					stream.write('channel=36\n');
				}
				break;
			case 'bgn':
			default:
				stream.write('hw_mode=g\n');
				if (o.ch === 'auto') {
					stream.write('channel=6\n');
				}
		}
		stream.end();
	});
	stream.once('close', () => {
		hapd_emi.emit('hostapd', conf_name);
	});

	return 0;
}

function WPASupp_DHCP(obj) {
	serid[obj.devid] = {};
	if (obj.dhcp_en === 'true')
		serid[obj.devid]['dhcp'] = ex.Service(
			'udhcpc',
			'-f -i ' + obj.IF + ' -s ' + c.UDHCPC_CONFIG,
			'restart'
		);
	else serid[obj.devid]['dhcp'] = undefined;
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
				stream.once('open', (/*fd*/) => {
					stream.write('ctrl_interface=' + c.CACHE_PATH + '/' + iface + '.' + 'wpasup_ctrl' + '\n');
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
				serid[obj.devid] = {};
				if (obj['Mode'] === 'client_in_br')
					serid[obj.devid]['wpas'] = ex.Service(
						sw_pth + '.wpa_supplicant',
						'-i' + iface + ' -Dwext' + ' -c' + wpa_conf + ' -b br0',
						'restart'
					);
				else
					serid[obj.devid]['wpas'] = ex.Service(
						sw_pth + '.wpa_supplicant',
						'-i' + iface + ' -Dwext' + ' -c' + wpa_conf,
						'restart'
					);
			});
		}
	}
	return 0;
}

function DeinitSupplicant(devid) {
	if (devid === undefined) {
		console.log('DeinitSupplicant error, devid==undefined');
		return;
	}
	if (serid[devid] === undefined) return;

	ex.ServiceCtrl(serid[devid]['wpas'], 'stop'); //ex.DeinitService(serid[devid]['wpas']);
	ex.ServiceCtrl(serid[devid]['dhcp'], 'stop'); //ex.DeinitService(serid[devid]['dhcp']);
}

module.exports = {
	GenerateWPASuppConfig,
	WPASupp_DHCP,
	GenerateHostAPDConfig,
	DeinitSupplicant,
	test: 1
};
