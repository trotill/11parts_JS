/**
 * Created by i7 on 21.01.2018.
 */
const fs = require('fs');
const ex = require('./../../../exec');
const c = require('../../../backCore');
const { glob } = require('../../Jnoda_global.js');
const logger = c.getLogger();
const sh = require('./../../../shared');
const ec = require('./../../EventCollector.js');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const nm = require('./network_manager.js');

let SarnetPID;
function RunSarnet() {
	let shared = '';
	//console.log("RunSarnet ");
	SarnetPID = spawn('sar', ['-n', 'DEV', '1'], {
		detached: true,
		stdio: ['ignore', 'pipe', 'ignore']
	});

	SarnetPID.stdout.on('data', (data) => {
		shared += data;
		let res = sh.ExtrudeString('IFACE', '\n\n', shared);
		//console.log("Sarnet res",res);
		if (res) {
			shared = res.buf;
			let elements = res.str.split('\n'); //_.split(res.str,'\n');
			// console.log("Sarnet elements",elements);
			delete elements[0];
			let parsed_str = {};
			elements.forEach((e) => {
				e = e.replace(/ +/g, ',');
				let parts = e.split(','); //_.split(e,',');
				let idx = 1;
				if (parts[1] === 'PM' || parts[1] === 'AM')
					//иногда в некоторых версиях, к времени добавляется столбец вечерн и утр. время
					idx = 2;
				let iface = parts[idx];
				//  console.log("iface",iface);
				let netname = nm.GetIfaceName(iface);
				if (typeof parts[idx] !== 'undefined')
					parsed_str[netname + 'spd'] =
						parseFloat(parts[idx + 3]) * 8 + parseFloat(parts[idx + 4]) * 8;
			});
			ec.SendEventToWeb(parsed_str, 'sarnet');
		}
		//
	});
}
function StopSarnet() {
	SarnetPID.kill();
}

let SarcpuPID;
function RunSarcpu() {
	let shared = '';
	SarcpuPID = spawn('sar', ['-P', 'ALL', '1'], {
		detached: true,
		stdio: ['ignore', 'pipe', 'ignore']
	});
	SarcpuPID.stdout.on('data', (data) => {
		shared += data;
		let res = sh.ExtrudeString('CPU', '\n\n', shared);
		if (res) {
			shared = res.buf;
			let elements = res.str.split('\n'); //_.split(res.str,'\n');
			delete elements[0];
			let parsed_str = {};
			elements.forEach((e) => {
				e = e.replace(/ +/g, ',');
				let parts = e.split(','); //_.split(e,',');
				let idx = 1;
				if (parts[1] === 'PM' || parts[1] === 'AM')
					//иногда в некоторых версиях, к времени добавляется столбец вечерн и утр. время
					idx = 2;
				if (parts[idx]) {
					parsed_str[parts[idx] + 'load'] = parts[idx + 1];
					parsed_str[parts[idx] + 'idle'] = parts[idx + 6];
				}
			});
			ec.SendEventToWeb(parsed_str, 'sarcpu');
		}
	});
}
function StopSarcpu() {
	SarcpuPID.kill();
}

function Sarram(data) {
	let memtotal = parseFloat(/MemTotal:(.*) kB/.exec(data)[1].replace(/\s/g, '') / 1000).toFixed(2);
	let memavail = parseFloat(/MemAvailable:(.*) kB/.exec(data)[1].replace(/\s/g, '') / 1000).toFixed(
		2
	);

	return {
		memtotal: memtotal,
		memfree: /MemFree:(.*) kB/.exec(data)[1].replace(/\s/g, '') / 1000,
		memavailable: memavail,
		memused: parseFloat(memtotal - memavail).toFixed(2)
	};
}

let ReadLogPID = [];

