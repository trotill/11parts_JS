/**
 * Created by i7 on 09.08.2017.
 */

setTimeout(() => {
	const c = require('./backCore');
	const awilix = require('awilix');
	const { glob } = require('./web/be/main_global.js');
	const belib = require('./web/be/belib.js');
	const mbo = require('./web/be/main_buildObj.js');
	const { DoExit, deleteTmpFiles, startUpMain } = require('./web/be/main_services.js');
	const { message_file_collector, on_message } = require('./web/be/main_message.js');
	const { necronInit } = require('./web/be/main_init.js');
	const { WebAdmin } = require('./web/web.js');
	const { WebControlAdapter, WebControlBase } = require('./web/webControl.js');
	const { WebEvent } = require('./web/webEvent.js');
	const { WebEventMap } = require('./web/webEventMap.js');
	const { WebGlobal } = require('./web/webGlobal.js');
	const { WebLogic } = require('./web/webLogic.js');
	const { WebWS } = require('./web/webWS.js');
	const { WebAuth } = require('./web/webAuth.js');

	const server_setup = require('./server_setup.js');
	const container = awilix.createContainer({
		injectionMode: awilix.InjectionMode.PROXY
	});
	container.register({
		web: awilix.asClass(WebAdmin).scoped(),
		webControlAdapter: awilix.asClass(WebControlAdapter).scoped(),
		webControlBase: awilix.asClass(WebControlBase).scoped(),
		webEvent: awilix.asClass(WebEvent).scoped(),
		webEventMap: awilix.asClass(WebEventMap).scoped(),
		webGlobal: awilix.asClass(WebGlobal).scoped(),
		webLogic: awilix.asClass(WebLogic).scoped(),
		webWS: awilix.asClass(WebWS).scoped(),
		webAuth: awilix.asClass(WebAuth).scoped(),
		confWebSrv: awilix.asClass(server_setup.ConfWebSrv).scoped(),
		glob: awilix.asValue(glob)
	});

	belib.installSystemPath();
	const ls = require('./logger.js');
	const logger = new ls.Logger(c.WEB_SRV_LOG_FILE, 'trace', 'srv', undefined, false, glob);
	c.setLogger(logger);

	logger.log('Run nodejs version -', process.version);

	const ex = require('./exec.js');
	ex.ExecNoOutSync('install -d ' + c.SVCLOG_PARAM_PATH);
	logger.log('install -d ' + c.SVCLOG_PARAM_PATH);

	//const ss = require('./server_setup.js');
	server_setup.Fill_glob(glob);
	if (glob.websrv.cfg.webSrvLogEn === 'true') glob.log_disabled = false;

	logger.log('Select Version', glob.version);
	glob.electronEn = glob.websrv.cfg.webElectronEn;

	glob.mod.watcher = require('./watcher.js');
	glob.world_map = require(c.PAGE_REGS_USER_MAP);
	glob.reduced_world = belib.GetReducedWorld(glob.world_map.world);
	belib.WorldGenAccessMap(glob.world_map);
	const dgram = require('dgram');
	const srecv = dgram.createSocket('udp4');

	const ssend = dgram.createSocket('udp4');
	glob.ssend = ssend;
	const { confWebSrv } = container.cradle;
	confWebSrv.ConfigureWebsrv(glob.websrv.cfg);
	glob.websrv.MQTTsendCB = server_setup.MQTTsendCB;

	if (glob.world_map.world.cache_opts) glob.cache.cache_opts = glob.world_map.world.cache_opts;

	logger.log('world_map', glob.world_map);

	require('./electron.js').run(glob);

	process.on('exit', function (code) {
		logger.log('*** MAIN GOT EXIT *** code ', code);
		logger.destructor().then(() => {
			ex.DeinitAllServices();
		});
	});

	process.on('SIGINT', function () {
		logger.log('*** GOT SIGINT ***');
		DoExit();
	});

	process.on('SIGTERM', function () {
		logger.log('*** GOT SIGTERM ***');
		DoExit();
	});

	srecv.on('listening', async function () {
		const address = srecv.address();
		logger.debug('server listening ' + address.address + ':' + address.port);
		srecv.setMulticastTTL(128);
		srecv.addMembership(c.GROUP_ADDR, c.BUS_IP);
		await deleteTmpFiles();

		mbo.CreateTmpDirs();
		await glob.mod.watcher.init();
		startUpMain(container.cradle);

		await message_file_collector();
		await necronInit();
	});

	srecv.on('message', function (message) {
		on_message(message, ssend);
	});

	ssend.bind(c.BUS_PORT_SEND_WDT, c.BUS_IP);
	srecv.bind(c.BUS_PORT_RCV_WDT, c.GROUP_ADDR);

	srecv.on('error', function (err) {
		logger.debug('srecv error:' + err.stack);
		srecv.close();
	});
	ssend.on('error', function (err) {
		logger.debug('ssend error:' + err.stack);
		ssend.close();
	});

	setInterval(function () {
		logger.debug('busy_list', glob.busy_list);
	}, 1000);
}, 1000);
