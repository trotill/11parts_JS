/**
 * Created by i7 on 05.01.2020.
 */

function Build() {
	return [
		{
			type: 'switch',
			value: false,
			id: 'askfact',
			name: 'Roll back to factory settings',
			data: [
				{
					type: 'br'
				},
				{
					type: 'br'
				},
				{
					type: 'button_a',
					value: false,
					id: 'resetToFactory',
					name: 'Roll back',
					event: {
						click: [
							{
								type: 'action',
								param: {
									action: 'resetToFactory',
									subscribers: ['jnoda'],
									params_provider: 'IdProvider'
								}
							}
						]
					}
					/*action: {
                    sender: 'SendAction',
                    start:{
                        yesno:2,//1-ok,2- yes,no
                        message_id:"RBACK_FACTORY"
                    },
                    finish: {
                        success: 'factory',
                        params: {
                            noda: 'web_ui',
                            send_setting: false,
                        },
                    }
                },*/
				}
			]
		}
	];
}
module.exports = {
	Build
};
