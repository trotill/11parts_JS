const c = require('../backCore.js');
//const { glob } = require('./be/main_global.js');
//const logger = c.getLogger();
//const { SendEventIOClient } = require('./webIO.js');
//const { saved_resp_event, event_map } = require('./webGlobal.js');
//const { io_events } = require('./webGlobal.js');

class WebEventMap {
	constructor({ glob, webGlobal, webControlBase }) {
		//const { saved_resp_event, event_map, io_events } = webGlobal;
		//this.saved_resp_event = saved_resp_event;
		//this.event_map = event_map;
		this.glob = glob;
		//this.io_events = io_events;
		//this.SendEventIOClient = webControlBase.SendEventIOClient;
		this.logger = c.getLogger();
		this.webGlobal = webGlobal;
		this.webControlBase = webControlBase;
		//glob.upd_evmap = this.upd_evmap;
		//glob.clear_eventmap = this.clear_eventmap;
	}
	upd_evmap(data, id) {
		//const { event_map, logger, io_events, SendEventIOClient } = this;
		const { saved_resp_event, event_map } = this.webGlobal;
		let reqsname = data.d.req + data.d.iface;
		if (event_map[id] === undefined) {
			event_map[id] = {};
			this.webGlobal.saved_resp_event[id] = {};
		}

		event_map[id][reqsname] = data.d;

		this.logger.webui('eventFromUI map ', event_map);
		this.webGlobal.io_events.emit(
			'to_jnoda',
			c.GenResponseEventObj({ action: 'upd_evmap', upd_evmap: event_map })
		);

		for (const usedId in saved_resp_event) {
			if (Object.keys(saved_resp_event[usedId]).length !== 0) {
				if (saved_resp_event[usedId][reqsname] !== undefined) {
					saved_resp_event[id] = saved_resp_event[usedId];
					break;
				}
			}
		}

		if (saved_resp_event?.[id]?.[reqsname]) {
			//отправка последних сохраненных данных
			console.log('MARKER');
			let event = JSON.parse(saved_resp_event[id][reqsname]);
			event.d.client = id;
			console.log('send first eventFromUI', event, 'to SID', id);
			this.webControlBase.SendEventIOClient(event, id);
		}
	}
	clear_eventmap(id) {
		//const { event_map, io_events } = this;
		const { event_map } = this.webGlobal;
		if (event_map[id]) {
			delete event_map[id];
			// if (typeof saved_resp_event[socket.id]!='undefined')
			//   delete saved_resp_event[socket.id];
			this.webGlobal.io_events.emit(
				'to_jnoda',
				c.GenResponseEventObj({ action: 'upd_evmap', upd_evmap: event_map })
			);
		}
	}
}

module.exports = {
	WebEventMap
};
