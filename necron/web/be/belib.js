/**
 * Created by i7 on 25.11.2017.
 */

const execSync = require('child_process').execSync;
const c = require('../../backCore');
const fs = require('fs');

function Random() {
	const min = 28374;
	const max = 874436212;
	return Math.round(min - 0.5 + Math.random() * (max - min + 1));
}

function PageCheck(world_map, page_name) {
	for (const reg_name in world_map.world.regions) {
		if (page_name === reg_name) {
			return page_name;
		}
	}
	return '';
}

function installSystemPath() {
	execSync(`install -d ${c.SVCLOG_PARAM_PATH}`);
}

function GetReducedWorld(world) {
	const reduced = {
		name: world.name,
		screen_scheme: world.screen_scheme,
		regions: {},
		lang: world.lang
	};

	for (const region in world.regions) {
		if (!world.regions[region].clone) {
			reduced.regions[region] = {
				name: world.regions[region].name,
				style: world.regions[region].style,
				screens: world.regions[region].screens,
				placeOpts: world.regions[region].placeOpts
			};
		}
	}

	return reduced;
}

function GetFreeSizeOnStorage(root_path) {
	const result = execSync('df -m ' + root_path) + '';
	const elements = result.split('\n');
	const df = elements[1].replace(/ +/g, ',');
	const dfparts = df.split(',');
	const res = (parseInt(dfparts[3]) - 4) * 1000000;
	if (res < 0) return 0;
	return res;
}

function WorldGenAccessMap(world) {
	const total_group = {};

	for (const region in world.world.regions) {
		total_group[region] = {};
		for (const groupName in world.world.regions[region].regmap) {
			total_group[region][groupName] = {};
		}
	}

	fs.writeFileSync(c.CACHE_PATH + '/groups.json', JSON.stringify(total_group), 'utf-8');
	const grparr = [];
	for (const reg in total_group) {
		for (const group in total_group[reg]) {
			grparr.push(group);
		}
	}

	const fname = c.CACHE_PATH + '/groups.prio.json';
	const data = JSON.stringify(grparr);
	fs.writeFileSync(fname, data, 'utf-8');
}

function CheckForNFS() {
	if (!fs.existsSync(c.CACHE_PATH + '/nfs')) {
		execSync("cat /proc/mounts|grep nfs|awk '{print $3}'>" + c.CACHE_PATH + '/nfs');
	}

	return fs.readFileSync(c.CACHE_PATH + '/nfs') === 'nfs\n';
}

function Factory_Set(ssend, socket_id) {
	console.log('Factory_Set socket_id', socket_id);
	c.send_to_cnoda(
		ssend,
		c.ConvToCSrvFormat(c.JSON_PACK_TYPE_SET_SYSTEM, { type: 'resettofactory' }, socket_id)
	);
}

function HTTP_Start(app, param) {
	console.log('!!!!!HTTP_Start', param);

	let http_port;
	let http_type;
	let key;
	let cert;
	let http;
	let io;
	let ss_use = false;
	if (param.ihttp === 'http') {
		http_port = param['hport'];
		http_type = 'http';
	} else {
		http_type = 'https';
		http_port = param['hsport'];
		if (param.ishttp === 'ss') {
			ss_use = true;
		} else {
			if (!param.httpkey || !param.httpcert) {
				ss_use = true;
			} else {
				if (!c.FindSetting('https_ucert.pem') || !c.FindSetting('https_ukey.pem')) ss_use = true;
			}
		}
		if (!ss_use) {
			console.log('Use User cert/key for HTTPS');
			cert = c.GetSetting('https_ucert.pem');
			key = c.GetSetting('https_ukey.pem');
		} else {
			console.log('Use self-signed cert/key for HTTPS');
			if (!c.FindSetting('https_cert.pem') || !c.FindSetting('https_key.pem')) {
				const key_s = c.CACHE_PATH + '/https_key.pem';
				const keytmp_s = c.CACHE_PATH + '/https_keytmp.pem';
				const cert_s = c.CACHE_PATH + '/https_cert.pem';
				//openssl req -x509 -newkey rsa:2048 -keyout keytmp.pem -out cert.pem -days 365 -nodes -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com"
				console.log(
					'openssl req -x509 -newkey rsa:2048 -keyout ' +
						keytmp_s +
						' -out ' +
						cert_s +
						' -days 36500 -nodes -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=11-parts.com"'
				);
				console.log('openssl rsa -in ' + keytmp_s + ' -out ' + key_s);
				execSync(
					'openssl req -x509 -newkey rsa:2048 -keyout ' +
						keytmp_s +
						' -out ' +
						cert_s +
						' -days 36500 -nodes -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=11-parts.com"'
				);
				execSync('openssl rsa -in ' + keytmp_s + ' -out ' + key_s);
				execSync(c.SaveSignSettingForBash(key_s, 'https_key.pem'));
				execSync(c.SaveSignSettingForBash(cert_s, 'https_cert.pem'));
			}
			cert = c.GetSetting('https_cert.pem');
			key = c.GetSetting('https_key.pem');
		}
	}

	if (http_type === 'https') {
		console.log('Create HTTPS server');
		try {
			http = require('https').createServer({ key: key, cert: cert }, app);
		} catch (e) {
			console.log('Fault key/cert HTTPS server, create HTTP server, witch port 80');
			console.log('Create HTTP server');
			http_port = '80';
			http = require('http').createServer(app);
		}
		//http_port = 443;
	} else {
		console.log('Create HTTP server');
		http = require('http').createServer(app);
		//http_port = 80;
	}

	console.log('Create Socket IO server');
	io = require('socket.io', {
		rememberTransport: false,
		transports: ['websocket', 'polling', 'polling-xhr', 'polling-jsonp']
	})(http);
	http.listen(http_port);

	return { http: http, io: io };
}

function HTTP_Stop(http, io) {
	io.close();
	http.close();
}

function CheckSaveAck(ret) {
	if (Array.isArray(ret) === false) {
		return ret.result.ack;
	} else {
		const foundedRet = ret.find((retItem) => retItem.result.ack !== 'ok');
		if (foundedRet) return foundedRet.result.ack;
	}
	return 'ok';
}

module.exports = {
	Random,
	PageCheck,
	GetReducedWorld,
	GetFreeSizeOnStorage,
	WorldGenAccessMap,
	CheckForNFS,
	Factory_Set,
	HTTP_Start,
	HTTP_Stop,
	CheckSaveAck,
	installSystemPath
};
