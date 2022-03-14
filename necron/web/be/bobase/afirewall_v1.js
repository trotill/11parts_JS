/**
 * Created by i7 on 28.10.2017.
 */

let { stylizeInputLittle, stylizeComboBoxLittle, stylizeComboBoxMed } = require('./util/style');

function Build() {
	return [
		{
			type: 'delim',
			id: 'frSet',
			name: 'Firewall settings'
		},
		{
			type: 'box',
			value: false,
			id: 'box_mac',
			name: 'MAC access',
			data: [
				{
					name: 'MAC access from MAC table',
					type: 'sbox',
					value: 'Allow',
					id: 'tMACblk',
					css: 'min-width:200px',
					tabidx: 1,
					items_name: [
						//"Allow",
						'Drop'
					],
					items_val: [
						//"Allow",
						'drop'
					]
				},
				{
					type: 'br'
				},
				{
					name: 'MAC table',
					type: 'table',
					id: 'tMACtab',
					edit: true,
					tabh: ['MAC'],
					jvalue: {
						obj: [
							{
								name: 'MAC',
								type: 'tfield',
								showname: false,
								flt: { len: ['17', '17'], chain: ['mac', 'upreg'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '08:00:27:63:8f:25',
								css: 'width:100%'
							}
						]
					}
				}
			]
		},
		{
			type: 'box',
			value: false,
			id: 'box_rules',
			data: [
				{
					type: 'delim',
					id: 'frshrul',
					name: 'Shared rules'
				},
				{
					name: 'Rules',
					type: 'table',
					id: 'rules',
					edit: true,
					tabh: ['Name', 'On/Off'],
					value: [],
					jvalue: {
						obj: [
							{
								name: '',
								type: 'sboxradio',
								tabidx: 1,
								value: 'mcast_ip_wan',
								items_name: [
									'Accept multicast on WAN',
									'Forward multicast WAN to Bridge',
									'Disable NAT and Forward',
									'Project rules1',
									'Project rules2',
									'Project rules3'
								],
								items_val: [
									'mcast_ip_wan',
									'mcast_ip_forward',
									'deny_ip_forward',
									'prj_rules1',
									'prj_rules2',
									'prj_rules3'
								]
							},
							{
								type: 'switch',
								value: 'false',
								name: ''
							}
						]
					}
				}
			]
		},
		{
			type: 'box',
			value: false,
			id: 'box_pacc',
			data: [
				{
					type: 'delim',
					id: 'pacc',
					name: 'Port access config'
				},
				{
					name: 'In/Out',
					type: 'multiform',
					id: 'port_inout',
					option: {
						edit: true,
						header: ['Net side', 'Proto', 'Rule', 'Direction', 'Port']
					},
					value: [],
					items: [
						{
							name: '',
							type: 'sbox',
							tabidx: 1,
							value: 'wan',
							//  id:"ipt_side",
							items_name: ['WAN side', 'Bridge side'],
							items_val: ['wan', 'br'],
							stylize: stylizeComboBoxLittle
						},
						{
							name: '',
							type: 'sbox',
							tabidx: 1,
							// id:'ipt_proto',
							value: 'tcp',
							items_name: ['TCP', 'UDP'],
							items_val: ['tcp', 'udp'],
							stylize: stylizeComboBoxLittle
						},
						{
							name: '',
							type: 'sbox',
							tabidx: 1,
							value: 'drop',
							// id:'ipt_acc',
							items_name: ['Drop', 'Accept'],
							items_val: ['drop', 'accept'],
							stylize: stylizeComboBoxLittle
						},
						{
							name: '',
							type: 'sbox',
							tabidx: 1,
							value: 'in',
							// id:'ipt_chain',
							items_name: ['Input', 'Output'],
							items_val: ['in', 'out'],
							stylize: stylizeComboBoxLittle
						},
						{
							name: 'Port',
							type: 'tfield',
							// id: 'ipt_port',
							showname: false,
							value: 1194,
							flt: { minmax: ['1', '65535'] },
							fltsett: { event: false },
							stylize: stylizeInputLittle
						}
					]
				},

				{
					name: 'Forward',
					type: 'multiform',
					id: 'port_fw',
					option: {
						edit: true,
						header: ['Net direction', 'Proto', 'Rule', 'Port']
					},
					value: [],
					items: [
						{
							name: '',
							type: 'sbox',
							tabidx: 1,
							value: 'wan',
							//id:"ipt_side",
							css: 'width:max-content;text-align: left;',
							items_name: ['WAN to Bridge', 'Bridge to WAN'],
							items_val: ['wanbr', 'brwan'],
							stylize: stylizeComboBoxMed
						},
						{
							name: '',
							type: 'sbox',
							tabidx: 1,
							// id:'ipt_proto',
							value: 'tcp',
							css: 'width:max-content;text-align: left;',
							items_name: ['TCP', 'UDP'],
							items_val: ['tcp', 'udp'],
							stylize: stylizeComboBoxLittle
						},
						{
							name: '',
							type: 'sbox',
							tabidx: 1,
							value: 'drop',
							//id:'ipt_acc',
							css: 'width:max-content;text-align: left;',
							items_name: ['Drop', 'Accept'],
							items_val: ['drop', 'accept'],
							stylize: stylizeComboBoxLittle
						},
						{
							name: 'Port',
							type: 'tfield',
							showname: false,
							// id: 'ipt_port',
							value: 1194,
							css: 'width:50px;margin: 0px 0px -2px 0px;',
							flt: { minmax: ['1', '65535'] },
							fltsett: { event: false },
							stylize: stylizeInputLittle
						}
					]
				}
			]
		}
	];
}

module.exports = {
	Build: Build
};
