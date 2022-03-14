/**
 * Created by i7 on 25.05.2019.
 */

function ModeDefSettings(mode, dev) {
	var dopt = dev.dev_opts;

	if (!dev['settings']) dev['settings'] = {};
	let m = mode;
	if (dopt.modes?.[m]?.settings) {
		const dms = dopt.modes[m].settings;
		for (const pn in dms) {
			//if (dev[pn]==undefined){
			if (Array.isArray(dms[pn])) {
				//array strings
				let ts = '';
				dms[pn].forEach((dmsItem) => {
					ts += dmsItem + '\n';
				});
				//for (let k = 0; k < dms[pn].length; k++) ts += dms[pn][k] + '\n';
				dev['settings'][pn] = ts;
			} else dev['settings'][pn] = dms[pn];
		}
		//}
	}
	//return res;
}

function a(inp) {
	const dev = inp.dev;
	const gsm = inp.gsm;
	const opts = inp.info;

	const smd = {
		name: 'Modem mode',
		type: 'sbox',
		value: opts.def_mode,
		id: 'mmode',
		tabidx: 0,
		items_name: [],
		items_val: [],
		spage: {}
	};

	ModeDefSettings('all', dev);
	console.log("ModeDefSettings('all',dev);", dev);

	if (opts.modes.MBIM) {
		smd.items_val.push('MBIM');
		ModeDefSettings('MBIM', dev);
		smd.items_name.push('Ethernet mode (MBIM)');
		smd.spage['MBIM'] = [
			{
				type: 'br'
			},
			{
				name: 'APN',
				type: 'tfield',
				id: 'apn',
				value: 'internet.mts.ru',
				flt: { len: ['1', '20'] }
			},
			/*  {
                type: 'switch',
                value: true,
                id: 'proxy',
                name: 'Proxy',
            },*/
			{
				name: 'Ethernet Driver',
				type: 'tfield',
				id: 'edrv',
				isRo: true,
				value: opts.edrv
			},
			{
				type: 'br'
			},
			{
				name: 'Network interface',
				type: 'tfield',
				id: 'eif',

				isRo: true,
				value: opts.eif
			},
			{
				type: 'br'
			},
			{
				type: 'br'
			}
		];
		//inp.cfgobj.push(smd);
	}

	if (opts.modes.CDC) {
		//smd.value = 'eth';
		ModeDefSettings('CDC', dev);
		smd.items_val.push('CDC');
		smd.items_name.push('Ethernet mode (CDC/QMI/NDI)');
		smd.spage['CDC'] = [
			{
				type: 'br'
			},
			{
				name: 'Ethernet Driver',
				type: 'tfield',
				id: 'edrv',
				isRo: true,
				value: opts.edrv
			},
			{
				type: 'br'
			},
			{
				name: 'Network interface',
				type: 'tfield',
				id: 'eif',

				isRo: true,
				value: opts.eif
			},
			{
				type: 'br'
			},
			{
				type: 'br'
			}
		];
		//inp.cfgobj.push(smd);
	}

	if (opts.modes.RAS) {
		ModeDefSettings('RAS', dev);
		const ras_cfg = gsm.dynGenDefRAS_Cfg(dev);

		//smd.value = 'ras';
		smd.items_val.push('RAS');
		smd.items_name.push('Modem mode (RAS)');

		smd.spage['RAS'] = [
			{
				name: 'APN',
				type: 'tfield',
				id: 'apn',
				value: ras_cfg.apn,
				flt: { len: ['1', '20'], sym: ['en'] }
			},
			{
				name: 'Dial Number',
				type: 'tfield',
				id: 'dnum',

				value: ras_cfg.dnum,
				flt: { len: ['4', '20'], sym: ['erns'] }
			},
			{
				name: 'Settings level',
				type: 'sbox',
				value: 'user',
				id: 'smgsm',
				tabidx: 1,
				items_name: ['Standart', 'Advanced'],
				items_val: ['user', 'admin'],
				spage: {
					user: [
						{
							type: 'var',
							id: 'conscr',
							name: 'conscr',
							value: ras_cfg.conscr
						},
						{
							type: 'var',
							id: 'disscr',
							name: 'disscr',
							value: ras_cfg.disscr
						}
					],
					admin: [
						{
							name: 'Connect script (for PPPD)',
							type: 'efield',
							id: 'conscr',
							value: ras_cfg.conscr,
							rows: '10'
						},
						{
							type: 'br',
							id: 'brb1'
						},
						{
							name: 'Disconnect script (for PPPD)',
							type: 'efield',
							id: 'disscr',
							value: ras_cfg.disscr,
							rows: '5'
						}
					]
				}
			},
			{
				type: 'switch',
				value: false,
				id: 'auth',
				name: 'Authentification',
				data: [
					{
						name: 'Username',
						type: 'tfield',
						id: 'uname',
						flt: { len: ['1', '20'], sym: ['en'] },
						value: ''
					},
					{
						type: 'br',
						id: 'bu2'
					},
					{
						name: 'Password',
						type: 'tfield',
						id: 'upasswd',
						flt: { len: ['1', '20'], sym: ['en'] },
						value: ''
					},
					{
						type: 'br',
						id: 'bu1'
					},
					{
						name: 'Type',
						type: 'sbox',
						value: 'Auto',
						id: 'atype',
						tabidx: 1,
						items_name: ['Auto', 'PAP', 'CHAP'],
						items_val: ['Auto', 'PAP', 'CHAP']
					}
				]
			}
		];

		/*
            var sset=ModeDefSettings('RAS',dev);
            sh.Merge_buildObj_settings(smd.spage['RAS'],sset);
            smd.spage['RAS']=Mustache.render(JSON.stringify(smd.spage['RAS']), ModeDefSettings('RAS',dev));
            console.log('MUSTACHE',smd.spage['RAS']);*/
	}
	inp.cfgobj.push(smd);

	let ras;
	if (opts.adev.length !== 0) {
		if (!dev.settings.atic) dev.settings.atic = '';

		if (!dev.settings.atid) dev.settings.atid = '';

		ras = [
			{
				type: 'br',
				id: 'brr0'
			},
			{
				name: 'Port settings',
				type: 'sbox',
				value: 'auto',
				id: 'pset',
				tabidx: 1,
				items_name: ['Auto', 'Manual'],
				items_val: ['auto', 'manual'],
				spage: {
					auto: [
						{
							type: 'var',
							id: 'ddev',
							name: 'ddev',
							//value:"0",
							//svalue: ['{"wrvar":"","value":"'+ttyitems_val[ttydataidx]+'"}'],
							value: opts.adev[opts.ttydataidx]
						},
						{
							type: 'var',
							id: 'cdev',
							name: 'cdev',
							// value:"0",
							// svalue: ['{"wrvar":"","value":"'+ttyitems_val[ttyctrlidx]+'"}'],
							value: opts.adev[opts.ttyctrlidx]
						},
						{
							type: 'var',
							id: 'atid',
							name: 'atid',
							value: dev.settings.atid
						},
						{
							type: 'var',
							id: 'atic',
							name: 'atic',
							value: dev.settings.atic //'AT^NDISDUP=1,1,"internet"\\r\\n',
						}
					],
					manual: [
						{
							name: 'Data port (default ' + opts.ttydataidx + ')',
							type: 'sbox',
							value: opts.adev[opts.ttydataidx],
							id: 'ddev',
							tabidx: opts.ttydataidx,
							items_name: opts.ttyitems_name,
							items_val: opts.ttyitems_val
						},
						{
							type: 'br',
							id: 'bre0'
						},
						{
							name: 'Control port (default ' + opts.ttyctrlidx + ')',
							type: 'sbox',
							id: 'cdev',
							value: opts.adev[opts.ttyctrlidx],
							tabidx: opts.ttyctrlidx,
							items_name: opts.ttyitems_name,
							items_val: opts.ttyitems_val
						},
						{
							type: 'br',
							id: 'bre1'
						},
						{
							name: 'Data port init (write str to port)',
							type: 'var',
							id: 'atid',
							flt: { len: ['0', '70'] },
							value: dev.settings.atid
						},
						{
							type: 'br',
							id: 'bre2'
						},
						{
							name: 'Control port init (write str to port)',
							type: 'tfield',
							id: 'atic',
							flt: { len: ['0', '70'] },
							value: dev.settings.atic //'AT^NDISDUP=1,1,"internet"\\r\\n',
						},
						{
							type: 'br',
							id: 'bre3'
						},
						{
							type: 'br',
							id: 'brf0'
						}
					]
				}
			}
		];
	} else {
		//if ras not present

		ras = {
			type: 'infobox',
			head: 'Warning',
			value: 'Modem interface not present<br>SMS and Call disabled'
		};
	}

	return inp.cfgobj.concat(ras);
}

module.exports = {
	a
};
