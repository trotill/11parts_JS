const tzs = [
	{ label: '(GMT-12:00) International Date Line West', value: 'Etc/GMT+12' },
	{ label: '(GMT-11:00) Midway Island, Samoa', value: 'Pacific/Midway' },
	{ label: '(GMT-10:00) Hawaii', value: 'Pacific/Honolulu' },
	{ label: '(GMT-09:00) Alaska', value: 'US/Alaska' },
	{ label: '(GMT-08:00) Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
	{ label: '(GMT-08:00) Tijuana, Baja California', value: 'America/Tijuana' },
	{ label: '(GMT-07:00) Arizona', value: 'US/Arizona' },
	{ label: '(GMT-07:00) Chihuahua, La Paz, Mazatlan', value: 'America/Chihuahua' },
	{ label: '(GMT-07:00) Mountain Time (US & Canada)', value: 'US/Mountain' },
	{ label: '(GMT-06:00) Central America', value: 'America/Managua' },
	{ label: '(GMT-06:00) Central Time (US & Canada)', value: 'US/Central' },
	{ label: '(GMT-06:00) Guadalajara, Mexico City, Monterrey', value: 'America/Mexico_City' },
	{ label: '(GMT-06:00) Saskatchewan', value: 'Canada/Saskatchewan' },
	{ label: '(GMT-05:00) Bogota, Lima, Quito, Rio Branco', value: 'America/Bogota' },
	{ label: '(GMT-05:00) Eastern Time (US & Canada)', value: 'US/Eastern' },
	{ label: '(GMT-05:00) Indiana (East)', value: 'US/East-Indiana' },
	{ label: '(GMT-04:00) Atlantic Time (Canada)', value: 'Canada/Atlantic' },
	{ label: '(GMT-04:00) Caracas, La Paz', value: 'America/Caracas' },
	{ label: '(GMT-04:00) Manaus', value: 'America/Manaus' },
	{ label: '(GMT-04:00) Santiago', value: 'America/Santiago' },
	{ label: '(GMT-03:30) Newfoundland', value: 'Canada/Newfoundland' },
	{ label: '(GMT-03:00) Brasilia', value: 'America/Sao_Paulo' },
	{ label: '(GMT-03:00) Buenos Aires, Georgetown', value: 'America/Argentina/Buenos_Aires' },
	{ label: '(GMT-03:00) Greenland', value: 'America/Godthab' },
	{ label: '(GMT-03:00) Montevideo', value: 'America/Montevideo' },
	{ label: '(GMT-02:00) Mid-Atlantic', value: 'America/Noronha' },
	{ label: '(GMT-01:00) Cape Verde Is.', value: 'Atlantic/Cape_Verde' },
	{ label: '(GMT-01:00) Azores', value: 'Atlantic/Azores' },
	{ label: '(GMT+00:00) Casablanca, Monrovia, Reykjavik', value: 'Africa/Casablanca' },
	{
		label: '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London',
		value: 'Etc/Greenwich'
	},
	{
		label: '(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
		value: 'Europe/Amsterdam'
	},
	{
		label: '(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague',
		value: 'Europe/Belgrade'
	},
	{ label: '(GMT+01:00) Brussels, Copenhagen, Madrid, Paris', value: 'Europe/Brussels' },
	{ label: '(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb', value: 'Europe/Sarajevo' },
	{ label: '(GMT+01:00) West Central Africa', value: 'Africa/Lagos' },
	{ label: '(GMT+02:00) Amman', value: 'Asia/Amman' },
	{ label: '(GMT+02:00) Athens, Bucharest, Istanbul', value: 'Europe/Athens' },
	{ label: '(GMT+02:00) Beirut', value: 'Asia/Beirut' },
	{ label: '(GMT+02:00) Cairo', value: 'Africa/Cairo' },
	{ label: '(GMT+02:00) Harare, Pretoria', value: 'Africa/Harare' },
	{ label: '(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius', value: 'Europe/Helsinki' },
	{ label: '(GMT+02:00) Jerusalem', value: 'Asia/Jerusalem' },
	{ label: '(GMT+02:00) Windhoek', value: 'Africa/Windhoek' },
	{ label: '(GMT+03:00) Kuwait, Riyadh, Baghdad', value: 'Asia/Kuwait' },
	{ label: '(GMT+03:00) Minsk', value: 'Europe/Minsk' },
	{ label: '(GMT+03:00) Moscow, St. Petersburg, Volgograd', value: 'Europe/Moscow' },
	{ label: '(GMT+03:00) Nairobi', value: 'Africa/Nairobi' },
	{ label: '(GMT+03:00) Tbilisi', value: 'Asia/Tbilisi' },
	{ label: '(GMT+03:30) Tehran', value: 'Asia/Tehran' },
	{ label: '(GMT+04:00) Abu Dhabi, Muscat', value: 'Asia/Muscat' },
	{ label: '(GMT+04:00) Baku', value: 'Asia/Baku' },
	{ label: '(GMT+04:00) Yerevan', value: 'Asia/Yerevan' },
	{ label: '(GMT+04:30) Kabul', value: 'Asia/Kabul' },
	{ label: '(GMT+05:00) Yekaterinburg', value: 'Asia/Yekaterinburg' },
	{ label: '(GMT+05:00) Islamabad, Karachi, Tashkent', value: 'Asia/Karachi' },
	{ label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi', value: 'Asia/Calcutta' },
	{ label: '(GMT+05:30) Sri Jayawardenapura', value: 'Asia/Calcutta' },
	{ label: '(GMT+05:45) Kathmandu', value: 'Asia/Katmandu' },
	{ label: '(GMT+06:00) Almaty, Novosibirsk', value: 'Asia/Almaty' },
	{ label: '(GMT+06:00) Astana, Dhaka', value: 'Asia/Dhaka' },
	{ label: '(GMT+06:30) Yangon (Rangoon)', value: 'Asia/Rangoon' },
	{ label: '(GMT+07:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok' },
	{ label: '(GMT+07:00) Krasnoyarsk', value: 'Asia/Krasnoyarsk' },
	{ label: '(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi', value: 'Asia/Hong_Kong' },
	{ label: '(GMT+08:00) Kuala Lumpur, Singapore', value: 'Asia/Kuala_Lumpur' },
	{ label: '(GMT+08:00) Irkutsk, Ulaan Bataar', value: 'Asia/Irkutsk' },
	{ label: '(GMT+08:00) Perth', value: 'Australia/Perth' },
	{ label: '(GMT+08:00) Taipei', value: 'Asia/Taipei' },
	{ label: '(GMT+09:00) Osaka, Sapporo, Tokyo', value: 'Asia/Tokyo' },
	{ label: '(GMT+09:00) Seoul', value: 'Asia/Seoul' },
	{ label: '(GMT+09:00) Yakutsk', value: 'Asia/Yakutsk' },
	{ label: '(GMT+09:30) Adelaide', value: 'Australia/Adelaide' },
	{ label: '(GMT+09:30) Darwin', value: 'Australia/Darwin' },
	{ label: '(GMT+10:00) Brisbane', value: 'Australia/Brisbane' },
	{ label: '(GMT+10:00) Canberra, Melbourne, Sydney', value: 'Australia/Canberra' },
	{ label: '(GMT+10:00) Hobart', value: 'Australia/Hobart' },
	{ label: '(GMT+10:00) Guam, Port Moresby', value: 'Pacific/Guam' },
	{ label: '(GMT+10:00) Vladivostok', value: 'Asia/Vladivostok' },
	{ label: '(GMT+11:00) Magadan, Solomon Is., New Caledonia', value: 'Asia/Magadan' },
	{ label: '(GMT+12:00) Auckland, Wellington', value: 'Pacific/Auckland' },
	{ label: '(GMT+12:00) Fiji, Kamchatka, Marshall Is.', value: 'Pacific/Fiji' },
	{ label: "(GMT+13:00) Nuku'alofa", value: 'Pacific/Tongatapu' }
];
const tzs2 = [
	{ label: '(GMT-12:00) International Date Line West', value: '-12' },
	{ label: '(GMT-11:00) Midway Island, Samoa', value: '-11' },
	{ label: '(GMT-10:00) Hawaii', value: '-10' },
	{ label: '(GMT-09:00) Alaska', value: '-9' },
	{ label: '(GMT-08:00) Pacific Time (US & Canada)', value: '-8' },
	{ label: '(GMT-08:00) Tijuana, Baja California', value: '-8' },
	{ label: '(GMT-07:00) Arizona', value: '-7' },
	{ label: '(GMT-07:00) Chihuahua, La Paz, Mazatlan', value: '-7' },
	{ label: '(GMT-07:00) Mountain Time (US & Canada)', value: '-7' },
	{ label: '(GMT-06:00) Central America', value: '-6' },
	{ label: '(GMT-06:00) Central Time (US & Canada)', value: '-6' },
	{ label: '(GMT-05:00) Bogota, Lima, Quito, Rio Branco', value: '-5' },
	{ label: '(GMT-05:00) Eastern Time (US & Canada)', value: '-5' },
	{ label: '(GMT-05:00) Indiana (East)', value: '-5' },
	{ label: '(GMT-04:00) Atlantic Time (Canada)', value: '-4' },
	{ label: '(GMT-04:00) Caracas, La Paz', value: '-4' },
	{ label: '(GMT-04:00) Manaus', value: '-4' },
	{ label: '(GMT-04:00) Santiago', value: '-4' },
	{ label: '(GMT-03:30) Newfoundland', value: '-3.5' },
	{ label: '(GMT-03:00) Brasilia', value: '-3' },
	{ label: '(GMT-03:00) Buenos Aires, Georgetown', value: '-3' },
	{ label: '(GMT-03:00) Greenland', value: '-3' },
	{ label: '(GMT-03:00) Montevideo', value: '-3' },
	{ label: '(GMT-02:00) Mid-Atlantic', value: '-2' },
	{ label: '(GMT-01:00) Cape Verde Is.', value: '-1' },
	{ label: '(GMT-01:00) Azores', value: '-1' },
	{ label: '(GMT+00:00) Casablanca, Monrovia, Reykjavik', value: '0' },
	{ label: '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London', value: '0' },
	{ label: '(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna', value: '1' },
	{ label: '(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague', value: '1' },
	{ label: '(GMT+01:00) Brussels, Copenhagen, Madrid, Paris', value: '1' },
	{ label: '(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb', value: '1' },
	{ label: '(GMT+01:00) West Central Africa', value: '1' },
	{ label: '(GMT+02:00) Amman', value: '2' },
	{ label: '(GMT+02:00) Athens, Bucharest, Istanbul', value: '2' },
	{ label: '(GMT+02:00) Beirut', value: '2' },
	{ label: '(GMT+02:00) Cairo', value: '2' },
	{ label: '(GMT+02:00) Harare, Pretoria', value: '2' },
	{ label: '(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius', value: '2' },
	{ label: '(GMT+02:00) Jerusalem', value: '2' },
	{ label: '(GMT+02:00) Minsk', value: '2' },
	{ label: '(GMT+02:00) Windhoek', value: '2' },
	{ label: '(GMT+03:00) Kuwait, Riyadh, Baghdad', value: '3' },
	{ label: '(GMT+03:00) Moscow, St. Petersburg, Volgograd', value: '3' },
	{ label: '(GMT+03:00) Nairobi', value: '3' },
	{ label: '(GMT+03:00) Tbilisi', value: '3' },
	{ label: '(GMT+03:30) Tehran', value: '3.5' },
	{ label: '(GMT+04:00) Abu Dhabi, Muscat', value: '4' },
	{ label: '(GMT+04:00) Baku', value: '4' },
	{ label: '(GMT+04:00) Yerevan', value: '4' },
	{ label: '(GMT+04:30) Kabul', value: '4.5' },
	{ label: '(GMT+05:00) Yekaterinburg', value: '5' },
	{ label: '(GMT+05:00) Islamabad, Karachi, Tashkent', value: '5' },
	{ label: '(GMT+05:30) Sri Jayawardenapura', value: '5.5' },
	{ label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi', value: '5.5' },
	{ label: '(GMT+05:45) Kathmandu', value: '5.75' },
	{ label: '(GMT+06:00) Almaty, Novosibirsk', value: '6' },
	{ label: '(GMT+06:00) Astana, Dhaka', value: '6' },
	{ label: '(GMT+06:30) Yangon (Rangoon)', value: '6.5' },
	{ label: '(GMT+07:00) Bangkok, Hanoi, Jakarta', value: '7' },
	{ label: '(GMT+07:00) Krasnoyarsk', value: '7' },
	{ label: '(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi', value: '8' },
	{ label: '(GMT+08:00) Kuala Lumpur, Singapore', value: '8' },
	{ label: '(GMT+08:00) Irkutsk, Ulaan Bataar', value: '8' },
	{ label: '(GMT+08:00) Perth', value: '8' },
	{ label: '(GMT+08:00) Taipei', value: '8' },
	{ label: '(GMT+09:00) Osaka, Sapporo, Tokyo', value: '9' },
	{ label: '(GMT+09:00) Seoul', value: '9' },
	{ label: '(GMT+09:00) Yakutsk', value: '9' },
	{ label: '(GMT+09:30) Adelaide', value: '9.5' },
	{ label: '(GMT+09:30) Darwin', value: '9.5' },
	{ label: '(GMT+10:00) Brisbane', value: '10' },
	{ label: '(GMT+10:00) Canberra, Melbourne, Sydney', value: '10' },
	{ label: '(GMT+10:00) Hobart', value: '10' },
	{ label: '(GMT+10:00) Guam, Port Moresby', value: '10' },
	{ label: '(GMT+10:00) Vladivostok', value: '10' },
	{ label: '(GMT+11:00) Magadan, Solomon Is., New Caledonia', value: '11' },
	{ label: '(GMT+12:00) Auckland, Wellington', value: '12' },
	{ label: '(GMT+12:00) Fiji, Kamchatka, Marshall Is.', value: '12' },
	{ label: "(GMT+13:00) Nuku'alofa", value: '13' }
];

function ParseTzs(tzs) {
	const result = { items_name: [], items_val: [] };
	for (var idx in tzs) {
		result.items_name.push(tzs[idx].label);
		result.items_val.push('posix/' + tzs[idx].value);
	}
	return result;
}

function Build() {
	const ptzs = ParseTzs(tzs);
	return [
		/*       {
         name:'Flow control',
         type: 'tfield',
         id:'snsflow',
         value: 'RTS/CTS',
         isRo: true,
         },*/
		{
			type: 'delim',
			id: 'dlTimeSett',
			name: 'Time setting'
		},
		{
			name: 'Timezone',
			type: 'sbox',
			value: '0',
			id: 'tzone',
			tabidx: 1,
			items_name: ptzs.items_name,
			items_val: ptzs.items_val,
			css: 'width:auto!important'
		},
		{
			name: 'Set date/time',
			type: 'sbox',
			value: 'manual',
			id: 'dt_mode',
			tabidx: 1,
			items_name: ['Manual', 'NTP'],
			items_val: ['manual', 'ntp'],
			spage: {
				manual: [
					{
						type: 'var',
						id: 'ntpen',
						name: 'ntpen',
						value: 'false',
						cvalue: 'false'
					},
					{
						name: 'Set Date/Time',
						type: 'multiform',
						id: 'tmantab',
						wrap: [0, 0, 0, 2, 0, 0, 1],
						count: 1,
						//tabh: [
						//   "Year","Month","Day","Hour","Min","Sec"
						//],

						defvalues: ['2018', '12', '14', '12', '40', '59'],
						items: [
							{
								name: 'Year',
								id: 'year',
								type: 'tfield',
								flt: { minmax: ['2018', '2118'], sym: ['n'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '',
								css: 'width:100%'
							},
							{
								name: 'Month',
								type: 'tfield',
								id: 'month',
								flt: { len: ['2', '2'], minmax: ['1', '12'], sym: ['n'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '',
								css: 'width:100%'
							},
							{
								name: 'Day',
								type: 'tfield',
								id: 'day',
								flt: { len: ['2', '2'], minmax: ['1', '31'], sym: ['n'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '',
								css: 'width:100%'
							},
							{
								name: 'Hour',
								type: 'tfield',
								id: 'hour',
								flt: { len: ['2', '2'], minmax: ['0', '23'], sym: ['n'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '',
								css: 'width:100%'
							},
							{
								name: 'Min',
								id: 'min',
								type: 'tfield',
								flt: { len: ['2', '2'], minmax: ['0', '59'], sym: ['n'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '',
								css: 'width:100%'
							},
							{
								name: 'Sec',
								id: 'sec',
								type: 'tfield',
								flt: { len: ['2', '2'], minmax: ['0', '59'], sym: ['n'] },
								fltsett: { event: false }, //eventFromUI disable
								value: '',
								css: 'width:100%'
							},
							{
								type: 'button_a',
								value: false,
								id: 'sdtime',
								name: 'Setup date/time',
								action: {
									sender: 'SendAction',
									finish: {
										success: 'set_date_time',
										params: {
											noda: 'Jnoda',
											send_setting: true
										}
									}
								}
							}
						]
					}
				],
				ntp: [
					{
						type: 'var',
						id: 'ntpen',
						name: 'ntpen',
						value: 'true',
						cvalue: 'true'
					},
					{
						name: 'Insert NTP servers',
						type: 'table',
						id: 'ntpsrv',
						edit: true,
						tabh: ['NTP URL'],
						value: [['0.pool.ntp.org'], ['1.pool.ntp.org'], ['2.pool.ntp.org'], ['3.pool.ntp.org']],
						jvalue: {
							obj: [
								{
									name: 'NTP URL',
									type: 'tfield',
									showname: false,
									flt: { len: ['3', '30'], sym: ['url'] },
									fltsett: { event: false }, //eventFromUI disable
									value: '',
									css: 'width:100%'
								}
							]
						}
					}
				]
			}
		},
		{
			type: 'label',
			name: 'System Date/Time',
			id: 'ntptime',
			rvalue:
				'{"iface":"","args":"%d/%m/%Y %H:%M","req":"dtime","req_t":5000,"name":["date"],"value":["date"]}',
			past: {
				jq: '.router_footer',
				type: 'appendTo'
			}
		}
	];
}

module.exports = {
	Build
};
