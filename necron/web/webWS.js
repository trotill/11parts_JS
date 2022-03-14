const c = require('../backCore.js');
//const { glob } = require('./be/main_global.js');
//const { world_map } = glob;
const SocketIOFileUpload = require('socketio-file-upload');
const fs = require('fs');
const cook = require('cookie');

//const au = require('./webAuth.js');
//const { saved_resp_event, event_map, clear_eventmap } = require('./webGlobal.js');
//const { SendBuzyState, SendReadyState, SendServerInfo } = require('./webControl.js');
//const { eventServiceEmitter, eventFromUI } = require('./webEvent.js');
//const { secret, io_events, wait } = require('./webGlobal.js');

class WebWS {
	constructor({ glob, webGlobal, webControlBase, webEvent, webAuth, webEventMap }) {
		//const { world_map } = glob;
		//this.world_map = world_map;
		this.glob = glob;
		this.logger = c.getLogger();

		this.webGlobal = webGlobal;
		this.webEventMap = webEventMap;
		this.webControlBase = webControlBase;
		//const { saved_resp_event, event_map, clear_eventmap } = webGlobal;
		//this.saved_resp_event = saved_resp_event;
		//this.event_map = event_map;
		//this.clear_eventmap = clear_eventmap;
		//const { SendBuzyState, SendReadyState, SendServerInfo } = webControlBase;
		//this.SendBuzyState = SendBuzyState;
		//this.SendReadyState = SendReadyState;
		//this.SendServerInfo = SendServerInfo;
		this.webEvent = webEvent;
		//const { eventServiceEmitter, eventFromUI } = webEvent;
		//this.eventServiceEmitter = eventServiceEmitter;
		//this.eventFromUI = eventFromUI;
		//const { secret, io_events, wait } = webGlobal;
		//this.secret = secret;
		//this.io_events = io_events;
		//this.wait = wait;
		this.webAuth = webAuth;
	}
	checkFromCook(socket, cookieParser) {
		if (socket.request.headers.cookie === undefined) socket.request.headers.cookie = '';
		const { webAuth } = this;
		let cookie = cook.parse(socket.request.headers.cookie);
		let token = cookieParser.signedCookie(cookie.token, this.webGlobal.secret);
		let rnd = cookieParser.signedCookie(cookie.rnd, this.webGlobal.secret);
		return webAuth.CheckFromCook({ token: token, rnd: rnd });
	}
	sendEventNeedAuth(socket) {
		let connectTime;
		const { glob } = this;
		if (glob.kAlive[socket.id] !== undefined) connectTime = glob.kAlive[socket.id]['connectTime'];
		else connectTime = Date.now();
		socket.emit(
			'event',
			c.GenResponseEventObj({
				action: 'needAuth',
				needAuth: {
					connectTime: connectTime,
					maxAge: this.glob.world_map.world.auth_opts.maxAge,
					disconnectTime: Date.now()
				}
			})
		);
	}
	checkSessionDuration(socket) {
		const { glob } = this;
		if (glob.world_map.world.auth_opts.maxAge === 0) return c.NO_ERROR;

		if (glob.kAlive[socket.id] === undefined) {
			console.log('broken socket', socket.id);
			return c.ERROR;
		}
		let srcDate = Date.now();

		if (srcDate < glob.kAlive[socket.id]['connectTime']) {
			console.log('Error check cook incorrect DATE/TIME');
			return c.ERROR;
		}

		if (
			srcDate - glob.kAlive[socket.id]['connectTime'] >
			this.glob.world_map.world.auth_opts.maxAge
		) {
			return c.ERROR;
		} else {
			return c.NO_ERROR;
		}
	}
	regConnectionIo(io, cookieParser) {
		const { webAuth, glob } = this;
		glob.io = io;
		io.on('connection', (socket) => {
			let authSt = this.checkFromCook(socket, cookieParser);
			console.log('ShowAccounts');
			webAuth.ShowAccounts();
			console.log('ShowAccounts');
			if (authSt.result !== c.NO_ERROR) {
				socket.disconnect();
				console.log(
					'Force disconnect not authorized client id ',
					socket.id,
					' total ',
					io.engine.clientsCount
				);
				this.logger.webui(
					'Force disconnect not authorized client id ',
					socket.id,
					' total ',
					io.engine.clientsCount
				);
				return;
			}

			this.logger.webui('Connection client id ', socket.id, ' total ', io.engine.clientsCount);
			console.log('Connection client id ', socket.id, ' total ', io.engine.clientsCount);
			console.log('use stransport', socket.conn.transport.name);

			glob.Server.User[socket.id] = {};
			glob.Server.User[socket.id]['address'] = socket.handshake.address;
			glob.Server.User[socket.id]['time'] = socket.handshake.time;
			glob.kAlive[socket.id] = {};
			glob.kAlive[socket.id]['wdt'] = 1;
			glob.kAlive[socket.id]['socket'] = socket;
			glob.kAlive[socket.id]['group'] = authSt.group;
			glob.kAlive[socket.id]['login'] = authSt.login;
			glob.kAlive[socket.id]['ignoreTime'] = 0;
			glob.kAlive[socket.id]['connectTime'] = Date.now();
			if (authSt.group === 'electron') {
				console.log('Force disconnect electron group');
				socket.disconnect();
			}

			glob.Server.WEBCliCount = io.engine.clientsCount;
			glob.Server.UserCount = Object.keys(this.glob.kAlive).length; //io.engine.clientsCount;

			if (this.webGlobal.wait.pleaseWait)
				this.webControlBase.SendBuzyState('', 100, 'webui_io.on_connection');
			else this.webControlBase.SendReadyState('', 100, 'webui_io.on_connection');

			this.logger.webui('Connect glob.Server.UserCount ', glob.Server.UserCount);
			this.webControlBase.SendServerInfo(socket.id, 'connect');
			socket.on('eventsub', (data) => {
				if (this.checkSessionDuration(socket) === c.ERROR) {
					this.sendEventNeedAuth(socket);
					return;
				}

				this.webEvent.eventServiceEmitter(data);
			});
			socket.on('event', async (data) => {
				if (this.checkSessionDuration(socket) === c.ERROR) {
					this.sendEventNeedAuth(socket);
					return;
				}
				await this.webEvent.eventFromUI(data);
			});

			socket.on('clear_eventmap', () => {
				if (this.checkSessionDuration(socket) === c.ERROR) {
					this.sendEventNeedAuth(socket);
					return;
				}
				this.webEventMap.clear_eventmap(socket.id);
			});

			socket.on('add_eventmap', (data) => {
				if (this.checkSessionDuration(socket) === c.ERROR) {
					this.sendEventNeedAuth(socket);
					return;
				}

				this.webEventMap.upd_evmap(data, socket.id, data);
				let reqsname = data.d.req + data.d.iface;
				this.logger.webui('add_eventmap saved_resp_event ', this.webGlobal.saved_resp_event);
				for (let ssid in this.webGlobal.saved_resp_event) {
					this.logger.webui('add_eventmap Send ', this.webGlobal.saved_resp_event[ssid][reqsname]);
					if (this.webGlobal.saved_resp_event[ssid][reqsname] !== undefined) {
						break;
					}
				}
			});
			socket.on('disconnect', () => {
				this.doDisconnect(socket.id, io);
			});

			const uploader = new SocketIOFileUpload();
			uploader.dir = c.DOWNLOAD_PATH;
			uploader.listen(socket);

			uploader.uploadValidator = (event, callback) => {
				let path = c.DOWNLOAD_PATH + '/' + event.file.name;
				if (fs.existsSync(path)) {
					fs.unlinkSync(path);
				}
				callback(true);
			};
			// Do something when a file is saved:
			uploader.on('saved', (event) => {
				console.log('Saved file', event.file.name);
			});

			// Error handler:
			uploader.on('error', (event) => {
				console.log('Error from uploader', event);
			});
		});
	}
	doDisconnect(sid, io) {
		this.logger.webui('Disconnect client id ', sid);
		//glob.Server.UserCount=io.engine.clientsCount;
		this.glob.Server.WEBCliCount = io.engine.clientsCount;
		delete this.glob.Server.User[sid];
		delete this.glob.kAlive[sid];
		this.glob.Server.UserCount = Object.keys(this.glob.kAlive).length;
		if (this.glob.Server.UserCount !== 0) {
			this.logger.webui('Disonnect glob.Server.UserCount ', this.glob.Server.UserCount);
		} else this.logger.webui('Error, incorrect calc users (count<0)');

		this.webControlBase.SendServerInfo(sid, 'disconnect');

		delete this.webGlobal.event_map[sid];
		delete this.webGlobal.saved_resp_event[sid];
		this.webGlobal.io_events.emit(
			'to_jnoda',
			c.GenResponseEventObj({ action: 'upd_evmap', upd_evmap: this.webGlobal.event_map })
		);
	}
}

module.exports = {
	WebWS
};
