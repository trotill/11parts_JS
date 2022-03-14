/**
 * Created by i7 on 28.10.2017.
 */

function Build() {
	return [
		{
			type: 'delim',
			id: 'reReboot',
			name: 'Reboot'
		},
		{
			type: 'switch',
			value: false,
			id: 'askreb',
			name: 'Reboot',
			data: [
				{
					type: 'br'
				},
				{
					type: 'button_a',
					value: false,
					id: 'doReboot',
					name: 'Do reboot',
					event: {
						click: [
							{
								type: 'action',
								param: {
									action: 'reboot',
									subscribers: ['jnoda'],
									params_provider: 'IdProvider'
								}
							}
						]
					}
				}
			]
		}
	];
}

module.exports = {
	Build
};
