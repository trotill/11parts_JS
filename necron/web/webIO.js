//const { glob } = require('./be/main_global.js');
//const { ssend } = glob;

const c = require('../backCore.js');

class WebIO {
	glob = {};
	c = {};
	constructor({ glob }) {
		this.glob = glob;
		this.logger = c.getLogger();
		this.ssend = glob.ssend;
	}
	ioSocketConnectedEmit(socket_id, event) {
		if (this.glob.kAlive?.[socket_id]?.['socket']?.emit) {
			this.glob.kAlive[socket_id]['socket'].emit('event', event);
		} else this.logger.webui('Warn:Send to dead socket id', socket_id);
	}
	SendEventIOClient(event, socket_id) {
		if (socket_id) {
			//return SendEventIOClient(eventFromUI,ssid);
			if (socket_id.indexOf('elec') !== -1) this.SendEventMqBroad(event);

			if (this.glob.Server.WEBCliCount > 0) {
				this.logger.webui('Send ucast eventFromUI to Browsers', event, ' sid ', socket_id);
				this.ioSocketConnectedEmit(socket_id, event);
				// io.sockets.connected[socket_id].emit('eventFromUI', eventFromUI);
			}
		} else return this.SendEventIOBroad(event);
	}
	SendEventMqBroad(event) {
		if (this.glob.mqMode) {
			this.glob.websrv.MQTTsendCB({
				data: JSON.stringify(event),
				topic: this.glob.beioTopic
			});
		}
	}
	SendEventIOBroad(event) {
		const { glob } = this;
		const { io } = glob;
		if (event.d[event.d.action]) {
			if (event.d['from'] !== 'cnoda') c.send_to_cnoda(this.ssend, JSON.stringify(event));
			this.SendEventMqBroad(event);
			if (glob.Server.WEBCliCount !== 0) io.emit('event', event);
		} else this.logger.webui('Skip bcast eventFromUI', event);
	}
	SendForceReload(type) {
		this.SendEventIOBroad(c.GenResponseEventObj({ action: 'reload', reload: type }));
	}
}

module.exports = {
	WebIO
};
