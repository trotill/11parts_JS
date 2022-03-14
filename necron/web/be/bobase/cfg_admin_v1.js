/**
 * Created by Ilya on 11.03.2020.
 */

function Build() {
	return [
		{
			type: 'delim',
			id: 'cadmDM',
			name: 'Config loader/archiver'
		},
		{
			name: 'Key items',
			type: 'table',
			id: 'cadmKeyItems',
			edit: true,
			tabh: ['Setting file', 'Field'],
			value: [],
			jvalue: {
				obj: [
					{
						name: 'Setting file',
						type: 'tfield',
						showname: false,
						fltsett: { event: false }, //eventFromUI disable
						value: 'distro',
						css: 'width:100%'
					},
					{
						name: 'Field',
						type: 'tfield',
						showname: false,
						fltsett: { event: false }, //eventFromUI disable
						value: 'cpu',
						css: 'width:100%'
					}
				]
			}
		},
		{
			name: 'Exclude file',
			type: 'table',
			id: 'cadmExcludeItems',
			edit: true,
			tabh: ['File/Folder'],
			value: [
				['settings.total_operating_time.*'],
				['settings.ethernet_network*'],
				['settings.distro.*'],
				['reserved/']
			],
			jvalue: {
				obj: [
					{
						name: 'Setting file or folder',
						type: 'tfield',
						showname: false,
						fltsett: { event: false }, //eventFromUI disable
						value: 'distro',
						css: 'width:100%'
					}
				]
			}
		},
		{
			name: 'Password',
			type: 'tfield',
			id: 'cadmPasswd',
			value: ''
		},
		{
			name: 'Archive name',
			type: 'tfield',
			id: 'cadmFname',
			value: '',
			flt: { sym: ['ens'] }
		},
		{
			type: 'switch',
			value: false,
			id: 'cadmPbkdf2',
			name: 'pbkdf2'
		},
		{
			type: 'button_a',
			value: false,
			id: 'cadmGetCfg',
			name: 'Get cfg archive',
			event: {
				click: [
					{
						type: 'action',
						param: {
							action: 'configs_enc',
							subscribers: ['jnoda'],
							params_provider: 'SettingsProvider'
						}
					}
				]
			}
		},
		{
			type: 'box',
			value: true,
			id: 'cadmSetCfgbox',
			name: 'Select archive configuration file',
			data: [
				{
					type: 'gfile',
					id: 'cadmSetCfg',
					value: '',
					name: 'Please select config arch',
					err: 'Please select config arch',
					icon: 'folder_open',
					flt: { len: ['2', '63'], sym: ['ens'], event: 'click' }

					// dest: GV.PageName,
				},
				{
					type: 'button_a',
					value: false,
					id: 'cadmAcceptCfg',
					name: 'Apply config',
					event: {
						click: [
							{
								type: 'action',
								param: {
									action: 'cadm_reconf_device',
									subscribers: ['cnoda'],
									params_provider: 'SettingsProvider'
								}
							}
						]
					}
				}
			]
		}
	];
}

function SaveSettings(obj) {
	/*let new_obj={
        type: obj.type,
        page: obj.page,
        cadmPasswd: obj.cadmPasswd,
        cadmFname: obj.cadmFname,
        cadmPbkdf2: obj.cadmPbkdf2,
        cadmSetCfg: obj.cadmSetCfg,
        cadmKeyItems: obj.cadmKeyItems
    }*/

	//console.log("SaveSettings cfg_admin",new_obj,'vers',vers);
	//if (obj.cadmSetCfg==="Please select config arch")
	//  delete obj.cadmSetCfg;

	obj.cadmSetCfg = '';
	obj.cadmPasswd = '';

	return { stat: 'ok', result: obj };
}

module.exports = {
	Build: Build,
	SaveSettings: SaveSettings
};
