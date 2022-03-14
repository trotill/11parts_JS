/**
 * Created by i7 on 28.10.2017.
 */

const { stylizeInputLittle, stylizeInputLittleMed } = require('./util/style');

function Build() {
	return [
		{
			type: 'delim',
			id: 'afPred',
			name: 'Port redirect'
		},
		{
			type: 'switch',
			value: false,
			id: 'PortRed',
			name: 'Port redirect',
			data: [
				{
					name: 'Port redirect table',
					type: 'multiform',
					id: 'tNRedir',
					option: {
						default: ['2000', '2000', '0.0.0.0'],
						edit: true,
						header: ['From WAN port', 'To LAN port', 'To IP']
					},
					value: [],
					items: [
						{
							name: 'From WAN port',
							type: 'tfield',
							showname: false,
							flt: { minmax: ['1', '65535'] },
							fltsett: { event: false }, //eventFromUI disable
							value: '20000',
							stylize: stylizeInputLittle
						},
						{
							name: 'To LAN port',
							type: 'tfield',
							showname: false,
							flt: { minmax: ['1', '65535'] },
							fltsett: { event: false }, //eventFromUI disable
							value: '20000',
							stylize: stylizeInputLittle
						},
						{
							name: 'To IP',
							type: 'tfield',
							showname: false,
							flt: { chain: ['ip'] },
							fltsett: { event: false }, //eventFromUI disable
							value: '0.0.0.0',
							stylize: stylizeInputLittleMed
						}
					]
				}
			]
		},
		{
			type: 'delim',
			id: 'afDMZen',
			name: 'DMZ enable/disable'
		},
		{
			type: 'switch',
			value: false,
			id: 'enDMZ',
			name: 'DMZ',
			data: [
				{
					name: 'DMZ IP address',
					type: 'tfield',
					id: 'ipDMZ',
					value: '',
					flt: { chain: ['ip'] },
					fltsett: { event: true }
				}
			]
		}
	];
}

module.exports = {
	Build: Build
};
