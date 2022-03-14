/**
 * Created by i7 on 16.03.2017.
 */
/**
 * iwlist - a powerful tool with a horrible output
 * Created by kc on 04.04.16.
 */

const c = require('../../../backCore');
const logger = c.getLogger();

/**
 * Parsing the output of iwlist, tool having a lot of different faces :-(
 * @param str output of the tool
 */

function iwlistParse(str) {
	let out = str.replace(/^\s+/gm, '');
	out = out.split('\n');
	let cells = [];
	let line;
	let info = {};
	let ossid = '';
	let fields = {
		mac: /^Cell \d+ - Address: (.*)/,
		ssid: /^ESSID:"(.*)"/,
		proto: /^Protocol:(.*)/,
		mode: /^Mode:(.*)/,
		chan: /^Frequency:(.*)/,
		enc_key: /Encryption key:(.*)/,
		brates: /Bit Rates:(.*)/,
		quality: /Quality(?:=|)([^\s]+)/,
		sig_lvl: /Signal level(?:=|)([^\s]+)/
	};

	for (let i = 0, l = out.length; i < l; i++) {
		line = out[i].trim();
		if (!line.length) {
			continue;
		}
		if (line.match('Scan completed :$')) {
			continue;
		}
		if (line.match("Interface doesn't support scanning.$")) {
			continue;
		}

		for (let field in fields) {
			if (line.match(fields[field])) {
				info[field] = fields[field].exec(line)[1].trim();
				if (field === 'chan') {
					// console.log('chan',info[field]);
					info[field] = info[field].match(/(.*)(.[0-9])/)[2];
				} else if (field === 'ssid' && info[field].length === 0) {
					info[field] = 'no ssid';
				}
			}
		}

		if (info.ssid && info.ssid !== ossid) {
			cells.push(info);
			ossid = info.ssid;
			info = {};
		}
	}
	if (info.ssid) cells.push(info);

	logger.debug('cells', cells);
	return cells;
}

function parseOutput(str) {
	//see https://gist.github.com/mauricesvay/4408150
	const iw = iwlistParse(str);
	const res = [];
	// console.log("iwlist ",iw);
	for (const n in iw) {
		const iwn = iw[n];
		const pr = [iwn.mac, iwn.ssid, iwn.chan, iwn.sig_lvl, iwn.enc_key];
		res.push(pr);
	}
	//=["MAC","ESSID","Channel","Quality",]
	return res; //[res];
}

module.exports = {
	parseOutput
};
