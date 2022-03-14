/**
 * Created by i7 on 17.12.2019.
 */

function Build() {
	const mqtt_cfg = [
		{
			name: 'MQTT url',
			type: 'tfield',
			id: 'webMQTT_URL',
			value: 'localhost',
			flt: { len: ['2', '63'], sym: ['ens'] }
		},
		{
			name: 'MQTT port',
			type: 'tfield',
			id: 'webMQTT_Port',
			value: '1883',
			flt: { len: ['2', '63'], sym: ['ens'] }
		},
		{
			name: 'EventID',
			type: 'tfield',
			id: 'webControllerType',
			value: 'dnk',
			flt: { len: ['2', '63'], sym: ['ens'] }
		},
		{
			name: 'MQTT topics',
			type: 'table',
			id: 'webMQTT_Topic',
			edit: true,
			tabh: ['Topic'],
			jvalue: {
				obj: [
					{
						name: 'Topic',
						type: 'tfield',
						showname: false,
						flt: { len: ['2', '63'], sym: ['ens'] },
						fltsett: { event: false }, //eventFromUI disable
						value: 'topic',
						css: 'width:100%'
					}
				]
			}
		},
		{
			name: 'MQTT format',
			type: 'sbox',
			value: 'json',
			id: 'webMQTT_Format',
			tabidx: 1,
			items_name: ['JSON', 'RAW'],
			items_val: ['json', 'raw']
		},
		{
			name: 'MQTT filters',
			type: 'table',
			id: 'webMQTT_Filt',
			edit: true,
			tabh: ['Ignore start seq'],
			jvalue: {
				obj: [
					{
						name: 'Filter',
						type: 'tfield',
						showname: false,
						// flt: {len:['2','63'],sym:['ens']},
						fltsett: { event: false }, //eventFromUI disable
						value: '{"x":{"alm":',
						css: 'width:100%'
					}
				]
			}
		}
	];
	const mqtt_en = [
		{
			type: 'switch',
			value: false,
			id: 'webSio_tunmqtt',
			name: 'tunneling mqtt over socketio',
			data: mqtt_cfg
		}
	];

	const cnoda = [
		{
			name: 'Cnoda Log format',
			type: 'tfield',
			id: 'cn_aal_save_style',
			value: '1',
			flt: { len: ['1', '1'], sym: ['n'] }
		},
		{
			name: 'Cnoda max lines in Log block',
			type: 'tfield',
			id: 'cn_aal_lines_in_block',
			value: '10000',
			flt: { len: ['1', '7'], sym: ['n'] }
		},
		{
			name: 'Cnoda max blocks',
			type: 'tfield',
			id: 'cn_aal_max_blocks',
			value: '2',
			flt: { len: ['1', '7'], sym: ['n'] }
		},
		{
			name: 'Log root path',
			type: 'tfield',
			id: 'cn_aal_path',
			value: '/var/run/svclog/',
			flt: { len: ['3', '70'] }
		}
	];

	const jnoda = [
		{
			type: 'switch',
			value: false,
			id: 'webSkipConfNet',
			name: 'skip configure net'
		},
		{
			type: 'switch',
			value: false,
			id: 'webJnodaLogEn',
			name: 'Jnoda log'
		},
		{
			type: 'switch',
			value: false,
			id: 'webJnodaUsePrivate',
			name: 'Use private'
		},
		{
			type: 'switch',
			value: false,
			id: 'webJnodaEnableInspect',
			name: 'Enable --inspect for Node cluster (port 9230)'
		}
	];
	const srv = [
		{
			type: 'switch',
			value: false,
			id: 'webSrvLogEn',
			name: 'srv log'
		},
		{
			type: 'switch',
			value: false,
			id: 'webSrvEnableInspect',
			name: 'Enable --inspect for main Node (port 9229)'
		}
	];
	return [
		{
			type: 'delim',
			id: 'web_dm',
			name: 'WEB server config'
		},
		{
			name: 'socketio tunneling',
			type: 'sbox',
			value: 'none',
			id: 'webSio_tunnel',
			tabidx: 1,
			items_name: ['None', 'MQTT'],
			items_val: ['none', 'mqtt'],
			spage: {
				none: [],
				mqtt: mqtt_en
			}
		}, //
		{
			type: 'var',
			value: 'true',
			id: 'webTimeHCtoSYS',
			name: 'Sync system time with hwclock'
		},
		{
			type: 'var',
			value: '/usr/share/zoneinfo/',
			id: 'webTimeZoneinfoPath',
			name: 'zoneinfo path'
		},
		{
			name: 'Hostname',
			type: 'tfield',
			id: 'hostname',
			value: '',
			flt: { len: ['2', '63'], sym: ['ens'] }
		},
		{
			type: 'delim',
			id: 'deSet',
			name: 'Http setting'
		},
		{
			name: 'HTTP mode',
			type: 'sbox',
			value: 'http',
			id: 'ihttp',
			tabidx: 1,
			items_name: ['HTTP', 'HTTPS'],
			items_val: ['http', 'https'],
			spage: {
				http: [
					{
						name: 'Port',
						type: 'sbox',
						value: '80',
						id: 'hport',
						tabidx: 1,
						items_name: ['80', '8080'],
						items_val: ['80', '8080']
					}
				],
				https: [
					{
						name: 'Port',
						type: 'tfield',
						id: 'hsport',
						value: '443',
						isRo: true
					},
					{
						name: 'Secure',
						type: 'sbox',
						value: 'ss',
						id: 'ishttp',
						tabidx: 1,
						items_name: ['Use self-signed certificate', 'Add new certificate'],
						items_val: ['ss', 'ns'],
						spage: {
							ns: [
								{
									type: 'gfile',
									id: 'httpkey',
									name: 'Download HTTPS private key',
									err: 'Please select HTTPS private key file',
									icon: 'folder_open',
									flt: { len: ['2', '63'], sym: ['ens'], event: 'click' },
									param: { showvalue: true }
									// dest: GV.PageName,
								},
								{
									type: 'gfile',
									id: 'httpcert',
									name: 'Download HTTPS certificate',
									err: 'Please select HTTPS certificate file',
									icon: 'folder_open',
									flt: { len: ['2', '63'], sym: ['ens'], event: 'click' },
									param: { showvalue: true }
									// dest: GV.PageName,
								}
							],
							ss: []
						}
					}
				]
			}
		},
		{
			name: 'Compress WEB options',
			type: 'sbox',
			value: 'false',
			id: 'gzip_en',
			tabidx: 1,
			items_name: ['No compress', 'Compress WEB trafic'],
			items_val: ['false', 'true'],
			spage: {
				false: [],
				true: [
					{
						name: 'Treshold (byte)',
						type: 'tfield',
						id: 'gzip_thr',
						value: '2000',
						flt: { minmax: ['0', '1000000'] }
					}
				]
			}
		},
		{
			type: 'switch',
			value: true,
			id: 'webPostDebug',
			name: 'debugging via POST req (rebuild, cnoda, jnoda, udev, stop, start)'
		},
		{
			type: 'switch',
			value: true,
			id: 'webCnoda',
			name: 'Config cnoda',
			data: cnoda
		},
		{
			type: 'switch',
			value: true,
			id: 'webJnoda',
			name: 'Config jnoda',
			data: jnoda
		},
		{
			type: 'switch',
			value: true,
			id: 'webSrv',
			name: 'Config srv',
			data: srv
		},
		{
			name: 'Version (overlapped Cnoda version)',
			type: 'tfield',
			id: 'version',
			value: '',
			flt: { len: ['0', '63'], sym: ['ens'] }
		},
		{
			type: 'switch',
			value: false,
			id: 'webElectronEn',
			name: 'enable Electron JS',
			data: [
				{
					type: 'delim',
					id: 'webElDel',
					name: 'Electron enabled (Native UI Client)'
				},
				{
					type: 'switch',
					value: false,
					id: 'webElHwAcc',
					name: 'HardwareAcceleration'
				},
				{
					name: 'Frame rate (webContents.setFrameRate)',
					type: 'tfield',
					id: 'webElFrameRate',
					value: '30',
					flt: { minmax: ['5', '120'] }
				},
				{
					name: 'Display X size',
					type: 'tfield',
					id: 'webElXsz',
					value: '1280',
					flt: { minmax: ['320', '10000'] }
				},
				{
					name: 'Display Y size',
					type: 'tfield',
					id: 'webElYsz',
					value: '720',
					flt: { minmax: ['240', '10000'] }
				},
				{
					name: 'Set User patch (for cookies e.t.c)',
					type: 'tfield',
					id: 'webElUserPath',
					value: '/root/.config/Electron'
				},
				{
					name: 'Set Splash patch (for native)',
					type: 'tfield',
					id: 'webElSplashPath',
					value: 'Projects/master/styles/splash11p.html'
				},
				{
					type: 'button_a',
					value: false,
					id: 'webElShowGpu',
					name: 'Show chrome://gpu',
					event: {
						click: [
							{
								type: 'userEvent',
								param: {
									action: 'sendIPC',
									subscribers: [],
									params_provider: 'ConstSettingProvider'
								}
							}
						]
					},
					ConstSetting: {
						action: 'showGPU'
					}
				},
				{
					type: 'button_a',
					value: false,
					id: 'webElRestartMain',
					name: 'reload windows',
					event: {
						click: [
							{
								type: 'userEvent',
								param: {
									action: 'sendIPC',
									subscribers: [],
									params_provider: 'ConstSettingProvider'
								}
							}
						]
					},
					ConstSetting: {
						action: 'restartMain'
					}
				},
				{
					type: 'button_a',
					value: false,
					id: 'webElOpenDevTools',
					name: 'open dev tools',
					event: {
						click: [
							{
								type: 'userEvent',
								param: {
									action: 'sendIPC',
									subscribers: [],
									params_provider: 'ConstSettingProvider'
								}
							}
						]
					},
					ConstSetting: {
						action: 'openDevTools'
					}
				},
				{
					name: 'Electron cmdline',
					type: 'efield',
					id: 'webElCmdLine',
					value: ''
				},
				{
					type: 'switch',
					value: false,
					id: 'webElXorgEn',
					name: 'run Xorg for Electron',
					data: [
						{
							name: 'Display DPMS Standby (sec)',
							type: 'tfield',
							id: 'webElXorgDpmsStandby',
							value: 0,
							format: 'int',
							flt: { minmax: [0, 86400] }
						},
						{
							name: 'Display DPMS Suspend (sec)',
							type: 'tfield',
							id: 'webElXorgDpmsSuspend',
							value: 0,
							format: 'int',
							flt: { minmax: [0, 86400] }
						},
						{
							name: 'Display DPMS Off (sec)',
							type: 'tfield',
							id: 'webElXorgDpmsOff',
							value: 0,
							format: 'int',
							flt: { minmax: [0, 86400] }
						},
						{
							name: 'Xorg params',
							type: 'tfield',
							id: 'webElXorgParams',
							value: '-noreset -nolock -nocursor'
						},
						{
							name: 'Xorg config script',
							type: 'efield',
							id: 'webElXorgCfgScript',
							value:
								'export DISPLAY=:0.0\n' +
								'xset s off\n' +
								'xset -dpms\n' +
								'xset s off -dpms\n' +
								'xrandr --output HDMI-1 --mode 1280x720\n'
						}
					]
				}
			]
		}
	];
}

function SaveSettings(websrv) {
	let stat = 'ok';

	console.log('Save', websrv);
	if (websrv.ishttp === 'ns') {
		if (
			websrv.httpkey !== '' &&
			websrv.httpcert !== '' &&
			fs.existsSync(c.DOWNLOAD_PATH + '/' + websrv.httpkey) &&
			fs.existsSync(c.DOWNLOAD_PATH + '/' + websrv.httpcert)
		) {
			const tkey = fs.readFileSync(c.DOWNLOAD_PATH + '/' + websrv.httpkey, 'utf8');
			const tcert = fs.readFileSync(c.DOWNLOAD_PATH + '/' + websrv.httpcert, 'utf8');
			c.SaveSignSetting('https_ucert.pem', tcert);
			c.SaveSignSetting('https_ukey.pem', tkey);
			//fs.writeFileSync(fname, data , 'utf-8');
		} else {
			if (c.FindSetting('https_ucert.pem') === false || c.FindSetting('https_ukey.pem') === false)
				stat = 'NOT_DETECT_HTTPS_SEC';

			console.log('Save', websrv);
		}
	}

	return { stat, result: websrv };
}

module.exports = {
	Build,
	SaveSettings
};
