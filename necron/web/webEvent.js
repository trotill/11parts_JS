//const { glob } = require('./be/main_global.js');
//const { world_map } = glob;
const c = require('../backCore.js');
//const logger = c.getLogger();
const belib = require('./be/belib');
//const { SendServerInfo, SendBuzyState } = require('./webControl.js');
//const { SendEventIOClient, SendEventIOBroad } = require('./webIO.js');
//const { io_events, wait } = require('./webGlobal.js');

class WebEvent {
	constructor({ glob, webControlAdapter, webControlBase, webGlobal }) {
		const { world_map } = glob;
		//this.glob = glob;
		this.world_map = world_map;
		this.logger = c.getLogger();
		this.glob = glob;
		this.webControlAdapter = webControlAdapter;
		this.webControlBase = webControlBase;
		this.webGlobal = webGlobal;
		//this.glob.event = this.eventFromUI.bind(this);
		//Object.assign(this, glob, webControlAdapter, webControlBase, webGlobal);
		//	const { SendServerInfo, SendBuzyState } = webControlAdapter;
		//this.SendServerInfo = SendServerInfo;
		//this.SendBuzyState = SendBuzyState;
		//const { SendEventIOClient, SendEventIOBroad } = webControlBase;
		//this.SendEventIOClient = SendEventIOClient;
		//this.SendEventIOBroad = SendEventIOBroad;
		//const { io_events, wait } = webGlobal;
		//this.io_events = io_events;
		//this.wait = wait;
		this.kaIgnoreTime = 5;
		//glob.eventServiceEmitter = this.eventServiceEmitter;
	}

