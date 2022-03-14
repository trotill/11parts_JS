/**
 * Created by i7 on 13.12.2019.
 */

import { webevents, global, getGlobalCallback } from './___global.js';
import { AddWaitOverlay, DeleteWaitOverlay, runui } from './_util.js';
import { t, nu, u } from './_core';
import {
	JSON_PACK_TYPE_SET_SYSTEM,
	JSON_PACK_TYPE_SEND_EVENT,
	JSON_PACK_TYPE_REQ_EVENT,
	PROTO_VERSION
} from '../../web/fe/constFe';
import { eventCallbackGet, eventIoHandlerCore, systemCallbackGet } from './eventIoHandlerCore';
import { io } from 'socket.io-client';
import pako from 'pako';

global.exampleformat.SendAction = {
	ConstSettingProvider: {},
	ArgProvider: {},
	IdProvider: {},
	SettingProvider: {},
	DnkProvider: {},
	ChangedMetaVarProvider: {}
};

global.exampleformat.SendAction.ChangedMetaVarProvider = {
	name: 'save',
	type: 'button_a',
	id: 'send_changed',
	event: {
		click: [
			{
				type: 'action',
				param: {
					action: 'dnk_tx_topic',
					subscribers: [],
					params_provider: 'ChangedMetaVarProvider'
				}
			}
		]
	}
};
global.exampleformat.SendAction.ConstSettingProvider = {
	type: 'button_a',
	value: false,
	id: 'get_sga_db',
	name: 'Download sqlite DB',
	event: {
		click: [
			{
				type: 'action',
				param: {
					action: 'get_slog',
					subscribers: ['jnoda'],
					params_provider: 'ConstSettingProvider'
				}
			}
		]
	},
	ConstSetting: {
		slog_file: 'SGA_sqlite.db.gz',
		get_slog_cfg: '/www/pages/necron/Cnoda/sqlite.slogger.json'
	}
};

global.exampleformat.SendAction.SettingProvider = {
	type: 'button_a',
	value: false,
	id: 'get_sga_db',
	name: 'Download sqlite DB',
	event: {
		click: [
			{
				type: 'action',
				param: {
					action: 'get_slog',
					subscribers: ['jnoda'],
					params_provider: 'SettingsProvider'
				}
			}
		]
	}
};

global.exampleformat.SendAction.DnkProvider = {
	type: 'button_a',
	value: false,
	id: 'power_off',
	name: t('Shut Down'),
	event: {
		click: [
			{
				type: 'action',
				param: {
					action: 'globDNKtxTopic',
					params_provider: 'DnkProvider',
					data: {
						y: {
							sga: {
								command: {
									sga: 'stop'
								}
							}
						}
					}
				}
			}
		]
	}
};

let EventListeners = global.EventListeners;

export function emitEvent(event, args) {
	let evt = new window.createCustomEvent(event, args);
	webevents.dispatchEvent(evt);
}
export function emitDnkEvent(event, val) {
	emitEvent(event, { val: val });
}
export function createEventToEventListeners(id, callb) {
	addEventToEventListeners(id, id, callb);
}

export function addEventToEventListeners(idx, id, callb) {
	//idx - может быть много одинаковых
	//id - уникален
	//два разных компонента могут быть подписаны на одно и тоже idx
	//console.log('webevents.addEventListener ',idx);
	removeEventFromEventListeners(id);
	EventListeners[id] = {
		idx: idx,
		listener: (event) => {
			callb(event.detail);
		}
	};

	webevents.addEventListener(idx, EventListeners[id].listener, id);
}

export function removeEventFromEventListeners(id) {
	if (nu(EventListeners[id])) return;
	webevents.removeEventListener(EventListeners[id].idx, EventListeners[id].listener, id);
	delete EventListeners[id];
}

