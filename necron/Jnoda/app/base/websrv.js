/**
 * Created by Ilya on 10.08.2018.
 */

let ex = require('./../../../exec');

async function setup(obj) {
	let hostname = obj.hostname;
	console.log('set hostaname', hostname);
	ex.ExecNoOutSync(`hostname ${hostname}`);
}

module.exports = {
	setup
};
