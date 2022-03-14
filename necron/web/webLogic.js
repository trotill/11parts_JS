/**
 * Created by i7 on 22.07.2020.
 */

const belib = require('./be/belib');
const fs = require('fs');
const c = require('../backCore.js');
//const { glob } = require('./be/main_global.js');
//const { world_map } = glob;
//const logger = c.getLogger();
//const { io_events } = require('./webGlobal.js');

class WebLogic {
	constructor({ glob, webGlobal }) {
		//const { world_map } = glob;
		this.glob = glob;
		this.logger = c.getLogger();
		this.webGlobal = webGlobal;
		//const { io_events } = webGlobal;
		//this.io_events = io_events;
		//this.logger = logger;
		//this.world_map = world_map;
	}
	GenErrToken() {
		return {
			respType: 'save_ack',
			result: {
				ack: 'err_token'
			}
		};
	}
	run({ req, auth, ssend, au, res, prolong, prolongCookies }) {
		let ret = {};
		let isAuthorized = auth.result;

		if (typeof req.type != 'undefined') {
			console.log('req.type ', req.type);
			switch (req.type) {
				case 'settings':
					if (req.action === 'auth') {
						if (au !== undefined) {
							this.logger.webui('ajax auth', req.settings);
							console.log(
								'ajax auth res',
								req,
								'password',
								req.settings.data.password.value,
								'login',
								req.settings.data.login.value
							);
							au.ShowAccounts();
							ret = au.CheckFromJson(
								res,
								req.settings.data.password.value,
								req.settings.data.login.value
							);
							prolong = false;
						}
					}
					break;

				case 'action':
					console.log('do action ');
					if (isAuthorized === c.ERROR) {
						//возможность удаления серверных кук, потерявшим авторизацию клиентам
						if (req.action === 'rmcookies') {
							if (au !== undefined) {
								au.RemoveAllCookies(res);

								prolong = false;
								if (req.data.response) {
									ret = req.data.response;
								} else ret = this.GenErrToken();
							}
						} else ret = this.GenErrToken();
					} else {
						ret = {
							respType: 'action',
							result: 'ok'
						};
						//try {
						//WaitStat(true);
						this.logger.webui('action params ', req.data, ' req ', req);
						// console.log('req.data',req.data,' req.data.settings',req.data.settings);
						if (req.data && req.data.settings && req.data.send_setting) {
							this.logger.webui('action SaveProcessing vers', req.action);
							ret.result = require(c.FW_PATH + '/web/be/settings.js').result({
								req: req.data,
								sendtocnoda: ssend,
								world_map: this.glob.world_map.world,
								svers: req.action,
								ctx: { webGlobal: this.webGlobal }
							}).result.ack;
						}
						console.log('action settings ret.result', ret.result);
						if (ret.result === 'ok') {
							if (req.data['noda'] === 'Jnoda') {
								this.logger.webui('send to jnoda ', req);

								this.webGlobal.io_events.emit(
									'to_jnoda',
									c.GenResponseEventObj({
										action: 'execute',
										execute: req
									})
								);
							} else {
								this.logger.webui('run action ', req.action);
								console.log('run action ', req.action);
								switch (req.action) {
									case 'rmcookies':
										//console.log('rmcookies');
										if (au !== undefined) {
											au.RemoveAllCookies(res);

											prolong = false;
											if (req.data.response !== undefined) {
												ret = req.data.response;
											} else ret = this.GenErrToken();
										}
										break;
									case 'factory':
										console.log('factory req', req);
										belib.Factory_Set(ssend, req.data.socket_id);
										break;

									default:
										this.logger.webui('error action ', req.action);
								}
							}
						}
					}
					break;
			}
		}

		if (au) {
			if (prolong === true) prolongCookies();
			res.end(JSON.stringify(ret));
		}

		return ret;
	}
	deinitWEBpathes() {
		fs.rmdirSync(c.CACHE_PATH_ELJ, { recursive: true });
	}
	initWEBpathes(app) {
		let addPath = (exp, dyn, stat) => {
			console.log(`addPath dyn ${dyn} stat ${stat}`);
			exp.app.use(dyn, exp.express.static(stat));
		};

		addPath(app, '/styles', c.FW_PATH + '/ui/styles');
		addPath(app, '/compiled', c.FW_PATH + '/compiled');
		addPath(app, '/visual/liblng', c.FW_PATH + '/ui/visual/liblng');
		addPath(app, '/res', c.FW_PATH + '/ui/visual/res');
		addPath(app, '/external', c.FW_PATH + '/ui/external');
		addPath(app, '/cache', c.CACHE_PATH_WEB);
		addPath(app, '/shared', c.SHARED_PATH);
	}
}

module.exports = {
	WebLogic
};
