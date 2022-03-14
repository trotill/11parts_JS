const c = require('../../backCore');
const logger = c.getLogger();
const ex = require('./../../exec.js');

module.exports = {
	execute: (obj) => {
		sett = obj.d[obj.d.action];
		sid = obj.sid;

		process.send(c.GenResponseEventObj({ action: 'busy', busy: { message: 'REMOVE_ALL' } }, sid));
		logger.debug('remove  ', sett.path, ' files ', sett.files);
		//Remove only for download!!!, for secure
		console.log('try clean ', sett.path, 'c.CACHE_PATH_WEB', c.CACHE_PATH_WEB);
		if (sett.path === c.DOWNLOAD_PATH || sett.path === c.CACHE_PATH_WEB) {
			console.log('Clean ', sett.path);
			logger.debug('rm', sett.path + '/*');
			ex.ExecNoOutAsync('/bin/rm ' + sett.path + '/*');
			process.send(c.GenResponseEventObj({ action: 'ready', ready: {} }, sid));
		}
	}
};
