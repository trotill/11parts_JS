/**
 * Created by i7 on 14.04.2020.
 */
const c = require('../../backCore');
const ex = require('./../../exec.js');
const fs = require('fs');

//Obsolete version slogger!!!
module.exports = {
	//Obsolete version slogger!!!
	execute: (obj) => {
		//Obsolete version slogger!!!
		console.log('Used obsolete version get_slog, change to slogger!!!');
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
			if (sett.get_slog_cfg) {
				cfg = sett.get_slog_cfg;
			}
			if (sett.slog_file) {
				slog_file = sett.slog_file;
			}
		}

		ex.ExecSpawnAsync(c.CNODA_PATH + '/safe_logger', [cfg, 'buildlog'], null, null, () => {
			const fname = c.CACHE_PATH_WEB + '/' + slog_file;
			console.log('get_slog ready, fname', fname);
			if (fs.existsSync(fname) === true) {
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
			} else {
				process.send(c.GenResponseEventObj({ action: 'message', message: 'ERROR_TRY_AGAIN' }, sid));
				process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
			}
		});
	}
};
