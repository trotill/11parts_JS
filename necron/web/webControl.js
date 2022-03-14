//const { glob } = require('./be/main_global.js');

const c = require('../backCore.js');

//const webGlobal = require('./webGlobal.js');
//const { saved_resp_event, wait } = webGlobal;
//const { clear_eventmap } = require('./webEventMap.js');

const { WebIO } = require('./webIO.js');

class WebControlBase extends WebIO {
	constructor({ glob, webGlobal, webAuth }) {
		super({ glob });
		//({ saved_resp_event: this.saved_resp_event, wait: this.wait } = webGlobal);
		//({ clear_eventmap: this.clear_eventmap } = webEventMap);
		this.webGlobal = webGlobal;
		this.ssend = glob.ssend;
		this.glob = glob;
		this.logger = c.getLogger();
		this.au = webAuth;
	}
	SendServerInfo(sid, action) {
		this.SendEventIOBroad(c.GenResponseEventObj({ action: 'server', server: this.glob.Server }));
		c.send_to_cnoda(
			this.ssend,
			c.ConvToCSrvFormat(
				c.JSON_PACK_TYPE_SET_SYSTEM,
				{ type: 'server', data: this.glob.Server, action: action },
				sid
			)
		);
	}
	WaitStat(stat) {
		this.webGlobal.wait.pleaseWait = stat;
		this.logger.webui('Set Wait stat ', this.webGlobal.wait.pleaseWait);
	}
	SendResponseIOClient(event, ssid) {
		if (ssid.length === 0) {
			this.SendEventIOBroad(event, '');
			return;
		}
		if (ssid.indexOf('elec') !== -1) this.SendEventMqBroad(event);

		if (this.glob.Server.WEBCliCount === 0 && ssid !== 'cnoda') return;

		const reqsname = event.d.webevent.req + event.d.webevent.iface;

		const event_str = JSON.stringify(event);

		if (!this.webGlobal.saved_resp_event[ssid]) {
			this.webGlobal.saved_resp_event[ssid] = {};
		}

		if (!this.webGlobal.saved_resp_event[ssid][reqsname]) {
			this.webGlobal.saved_resp_event[ssid][reqsname] = event_str;
			this.ioSocketConnectedEmit(ssid, event);
			if (ssid === 'cnoda') {
				c.send_to_cnoda(this.ssend, JSON.stringify(event));
			}
		} else {
			if (ssid === 'cnoda' || this.webGlobal.saved_resp_event[ssid][reqsname] !== event_str) {
				this.webGlobal.saved_resp_event[ssid][reqsname] = event_str;
				this.ioSocketConnectedEmit(ssid, event);
				if (ssid === 'cnoda') {
					c.send_to_cnoda(this.ssend, JSON.stringify(event));
				}
			} else this.logger.webui('skip eventFromUI ', reqsname, ' for ', ssid);
		}
	}
	SendReadyState(message, prio, from) {
		message = message ?? '';

		this.logger.webui('SendReadyState, glob.busy_list', this.glob.busy_list);
		console.log('SendReadyState, glob.busy_list', this.glob.busy_list);
		if (this.glob.busy_list[from] !== undefined) {
			this.glob.busy_list[from] = undefined;
			this.logger.webui('glob.busy_list, got ready state, remove', from);
			console.log('glob.busy_list, got ready state, remove', from);
		}
		for (let fr in this.glob.busy_list) {
			if (this.glob.busy_list[fr] !== undefined) {
				this.logger.webui('glob.busy_list not empty ', this.glob.busy_list);
				console.log('glob.busy_list not empty ', this.glob.busy_list);
				return;
			}
		}
		console.log('glob.busy_list is empty, send ready state');
		this.logger.webui('glob.busy_list is empty, send ready state');
		this.SendEventIOBroad(
			c.GenResponseEventObj({
				action: 'ready',
				ready: { message: message, prio: prio, from: from }
			})
		);
	}
	SendBuzyState(message, prio, from) {
		message = message ?? '';

		this.SendEventIOBroad(
			c.GenResponseEventObj({
				action: 'busy',
				busy: { message: message, prio: prio, from: from }
			})
		);
		this.glob.busy_list[from] = {
			from: from,
			prio: prio,
			message: message
		};
		this.logger.webui('SendBuzyState, glob.busy_list', this.glob.busy_list);
		if (this.glob.busy_timeout_tmr) clearTimeout(this.glob.busy_timeout_tmr);
		this.glob.busy_timeout_tmr = setTimeout(() => {
			for (let fr in this.glob.busy_list) {
				if (this.glob.busy_list[fr]) {
					this.logger.webui('\n\n\nglob.busy_list from', fr, 'is frozen, force clear\n\n\n');
					console.log('\n\n\nglob.busy_list from', fr, 'is frozen, force clear\n\n\n');
					this.glob.busy_list[fr] = undefined;
				}
			}
		}, this.glob.busy_timeout);
	}
}

class WebControlAdapter {
	constructor({ webControlBase, webGlobal, webEventMap }) {
		this.wc = webControlBase;
		this.webEventMap = webEventMap;
		this.io_events = webGlobal.io_events;
	}
	add_eventmap(data, id) {
		let reqsname = data.d.req + data.d.iface;
		this.webEventMap.upd_evmap(data, id, reqsname);
	}
	clear_eventmap(id) {
		this.webEventMap.clear_eventmap(id);
	}
	UpdateAuth(accounts) {
		this.wc.logger.webui('Update auth ', accounts);
		this.wc.au.SyncAccounts(accounts);
		this.wc.au.ShowAccounts();
	}

	SendServerInfo() {
		this.wc.SendServerInfo('0', 'none');
	}
	SendEventIO_Broadcast(event) {
		this.wc.SendEventIOBroad(event);
	}

	SendEventIO_Client(event, sid) {
		this.wc.SendEventIOClient(event, sid);
	}
	SendResponseIO_Client(event, client) {
		this.wc.SendResponseIOClient(event, client);
	}
	GetIOEventContext() {
		return this.io_events;
	}
	SetReadyState(message, prio, from) {
		this.wc.WaitStat(false);
		this.wc.SendReadyState(message, prio, from);
	}

	SetBuzyState(message, prio, from) {
		this.wc.WaitStat(true);
		this.wc.SendBuzyState(message, prio, from);
	}
	RemoveAuthData(data) {
		this.wc.logger.webui('RemoveAuthData ', data);
		this.wc.au.RemoveAuthData(data);
	}
}

module.exports = {
	WebControlAdapter,
	WebControlBase
};
