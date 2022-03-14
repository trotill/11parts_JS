const c = require('../../backCore');
const logger = c.getLogger();
const { glob } = require('./main_global.js');
const fs = require('fs');
const mbo = require('./main_buildObj.js');
const me = require('./main_evdev.js');
const { SendToJnoda } = require('./main_cluster.js');
const {
	CMD_server_reboot,
	CMD_restart_setting,
	CreateDeviceBuildObj,
	RestartUdev
} = require('./main_services.js');
const { RebuildMAP_ForDevices } = require('./main_buildObj.js');

const spawn = require('child_process').spawn;

function JSON_PACK_TYPE_TO_WEB_SRV_hdlr(json_obj) {
	logger.debug('c.JSON_PACK_TYPE_TO_WEB_SRV', json_obj.d);
	switch (json_obj.d.action) {
		case 'authclear':
			glob.web.RemoveAuthData(json_obj.d['authclear']);
			break;
		case 'auth':
			glob.web.UpdateAuth(json_obj.d['auth']);
			break;
		case 'cnodaready':
			glob.web.SendServerInfo();
			break;
		case 'upd_evmap':
			glob.web.add_eventmap(json_obj.d.upd_evmap, json_obj.id);
			break;
		case 'clear_eventmap':
			glob.web.clear_eventmap(json_obj.id);
			break;
	}
}

function on_message(message, ssend) {
	//UDP сокет
	const json_obj = JSON.parse(message);

	logger.debug('Got data [' + message + ']');
	logger.debug('Input JSON: ', json_obj);
	if (!json_obj.t || !json_obj.t[0]) {
		logger.debug('Got incorrect data ' + message);
		return;
	}

	logger.debug('Apply cmd: ', json_obj.t[0]);
	switch (json_obj.t[0]) {
		case c.JSON_PACK_TYPE_TO_WEB_SRV:
			JSON_PACK_TYPE_TO_WEB_SRV_hdlr(json_obj);
			break;
		case c.JSON_PACK_TYPE_TO_UI:
			if (!json_obj.d.sid) {
				glob.web.SendEventIO_Broadcast(json_obj.d);
				logger.debug('To UI broadcast', json_obj.d);
			} else {
				glob.web.SendEventIO_Client(json_obj.d, json_obj.d.sid);
				logger.debug('To client ', json_obj.d.sid, ' UI ', json_obj.d);
			}
			break;
		case c.JSON_PACK_TYPE_TO_JNODA:
			SendToJnoda(json_obj.d);
			break;
		case c.JSON_PACK_TYPE_TO_CNODA:
			c.send_to_cnoda(ssend, JSON.stringify(json_obj.d));
			break;
		case c.JSON_PACK_TYPE_WD_RESTART:
			if (json_obj.d.type === 'server_reboot') CMD_server_reboot(json_obj.d.arg);
			else if (json_obj.d.type === 'restart_setting') CMD_restart_setting(json_obj.d.arg);

			break;
		case c.JSON_PACK_TYPE_SEND_EVENT:
			{
				let resp = me.UpdateDevList(json_obj, glob.BuildDevices, glob.world_map);

				c.send_to_cnoda(ssend, c.ConvToCSrvFormat(c.JSON_PACK_TYPE_SEND_EVENT, resp, ''));
				if (resp[resp.action] === undefined) break;

				if (resp.action !== 'none') {
					if (resp[resp.action] === undefined) {
						logger.debug('-----OOOPs --- Error resp[resp.action]==undefined!!!');
						break;
					}
					let interface_type = resp[resp.action].type;
					let objIdx = resp[resp.action].idx;

					//BuildDevices[interface_type] удалится если при удалении устройства, поэтому принудительно
					//перестраиваем карту
					logger.debug('resp.action', resp.action);
					if (resp.action === 'remove') {
						RebuildMAP_ForDevices(glob.BuildDevices, glob.DevicesList);
					}

					if (glob.BuildDevices[interface_type] && resp[resp.action]) {
						if (resp.action === 'add') {
							logger.debug('add', resp[resp.action].id);
							if (!glob.DevicesList[objIdx]) break;
							me.CreateDeviceBuilobjID(
								glob.DevicesList[objIdx].id,
								glob.BuildDevices[interface_type].pname + glob.DevicesList[objIdx].order_num,
								glob.BuildDevices[interface_type]
							);
							CreateDeviceBuildObj(objIdx);
							mbo.AddToMAP_OneDevice(
								glob.BuildDevices[glob.DevicesList[objIdx].type],
								glob.DevicesList[objIdx]
							);
						}

						if (
							resp[resp.action].class === 'net' ||
							(resp[resp.action].class === 'dev' &&
								(resp[resp.action].type === 'wlan' ||
									resp[resp.action].type === 'gsm' ||
									resp[resp.action].type === 'eth'))
						) {
							glob.web.SendEventIO_Broadcast(c.GenResponseEventObj(resp));

							let nest = me.NetEventSendToJNODA(
								resp,
								glob.BuildDevices[interface_type].pname,
								glob.BuildDevices[interface_type]
							);

							if (nest !== undefined) {
								logger.debug('!!!SendToJnoda nest', nest);
								SendToJnoda(nest);

								mbo.RebuildOnrdyPages();
								mbo.PageMAP_ToUnconfigured();
							} else {
								logger.debug(
									'!!!!!!!!!!!!!!!!!!!!!!!nest',
									nest,
									'interface_type',
									interface_type,
									'pname',
									glob.BuildDevices[interface_type].pname
								);
								mbo.PageMAP_ToUnconfigured();
								break;
							}
						} else {
							glob.web.SendEventIO_Broadcast(c.GenResponseEventObj(resp));
							mbo.RebuildOnrdyPages();
							mbo.PageMAP_ToUnconfigured();
						}
					}
					logger.debug('sort Sorted DevicesList', glob.DevicesList);
				}
			}
			break;
		default:
			logger.debug('Recv undev msg');
	}
}

async function message_file_collector() {
	let evtFile = c.CACHE_PATH + '/exevents';
	let parseEvt = (data) => {
		let res = data.toString().split('\n');
		if (res.length < 2) return;
		res.forEach((resItem) => {
			logger.debug('event', resItem);
			resItem && on_message(resItem);
		});
	};

	await new Promise((resolve) =>
		fs.readFile(evtFile, (err, data) => {
			if (!err) {
				parseEvt(data);
				resolve();
			}
		})
	);

	await new Promise((resolve) => fs.writeFile(evtFile, '', () => resolve()));
	RestartUdev();
	let exEvt = spawn('tail', ['-n0', '-f', evtFile]);
	exEvt.stdout.on('data', function (data) {
		parseEvt(data);
	});
}

module.exports = {
	message_file_collector,
	on_message
};
