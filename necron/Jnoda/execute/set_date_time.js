const c = require('../../backCore');
const logger = c.getLogger();
const ex = require('./../../exec.js');

module.exports = {
	execute: (obj) => {
		let ds = obj.d['set_date_time'].ntp.tmantab[0];
		// var ds=obj.data.settings.tmantab[0];
		logger.debug(
			'set_date_time',
			JSON.stringify(obj.data),
			'run ',
			'date +%Y%m%d -s ' + ds[0] + ds[1] + ds[2]
		);
		ex.ExecNoOutSync('date +%Y%m%d -s ' + ds[0] + ds[1] + ds[2]);
		ex.ExecNoOutSync('date +%T -s ' + ds[3] + ':' + ds[4] + ':' + ds[5]);
		ex.ExecNoOutAsync('hwclock --systohc --utc');
	}
};
