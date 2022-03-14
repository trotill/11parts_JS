/**
 * Created by Ilya on 05.07.2018.
 */
const c = require('../../../backCore');
const fs = require('fs');

function Build() {
	return [
		{
			type: 'delim',
			id: 'vpn_dhname',
			name: 'VPN (Virtual Private Network)'
		},
		{
			type: 'switch',
			value: false,
			id: 'vpn_enable',
			name: 'Enable VPN',
			data: [
				{
					name: 'VPN',
					type: 'sbox',
					value: 'ovpn',
					id: 'vpn_type',
					tabidx: 1,
					items_name: ['OpenVPN'],
					items_val: ['ovpn'],
					spage: {
						ovpn: [
							{
								name: 'OpenVPN Mode',
								type: 'sbox',
								value: 'client',
								id: 'vpn_role',
								tabidx: 1,
								items_name: ['Client'],
								items_val: ['client'],
								spage: {
									client: [
										{
											type: 'delim',
											id: 'vpn_e1',
											lid: 'vpn_eone',
											name: 'Upload OpenVPN config file'
										},
										{
											type: 'gfile',
											id: 'vpn_conf_file',
											value: '',
											name: 'vpn_conf_file',
											flt: { len: [1, 128] },
											err: 'Please select OpenVPN config file',
											icon: 'folder_open',
											param: { showvalue: true }
											// dest: GV.PageName,
										},
										{
											type: 'delim',
											id: 'vpn_e2',
											lid: 'vnn_etwo',
											name: 'Set auth param'
										},
										{
											name: 'Auth Type',
											type: 'sbox',
											value: 'userpasswd',
											id: 'vpn_auth_mode',
											tabidx: 1,
											items_name: ['User/Password', 'Only Password', 'No used'],
											items_val: ['userpasswd', 'passwd', 'noused'],
											spage: {
												userpasswd: [
													{
														name: 'User',
														type: 'tfield',
														id: 'vpn_user',
														value: '',
														flt: { len: [0, 63], sym: ['en'] }
													},
													{
														name: 'Password',
														type: 'tfield',
														id: 'vpn_passwd',
														value: '',
														flt: { len: [0, 63], sym: ['en'] }
													}
												],
												passwd: [
													{
														name: 'Password',
														type: 'tfield',
														id: 'vpn_passwd',
														value: '',
														flt: { len: [0, 63], sym: ['en'] }
													}
												],
												noused: [
													{
														type: 'delim',
														id: 'vpn_nupl',
														name: 'Login and password no used'
													}
												]
											}
										},

										{
											type: 'delim',
											id: 'vpn_e3',
											lid: 'vpn_etree',
											name: 'Set connect params'
										},
										{
											name: 'VPN Server IP/URL',
											type: 'tfield',
											id: 'vpn_server_ip',
											value: '',
											flt: { len: ['3', '30'], sym: ['url'] }
										},
										{
											name: 'VPN Server port',
											type: 'tfield',
											id: 'vpn_server_port',
											value: '1194',
											flt: { minmax: ['1', '65535'] }
										},
										{
											name: 'Connect over interface',
											type: 'sbox',
											id: 'vpn_netif',
											value: 'auto',
											tabidx: 1,
											items_name: ['Default', 'Auto', 'Ethernet', 'WiFi', 'GSM0', 'GSM1'],
											items_val: ['default', 'auto', 'eth0', 'wlan0', 'gsm0', 'gsm1']
										},
										{
											name: 'OpenVPN client LOG',
											type: 'lfield',
											id: 'ovpncllg',
											rvalue:
												'{"iface":"","req":"log1","args":{"uid":"ovpncl","file":"/var/log/openvpn.log","rows":60},"value":"ovpncl","req_t":0}',
											rows: '600',
											css: 'height: 500px;',
											past: {
												type: 'appendTo',
												jq: '.page-content',
												group: 'ovpn'
											}
										}
									]
								}
							}
						]
					}
				}
			]
		}
	];
}

function SaveSettings(vpn, vers) {
	let stat = 'ok';
	console.log('SS VPN', vpn);
	const obj = vpn;

	//vpn.page="vpn";

	console.log('VERS', vers);
	if (obj.vpn_enable === 'true' && obj.vpn_type === 'ovpn') {
		//Setting OpenVPN client
		if (obj.vpn_role === 'client') {
			console.log('Setting OpenVPN client');
			if (obj.vpn_conf_file !== undefined) {
				console.log('obj.vpn_conf_file', obj.vpn_conf_file);

				if (fs.existsSync(c.DOWNLOAD_PATH + '/' + obj.vpn_conf_file) && obj.vpn_conf_file !== '') {
					let vpn_conf = fs.readFileSync(c.DOWNLOAD_PATH + '/' + obj.vpn_conf_file, 'utf8');
					//console.log("write to setting file",'openvpn_client.conf');
					c.SaveFileToSettingStor('openvpn_client.set', vpn_conf);
				} else {
					if (c.GetSetting('openvpn_client') === '{}') {
						console.log('Not found or not write OpenVPN client config', obj.vpn_conf_file);
						stat = 'ERR_UPLOAD_OPENVPN_CONFIG';
					}
				}
			}
		} else {
			if (
				vers === 'ovpn_srv_regen' ||
				vers === '|vpn|gw|tap_network0.net.tap0' ||
				vers === '|vpn|gw|tap_network0.net.tun0'
			) {
				vpn.ca_passwd =
					Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
				vpn.pem_srv_passwd =
					Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

				console.log('new vpn', vpn);
			} else if (c.FindSetting('server.key') === false) stat = 'ERR_OPEN_VPN_REGEN_KEY_SERT';
		}
	}

	return { stat, result: vpn };
}

module.exports = {
	Build,
	SaveSettings
};
