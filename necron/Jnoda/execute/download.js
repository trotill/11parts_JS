/**
 * Created by i7 on 14.08.2020.
 */
const c = require('../../backCore');
const fs = require('fs');

module.exports = {
	execute: (obj) => {
		//action format
		let sett = obj.d[obj.d.action];
		let sid = obj.sid;

		process.send(c.GenResponseEventObj({ action: 'busy', busy: { message: 'DownloadWait' } }, sid));

		let download_file = sett.download_file;
		let download_wpath = sett.download_wpath;
		let download_path = sett.download_path;
		if (download_wpath === undefined) download_wpath = download_path;

		const fname = download_path + '/' + download_file;
		if (fs.existsSync(fname) === true) {
			process.send(
				c.GenResponseEventObj(
					{
						action: 'download',
						download: { folder: download_wpath, file: download_file, fullPath: fname }
					},
					sid
				)
			);
			process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
		} else {
			process.send(c.GenResponseEventObj({ action: 'message', message: 'ERROR_TRY_AGAIN' }, sid));
			process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
		}
	}
};
