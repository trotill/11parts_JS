const c = require('../backCore.js');
//const { glob } = require('./be/main_global.js');

const belib = require('./be/belib');
//const wl = require('./webLogic');
const { execSync } = require('child_process');

const cookieParser = require('cookie-parser');
const SocketIOFileUpload = require('socketio-file-upload');
const webUpload = require('./webUpload.js');
//const { regConnectionIo, doDisconnect } = require('./webWS.js');
//const { control, SendBuzyState } = require('./webControl.js');
//const au = require('./webAuth.js');
const dgram = require('dgram');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const { Render: FeRender } = require(c.FW_PATH + '/web/fe/index.js');
const { mergeDeep } = require('../shared.js');
//const { secret, io_events, pagePrefix, wait } = require('./webGlobal.js');

class WebAdmin {
	constructor(cradle) {
		this.cradle = cradle;
	}
	init() {
		const { webControlBase, glob, webGlobal, webWS, webLogic, webAuth } = this.cradle;
		const { world_map, reduced_world } = glob;
		const logger = c.getLogger();
		//const { SendBuzyState } = webControlBase;
		//const { secret, io_events, pagePrefix, wait } = webGlobal;
		//const { Upload } = webUpload;

		const webSsend = dgram.createSocket('udp4');
		webSsend.bind(c.BUS_PORT_WEBUI_TO_CNODA, c.BUS_IP);

		let compression;

		const app = express();
		const keepalive = 30000; //интервал запусков вачдога, для опред. отв. клиентов

		console.log('glob.websrv.cfg', glob.websrv.cfg);
		if (!glob.websrv.cfg.ihttp) {
			glob.websrv.cfg['ihttp'] = 'http';
			glob.websrv.cfg['hport'] = '80';
			glob.websrv.cfg['gzip_en'] = 'false';
		}

		const gzip = {
			enable: false,
			thr: 2000
		};
		if (world_map.world.compress) {
			gzip.enable = true;
			gzip.thr = world_map.world.compress.treshold;
		} else {
			if (glob.websrv.cfg['gzip_en'] === 'true') {
				gzip.enable = true;
				gzip.thr = glob.websrv.cfg['gzip_thr'];
			}
		}

		app.use(SocketIOFileUpload.router);

		if (gzip.enable) {
			compression = require('compression');
			app.use(
				compression({
					threshold: gzip.thr,
					filter: (req) => {
						const type = req.headers['content-type'];
						logger.info('Compress header type', type);
						if (!type) {
							logger.info('%s not compressible', type);
							return false;
						}
						return true;
					}
				})
			);
		}

		app.use(cookieParser(webGlobal.secret));
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json());

		execSync('install -d ' + c.CACHE_PATH_WEB);

		logger.webui('__dirname', __dirname);

		webLogic.initWEBpathes({ app: app, express: express });

		const hs_res = belib.HTTP_Start(app, glob.websrv.cfg);
		const io = hs_res.io;

		webWS.regConnectionIo(io, cookieParser);

		setInterval(() => {
			for (let sid in glob.kAlive) {
				if (glob.kAlive[sid].wdt === 0) {
					if (glob.kAlive[sid].socket) {
						//Защита для electron, т.к. socket там нет
						glob.kAlive[sid].socket.disconnect();
					}
					webWS.doDisconnect(sid, io);
					console.log('Force disconnect socket on timeout WDT SID', sid);
				} else {
					glob.kAlive[sid].wdt = 0;
				}
			}
		}, keepalive);

		app.get(`/lang/:lang/:region`, (req, res) => {
			const { lang } = req.params;
			let region = req.params.region === 'default' ? '' : req.params.region + '/';
			let baseLang = {
				__sections: {},
				__mname: {},
				__keywords: {}
			};
			let projectLang = baseLang;
			let baseLangPath = `${c.ROOT_PATH}/ui/visual/liblng/${lang}.js`;
			let projectLangPath = `${c.ROOT_PATH}/ui/styles/${region}liblng/${lang}.js`;
			if (fs.existsSync(baseLangPath)) {
				baseLang = require(baseLangPath).__language_def;
				if (fs.existsSync(projectLangPath)) {
					projectLang = require(projectLangPath).__language;
				}
			}
			let mergedLng = mergeDeep(baseLang, projectLang);
			res.end(JSON.stringify(mergedLng));
		});
		app.post('/' + c.PAGE_PREFIX, function (req, res) {
			logger.webui('ajax req', req.body);

			let contype = req.headers['content-type'];

			let auth = webAuth.CheckFromCook(req.signedCookies);
			let prolong = false;

			if (world_map.world.auth_opts.prolong_cook) prolong = true;

			let isAuthorized = auth.result;

			if (contype === 'application/json') {
				console.log(' req.body', req.body);
				//оставлено только для авторизации

				webLogic.run({
					req: req.body,
					auth,
					ssend: webSsend,
					au: webAuth,
					res,
					prolong,
					hs_res,
					SendBuzyState: webControlBase.SendBuzyState,
					prolongCookies: () => {
						webAuth.ProlongCookies(res, req.signedCookies);
					}
				});
			} else {
				if (isAuthorized === c.ERROR) return;
				if (prolong === true) webAuth.ProlongCookies(res, req.signedCookies);
				webUpload.Upload(req, res); //Obsolete upload
			}
		});

		let main = (req, res) => {
			let PageRegionName = belib.PageCheck(world_map, req.param('page'));
			let PageName = req.param(PageRegionName);

			logger.webui('cookies ', req.signedCookies);

			let auth = 0;
			let chk = webAuth.CheckFromCook(req.signedCookies);

			if (chk.result === c.NO_ERROR) {
				console.log('CheckFromCook checked, is authorized');
				if (world_map.world.auth_opts.prolong_cook) {
					webAuth.ProlongCookies(res, req.signedCookies);
					let ioid = req.cookies.ioid;
					if (ioid !== undefined && glob.kAlive[ioid]) {
						glob.kAlive[ioid]['connectTime'] = Date.now();
					}
				}
			} else console.log('CheckFromCook not checked, not authorized!!!');

			if (chk.result === c.NO_ERROR && chk.group !== 'electron') {
				auth = 1;
				logger.webui('Checked for group ', chk.group);
			}

			logger.webui('Auth state ', auth, ' wait.pleaseWait ', webGlobal.wait.pleaseWait);
			const index = FeRender(
				{
					PageRegionName: PageRegionName,
					PageName: PageName,
					auth: auth,
					world: world_map.world,
					reduced_world: reduced_world,
					group: chk.group,
					login: chk.login,
					client: 'web'
				},
				glob
			);

			res.end(index);
			return auth;
		};

		app.get('/debug', function (req, res) {
			if (main(req, res)) {
				if (glob.websrv.cfg.webPostDebug === 'true') {
					if (req.param('action')) {
						let action = req.param('action');
						console.log(`Post DEBUG ACTION ${action}`);
						webGlobal.io_events.emit(action, {});
					}
				}
			}
		});
		app.get('/*', main);
	}
}

module.exports = {
	WebAdmin
};
