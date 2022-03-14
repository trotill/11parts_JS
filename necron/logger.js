/**
 * Created by i7 on 03.12.2017.
 */
const fs = require('fs');
const util = require('util');

const spawn = require('child_process').spawn;
const config = require('./config.js');
const CNODA_PATH = config.CNODA_PATH;
const SVCLOG_FIFO_PATH = config.CACHE_PATH + '/slogger';
const DEF_LOG_PATH = `${config.CACHE_PATH_NEC}/../log`;

let slogger_closed = 1;
class Logger_fifo {
	constructor(LogfileT, LogLevelTxt, Pref, slogger_conf, consoleLog, context) {
		console.log('Logger args ', arguments, '  len ', arguments.length);
		this.LogLevel = 0;

		this.Pref = Pref;

		this.sender = {};
		this.slogger = {};
		this.wstream = undefined;
		this.slogger_cfg;
		this.slogger_ready = 0;
		this.context = context ?? { log_disabled: 0 };

		this.err_wstream = 0;

		let cpref = Pref.replace(/\s/g, '');
		let def_slogger_cfg = {
			slogger_loglevel: 1,
			slogger_atime: 1,
			sase_loglevel: 1,
			slogger_atime_format: 0,
			aal_save_style: 1,
			algo_type: 0,
			aal_max_blocks: 10,
			aal_lines_in_block: 1000,
			aal_sync_time: 10,
			aal_offset_time: 10,
			log_out_fifo: SVCLOG_FIFO_PATH + '/' + cpref + '_r',
			fifo_file: SVCLOG_FIFO_PATH + '/' + cpref + '_w',
			'aal_path[0]': DEF_LOG_PATH + '/' + cpref + '/log1',
			'aal_path[1]': DEF_LOG_PATH + '/' + cpref + '/log2',
			PathDefault: '/etc/necron/',
			slogger_skip_data: '0'
		};

		if (slogger_conf === undefined) {
			slogger_conf = {};
		}
		this.LogCfgFile = LogfileT;
		this.slogger_cfg = Object.assign(def_slogger_cfg, slogger_conf);
		this.run_slogger();
	}
	run_slogger() {
		fs.writeFileSync(this.LogCfgFile, JSON.stringify(this.slogger_cfg));
		console.log('run ', CNODA_PATH + '/safe_logger', this.LogCfgFile);
		this.slogger = spawn(CNODA_PATH + '/safe_logger', [this.LogCfgFile], {
			detached: false,
			stdio: ['ignore', 'ignore', 'ignore']
		});
		slogger_closed = 0;
		this.slogger.on('close', function () {
			console.log('slogger close ', this.slogger_cfg);
			slogger_closed = 1;
		});
	}

	async destructor() {
		console.log('terminate logger', this.LogCfgFile);
		this.context.log_disabled = 1;
		let delay = (ms) => new Promise((resolve) => setInterval(() => resolve(), ms));
		await delay(1000);
		if (this.wstream) {
			this.wstream.end();
			this.wstream = undefined;
		} else this.slogger.kill();

		this.slogger_ready = 0;
		this.err_wstream = 0;
		return new Promise(function (resolve) {
			let interv = setInterval(() => {
				console.log('Promise slogger_closed', slogger_closed);
				if (slogger_closed) {
					console.log('logger promise resolve!!!');
					clearInterval(interv);
					resolve();
				}
			}, 100);
		});
	}

	sendLog(type, data) {
		if (this.context.log_disabled || slogger_closed === 1 || this.err_wstream === 1) {
			return;
		}

		if (this.slogger_ready === 0) {
			console.log(`slogger ${this.LogCfgFile} closed`, 'fifo', this.slogger_cfg.fifo_file);
			if (fs.existsSync(this.slogger_cfg.fifo_file)) {
				this.wstream = fs.createWriteStream(this.slogger_cfg.fifo_file);
				this.wstream.on('error', (err) => {
					console.log(`logger ${this.slogger_cfg.fifo_file} writes stream error ${err}`);
					this.err_wstream = 1;
				});
				this.wstream.on('close', () => {
					console.log('logger  stream close');
					this.slogger.kill();
				});
				this.slogger_ready = 1;
			} else {
				return;
			}
		}
		if (!this.wstream) return;

		let str = `[${this.Pref}@${type}]->${util.format(...data)}\n`;
		try {
			this.wstream.write(str);
		} catch (e) {
			console.log('logger catch except', this.LogCfgFile);
			this.err_wstream = 1;
		}
	}

	webui() {
		this.sendLog('webui', arguments);
	}
	log() {
		console.log(...arguments);
		this.info(arguments);
	}
	info() {
		this.sendLog('info', arguments);
	}
	debug() {
		this.sendLog('debug', arguments);
	}
	websrv() {
		this.sendLog('websrv', arguments);
	}
}

module.exports = {
	Logger: Logger_fifo,
	ConsoleLogger: {
		debug() {
			console.log(':X:', ...arguments);
		},
		info() {
			console.log(':X:', ...arguments);
		},
		log() {
			console.log(':X:', ...arguments);
		},
		webui() {
			console.log(':X:', ...arguments);
		}
	}
};
