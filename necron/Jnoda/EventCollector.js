/**
 * Created by i7 on 05.12.2017.
 */

const c = require('../backCore');
const logger = c.getLogger();

const jn_events = null;

const EventRequester = {};
const ClientsList = {};

function StopUnusedRequester(req_table) {
	let trig = 0;

	for (const evr_idx in EventRequester) {
		trig = 0;
		for (const req_idx in req_table) {
			if (req_idx === evr_idx) {
				trig = 1;
				break;
			}
		}
		if (trig === 0) {
			if (EventRequester[evr_idx].stop) {
				EventRequester[evr_idx].stop(EventRequester[evr_idx].context);
				delete EventRequester[evr_idx];
				//Clear clients array
				while (ClientsList[evr_idx].length > 0) {
					ClientsList[evr_idx].pop();
				}
			}
		}
	}
}

function SendEventDeviceToWeb(event) {
	const act = event.d.action;
	const ev_id = event.d[act].req + event.d[act].iface;
	for (const client in ClientsList[ev_id]) {
		event.d['client'] = ClientsList[ev_id][client];
		c.ProcessSend(event);
	}
}

function SendMessageToWeb(message) {
	const MsgObj = c.GenResponseEventObj({ action: 'message', message: message });
	c.ProcessSend(MsgObj);
}

function SendEventToWeb(data, evname) {
	process.emit('As' + evname, { evname: evname, data: data });
}

function StartEventRequesters(req_table, info_callb) {
	StopUnusedRequester(req_table);

	for (const req_idx in req_table) {
		if (EventRequester[req_idx] === undefined) {
			EventRequester[req_idx] = {};
			EventRequester[req_idx]['data'] = req_table[req_idx];

			if (req_table[req_idx].req_t !== 0) {
				logger.debug('Add timer eventFromUI ', req_idx);
				console.log('Add timer eventFromUI ', req_idx);
				EventRequester[req_idx]['context'] = setInterval(
					(req) => {
						info_callb.tmr_sender(req);
					},
					req_table[req_idx].req_t,
					req_table[req_idx]
				);
				EventRequester[req_idx]['stop'] = (context) => {
					logger.debug('Stop requester ', req_idx);
					clearInterval(context);
				};
				info_callb.tmr_sender(req_table[req_idx]);
			} else {
				logger.debug('Add dynamic eventFromUI ', req_idx);
				console.log('Add dynamic eventFromUI ', req_idx);
				if (EventRequester[req_idx]['context']) continue;

				EventRequester[req_idx]['listener'] = (obj) => {
					const evname = obj.evname;
					const evreq = obj.data;
					if (EventRequester[evname] === undefined) {
						console.log('Skip async eventFromUI', evname);
						return;
					}

					const Requester = EventRequester[evname];
					const evfrm = {
						action: 'webevent',
						webevent: {
							iface: Requester['data'].iface,
							req: Requester['data'].req,
							result: evreq
						}
					};

					const res = c.GenResponseEventObj(evfrm);
					info_callb.async_sender(res);
				};

				EventRequester[req_idx]['context'] = process.on(
					'As' + EventRequester[req_idx]['data'].req,
					EventRequester[req_idx].listener
				);

				info_callb.async_plug({
					req: EventRequester[req_idx]['data'].req,
					args: EventRequester[req_idx]['data'].args
				});

				EventRequester[req_idx]['stop'] = () => {
					logger.debug('Stop eventFromUI worker ', req_idx);
					console.log('Stop eventFromUI worker ', req_idx);
					info_callb.async_unplug({
						req: EventRequester[req_idx]['data'].req,
						args: EventRequester[req_idx]['data'].args
					});
					try {
						EventRequester[req_idx]['context'].removeListener(
							'As' + EventRequester[req_idx]['data'].req,
							EventRequester[req_idx].listener
						);
					} catch (e) {
						logger.debug("Catch undef EventRequester[req_idx]['context'].removeListener ");
					}
					delete EventRequester[req_idx]['context'];
				};
			}
		}
	}
}

function PackEventReq(evlist) {
	let result = {};

	for (let client in evlist) {
		for (let req in evlist[client]) {
			if (!result[req]) {
				result[req] = evlist[client][req];
				ClientsList[req] = [client];
			} else ClientsList[req].push(client);
		}
	}
	return result;
}

module.exports = {
	PackEventReq,
	StartEventRequesters,
	SendEventDeviceToWeb,
	SendMessageToWeb, //Send any async info message for WEB
	SendEventToWeb, //Send any async eventFromUI for UI components
	GetEventEmit() {
		return jn_events;
	}
};
