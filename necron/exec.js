/**
 * Created by i7 on 09.03.2017.
 */

const c = require('./backCore.js');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const spawn = require('child_process').spawn;
const fs = require('fs');
const runarr = require('./services.js').runarr;
const DeinitService = require('./services.js').DeinitService;
const Service = require('./services.js').Service;
const ServiceCtrl = require('./services.js').ServiceCtrl;
const ServiceState = require('./services.js').ServiceState;
const logger = c.getLogger();

function ExecNoOutAsync(cmd) {
	exec(cmd, (error, stdout, stderr) => {
		if (stderr) logger.debug('Error execute cmd' + cmd + 'stderr ' + stderr);
	});
}

function ExecPromise(cmd) {
	return new Promise((resolve) => {
		exec(cmd, (error, stdout, stderr) => {
			resolve({
				stdout: stdout,
				stderr: stderr,
				error: error
			});
		});
	});
}

function ExecSpawnAsync(cmd, params, stdout, stderr, onclose) {
	const sp = spawn(cmd, params);

	stdout &&
		sp.stdout.on('data', (data) => {
			stdout(data);
		});

	stderr &&
		sp.stderr.on('data', (data) => {
			stderr(data);
		});

	onclose &&
		sp.on('close', function (code) {
			onclose(code);
		});

	return sp;
}

function ExecNoOutSync(cmd) {
	ExecWOutSync(cmd);
}

function ExecWOutSync(cmd) {
	let out = '';
	try {
		out = execSync(cmd);
	} catch (err) {
		logger.debug('Error execute cmd ' + cmd + ' err ' + err);
	}

	return out;
}

function GenServiceName(srv, args) {
	const srvname = srv.replace(/\s/g, '');
	const argrx = args.replace(/[\s-/''""()@^&*!~]/g, '');
	return {
		srvname,
		service_name: srvname + '.' + argrx
	};
}

let waiterarr = [];
//act - start/stop
function AddWaiter(file_name, callback, callback_arg) {
	if (waiterarr[file_name]) {
		waiterarr[file_name].pid.kill();
		delete waiterarr[file_name];
	}

	waiterarr[file_name] = {};
	waiterarr[file_name]['pid'] = '';

	logger.debug('Add waiter ', file_name);
	waiterarr[file_name].pid = spawn(
		'inotifywait',
		['-qm', '--eventFromUI', 'modify', '--format', "'%f'", file_name],
		{ detached: true }
	);
	waiterarr[file_name].pid.stdout.on('data', () => {
		//console.log("Waiter data ", data);
		callback(callback_arg);
	});
	waiterarr[file_name].pid.on('exit', (code) => {
		logger.debug('Waiter exit code ', code);
	});
}
function DelWaiter(file_name) {
	if (waiterarr[file_name]) {
		waiterarr[file_name].pid.kill();
		delete waiterarr[file_name];
	}
}

function DelAllWaiters() {
	logger.debug('Delete all waiters');
	for (let file_name in waiterarr) {
		logger.debug('Delete waiter ', file_name);
		DelWaiter(file_name);
	}
}

function ShowRunarr() {
	let show = '\n';
	Object.entries(runarr).forEach(([name, { state }], n) => {
		show += '  ' + n + '-[' + name + '] state:' + state + '\n';
	});
	logger.log('runarr', show);
}

function RestartServiceWDiffArgs(old_service_name, srv, args, action, log, exparam) {
	const new_service_name = GenServiceName(srv, args).service_name;
	logger.log('RestartServiceWDiffArgs oldname', old_service_name, 'newname', new_service_name);
	ServiceCtrl(old_service_name, 'stop');
	return Service(srv, args, action, log, exparam);
}

function CheckDeinitAllServices() {
	Object.entries(runarr).forEach(([, item]) => {
		if (item.state !== 'exit') {
			DeinitService(item);
			return false;
		}
	});

	logger.log('All services deinited');
	return true;
}
function DeinitAllServices() {
	logger.log('Deinit all services');
	Object.entries(runarr).forEach(([, item]) => {
		DeinitService(item);
	});
}

function RestartAllService() {
	logger.debug('Restart all services');
	Object.entries(runarr).forEach(([name, item]) => {
		logger.debug('Restart service ', name);
		Service(item.name, item.args, 'restart');
	});
}

let readFilePromise = (fn) =>
	new Promise((resolve) =>
		fs.readFile(fn, 'utf8', (err, data) => {
			resolve(data);
		})
	);

let writeFilePromise = (fn, data) =>
	new Promise((resolve) =>
		fs.writeFile(fn, data, 'utf8', (err) => {
			resolve(err);
		})
	);
module.exports = {
	ExecNoOutAsync,
	ExecWOutSync,
	ExecNoOutSync,
	ExecSpawnAsync,
	ExecPromise,
	readFilePromise,
	writeFilePromise,
	Service,
	DeinitAllServices,
	CheckDeinitAllServices,
	RestartAllService,
	DelAllWaiters,
	AddWaiter,
	ShowRunarr,
	ServiceCtrl,
	ServiceState,
	ServiceDiffArgs: RestartServiceWDiffArgs
};
