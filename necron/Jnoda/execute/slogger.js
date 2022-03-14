/**
 * Created by i7 on 14.04.2020.
 */
const c = require('../../backCore');
const ex = require('./../../exec.js');
const fs = require('fs');

module.exports = {
	execute: (obj) => {
		let sett;
		let sid;
		if (obj.data) {
			//old format, obsolete
			sett = obj.data.settings;
			sid = obj.data.socket_id;
		} else {
			//action format
			sett = obj.d[obj.d.action];
			sid = obj.sid;
		}

		process.send(c.GenResponseEventObj({ action: 'busy', busy: { message: 'GET_LOG_WAIT' } }, sid));

		let cfg = c.CNODA_PATH + '/Cnoda.json';
		let slog_file = '/slog.log.gz';
		if (sett) {
			if (sett.slogger_config) {
				cfg = sett.slogger_config;
			}
			if (sett.slogger_file) {
				slog_file = sett.slogger_file;
			}
		}

		ex.ExecSpawnAsync(c.CNODA_PATH + '/safe_logger', [cfg, 'buildlog'], null, null, () => {
			const fname = c.CACHE_PATH_WEB + '/' + slog_file;
			if (fs.existsSync(fname)) {
				process.send(
					c.GenResponseEventObj(
						{
							action: 'download',
							download: { folder: 'cache', file: slog_file, fullPath: fname }
						},
						sid
					)
				);
				process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
				setTimeout(() => {
					if (fs.existsSync(fname)) {
						console.log(fname, 'removed!!');
						fs.unlinkSync(fname);
					}
				}, 600000); //файлы удаляться через 10 мин. За это время они должы быть полностью переданы
			} else {
				process.send(c.GenResponseEventObj({ action: 'message', message: 'ERROR_TRY_AGAIN' }, sid));
				process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
			}
		});
	}
};
