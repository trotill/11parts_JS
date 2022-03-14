/**
 * Created by i7 on 17.12.2019.
 */
const c = require('./backCore');
let fs = require('fs');
let ex = require('./exec');
//let wl = require('./web/webLogic');
let eapi = require('./web/be/electron_api');
//const { glob } = require('./web/be/main_global.js');

let client;
let mqtt;
let febeTopic = 'febe';
let befeTopic = 'befe';
let qos = 2;

class ConfWebSrv {
	constructor({ glob, webLogic, webEventMap, webEvent }) {
		this.webLogic = webLogic;
		this.webEventMap = webEventMap;
		this.webEvent = webEvent;
		this.glob = glob;
	}
	ConfigureWebsrv(websrv_cfg) {
		if (websrv_cfg['webSio_tunnel']) {
			if (websrv_cfg['webSio_tunnel'] === 'mqtt' && websrv_cfg['webSio_tunmqtt'] === 'true') {
				console.log('Configure MQTT tunnel');

				const url = websrv_cfg.webMQTT_URL;
				const port = parseInt(websrv_cfg.webMQTT_Port);
				const topic = [];
				for (let item in websrv_cfg.webMQTT_Topic) {
					topic.push(websrv_cfg.webMQTT_Topic[item][0]);
				}

				const controller = websrv_cfg.webControllerType;
				const filt = ['{"x":{"alm"', '{"x":{"evt"'];
				let format = 'raw';
				if (websrv_cfg['webMQTT_Format']) {
					format = websrv_cfg['webMQTT_Format'];
				}
				this.init_mqtt_client({
					port,
					host: url,
					keepalive: 10,
					topic,
					filt,
					webcontroller: controller,
					format
				});
			}
		}
		if (websrv_cfg['webTimeHCtoSYS']) {
			if (websrv_cfg['webTimeHCtoSYS'] === 'true') {
				this.SyncTimeHCtoSYS(websrv_cfg);
			}
		}
	}

	init_mqtt_client(params) {
		mqtt = require('mqtt');
		const { glob } = this;
		client = mqtt.connect({
			port: params.port,
			host: params.host,
			keepalive: params.keepalive
		}); //'mqtt://'+params.host);
		console.log('init_mqtt_client params', params);
		client.on('connect', function () {
			params.topic.forEach(function (item) {
				client.subscribe(item, { qos: qos }, function (err) {
					if (err) console.log('Error subscribe to', item);
					else console.log('MQTT success subscribe to topic', item);
				});
			});
		});
		client.on('message', async (topic, message) => {
			// message is Buffer
			let tmsg = message.toString();
			let msg;

			if (params.format === 'raw') msg = tmsg;
			else msg = JSON.parse(tmsg);
			if (msg === null || tmsg === null) return;
			if (topic === febeTopic) {
				let packData = JSON.parse(tmsg);
				if (packData?.d?.action) {
					switch (packData.d.action) {
						case 'fe_init':
							{
								let fe_init = JSON.stringify(
									c.GenActionPack('fe_init', electronGenFe_init(glob), 'be', global.clientId)
								);
								client.publish(befeTopic, fe_init, { qos: qos });
								glob.mqMode = true;
								glob.kAlive[packData.sid] = {};
								glob.kAlive[packData.sid]['wdt'] = 1;
								glob.kAlive[packData.sid]['group'] = 'electron';
								glob.kAlive[packData.sid]['ignoreTime'] = 0;
								glob.Server.UserCount = Object.keys(glob.kAlive).length;
							}
							break;
						case 'download':
							{
								let arrFname = packData.d.download.data.arrFname;
								if (arrFname === null || arrFname === undefined) break;
								console.log('MQTT download files', arrFname);
								eapi.downloadFiles(
									arrFname,
									function (data) {
										glob.websrv.MQTTsendCB({
											data: data,
											topic: glob.beioTopic
										});
									},
									() => {
										console.log('Download success');
									},
									packData.sid
								);
							}
							break;
						case 'fileChunk': //upload file
							eapi.uploadChunkedFile(
								packData,
								c.DOWNLOAD_PATH,
								false,
								function (err) {
									let event = c.GenActionPack('message', err, 'be', global.clientId);
									glob.websrv.MQTTsendCB({
										data: JSON.stringify(event),
										topic: glob.beioTopic
									});
								},
								'electron'
							);
							break;
						case 'getServerData':
							{
								let auth = {
									result: c.NO_ERROR,
									group: 'electron'
								};
								let ret = this.webLogic.run({
									req: packData.d[packData.d.action].data,
									auth,
									ssend: glob.ssend
								});
								let pubd = JSON.stringify(
									c.GenActionPack('serverData', ret, 'be', global.clientId)
								);
								client.publish(befeTopic, pubd, { qos: qos });
							}
							break;
						case 'clear_eventmap':
							this.webEventMap.clear_eventmap(packData.sid);
							break;
						case 'add_eventmap':
							this.webEventMap.upd_evmap(packData.d.add_eventmap, packData.sid);
							break;
						case 'eventsub':
							this.webEvent.eventServiceEmitter(packData.d.eventsub);
							break;
						case 'event':
							await this.webEvent.eventFromUI(packData.d.event);
							break;
					}
				}
				return;
			}
			let ignore = false;
			if (params.filt || params.filt.length === 0)
				glob.web.SendEventIO_Broadcast(
					c.GenResponseEventObj({
						action: 'webevent',
						webevent: {
							req: params.webcontroller,
							result: {
								msg: msg,
								src: topic
							}
						}
					})
				);
			else {
				params.filt.forEach(function (item) {
					let i;
					for (i = 0; i < item.length; i++) {
						if (msg[i] !== item[i]) break;
					}
					if (i === item.length) ignore = true;
				});

				if (!ignore) {
					console.log('send', tmsg.substring(0, 50));
					glob.web.SendEventIO_Broadcast(
						c.GenResponseEventObj({
							action: 'webevent',
							webevent: {
								req: params.webcontroller,
								result: {
									msg: msg,
									src: topic
								}
							}
						})
					);
				} else console.log('ignore', tmsg.substring(0, 50));
			}
		});
	}
	//webTimeHCtoSYS
	SyncTimeHCtoSYS(params) {
		let ltfile = c.GSETTINGS_STOR + '/localtime';
		let time = JSON.parse(c.GetSetting('settings.ntp'));
		let zoneinfopath = '/usr/share/zoneinfo/';
		if (params.webTimeZoneinfoPath) {
			zoneinfopath = params.webTimeZoneinfoPath;
		}

		if (fs.existsSync(ltfile) === false) {
			let tzone;
			if (!time?.d?.tzone) {
				time['d'] = { tzone: 'UTC' };
			}

			tzone = zoneinfopath + time.d.tzone;
			ex.ExecNoOutSync('ln -s ' + tzone + ' ' + ltfile);
		}
		ex.ExecNoOutSync('hwclock --hctosys --utc');
	}
}

