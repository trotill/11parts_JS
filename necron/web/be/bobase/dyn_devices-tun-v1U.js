/**
 * Created by i7 on 17.06.2019.
 */
function a(bobjname, dev) {
	// console.log("!!!!!!DEV!!!!!!!",dev);
	return [
		{
			type: 'delim',
			id: 'etCon',
			name: 'TUN VPN' + dev.order_num + ' network'
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
		}
	];
}

module.exports = {
	a
};
