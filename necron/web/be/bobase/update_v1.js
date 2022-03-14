/**
 * Created by i7 on 28.10.2017.
 */
const c = require('../../../backCore');

function Build() {
	return [
		{
			type: 'delim',
			id: 'upUpd',
			name: 'Update Firmware'
		},
		{
			type: 'gfile',
			id: 'fw',
			name: 'fw',
			err: 'Please select firmware',
			icon: 'folder_open',
			flt: { len: ['2', '63'], sym: ['ens'] }
			// action:{sender:'SendSettings',
			//  finish:{success:'apply_nr',
			//   params:{}}},
			// dest: GV.PageName,
		},
		{
			type: 'box',
			value: false,
			id: 'romshow',
			name: 'Show memory',
			data: [
				{
					type: 'graph_bar',
					name: 'ROM memory use (MByte)',
					id: 'rommem',
					style: 'horizontalBarStacked',
					xname: 'kByte',
					yname: 'Time',
					css: 'height:20%',
					colors: ['#0373fb', '#337322', '#424243'],
					rvalue:
						'{"iface":"","req":"rommem","req_t":1000,"name":["Download","Used","Total"],"value":["downused","romused","romtotal"]}'
				},
				{
					type: 'button_a',
					value: false,
					id: 'cleanDownload',
					name: 'Clean download folder',
					event: {
						click: [
							{
								type: 'action',
								param: {
									action: 'cleanDownload',
									subscribers: ['jnoda'],
									params_provider: 'ConstSettingProvider'
								}
							}
						]
					},
					ConstSetting: {
						path: c.DOWNLOAD_PATH,
						files: '*'
					}

					/*action:{
                        sender:'SendAction',
                        start:{
                            yesno:1,//1-ok,2- yes,no
                            message_id:"CLEAN_DF_WARN"
                        },
                        finish:{success:'remove',
                                params:{
                                    noda:'Jnoda',
                                    path:c.DOWNLOAD_PATH,
                                    files:'*'
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