	async eventFromUI(data) {
		let socketIoId = data.sid;
		//console.log('Source data',data);
		// addAuthMetaToData(data,socketIoId);
		//console.log('Dest data',data);
		const { logger, glob, world_map } = this;

		//const { glob, logger, io_events, world_map, SendBuzyState } = this;

		if (!glob?.kAlive?.[socketIoId]) {
			console.log('undef glob.kAlive for', socketIoId, 'skip eventFromUI', data);
			console.log('glob', glob);
			return;
		}
		if (!this.glob.sendServerInfoStat) {
			this.webControlAdapter.SendServerInfo(socketIoId, 'connect');
			glob.sendServerInfoStat = true;
		}
		// console.log('glob.kAlive',glob.kAlive);
		//let group=glob.kAlive[socketIoId]['group'];
		// console.log('socketIoId',socketIoId,'glob.kAlive[socketIoId]',glob.kAlive[socketIoId],'group',glob.kAlive[socketIoId].group);
		let checkPageRegionGroup = (PageRegionName, group) => {
			for (let pRegion in world_map.world.regions) {
				if (pRegion === PageRegionName) {
					for (let grp in world_map.world.regions[pRegion].regmap) {
						if (group === grp) return true;
					}
				}
			}
			return false;
		};
		let rebuildPageSett = async (cache, data, reInit, PageRegionName, group) => {
			if (reInit) {
				if (PageRegionName === '' || PageRegionName === undefined || group === undefined) return;

				if (checkPageRegionGroup(PageRegionName, group)) {
					glob.mod.watcher.reCalcTotalHash();

					let pack = await c.GenResponseZipEventObj(
						{
							action: 'syncPageCache',
							syncPageCache: {
								pages: cache.pages,
								hashTmap: cache.hashTmap,
								pageMap: require('./be/buildNavi.js').Load_buildNavi(PageRegionName, group).result
							}
						},
						data.sid
					);
					this.webControlBase.SendEventIOClient(pack, socketIoId);
				}
			} else
				this.webControlBase.SendEventIOClient(
					c.GenResponseEventObj(
						{
							action: 'syncPageCache',
							syncPageCache: {
								pages: cache.pages,
								hashTmap: []
							}
						},
						data.sid
					),
					socketIoId
				);
		};

		if (data.d.action === 'eventObsolete') {
			//Для совместимости со старыми проектами, замена старого AJAX, отправляется из BuildJSON_SendAction
			let req = data.d[data.d.action];
			if (req.data['noda'] === 'Jnoda') {
				logger.webui('send to jnoda ', req);

				this.webGlobal.io_events.emit(
					'to_jnoda',
					c.GenResponseEventObj({
						action: 'execute',
						execute: req
					})
				);
			} else {
				this.logger.webui('run action ', req.action);
				switch (req.action) {
					case 'factory':
						console.log('factory req', req);
						belib.Factory_Set(this.glob.ssend, req.data.socket_id);
						break;
				}
			}
			return;
		}
		if (data.d.action === 'settings') {
			let req = data.d.settings;
			console.log('settings req', req);
			//req, sendtocnoda, world_map, svers, ctx
			let result = require(c.FW_PATH + '/web/be/settings.js').result({
				req: {
					settings: req.settArray,
					socket_id: socketIoId,
					action: req.settAct,
					__login: glob.kAlive[socketIoId].login,
					__group: glob.kAlive[socketIoId].group
				},
				sendtocnoda: this.glob.ssend,
				world_map: world_map.world,
				svers: '',
				ctx: { webGlobal: this.webGlobal }
			});

			logger.webui('/web/be/settings.js ret', result);
			console.log(c.FW_PATH + '/web/be/settings.js ret', result);
			if (belib.CheckSaveAck(result) === 'ok') {
				if (req.settAct === 'apply') {
					//from: 'jnoda', prio: 100, message: 'JNODA_INITED'
					this.webControlBase.SendBuzyState('JNODA_INITED', 100, 'jnoda');
				}
				// "",100,"websrv_cluster.on_message"
				if (req.settAct === 'apply_one') {
					this.webControlBase.SendBuzyState('APPLY_ONE', 1, 'settings_apply_one');
				}
			} else {
				console.log("data.d.action==='settings' ret", result);
			}
			glob.cache.hashT = data.d[data.d.action].hashT;
			// settingsResult(result,socketIoId);
		}
		//console.log('data',data,'glob.kAlive[data.sid]',glob.kAlive[data.sid]);
		if (
			(data.d.action === 'keepalive' || data.d.action === 'settings') &&
			glob.kAlive[data.sid].ignoreTime < data.d[data.d.action].ts
		) {
			glob.kAlive[data.sid].ignoreTime = 0; //Фильтр вброса пакетов
			let group = glob.kAlive[socketIoId]['group'];
			//console.log('Got keepalive from',socketIoId,'data',data);
			if (glob.kAlive[data.sid] !== undefined) glob.kAlive[data.sid].wdt = 1;
			let kdata = data.d[data.d.action];

			let region = kdata.PageRegionName;

			if (kdata.hashT !== glob.cache.hashT && kdata.hashT !== '') {
				console.log(
					'client',
					data.sid,
					'kdata.hashT',
					kdata.hashT,
					'glob.cache.hashT',
					glob.cache.hashT
				);
				console.log(
					'cli pageCnt',
					kdata.pageCnt,
					'srv pageCnt',
					glob.cache.pageCnt,
					'hashTmap',
					glob.cache.hashTmap
				);
				if (kdata.pageCnt !== glob.cache.pageCnt) {
					//кол. закешированных стр. на клиенте отличается от кол. на сервере, нужно полностью синхронизировать
					console.log('Send syncPageCache, sync all');
					glob.mod.watcher.correctCache();
					glob.mod.watcher.dumpCachesRd();
					//кол. закешированных стр. на клиенте отличается от кол. на сервере, нужно полностью синхронизировать
					glob.kAlive[data.sid].ignoreTime = data.d[data.d.action].ts + this.kaIgnoreTime; //в течении этого времени пакеты будут отбрасыватся, фильр вброса
					await rebuildPageSett(glob.cache, data, 1, region, group);
				} else {
					glob.kAlive[data.sid].ignoreTime = data.d[data.d.action].ts + this.kaIgnoreTime; //в течении этого времени пакеты будут отбрасыватся, фильр вброса
					this.webControlBase.SendEventIOClient(
						c.GenResponseEventObj({ action: 'reqAllHash', reqAllHash: {} }, data.sid),
						data.sid
					);
				}
				//SendEventIOClient(c.GenResponseEventObj({action: 'reqAllHash', reqHashes: {}}),data.sid);
				//console.log("Send reqAllHash");
			} else {
				console.log('client', data.sid, 'hash sync Ok!!!');
			}
		}

		if (data.d.action === 'respAllHash') {
			// console.log("Get respAllHash",data.d.respAllHash.hashMap);
			let group = glob.kAlive[socketIoId]['group'];
			let syncBGrp = [];
			let syncSGrp = [];
			let dCntr = 0;
			let repair = {
				pages: {}
			};
			let region = data.d.respAllHash.PageRegionName;
			for (let srvPage in glob.cache.pages) {
				if (data.d.respAllHash.hashMap[srvPage] === undefined) {
					console.log('Incorrect client content pages/sett, rebuild', 'SID', data.sid);
					await rebuildPageSett(glob.cache, data, 1, region, group);
					return;
				}
				let trg0 = 0;
				let trg1 = 0;

				if (glob.cache.pages[srvPage].hashB !== undefined) trg0 = 1;
				if (data.d.respAllHash.hashMap[srvPage].hashB !== undefined) trg1 = 1;

				if (trg0 === trg1) {
					if (data.d.respAllHash.hashMap[srvPage].hashB !== glob.cache.pages[srvPage].hashB) {
						syncBGrp.push(srvPage);
						repair.pages[srvPage] = {
							buildObj: glob.cache.pages[srvPage].buildObj,
							hashB: glob.cache.pages[srvPage].hashB
						};
						dCntr++;
						console.log(
							`Detect diff buildObj [${srvPage}] src ${glob.cache.pages[srvPage].hashB} dst ${data.d.respAllHash.hashMap[srvPage].hashB}`
						);
					}
				} else {
					console.log('Incorrect client content pages, rebuild');
					await rebuildPageSett(glob.cache, data, 1, region, group);
					return;
				}

				trg0 = 0;
				trg1 = 0;
				if (glob.cache.pages[srvPage].hashS !== undefined) trg0 = 1;
				if (data.d.respAllHash.hashMap[srvPage].hashS !== undefined) trg1 = 1;

				if (trg0 === trg1) {
					if (data.d.respAllHash.hashMap[srvPage].hashS !== glob.cache.pages[srvPage].hashS) {
						syncSGrp.push(srvPage);
						if (repair.pages[srvPage] === undefined) repair.pages[srvPage] = {};

						repair.pages[srvPage].setting = glob.cache.pages[srvPage].setting;
						repair.pages[srvPage].hashS = glob.cache.pages[srvPage].hashS;
						dCntr++;
						console.log(
							`Detect diff setting [${srvPage}] src ${glob.cache.pages[srvPage].hashS} dst ${data.d.respAllHash.hashMap[srvPage].hashS}`
						);
					}
				} else {
					console.log('Incorrect client content sett, rebuild');
					await rebuildPageSett(glob.cache, data, 1, region, group);
					return;
				}
			}

			if (dCntr !== 0) {
				console.log('repair', repair, 'SID', data.sid);
				await rebuildPageSett(repair, data, 0, region, group);
				console.log('syncBGrp', syncBGrp, 'SID', data.sid);
				console.log('syncSGrp', syncSGrp, 'SID', data.sid);
			} else {
				//Если хеши не отличаются, и кол. одинакого, значит нужно пересчитать контрольную сумму, в ней возможно ошибка
				console.log('hash not diff, recalc SID', data.sid);
				await rebuildPageSett(glob.cache, data, 1, region, group);
				//SendEventIOClient(c.GenResponseEventObj({action: 'reCalcTotalHash', reCalcTotalHash: {}},data.sid),data.sid);
				glob.mod.watcher.reCalcTotalHash();
			}
			//let srcObjCnt=;
		}

		if (data.d.action === 'check_ready') {
			if (!this.webGlobal.wait.pleaseWait)
				//&&(busy_cnt==ready_cnt))
				this.webControlBase.SendEventIOBroad(
					c.GenResponseEventObj({ action: 'ready', ready: { prio: 100 } })
				);

			//io_sockets_connected_emit(socket.id,{state:GV.PleaseWait});
			//io_events.emit('to_jnoda', c.GenResponseEventObj({action: "upd_evmap", upd_evmap: event_map}));
		}
		if (data.d.action === 'mqttevent') {
			glob.websrv.MQTTsendCB({
				data: data.d?.mqttevent?.msg,
				topic: data.d?.mqttevent?.src
			});
		}
	}
	//приращение в сек., для блокировки пакетов keepalive на время приращения

	eventServiceEmitter(data) {
		//console.log('eventServiceEmitter data',data);
		const { glob } = this;
		if (data.d === undefined) return;

		data.d.__login = glob.kAlive[data.sid].login;
		data.d.__group = glob.kAlive[data.sid].group;

		if (data.d.sub !== undefined && data.d.sub.length !== 0) {
			for (let n = 0; n < data.d.sub.length; n++) {
				if (data.d.sub[n] === 'cnoda') {
					c.send_to_cnoda(
						this.glob.ssend,
						c.ConvToCSrvFormat(c.JSON_PACK_TYPE_SEND_EVENT, data.d, data.sid)
					);
				}
				if (data.d.sub[n] === 'jnoda') {
					this.webGlobal.io_events.emit(
						'to_jnoda',
						c.GenResponseEventObj({
							action: 'execute',
							execute: data
						})
					);
				}
			}
		}
	}
}

module.exports = {
	WebEvent
};
