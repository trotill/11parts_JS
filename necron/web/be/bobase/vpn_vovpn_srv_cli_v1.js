/**
 * Created by i7 on 17.02.2020.
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
								items_name: ['Client', 'Server'],
								items_val: ['client', 'server'],
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
											name: 'vpn_client.ovpn',
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
														flt: { len: [4, 63], sym: ['en'] }
													},
													{
														name: 'Password',
														type: 'tfield',
														id: 'vpn_passwd',
														value: '',
														flt: { len: [4, 63], sym: ['en'] }
													}
												],
												passwd: [
													{
														name: 'Password',
														type: 'tfield',
														id: 'vpn_passwd',
														value: '',
														flt: { len: [4, 63], sym: ['en'] }
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
												'{"iface":"","req":"log2","args":{"uid":"ovpncl","file":"/var/log/openvpn.log","rows":60},"value":"ovpncl","req_t":0}',
											rows: '600',
											css: 'height: 500px;',
											past: {
												type: 'appendTo',
												jq: '.page-content',
												group: 'ovpn'
											}
										}
									],
									server: [
										{ type: 'delim', id: 'vpn_dsrv', name: 'OpenVPN server' },
										/*  {
                                         name: 'Certificate Authority (CA) key passphrase',
                                         type: 'tfield',
                                         id: 'ca_passwd',
                                         value: '',
                                         isSec: false,
                                         flt: {len: [4, 63], sym: ['en']},
                                         },*/
										{
											name: 'Certificate Authority (CA) key passphrase',
											type: 'var',
											id: 'ca_passwd',
											value: ''
										},
										{
											type: 'switch',
											value: 'true',
											id: 'regen_srv',
											name: 'Create server private key/cert and CA',
											data: [
												/* {
                                                 name: 'Enter server PEM pass phrase',
                                                 type: 'tfield',
                                                 id: 'pem_srv_passwd',
                                                 value: '',
                                                 isSec: false,
                                                 flt: {len: [4, 63], sym: ['en']},
                                                 },*/
												{
													name: 'Enter server PEM pass phrase',
													type: 'var',
													id: 'pem_srv_passwd',
													value: ''
												},
												{
													type: 'button_a',
													value: false,
													id: 'ovpn_srv_regen',
													name: 'Create server key/sert.',
													event: {
														click: [
															{
																type: 'action',
																param: {
																	action: 'ovpn_srv_regen',
																	subscribers: ['jnoda'],
																	params_provider: 'SettingsProvider'
																}
															}
														]
													}
												}
												/* {
                                                    type: 'button_a',
                                                    value: false,
                                                    id: 'ovpn_srv_regen',
                                                    name: 'Create server key/sert.',
                                                    action: {
                                                        sender: 'SendAction',
                                                        start:{
                                                            yesno:2,//1-ok,2- yes,no
                                                            message_id:"CREATE_VPN_KEY_SERT"
                                                        },
                                                        finish: {
                                                            success: 'ovpn_srv_regen',
                                                            params: {
                                                                noda: 'Jnoda',
                                                                send_setting: true,
                                                            },
                                                        }
                                                    },
                                                },*/
											]
										},
										{
											type: 'switch',
											value: 'false',
											id: 'regen_clnt',
											name: 'Create VPN client config file',
											data: [
												{
													name: 'Enter client PEM pass phrase',
													type: 'tfield',
													id: 'pem_client_passwd',
													value: '',
													isSec: false,
													flt: { len: [4, 63], sym: ['en'] }
												},
												{
													type: 'button_a',
													value: false,
													id: 'ovpn_clnt_regen_get',
													name: 'Download client config (*.ovpn)',
													event: {
														click: [
															{
																type: 'action',
																param: {
																	action: 'ovpn_clnt_regen_get',
																	subscribers: ['jnoda'],
																	params_provider: 'SettingsProvider'
																}
															}
														]
													}
												}
											]
										},
										{
											type: 'var',
											id: 'vpn_topology',
											value: 'server'
										},
										{
											type: 'var',
											id: 'vpn_clntopts',
											value: 'float'
										},
										{
											type: 'var',
											id: 'vpn_ip',
											value: '10.10.0.0'
										},
										{
											type: 'var',
											id: 'vpn_mask',
											value: '255.255.255.0'
										},
										/*{
                                         name: "Embedded DHCP",
                                         type: 'sbox',
                                         value: 'bridge',
                                         id: 'vpn_topology',
                                         tabidx: 1,
                                         items_name: ['Standart mode','Bridge compatible mode'],
                                         items_val: ['server','bridge'],
                                         spage: {
                                         server: [

                                         {
                                         name: 'VPN Server net IP',
                                         type: 'var',
                                         id: 'vpn_ip',
                                         value: '10.10.0.0',
                                         flt:{chain:['ip']}
                                         },
                                         {
                                         name: 'VPN Server mask',
                                         type: 'var',
                                         id: 'vpn_mask',
                                         value: '255.255.255.0',
                                         flt:{chain:['ip']}
                                         },
                                         ],
                                         bridge:[
                                         ]
                                         }
                                         },*/
										{
											name: 'Dev type',
											type: 'sbox',
											value: 'tun',
											id: 'vpn_dev',
											tabidx: 1,
											items_name: ['TAP layer 2', 'TUN layer 3'],
											items_val: ['tap', 'tun']
										},
										/* {
                                         name: 'Dev type',
                                         type: 'sbox',
                                         value: 'tun',
                                         id: 'vpn_dev',
                                         tabidx: 1,
                                         items_name:  [
                                         "TUN layer 3","TAP layer 2"
                                         ],
                                         items_val:  [
                                         "tun","tap"
                                         ],
                                         },*/
										{
											name: 'VPN Server port',
											type: 'tfield',
											id: 'vpn_port',
											value: '1194',
											flt: { minmax: ['1', '65535'] }
										},
										{
											name: 'Select cipher',
											type: 'sbox',
											value: 'AES-128-CBC',
											id: 'vpn_cipher',
											tabidx: 1,
											items_name: [
												'AES-128-CBC',
												'AES-256-CBC',
												'DES-CBC',
												'DES-EDE-CBC',
												'RC2-40-CBC'
											],
											items_val: [
												'AES-128-CBC',
												'AES-256-CBC',
												'DES-CBC',
												'DES-EDE-CBC',
												'RC2-40-CBC'
											]
										},
										{
											name: 'Max clients',
											type: 'tfield',
											id: 'max_clients',
											value: '10',
											flt: { minmax: ['1', '100'] }
										},
										{
											name: 'Protocol',
											type: 'sbox',
											value: 'udp',
											id: 'proto',
											tabidx: 1,
											items_name: ['TCP', 'UDP'],
											items_val: ['tcp-server', 'udp']
										},
										{
											name: 'OpenVPN add option',
											type: 'efield',
											id: 'vpn_opt_list',
											//'push redirect-gateway def1\n' +
											value:
												'push "dhcp-option DNS 8.8.8.8"\n' +
												'push "ping-restart 10"\n' +
												'push "ping 5"\n' +
												'ping "5"\n' +
												'# For force redirect all pack from VPN to default gw, uncomment this\n' +
												'# push redirect-gateway\n' +
												'tun-mtu 1500\n' +
												'tun-mtu-extra 32\n' +
												'mssfix 1450',
											rows: '10'
										},
										{
											type: 'var',
											id: 'client_cfg_ttl',
											name: 'vpn_rcc',
											value: '15000'
										},
										{
											name: 'OpenVPN server LOG',
											type: 'lfield',
											id: 'ovpnsrvlg',
											rvalue:
												'{"iface":"","req":"log10","args":{' +
												'"uid":"ovpnsrv",' +
												'"method":"slogger",' +
												'"pipe":"/var/run/slogger/log.openvpn_--tmp-dirvarrun--configvarrunopenvpn_srvconf",' +
												'"arch":"/var/run/svclog/log1/openvpn*/*",' +
												'"rows":200' +
												'},"value":"ovpnsrv","req_t":0}',
											rows: '600',
											css: 'height: 500px;',
											past: {
												type: 'appendTo',
												jq: '.page-content',
												group: 'server'
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

	console.log('VERS', vers);
	if (obj.vpn_enable === 'true' && obj.vpn_type === 'ovpn') {
		//Setting OpenVPN client
		if (obj.vpn_role === 'client') {
			console.log('Setting OpenVPN client');
			if (obj.vpn_conf_file !== undefined) {
				console.log('obj.vpn_conf_file', obj.vpn_conf_file);
				// try {
				//console.log("read file",c.DOWNLOAD_PATH + '/' + obj.vpn_conf_file.value);
				//
				// console.log(c.DOWNLOAD_PATH + '/' + obj.vpn_conf_file,fs.existsSync(c.DOWNLOAD_PATH + '/' + obj.vpn_conf_file));
				//console.log(c.DOWNLOAD_PATH + '/2' + obj.vpn_conf_file,fs.existsSync(c.DOWNLOAD_PATH + '/2' + obj.vpn_conf_file));

				if (fs.existsSync(c.DOWNLOAD_PATH + '/' + obj.vpn_conf_file) && obj.vpn_conf_file !== '') {
					var vpn_conf = fs.readFileSync(c.DOWNLOAD_PATH + '/' + obj.vpn_conf_file, 'utf8');
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
			} else {
				if (c.FindSetting('server.key') === false) {
					stat = 'ERR_OPEN_VPN_REGEN_KEY_SERT';
				} else {
					let vcfg_s = c.GetSetting('settings.vpn');
					if (vcfg_s !== '{}') {
						let vcfg = JSON.parse(vcfg_s).d;
						if (vcfg.ca_passwd !== '') {
							console.log('vpn fill passwd');
							vpn.ca_passwd = vcfg.ca_passwd;
							vpn.pem_srv_passwd = vcfg.pem_srv_passwd;
						}
					}
				}
			}
		}
	}

	return { stat, result: vpn };
}

module.exports = {
	Build,
	SaveSettings
};