export function cleanupEventWrapper(id) {
	removeEventFromEventListeners(id);
}
export function AddEventWrapper(json, callb, id) {
	let idx = json.iface ? json.req + json.iface : json.req;

	if (nu(json.sub) || json.sub.length === 0) {
		//если не задан массив подписчиков sub или он пустой, то сразу настроить событие на сервере
		if (u(json.value)) {
			console.log('eventmap add serverEvent', json);
			global.serverEvent.push(json);
			SendEventMap(json);
		} else {
			console.log('eventmap skip serverEvent', json);
			//если массив подписчиков не задан и нет value, то событие однозначно не для сервера, это фиктивное событие
		}
	} else {
		if (json.sub.length === 1 && json.sub[0] === 'webui') {
			console.log('eventmap skip serverEvent', json);
			//если массив подписчиков sub содержит только webui, то не нужно настраивать событие на сервере, т.к. событие может генериться только в WEB
		} else {
			console.log('eventmap add serverEvent', json);
			global.serverEvent.push(json);
			for (let rx in json.sub) {
				switch (json.sub[rx]) {
					case 'jnoda':
						SendEventMap(json);
				}
			}
		}
	}

	addEventToEventListeners(idx, id, callb);
}

export function DelEventWrapper(id) {
	//debugger;
	try {
		console.log('webevents.removeEventListener ', EventListeners[id]);
		removeEventFromEventListeners(id);
		delete EventListeners[id];
	} catch (e) {
		// eslint-disable-next-line no-debugger
		debugger;
	}
}

export function SockIO_EventReInit() {
	console.log('eventmap Event reinit');
	for (let n in global.serverEvent) {
		if (global.serverEvent[n]) SendEventMap(global.serverEvent[n]);
	}
}

//CustomEvent wrapper for ie11
window.createCustomEvent = function (name, data) {
	let newEvent;
	if ('CustomEvent' in window && typeof window.CustomEvent === 'function') {
		//console.log('true');
		newEvent = new CustomEvent(name, { bubbles: true, detail: data });
	} else {
		// console.log('false');
		newEvent = document.createEvent('CustomEvent');
		newEvent.initCustomEvent(name, true, true, data);
	}

	return newEvent;
};

global.exampleformat.eventController = {
	click: [
		{
			type: 'action',
			param: {
				action: 'relay_on',
				subscribers: ['cnoda'],
				params_provider: 'SettingsProvider'
			}
		}
	]
};

export function eventControllerLink(tagid, arr, ev, params) {
	let element = document.getElementById(tagid);
	if (!element) {
		element = document.getElementById('div' + tagid);
		// eslint-disable-next-line no-debugger
		debugger;
		return undefined;
	}

	let tid = tagid;
	console.log('eventFromUI param init', params);

	let listener = (evt) => {
		// console.log(tid);
		if (params.type === 'action' || params.type === 'userEvent') {
			let act_param = params.param;
			act_param.id = tid;
			let action = act_param.action;
			let subscribers = act_param.subscribers;
			if (nu(subscribers)) subscribers = [];
			let data = {};
			if (u(act_param.params_provider) && act_param.params_provider.length !== 0) {
				let params_provider = act_param.params_provider;
				data = getGlobalCallback(params_provider)({
					action_id: action,
					arr: arr,
					param: act_param,
					contentClass: arr.contentClass,
					evt: evt
				});
				if (!data)
					//запрет на отправку эвента, например фильтры не прошли
					return;
			}
			if (subscribers.length !== 0) {
				SendActionSocketIO({
					action: action,
					sub: subscribers,
					data: data
				});
			}

			if (data instanceof Object) {
				data.contentClass = arr.contentClass;
				data.evt = evt ?? {};
			}
			//console.log('eventControllerLink',action);

			if (params.type === 'action') {
				emitEvent(action, data);
				//console.warn(`action send ${action} ${JSON.stringify(data)}`);
			}
			if (params.type === 'userEvent') {
				sendUserWebEvent(action, data);
				//console.warn(`userEvent send ${action} ${JSON.stringify(data)}`);
			}
		}
	};
	element.addEventListener(ev, listener);
	return () => {
		element.removeEventListener(ev, listener);
	};
}

