const cluster = require('cluster');
const c = require('../../backCore');
const logger = c.getLogger();
let { glob } = require('./main_global.js');
const mbo = require('./main_buildObj.js');

let worker = '';

function TryStopJnoda() {
	worker.send({
		t: [c.JSON_PACK_TYPE_TO_JNODA, c.PROTO_VERS],
		d: {
			action: 'shutdown',
			shutdown: {}
		}
	});
}

function ReStart_JNoda() {
	logger.debug('ReStart jnoda');
	glob.web.SetBuzyState('', 100, 'websrv_ReStart_JNoda');
	if (glob.cluster_stop === 1) {
		let param = { exec: c.SRVIOT_JS_PATH };
		let jnodaDbgArg = '';
		//process.argv.forEach((item) => {
		if (glob.websrv.cfg.webJnodaEnableInspect === 'true') {
			jnodaDbgArg = '--inspect=0.0.0.0:9230';
			logger.log('Run with JNODA debug', jnodaDbgArg);
		}
		//});
		if (jnodaDbgArg.length > 0) {
			param['execArgv'] = [];
			param['execArgv'].push(jnodaDbgArg);
		}

		cluster.setupMaster(param);

		worker = cluster.fork();
		logger.debug('Fork cluster pid ', worker.process.pid);
		glob.cluster_stop = 0;

		worker.on('error', (err) => {
			logger.debug('worker err', err);
			ReStart_JNoda();
		});
		cluster.on('error', (err) => {
			logger.debug('cluster err', err);
			ReStart_JNoda();
		});
		cluster.on('exit', () => {
			glob.cluster_stop = 1;
		});
	} else {
		TryStopJnoda();
		if (glob.DoExit_Var === false) {
			setTimeout(() => {
				ReStart_JNoda();
			}, 1000);
		}
	}
}
function SendToJnoda(data) {
	if (glob.cluster_ready) {
		worker.send(data);
		logger.debug('To jnoda ', data);
	} else {
		logger.debug('Skip data to jnoda ', data);
		logger.log('jnoda not ready, skip data');
	}
}

cluster.on('message', function (worker, message) {
	arguments.length === 2 && (message = worker); //если message не передан, то аргумента будет 2 а не 3
	if (message.t[0] === c.JSON_PACK_TYPE_SEND_EVENT && message.d.action) {
		switch (message.d.action) {
			case 'init_process':
				glob.cluster_ready = 1;
				break;
			case 'busy':
				if (message.d.busy.message !== undefined)
					glob.web.SetBuzyState(message.d.busy.message, 100, 'websrv_cluster.on_message');
				else glob.web.SetBuzyState('', 100, 'websrv_cluster.on_message');
				glob.jnoda_is_ready = false;
				break;

			case 'ready':
				{
					let prio = message.d.ready.prio;
					let msg = message.d.ready.message;
					let from = message.d.ready.from;
					logger.log(
						'\n\n\n\n\n\n!!!!!!!!READY!!!!!!!! from',
						from,
						'message',
						msg,
						'prio',
						prio,
						'\n\n\n\n\n\n'
					);
					mbo.RebuildOnrdyPages();
					mbo.PageMAP_ToUnconfigured();
					if (msg !== undefined && msg.length > 0) {
						glob.web.SetReadyState(msg, prio, from);
					} else {
						glob.web.SetReadyState('', 10, 'websrv_cluster.on_message');
						glob.web.SetReadyState('', 100, 'websrv_CMD_server_reboot');
						glob.web.SetReadyState('', 100, 'websrv_ReStart_JNoda');
						glob.web.SetReadyState('', 100, 'webui_io.on_connection');
					}

					glob.jnoda_is_ready = true;
				}
				break;
			case 'webevent':
				{
					glob.web.SendResponseIO_Client(message, message.d.client);
				}
				break;
			case 'message':
				{
					glob.web.SendEventIO_Client(message, message.sid);
				}
				break;
			case 'download':
				{
					logger.log('!!!!!!!!download', message, 'sid', message.sid, '!!!!!!!!');
					glob.web.SendEventIO_Client(message, message.sid);
				}
				break;
			default: {
				logger.log('Send default message', message);
				glob.web.SendEventIO_Client(message, message.sid);
			}
		}
	}
});

module.exports = {
	TryStopJnoda,
	ReStart_JNoda,
	SendToJnoda
};
