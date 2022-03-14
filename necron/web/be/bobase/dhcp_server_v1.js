/**
 * Created by i7 on 28.10.2017.
 */

function Build() {
	return [
		{
			type: 'delim',
			id: 'dhdDhcp',
			name: 'DHCP server'
		},
		{
			type: 'switch',
			value: false,
			id: 'dhEnable',
			name: 'Enable DHCP',
			data: [
				{
					type: 'var',
					id: 'dhIface',
					name: 'iface',
					value: 'br0'
				},
				{
					type: 'delim',
					id: 'sIPr',
					name: 'Specify IP range'
				},
				{
					name: 'Initial IP',
					type: 'tfield',
					id: 'dhStart',
					value: '192.168.0.2',
					flt: { chain: ['ip'] }
				},
				{
					name: 'Final IP',
					type: 'tfield',
					id: 'dhStop',
					flt: { chain: ['ip'] },
					value: '192.168.0.100'
				},
				{
					name: 'Address validity period',
					type: 'tfield',
					id: 'dhTime',
					value: '2880',
					flt: { minmax: ['1', '10000'], sym: ['n'] }
				},
				{
					type: 'delim',
					id: 'sDGW',
					name: 'Set DNS'
				},
				{
					type: 'br'
				},
				{
					name: 'Primary DNS IP',
					type: 'tfield',
					id: 'dhDNS',
					value: '8.8.8.8',
					flt: { chain: ['ip'] }
				},
				{
					name: 'Alternate DNS IP',
					type: 'tfield',
					id: 'dhDNSex',
					value: '192.168.0.1',
					flt: { chain: ['ip'] }
				},
				{
					type: 'delim',
					id: 'delimMacIP',
					name: 'Link MAC with IP'
				},
				{
					name: 'MAC/IP table',
					type: 'table',
					id: 'tLinkMacIp',
					edit: true,
					tabh: ['MAC', 'IP'],
					value: [],
					jvalue: {
						obj: [
							{
								name: 'MAC',
								showname: false,
								type: 'tfield',
								flt: { len: ['17', '17'], chain: ['mac', 'upreg'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '08:00:27:63:8f:25',
								css: 'width:100%'
							},
							{
								name: 'IP',
								showname: false,
								type: 'tfield',
								flt: { chain: ['ip'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '0.0.0.0',
								css: 'width:100%'
							}
						]
					}
				},
				{
					type: 'delim',
					id: 'delimClient',
					name: 'DHCP client list'
				},
				{
					name: 'Clients',
					type: 'table',
					css: 'max-height: 400px; overflow: auto;',
					id: 'tDHCP_List',
					edit: false,
					tabh: ['MAC', 'IP', 'Name'],
					rvalue: ['{"iface":"br0","req":"dhcpltab","value":[1,2,3]}']
				}
			]
		}
	];
}

module.exports = {
	Build: Build
};