export function eventController(arr) {
	let result = [];
	if (u(arr.event)) {
		let tagid = arr.id;
		let isArr = Array.isArray(arr.value);
		for (let ev in arr.event) {
			if (ev === 'user')
				//Специальный эвент, обрабатывается только в построении компонентов
				continue;

			if (Array.isArray(arr.event[ev])) {
				//Если элемент имеет массив событий, или одиночный элемент без потомков
				arr.event[ev].forEach((evIdx) => {
					if (u(evIdx.id)) {
						tagid = evIdx.id;
					}

					if (isArr) {
						//Если элемент имеет массив значений и имеет массив событий, а события вешаются на потомков, например элементы в dnk panel
						arr.value.forEach((valIdx) => {
							if (valIdx) result.push(eventControllerLink(tagid + n, arr, ev, evIdx));
						});
					} else {
						//Если элемент не имеет массива значений, но имеет массив событий
						if (arr.value) result.push(eventControllerLink(tagid, arr, ev, evIdx));
					}
				});
			} else {
				//Если элемент имеет массив значений и событие - одно и не в массиве, в этом случае событие вешается на родителя, например кнопка на базе dnk panel
				if (arr.event[ev].id) {
					tagid = arr.event[ev].id;
				}

				if (arr.value) result.push(eventControllerLink(tagid, arr, ev, arr.event[ev]));
			}
		}
	}
	return result;
}

export function SendActionSocketIO(params) {
	//Для редиректа в конкретный сервер, заполни sub поле, sub:["cnoda","jnoda","websrv","webui"]
	let action = params.action;
	let sub = [];
	if (u(params.sub) && params.sub.length !== 0 && Array.isArray(params.sub)) sub = params.sub;

	let arg = {
		action: params.action,
		sub: sub //массив подписчков из множества ["cnoda","jnoda","websrv","webui"]
	};
	arg[action] = params.data;

	if (arg.sub.length === 0) SendSocketIO(arg);
	else SendSocketIO_ex(arg);
	return true;
}
function SendSocketIO(obj) {
	let event = { t: [JSON_PACK_TYPE_SEND_EVENT, PROTO_VERSION], d: obj, sid: global.clientId };

	if (global.SRV_OBJ.client === 'electron') {
		eglobal.publish(
			JSON.stringify(
				eglobal.c.GenActionPack('event', event, global.SRV_OBJ.client, global.clientId)
			)
		);
	} else {
		if (global.socket_connect) {
			global.socket.emit('event', event);
		} else {
			global.socket.connect();
		}
	}
}
function SendSocketIO_ex(obj) {
	let event = { t: [JSON_PACK_TYPE_SEND_EVENT, PROTO_VERSION], d: obj, sid: global.clientId };

	if (global.SRV_OBJ.client === 'electron') {
		eglobal.publish(
			JSON.stringify(
				eglobal.c.GenActionPack('eventsub', event, global.SRV_OBJ.client, global.clientId)
			)
		);
	} else {
		if (global.socket_connect) {
			global.socket.emit('eventsub', event);
		} else {
			global.socket.connect();
		}
	}
}
function SendEventMap(obj) {
	const eventmap = { t: [JSON_PACK_TYPE_REQ_EVENT, PROTO_VERSION], d: obj };
	console.log('Send eventmap ', eventmap);
	if (global.socket_connect) global.socket.emit('add_eventmap', eventmap);

	if (global.SRV_OBJ.client === 'electron') {
		eglobal.publish(
			JSON.stringify(
				eglobal.c.GenActionPack('add_eventmap', eventmap, global.SRV_OBJ.client, global.clientId)
			)
		);
	}
}

export function ClearEventMap() {
	console.log('Clear eventmap ');
	if (global.socket_connect) global.socket.emit('clear_eventmap', {});

	if (global.SRV_OBJ.client === 'electron') {
		eglobal.publish(
			JSON.stringify(
				eglobal.c.GenActionPack('clear_eventmap', {}, global.SRV_OBJ.client, global.clientId)
			)
		);
	}

	global.serverEvent = [];
}

function initIOunzipData(data) {
	let result;
	if (data.comp) {
		if (data.comp === 'base64gzip') {
			let eb64 = Uint8Array.from(atob(data.d), (c) => c.charCodeAt(0));

			let inflate = pako.inflate(eb64);
			let msgString = new TextDecoder('utf-8').decode(inflate); //String.fromCharCode.apply(null, new Uint16Array(inflate))
			let msg = JSON.parse(msgString);
			result = {
				t: data.t,
				d: msg,
				dbg: {
					encSz: data.d.length,
					unpSz: msgString.length
				},
				sid: data.sid
			};
		}
	} else {
		result = data;
	}
	return result;
}

function initIO() {
	subscribeUserReceiver();
	subscribeWizardReceiver();
	if (global.SRV_OBJ.client === 'web') {
		InitSocketIO();
	}
	if (global.SRV_OBJ.client === 'electron') {
		InitMqIO();
	}
}