function ReadLog(obj, action) {
	let args = obj.args;
	let reqid = obj.req;
	console.log('ReadLog args', args);
	if (!args?.uid) return;

	let ename = args.uid;
	let file = args.file;
	let method = 'tail';
	if (args.method) method = args.method;

	if (method === 'slogger') {
		file = args.pipe;
	}

	let tout_id;
	if (action === 'start' && !ReadLogPID?.[ename]?.pid) {
		ReadLogPID[ename] = { args: args, pid: undefined };
		let rlog = () => {
			switch (method) {
				case 'journalctl':
					ReadLogPID[ename].pid = spawn('journalctl', ['-f', '-n', args.rows], {
						detached: true,
						stdio: ['pipe', 'pipe', 'ignore']
					});
					ReadLogPID[ename].pid.stdout.on('data', (data) => {
						let str = data.toString();
						let s = str.split('\n');
						let sob = {};
						s.forEach((sN) => {
							sob[ename] = sN;
							if (sN.length !== 0) {
								ec.SendEventToWeb(sob, reqid);
							}
						});
					});
					ReadLogPID[ename].pid.stdout.on('exit', () => {
						logger.debug(ename, 'on exit ', data);
					});
					break;
				case 'cat':
					ReadLogPID[ename].pid = spawn('cat', [file, '2>/dev/null'], {
						detached: true,
						stdio: ['pipe', 'pipe', 'ignore']
					});
					ReadLogPID[ename].pid.stdout.on('data', (data) => {
						// console.log('slogger data pipe',data);
						let str = data.toString();
						let s = str.split('\n');
						let sob = {};
						s.forEach((sN) => {
							sob[ename] = sN;
							if (sN.length !== 0) {
								ec.SendEventToWeb(sob, reqid);
							}
						});
					});
					ReadLogPID[ename].pid.stdout.on('exit', () => {
						logger.debug(ename, 'on exit ', data);
					});
					break;
				case 'slogger':
					{
						let blocks = 2;
						if (args.arch_blk) blocks = args.arch_blk;
						exec(
							`ls ${args.arch}|tail -${blocks}|xargs cat|tail -${args.rows}`,
							(error, stdout) => {
								let str = stdout.toString();
								let s = str.split('\n');
								let sob = {};
								for (let n = 0; n < s.length; n++) {
									sob[ename] = s[n];
									if (s[n].length !== 0) {
										ec.SendEventToWeb(sob, reqid);
									}
								}
							}
						).on('exit', () => {
							let clean_oldest = false;
							ReadLogPID[ename].pid = spawn('cat', [args.pipe, '2>/dev/null'], {
								detached: true,
								stdio: ['ignore', 'pipe', 'ignore']
							});
							ReadLogPID[ename].pid.stdout.on('data', (data) => {
								if (clean_oldest === false) {
									clean_oldest = true;
									return;
								}
								let str = data.toString();
								let s = str.split('\n');
								let sob = {};
								s.forEach((sN) => {
									sob[ename] = sN;
									if (sN.length !== 0) {
										ec.SendEventToWeb(sob, reqid);
									}
								});
							});
							ReadLogPID[ename].pid.stdout.on('exit', () => {
								logger.debug(ename, 'on exit ', data);
							});
						});
					}
					break;
				case 'tail':
				default:
					ReadLogPID[ename].pid = spawn('tail', ['-F', file, '-n', args.rows, '2>/dev/null'], {
						detached: true,
						stdio: ['pipe', 'pipe', 'ignore']
					});
					ReadLogPID[ename].pid.stdout.on('data', (data) => {
						let str = data.toString();
						let s = str.split('\n');
						let sob = {};
						s.forEach((sN) => {
							sob[ename] = sN;
							if (sN.length !== 0) {
								ec.SendEventToWeb(sob, reqid);
							}
						});
					});
					ReadLogPID[ename].pid.stdout.on('exit', () => {
						logger.debug(ename, 'on exit ', data);
					});
			}
		};

		if (fs.existsSync(file)) rlog();
		else {
			let tm_outf = () => {
				if (fs.existsSync(file)) rlog();
				else {
					tout_id = setTimeout(tm_outf, 1000);
				}
			};
			tout_id = setTimeout(tm_outf, 1000);
		}
		if (file === undefined) rlog();
	}

	if (action === 'stop' && ReadLogPID[ename].pid) {
		logger.debug(ename, 'kill ');
		clearTimeout(tout_id);
		ReadLogPID[ename].pid.kill();
		ReadLogPID[ename].pid = undefined;
	}
}

