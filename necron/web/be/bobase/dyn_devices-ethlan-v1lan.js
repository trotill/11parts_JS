/**
 * Created by i7 on 26.05.2020.
 */
function a(bobjname, dev) {
	// console.log("!!!!!!DEV!!!!!!!",dev);
	return [
		{
			type: 'delim',
			id: 'etCon',
			name: 'Ethernet' + dev.order_num + ' config'
		},
		{
			name: 'MAC address',
			type: 'tfield',
			id: 'shMac',
			rvalue:
				'{"iface":"' +
				dev.type +
				dev.order_num +
				'","req":"ifconf","req_t":1000,"name":["MAC"],"value":["mac"]}',
			isRo: true
		},
		{
			name: 'IP mode',
			type: 'sbox',
			value: 'stip',
			id: 'Mode',
			tabidx: 1,
			items_name: ['Static IP', 'DHCP'],
			items_val: ['stip', 'dhcp'],
			spage: {
				stip: [
					{
						name: 'IP address',
						type: 'tfield',
						id: 'Ip',
						value: '',
						flt: { ip: [] }
					},
					{
						name: 'IP Mask',
						type: 'tfield',
						id: 'Ms',
						value: '255.255.255.0',
						flt: { chain: ['ip'] }
					},
					{
						name: 'Gateway IP',
						type: 'tfield',
						id: 'Gw',
						value: '192.168.0.1',
						flt: { chain: ['ip'] }
					},
					{
						type: 'br'
					},
					{
						type: 'switch',
						value: false,
						id: 'FakeMac',
						name: 'Fake MAC address',
						data: [
							{
								type: 'delim',
								id: 'delimMac',
								name: 'Input MAC address'
							},
							{
								name: 'MAC address',
								type: 'tfield',
								id: 'Mac',
								flt: { len: ['17', '17'], chain: ['mac', 'upreg'] },
								value: '00:80:0F:95:19:0F'
							}
						]
					}
				],
				dhcp: [
					{
						name: 'IP address',
						type: 'tfield',
						id: 'shIP',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["IP"],"value":["ip"]}',
						isRo: true
					},
					{
						type: 'switch',
						value: false,
						id: 'FakeMac',
						name: 'Fake MAC address',
						data: [
							{
								type: 'delim',
								id: 'delimMac',
								name: 'Input MAC address'
							},
							{
								name: 'MAC address',
								type: 'tfield',
								id: 'Mac',
								flt: { len: ['17', '17'], chain: ['mac', 'upreg'] },
								value: '00:80:0F:95:19:0F'
							}
						]
					}
				]
			}
		},
		{
			type: 'switch',
			value: false,
			id: 'usedns',
			name: 'DNS settings',
			data: [
				{
					name: 'Primary DNS IP',
					type: 'tfield',
					id: 'dhDNS',
					flt: { chain: ['ip'] },
					value: '8.8.8.8'
				},
				{
					name: 'Alternate DNS IP',
					type: 'tfield',
					id: 'dhDNSex',
					flt: { chain: ['ip'] },
					value: '192.168.0.1'
				}
			]
		},
		{
			type: 'switch',
			value: false,
			id: 'UseAltIP',
			name: 'Add second static IP',
			data: [
				{
					name: 'IP',
					type: 'tfield',
					value: '',
					id: 'exIp',
					flt: { chain: ['ip'] }
				}
			]
		}
	];
}

module.exports = {
	a
};