function MQTTsend(arg) {
	let data = arg.data;
	let topic = arg.topic;
	if (client) client.publish(topic, data, { qos: qos });
}

function electronGenFe_init(glob) {
	const { world_map, reduced_world } = glob;
	let region = 'none';
	for (let reg in world_map.world.regions) {
		if (world_map.world.regions[reg].screens.indexOf('electron') !== -1) {
			region = reg;
			break;
		}
	}
	console.log('glob version', glob.version);
	return require(c.FW_PATH + '/web/fe/index.js').fe_init(
		{
			PageRegionName: region,
			PageName: world_map.world.regions[region].name,
			auth: 1,
			world: world_map.world,
			reduced_world,
			group: 'electron',
			login: 'electron',
			basepath: c.CACHE_PATH_ELJ,
			client: 'electron',
			engpath: c.FW_PATH
		},
		glob
	);
}

global.JSON.minify = function (json) {
	let tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
		in_string = false,
		in_multiline_comment = false,
		in_singleline_comment = false,
		tmp,
		tmp2,
		new_str = [],
		ns = 0,
		from = 0,
		lc,
		rc;

	tokenizer.lastIndex = 0;

	while ((tmp = tokenizer.exec(json))) {
		lc = RegExp.leftContext;
		rc = RegExp.rightContext;
		if (!in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.substring(from);
			if (!in_string) {
				tmp2 = tmp2.replace(/(\n|\r|\s)*/g, '');
			}
			new_str[ns++] = tmp2;
		}
		from = tokenizer.lastIndex;

		if (tmp[0] === '"' && !in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.match(/(\\)*$/);
			if (!in_string || !tmp2 || tmp2[0].length % 2 === 0) {
				// start of string with ", or unescaped " character found to end string
				in_string = !in_string;
			}
			from--; // include " character in next catch
			rc = json.substring(from);
		} else if (tmp[0] === '/*' && !in_string && !in_multiline_comment && !in_singleline_comment) {
			in_multiline_comment = true;
		} else if (tmp[0] === '*/' && !in_string && in_multiline_comment && !in_singleline_comment) {
			in_multiline_comment = false;
		} else if (tmp[0] === '//' && !in_string && !in_multiline_comment && !in_singleline_comment) {
			in_singleline_comment = true;
		} else if (
			(tmp[0] === '\n' || tmp[0] === '\r') &&
			!in_string &&
			!in_multiline_comment &&
			in_singleline_comment
		) {
			in_singleline_comment = false;
		} else if (!in_multiline_comment && !in_singleline_comment && !/\n|\r|\s/.test(tmp[0])) {
			new_str[ns++] = tmp[0];
		}
	}
	new_str[ns++] = rc;
	return new_str.join('');
};

function ParseCnodaCfg() {
	if (fs.existsSync(c.CNODA_CFG_PATH)) {
		let cnoda_obj = JSON.parse(JSON.minify(fs.readFileSync(c.CNODA_CFG_PATH, 'utf8')));
		console.log('Cnoda cfg', cnoda_obj);
		return cnoda_obj;
	} else return {};
}

function ParseWebsrvCfg() {
	let websrv_str = c.GetSetting('settings.websrv').toString();
	let websrv_cfg = {};
	if (websrv_str.length > 3) {
		websrv_cfg = JSON.parse(websrv_str).d;
	}
	return { cfg: websrv_cfg };
}

function Fill_glob(glob) {
	glob.websrv = ParseWebsrvCfg();
	glob.cnoda_cfg = ParseCnodaCfg();
	glob.version = '';
	if (glob.cnoda_cfg?.version) glob.version = glob.cnoda_cfg.version;

	if (glob.websrv.cfg?.version) glob.version = glob.websrv.cfg.version;
}
module.exports = {
	ParseWebsrvCfg,
	ParseCnodaCfg,
	Fill_glob,
	ConfWebSrv,
	MQTTsendCB: MQTTsend
};