export function sendUserWebEvent(event, data) {
	let evName = event + 'IntEv';
	global.userEmitter.emitEvent('webEvent', [
		{
			t: [JSON_PACK_TYPE_SEND_EVENT, 1],
			d: {
				action: evName,
				[evName]: data
			}
		}
	]);
}

export function sendUserWebSystem(event, data) {
	let evName = event + 'IntEv';
	global.userEmitter.emitEvent('webEvent', [
		{
			t: [JSON_PACK_TYPE_SET_SYSTEM, 1],
			d: {
				action: evName,
				[evName]: data
			}
		}
	]);
}

function webEventReceiver(eventRaw) {
	let event = initIOunzipData(eventRaw);
	if (u(event.sid)) {
		if (event.sid !== global.clientId) {
			console.log('Skip pack, another sid', event.sid, '!==', global.clientId);
			return;
		}
	} else if (u(event.d.client) && event.d.client.length !== 0) {
		if (event.d.client !== global.clientId) {
			console.log('Skip pack, another webevent client', event.d.client, '!==', global.clientId);
			return;
		}
	}
	//во время обновления блокируются все пакеты кромы системных global.doUpdate===false!!!
	if (event.t[0] === JSON_PACK_TYPE_SEND_EVENT && global.doUpdate === false) {
		if (typeof event.d != 'undefined' && typeof event.d.action != 'undefined') {
			if (eventIoHandlerCore(event) !== 'ok') {
				if (global.callback.EventIO_HandlerExtend(event) !== 'ok') {
					let result = eventCallbackGet(event); //global.callback.EventIO_Handler(eventFromUI);
					if (result !== 'ok') {
						runui('flymsg', `Undef. event ${event.d.action}`, '', () => {});
					}
				}
			}
		}
	}

	if (event.t[0] === JSON_PACK_TYPE_SET_SYSTEM) {
		if (event.d && event.d.action) {
			if (global.callback.SystemIO_HandlerExtend(event) !== 'ok') systemCallbackGet(event);
		}
	}
}
function subscribeUserReceiver() {
	global.userEmitter.addListener('webEvent', (data) => {
		webEventReceiver(data);
	});
}

function subscribeWizardReceiver() {
	global.wizardEmitter.addListener('wizevent', () => {});
}

function InitMqIO() {
	eglobal.emitter.on('beio', (eventRaw) => {
		console.log('MqIO msg', eventRaw);
		webEventReceiver(eventRaw);
	});
}

function InitSocketIO() {
	if (global.SRV_OBJ.client !== 'web') return;

	global.socket = io.connect(location.origin, {
		reconnection: true,
		autoConnect: true,
		//  timeout:10,
		pingTimeout: 1000,
		pingInterval: 10000,
		//  reconnectionDelay: 5,
		//  reconnectionDelayMax : 10,
		reconnectionAttempts: 999
	}); //,{timeout:1000, rememberTransport: false,secure: true, transports: ['websocket', 'polling', 'polling-xhr','polling-jsonp'] });

	global.socket_connect = false;
	global.socket.on('connect', () => {
		console.log('Socket IO connect ', global.socket);
		global.socket_connect = true;
		global.clientId = global.socket.id;
		global.api.storagesEng.createSSID_Cookie(global.clientId);
		DeleteWaitOverlay();
		// alert('connect');
	});
	global.socket.on('reconnect', function () {
		console.log('reconnect fired!');
	});
	global.socket.on('event', function (eventRaw) {
		console.log('Socket IO eventFromUI', eventRaw);
		webEventReceiver(eventRaw);
	});
	global.socket.on('message', function (data) {
		console.log('Socket IO message', data);
	});

	global.socket.on('connect_error', () => {
		setTimeout(() => {
			global.socket.connect();
		}, 1000);
	});

	global.socket.on('disconnect', () => {
		console.log('Socket IO disconnect');
		global.socket_connect = false;
		if (global.SRV_OBJ.AuthState === 1) AddWaitOverlay(t('Please_wait_conn_lost'), 180000);

		global.socket.io.reconnect();
		//!!!! Смотри preinit.js keepalive, там повторный инит!!!!
	});
}

export { initIO, EventListeners };
export default initIO;
