/**
 * Created by i7 on 26.01.2018.
 */

const c = require('../backCore');
const stripJsonComments = require('strip-json-comments');

function BuildEventReader(respfull, send, spawn, parser) {
	new Promise((resolve) => {
		let shared = '';
		spawn.stdout.on('data', (data) => {
			shared += data;
		});

		spawn.stdout.on('close', async () => {
			const str = await parser(shared);
			shared = '';
			resolve({
				list: str,
				resp: respfull
			});
		});
	}).then((arg) => {
		arg.resp['result'] = arg.list;
		let str = c.GenResponseEventObj({ action: 'webevent', webevent: arg.resp });
		send(str);
	});
}
function ExtractSettingType(pagename) {
	const pname_t = pagename.replace(/.lan/g, '');
	const pname = pname_t.replace(/\d+$/g, '');
	const num = pname_t.match(/\d+$/g, '');

	return { type: pname, n: num };
}

async function ReadNetworkSetting() {
	let ntw = await c.GetSettingPromise('networks');
	return JSON.parse(stripJsonComments(ntw.toString()).replace(/\n|\r/g, ''));
}

module.exports = {
	BuildEventReader,
	ExtractSettingType,
	ReadNetworkSetting
};
