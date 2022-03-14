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
			type: 'var',
			id: 'Mode',
			value: 'bridge'
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
					flt: { len: ['17', '17'], chain: ['max'] },
					value: '00:80:0F:95:19:0F'
				}
			]
		}
	];
}

module.exports = {
	a
};
