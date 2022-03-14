/**
 * Created by i7 on 20.11.2019.
 */

const priv = require('../../../private.js');

function Build() {
	let sn = priv.GetPrivateValue('sys.sn.sn');
	if (!sn) sn = '00000000';
	return [
		{
			type: 'delim',
			id: 'ssdSsd_dm',
			name: 'SSDP config'
		},
		{
			type: 'switch',
			value: false,
			id: 'ssdEnable',
			name: 'Enable ssdp daemon'
		},
		{
			name: 'SSDP notify interval (30-900)',
			type: 'var',
			id: 'ssdNint',
			value: '300'
		},
		{
			name: 'Interface refresh interval (5-1800)',
			type: 'var',
			id: 'ssdIri',
			value: '600'
		},
		{
			name: 'TTL for multicast frames',
			type: 'var',
			id: 'ssdTtl',
			value: '2'
		},
		{
			name: 'Uni value for UUID calk',
			type: 'efield',
			id: 'ssdUv',
			value: ''
		},
		{
			name: 'Manufacture',
			type: 'var',
			id: 'ssdManuf',
			svalue: ['{"readfile":"distro","sep":"","value":"hwmanuf"}']
		},
		{
			name: 'Manufacture URL',
			type: 'efield',
			id: 'ssdManufUrl',
			value: ''
		},
		{
			name: 'Model',
			type: 'var',
			id: 'ssdModel',
			svalue: ['{"readfile":"distro","sep":"","value":"hwmodel"}']
		},
		{
			name: 'Device name',
			type: 'efield',
			id: 'ssdDevn',
			value: 'device',
			flt: { len: ['2', '63'], sym: ['ens'] }
		},
		{
			name: 'Model number',
			type: 'var',
			id: 'ssdModelNum',
			value: '',
			svalue: ['{"readfile":"distro","sep":"","value":"hwvers"}']
		},
		{
			name: 'Model URL',
			type: 'efield',
			id: 'ssdModURL',
			value: ''
		},
		{
			name: 'Serial number',
			type: 'var',
			id: 'ssdSN',
			value: sn
		}
	];
}

function SaveSettings(obj, vers) {
	console.log('SaveSettings obj', obj);
	console.log('VERS', vers);

	if (!obj['ssdUv'] || obj['ssdUv'].length === 0) {
		obj['ssdUv'] =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}
	return { stat: 'ok', result: obj };
}

module.exports = {
	Build,
	SaveSettings
};
