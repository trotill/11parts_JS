const EventEmitter = require('events');

class WebGlobal {
	constructor() {
		this.saved_resp_event = {};
		this.event_map = {};
		this.secret = 'dhihfsdbr';
		this.io_events = new EventEmitter();

		this.wait = {
			pleaseWait: false
		};
	}
}

module.exports = {
	WebGlobal
};
