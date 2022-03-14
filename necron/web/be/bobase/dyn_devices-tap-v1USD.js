/**
 * Created by i7 on 17.06.2019.
 */
function a(bobjname, dev) {
	// console.log("!!!!!!DEV!!!!!!!",dev);
	return [
		{
			type: 'delim',
			id: 'etCon',
			name: 'TAP' + dev.order_num + ' config'
		},
		{
			name: 'IP mode',
			type: 'sbox',
			value: 'unconf',
			id: 'Mode',
			tabidx: 1,
			items_name: ['Static IP', 'DHCP', 'Auto'],
			items_val: ['stip', 'dhcp', 'unconf'],
			spage: {
				unconf: [
					{
						type: 'var',
						id: 'usedns',
						value: 'false'
					},
					{
						name: 'IP address',
						type: 'tfield',
						id: 'ip_addr',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["IP"],"value":["ip"]}',
						isRo: true
					},
					{
						name: 'IP mask',
						type: 'tfield',
						id: 'ip_mask',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["Mask"],"value":["mask"]}',
						isRo: true
					},
					{
						name: 'MAC address',
						type: 'tfield',
						id: 'mac_addr',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["MAC"],"value":["mac"]}',
						isRo: true
					},
					{
						type: 'var',
						id: 'usedns',
						value: 'true'
					},
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
				],
				stip: [
					{
						name: 'IP address',
						type: 'tfield',
						id: 'Ip',
						value: '',
						flt: { chain: ['ip'] }
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
						type: 'var',
						id: 'usedns',
						value: 'true'
					},
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
				],
				dhcp: [
					{
						type: 'var',
						id: 'usedns',
						value: 'false'
					},
					{
						name: 'IP address',
						type: 'tfield',
						id: 'ip_addr',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["IP"],"value":["ip"]}',
						isRo: true
					},
					{
						name: 'IP mask',
						type: 'tfield',
						id: 'ip_mask',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["Mask"],"value":["mask"]}',
						isRo: true
					},
					{
						name: 'MAC address',
						type: 'tfield',
						id: 'mac_addr',
						rvalue:
							'{"iface":"' +
							dev.type +
							dev.order_num +
							'","req":"ifconf","req_t":1000,"name":["MAC"],"value":["mac"]}',
						isRo: true
					}
				]
			}
		}
	];
}

module.exports = {
	a
};
