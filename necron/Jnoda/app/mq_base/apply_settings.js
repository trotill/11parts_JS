/**
 * Created by Ilya on 28.02.2018.
 */

const m = require('./mosquitto.js');
const c = require('../../../backCore.js');
const jf = require('./../../Jnoda_func.js');

function cnoda_event() {}

function cnoda(obj) {
	if (obj.action === 'event') {
		cnoda_event(obj.event);
	}
}
function apply(obj, ssend) {
	if (obj.d['type'] === 'settings') {
		var extra = jf.ExtractSettingType(obj.d.page);
		switch (extra.type) {
			case 'mosquitto':
				{
					/*
                        mosquitto должен стартовать один раз и не перезагружаться иначе сносит башню клиентам paho-mqtt,
                        они начинают потреблять 100% процессорного времени.
                        Запуск клинета должен происходить только после запуска сервера mosquitto, поэтому клиенты
                        должны стартовать только после события mosquitto_ready
                     */
					m.setup(obj.d, ssend);
					setTimeout(function () {
						process.send(c.GenResponseEventObj({ action: 'mosquitto_ready', mosquitto_ready: {} }));
					}, 2000);
				}
				break;
		}
	}
}

function async_plug() {}

function async_unplug() {}

function info() {}

function SetToDefault() {}

module.exports = {
	apply,
	info,
	cnoda,
	async_plug,
	async_unplug,
	SetToDefault
};