async function Freq_imx6(data) {
	let r = await ex.ExecPromise('cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq');
	let max = r.stdout.toString();
	if (data === '') data = '0';
	return {
		curr: data,
		max: max
	};
}

function Cpu_t_imx6(data) {
	return {
		cputemp: Math.trunc(data / 1000)
	};
}

async function Uptime(data) {
	let uptime = data.match(/[0-9]*/g)[0];

	let day = Math.trunc(uptime / 24 / 3600);
	let hour = Math.trunc((uptime - day * 24 * 3600) / 60 / 60);
	let min = Math.trunc((uptime - day * 24 * 3600 - hour * 60 * 60) / 60);

	let totalhour = uptime / 3600;
	let result = day + ' ' + hour + ':' + min + ' (H) ' + Math.round(totalhour);

	return {
		uptime: result
	};
}

function Life_time() {
	let ltime = glob.event['total_operating_time'];
	let day = Math.trunc(ltime / 24 / 3600);
	let hour = Math.trunc((ltime - day * 24 * 3600) / 60 / 60);
	let min = Math.trunc((ltime - day * 24 * 3600 - hour * 60 * 60) / 60);

	let totalhour = ltime / 3600;
	let result = day + ' ' + hour + ':' + min + ' (H) ' + Math.round(totalhour);

	let res = {
		ltime: result
	};
	console.log(
		"glob.eventFromUI['total_operating_time'] ",
		glob.event['total_operating_time'],
		'glob.eventFromUI',
		glob.event
	);
	console.log('Life_time ', res);
	return res;
}

function Dtime(data) {
	return {
		date: data
	};
}

async function RomMem() {
	let r = await ex.ExecPromise('df -m ' + c.DOWNLOAD_PATH + ';du ' + c.DOWNLOAD_PATH + ' -sm');
	let result = r.stdout + '';
	let elements = result.split('\n'); //_.split(result,'\n');
	let df = elements[1].replace(/ +/g, ',');
	let duparts = elements[2].match(/^[0-9]+/g);

	let dfparts = df.split(','); //_.split(df,',');
	let romused = dfparts[2];
	let romavail = dfparts[3];
	let romtotal = parseInt(romavail) + parseInt(romused);

	return {
		romused: romused,
		downused: duparts[0],
		romtotal: romtotal
	};
}

async function RomMemEx(arg) {
	try {
		let r = await ex.ExecPromise(
			'df -m ' + arg['mount_point'] + ';du ' + arg['checked_path'] + ' -sm'
		);
		let result = r.stdout + '';
		let elements = result.split('\n'); //_.split(result,'\n');
		let df = elements[1].replace(/ +/g, ',');
		let duparts = elements[2].match(/^[0-9]+/g);

		let dfparts = df.split(','); //_.split(df,',');
		let romused = dfparts[2];
		let romavail = dfparts[3];
		let romtotal = parseInt(romavail) + parseInt(romused);

		return {
			romused: romused,
			downused: duparts[0],
			romtotal: romtotal
		};
	} catch (e) {
		return {
			romused: 0,
			downused: 0,
			romtotal: 0
		};
	}
}

module.exports = {
	RunSarnet,
	StopSarnet,
	RunSarcpu,
	StopSarcpu,
	Sarram,
	Uptime,
	Life_time,
	Dtime,
	RomMem,
	RomMemEx,
	Cpu_t_imx6,
	Freq_imx6,
	ReadLog
};
