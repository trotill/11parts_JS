const ex = require('./../../exec.js');
module.exports = {
	execute: (/*obj,sendToCnoda*/) => {
		ex.ExecNoOutAsync('poweroff&');
	}
};
