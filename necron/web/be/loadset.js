/**
 * Created by Ilya on 15.02.2019.
 */

const c = require('../../backCore.js');
const logger = c.getLogger();

function result(req) {
	console.log('loadset', req);
	logger.debug('Load settings ' + req.setting_name);

	let cfgName = req.setting_name;

	if (glob.cache.devId[cfgName]) {
		cfgName += '.' + glob.cache.devId[cfgName];
		console.log(
			'Load devId from cache',
			glob.cache.devId[req.setting_name],
			'change',
			req.setting_name,
			'to',
			cfgName
		);
	}

	if (glob.cache.pages[cfgName]) {
		//если данные есть в кеше, то они выдаются
		console.log('Load setting from cache', cfgName);
		if (glob.cache.pages[cfgName].setting) {
			//если есть setting
			return {
				setting: JSON.parse(glob.cache.pages[cfgName].setting),
				respType: 'loadSet',
				setting_name: cfgName
			};
		} else {
			//если нет setting
			return { setting: {}, respType: 'loadSet', setting_name: cfgName };
		}
	}

	//если нет ни setting, ни buildObj, часто присутствует в wisard, например secure или passwd
	return { setting: {}, respType: 'loadSet', setting_name: cfgName };
}

module.exports = {
	result
};
