/**
 * Created by i7 on 28.10.2017.
 */

const sh = require('../../../shared');
function Build() {
	let rebootCntSrv = sh.GetValJSON_F('stat', 'device_reboot_cnt');
	let rebootCntCnoda = sh.GetValJSON_F('stat', 'server_reboot_cnt');
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
							'{"iface":"","req":"log2","args":{"uid":"cnoda_log","file":"/var/run/svclog/log1/wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson/0000000000-aal.log","rows":60},"value":"cnoda_log","req_t":0}', //'{"iface":"","req":"jnlog","value":"str","req_t":0}',
						rows: '600',
						css: 'height: 800px;',
						past: {
							type: 'appendTo',
							jq: '.page-content'
						}
					},
					{
						type: 'var',
						id: 'get_slog_cfg',
						value: '/var/run/svclog//wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson'
					},
					{
						type: 'button_a',
						id: 'get_slog',
						name: 'Download log file',
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
					}
				],
				jnoda: [
					{
						name: 'LOG',
						type: 'lfield',
						id: 'jnoda_log',
						rvalue: '{"iface":"","req":"jnlog","value":"str","req_t":0}',
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
