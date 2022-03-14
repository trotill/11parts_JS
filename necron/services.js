/**
 * Created by i7 on 08.12.2019.
 */
const spawn = require('child_process').spawn;
const c = require('./backCore.js');
const logger = c.getLogger();

let runarr = {};

function GenServiceName(srv, args) {
	const srvname = srv.replace(/\s/g, '');
	const argrx = args.replace(/[\s-/''""()@^&*!~]/g, '');
	return {
		srvname: srvname,
		service_name: srvname + '.' + argrx
	};
}

function Service(srv, args, action, svcarg) {
	logger.log('Service srv', srv, 'args', args, 'action', action);
	if (arguments.length < 3) {
		logger.log('Incorrect service args');
		return;
	}
	if (args == null) args = '';

	const gsn = GenServiceName(srv, args);
	const srvname = gsn.srvname;
	const service_name = gsn.service_name;

	//search service
	if (runarr[service_name] && runarr[service_name].state !== 'exit') {
		//Service registered
		logger.log('runarr[srvname].args ', runarr[service_name].args, ' args ', args);

		try {
			runarr[service_name].pid.stdin.write(action + '\n');
		} catch (e) {
			logger.log(srvname + ' is dead ');
			logger.log(srvname + ' is dead ');
			runarr[service_name].pid.kill();
			action = 'exit';
		}

		runarr[service_name].state = action;
		logger.log(srvname + ' is ' + action + 'ed');
		return service_name;
	}

	logger.log('runarr[service_name]', runarr[service_name], 'service_name', service_name);
	if (!runarr[service_name] || runarr[service_name].pid === 0) {
		const n = {
			args: args,
			name: srvname,
			pid: {},
			state: 'start'
		};
		runarr[service_name] = n;
		logger.log('exec runsv');

		let stop_time = 20;
		if (svcarg?.stop_time) {
			stop_time = svcarg['stop_time'];
		}
		let marg = {
			prg: srv,
			args: args,
			stop_time: stop_time
		};
		if (svcarg?.log) {
			marg['log'] = svcarg.log;
		}

		let smarg = JSON.stringify(marg);
		logger.log('run /svc ' + smarg);
		//WARNING, if not req. read stdio, set options stdio:'ignore', otherwise the thread hangs!!!
		runarr[service_name].pid = spawn(c.CNODA_PATH + '/svc', [smarg], {
			detached: false,
			stdio: ['pipe', 'ignore', 'ignore']
		});
		runarr[service_name].pid.on('close', () => {
			runarr[service_name].pid = 0;
			runarr[service_name].state = 'exit';
			logger.log('Service ' + service_name + ' is close');
			logger.log(service_name + ' is close');
		});
		runarr[service_name].pid.on('error', (err) => {
			logger.log('Service ' + service_name + ' is error', err);
			logger.log(service_name + ' is error', err);
		});
	}

	logger.debug('Start service ', srvname, ' with args ', args);

	return service_name;
}

function DeinitService(service_id) {
	if (service_id) {
		const srv_id = service_id.toString();
		if (runarr[srv_id] && runarr[srv_id].pid !== 0 && runarr[srv_id].state !== 'exit') {
			logger.log('Deinit service ', srv_id);
			logger.debug('deinit service ', srv_id);
			ServiceCtrl(srv_id, 'exit');
		} else logger.log('runarr[' + srv_id + '] exited ');
	} else logger.log('Not deinit service (service_id==undefined)');
}

function ServiceState(service_id) {
	if (!service_id) return 'exit';

	const srv_id = service_id.toString();
	if (runarr[srv_id] && runarr[srv_id].pid !== 0) {
		return runarr[srv_id].state;
	} else return 'exit';
}

function ServiceCtrl(service_id, act) {
	if (service_id) {
		const srv_id = service_id.toString();
		logger.log('Try ' + act + ' Service id', srv_id);
		if (runarr[srv_id] && runarr[srv_id].pid !== 0) {
			try {
				runarr[srv_id].pid.stdin.write(act + '\n');
			} catch (e) {
				logger.log('Error: not apply action', act + ' service ', srv_id);
				runarr[srv_id].pid.kill();
				act = runarr[srv_id].state = 'exit';
			}
			logger.log(act + ' service ', srv_id);
			logger.debug(act + ' service ', srv_id);
			if (act !== 'exit') runarr[srv_id].state = act;
		} else logger.log('runarr[' + srv_id + '] == undefined ');
	} else logger.log('Not ' + act + ' service (service_id==undefined)');
}
module.exports = {
	DeinitService,
	Service,
	ServiceCtrl,
	ServiceState,
	runarr
};
