const c = require('../../backCore');
const fs = require('fs');

let rollBackStump = 'rollOutToFactory';
module.exports = {
	execute: (/*obj,sendToCnoda*/) => {
		fs.writeFileSync(c.CACHE_PATH_NEC + '/' + rollBackStump, '');
	}
};
