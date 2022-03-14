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
			type: 'var',
			value: false,
			id: 'usedns',
			name: 'DNS settings'
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
		}
	];
}

module.exports = {
	a
};
