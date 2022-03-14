/**
 * Created by i7 on 15.02.2020.
 */

const sh = require('../../../shared');
function Build() {
	let rebootCntSrv = sh.GetValJSON_F('stat', 'device_reboot_cnt');
	let rebootCntCnoda = sh.GetValJSON_F('stat', 'server_reboot_cnt');
	let cnoda_log_cfg;
	let cnoda_log;

	if (glob.version === 'dbg') {
		cnoda_log_cfg =
			'/www/pages/log/cnoda/wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson';
		cnoda_log =
			'"/www/pages/log/cnoda/log1/wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson/0000000000-aal.log"';
	} else {
		cnoda_log_cfg = '/var/run/svclog/wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson';
		cnoda_log =
			'"/var/run/svclog/log1/wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson/0000000000-aal.log"';
	}

	return [
		{
			type: 'delim',
			id: 'deDbg',
			name: 'Debug tools'
		},
		{
			name: 'Select mode',
			type: 'sbox',
			value: 'jnmusage',
			id: 'dbg',
			tabidx: 2,
			items_name: [
				'Cnoda log',
				'Jnoda log',
				'Jnoda memory' //"LAN1","WIFI","GSM","Disabled",
			],
			items_val: [
				'cnoda',
				'jnoda',
				'jnmusage' //"['eth1','br0']","['wlan0','br0']","['gsm','br0']","['']",
			],
			spage: {
				cnoda: [
					{
						name: 'Cnoda reboot',
						type: 'tfield',
						id: 'cnodareboot',
						value: rebootCntCnoda,
						//svalue: ['{"readfile":"stat","sep":"","value":"server_reboot_cnt"}'],
						isRo: true
					},
					{
						name: 'Cnoda LOG',
						type: 'lfield',
						id: 'cnoda_log',
						rvalue:
							'{"iface":"","req":"log2","args":{' +
							'"uid":"cnoda_log",' +
							'"method":"slogger",' +
							'"rows":500,' +
							'"arch":"/www/pages/log/cnoda/log1/wwwpagesnecronCnoda*/*",' +
							'"pipe":"/run/slogger/log.wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson"' +
							'},"value":"cnoda_log","req_t":0}', //'{"iface":"","req":"jnlog","value":"str","req_t":0}',
						rows: '600',
						css: 'height: 800px;',
						past: {
							type: 'appendTo',
							jq: '.page-content'
						}
					},
					/* {
                        name: 'Cnoda LOG',
                        type: 'lfield',
                        id: 'cnoda_log',
                        rvalue: `{"iface":"","req":"log2","args":{"uid":"cnoda_log","file":${cnoda_log},"rows":60},"value":"cnoda_log","req_t":0}`,//'{"iface":"","req":"jnlog","value":"str","req_t":0}',
                        rows: '600',
                        css:'height: 800px;',
                        past:{
                            type:'insertAfter',
                            jq: '.page-content'
                        }
                    },*/
					{
						type: 'var',
						id: 'get_slog_cfg',
						cvalue: cnoda_log_cfg
					},
					{
						type: 'button_a',
						id: 'get_slog',
						name: 'Download log file',
						event: {
							click: [
								{
									type: 'action',
									param: {
										action: 'slogger',
										subscribers: ['jnoda'],
										params_provider: 'ConstSettingProvider'
									}
								}
							]
						},
						ConstSetting: {
							slogger_file: 'procLog.gz',
							slogger_config: cnoda_log_cfg
						}
					}
				],
				jnoda: [
					{
						name: 'LOG',
						type: 'lfield',
						id: 'jnoda_log',
						rvalue:
							'{"iface":"","req":"log4","args":{' +
							'"uid":"jnoda_log",' +
							'"method":"slogger",' +
							'"rows":500,' +
							'"arch":"/www/pages/log/Jn/log1/*",' +
							'"pipe":"/run/slogger/Jn"' +
							'},"value":"jnoda_log","req_t":0}', //'{"iface":"","req":"jnlog","value":"str","req_t":0}',
						rows: '600',
						css: 'height: 800px;',
						past: {
							type: 'appendTo',
							jq: '.page-content'
						}
					}
				],
				jnmusage: [
					//rss: 23314432, heapTotal: 11365760, heapUsed: 9045900 }
					{
						type: 'var',
						id: 'get_slog_cfg',
						cvalue: '/www/pages/necron/Cnoda/svc.slogger.json'
					},
					{
						type: 'debugLinks',
						id: 'debugLinks'
					},
					{
						type: 'button_a',
						id: 'get_slog',
						name: 'Download process log file',
						action: {
							sender: 'SendAction',
							finish: {
								success: 'get_slog',
								params: {
									noda: 'Jnoda',
									send_setting: true
								}
							}
						}
					},
					{
						name: 'Resident Set Size',
						type: 'tfield',
						id: 'ress',
						rvalue: '{"iface":"","req":"memusage","value":"rss","req_t":2000}',
						isRo: true
					},
					{
						type: 'br'
					},
					{
						name: 'Total Size of the Heap',
						type: 'tfield',
						id: 'totheap',
						rvalue: '{"iface":"","req":"memusage","value":"heapTotal","req_t":2000}',
						isRo: true
					},
					{
						type: 'br'
					},
					{
						name: 'Heap actually Used',
						type: 'tfield',
						id: 'heapused',
						rvalue: '{"iface":"","req":"memusage","value":"heapUsed","req_t":2000}',
						isRo: true
					},
					{
						type: 'br'
					},
					{
						name: 'CPU temperature',
						type: 'tfield',
						id: 'cputemp',
						rvalue: '{"iface":"","req":"cpu_t_imx6","value":"cputemp","req_t":1000}',
						isRo: true
					},
					{
						name: 'Device reboot',
						type: 'tfield',
						id: 'devreb',
						value: rebootCntSrv,
						//svalue: ['{"readfile":"stat","sep":"","value":"device_reboot_cnt"}'],
						isRo: true
					}
				]
			}
		}
	];
}

module.exports = {
	Build: Build
};
