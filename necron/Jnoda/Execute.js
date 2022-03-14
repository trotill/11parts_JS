/**
 * Created by i7 on 18.03.2018.
 */

function Run(obj, send_cnoda) {
	console.log('!!!!!!!@@@@@@@@execute ', obj);
	console.log('action', obj.d.action);

	let action;
	if (obj.action) {
		action = obj.action;
	} else action = obj.d.action;
	require('./execute/' + action).execute(obj, send_cnoda);
}

module.exports = {
	Run
};
