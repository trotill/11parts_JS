/**
 * Created by i7 on 22.11.2017.
 */
const c = require('../../backCore.js');
const logger = c.getLogger();
const fs = require('fs');
const sh = require('../../shared.js');
const priv = require('../../private.js');
const ro_pages = priv.GetPrivateValue('sys.page.ro');

function GetPageType(page_name, world_map, groupName) {
	let map;
	let items;
	for (const region in world_map.regions) {
		if (world_map.regions[region].regmap[groupName]) {
			map = JSON.parse(
				fs.readFileSync(c.GenPageRegsInCacheMAP_Name(`${region}.${groupName}`), 'utf8')
			);
			for (let sec in map) {
				items = map[sec].items;
				for (let page in items) {
					if (page !== page_name) continue;
					if (items[page].type) {
						console.log('SS found pagetype for ', page_name, items[page].type);
						return items[page].type;
					} else return 'user';
				}
			}
		}
	}

	return 'user';
}

function GetJsonResult(objset) {
	return {
		respType: 'save_ack',
		result: {
			ack: '',
			page: objset.page
		}
	};
}

function SettingProcessing({ json_result, obj, objset, sendtocnoda, svers, pagetype, ctx }) {
	//console.log('SettingProcessing svers',svers);
	const socket_id = obj.socket_id;

	const devconf = c.BUILDOBJ_PATH + '/' + objset.page + '.js';
	logger.debug('SettingProcessing devconf', devconf, ' svers', svers);
	json_result.result.ack = 'ok';

	if (
		fs.existsSync(devconf) &&
		(require(devconf).SaveSettings || require(devconf).SaveSettingsV2)
	) {
		logger.debug('RUN', devconf, 'SaveSettings');
		console.log('SS "RUN"', devconf, 'SaveSettings');

		let retval = require(devconf).SaveSettingsV2
			? require(devconf).SaveSettingsV2({ obj, svers, socket_id, ctx })
			: require(devconf).SaveSettings(objset, svers, socket_id);

		retval.result['__mapType'] = pagetype; //добавить тип пакета, для того что бы понимать как обрабатывать
		retval.result['__login'] = obj.__login;
		retval.result['__group'] = obj.__group;
		if (retval.stat === 'ok') {
			//если все хорошо, отправить конфиг из retval.result
			c.send_to_cnoda(
				sendtocnoda,
				c.ConvToCSrvFormat(c.JSON_PACK_TYPE_SET_SYSTEM, retval.result, socket_id)
			);
			logger.debug('Setting ok' + objset.page + ' saved');
		} else {
			//если обработчик выдал ошибку, то поменять статус ok, на сообщение
			json_result.result.ack = retval.stat;
			c.send_to_cnoda(
				sendtocnoda,
				c.ConvToCSrvFormat(
					c.JSON_PACK_TYPE_SET_SYSTEM,
					{
						page: objset.page,
						type: 'settings',
						__errMsg: retval.stat
					},
					socket_id
				)
			);
		}
	} else {
		//если нет обработчика, то просто отправить конфиг
		objset['__login'] = obj.__login;
		objset['__group'] = obj.__group;
		objset['__mapType'] = pagetype; //добавить тип пакета, для того что бы понимать как обрабатывать
		console.log('SS "send_to_cnoda"', objset);
		c.send_to_cnoda(
			sendtocnoda,
			c.ConvToCSrvFormat(c.JSON_PACK_TYPE_SET_SYSTEM, objset, socket_id)
		);
		logger.debug('Setting ' + objset.page + ' saved');
	}
}

function SaveSettings({ obj, objset, sendtocnoda, world_map, svers, ctx }) {
	const ssend = sendtocnoda;

	const page = sh.GetSettingName(objset.page);
	console.log('SaveSettings settings.' + page + '.set for page', objset.page);
	objset.page = page;

	const json_result = GetJsonResult(objset);
	console.log('SS json_result', json_result, 'objset', objset);
	if (typeof objset.page == 'undefined') {
		objset.page = 'undef';
	}

	const pagetype = GetPageType(objset.page, world_map, obj.__group);
	console.log('SS pagetype', pagetype);
	logger.debug(`Save settings.${page}.set  obj`, obj);

	if (ro_pages?.find((roPage) => objset.page === roPage)) {
		json_result.result.ack = 'page.ro';
		return json_result;
	}

	console.log('SS json_result', json_result);

	SettingProcessing({ json_result, obj, objset, sendtocnoda, svers, pagetype, ctx });

	if (obj.action === 'apply_one' && json_result.result.ack === 'ok') {
		let cmd = { type: 'restart_setting', arg: [objset.page] }; //settings name
		c.send_to_cnoda(ssend, c.ConvToCSrvFormat(c.JSON_PACK_TYPE_WD_RESTART, cmd));
	}

	logger.debug('json_result ', json_result);
	return json_result;
}

function result({ req, sendtocnoda, world_map, svers, ctx }) {
	logger.debug('Settings svers', svers, 'req', req);
	console.log('Settings svers', svers, 'req', req);
	let result;
	let resStat = 1;
	if (Array.isArray(req.settings) === false) {
		result = SaveSettings({
			obj: req,
			objset: req.settings,
			sendtocnoda,
			world_map,
			svers,
			ctx
		});
		if (result.result.ack !== 'ok') resStat = 0;
	} else {
		result = [];

		if (!svers) {
			let svn = '';
			req.settings.forEach((reqItem) => {
				svn = `${svn}|${reqItem.page}`;
			});
			svers = svn;
		}
		req.settings.forEach((reqItem) => {
			result.push(SaveSettings({ obj: req, objset: reqItem, sendtocnoda, world_map, svers, ctx }));
			//if (reqItem.ack !== 'ok') resStat = 0;
		});
		resStat = !result.find(({ result }) => result.ack !== 'ok');
	}

	if (req.action === 'apply' && resStat) {
		c.send_to_cnoda(
			sendtocnoda,
			c.ConvToCSrvFormat(c.JSON_PACK_TYPE_WD_RESTART, { type: 'server_reboot', arg: ['allsrv'] })
		);
	}
	return result;
}

module.exports = {
	result
};
