const c = require('../../backCore');
const logger = c.getLogger();
const ex = require('../../exec.js');
let { glob } = require('./main_global.js');
const mbo = require('./main_buildObj.js');
const { SendToJnoda, TryStopJnoda, ReStart_JNoda } = require('./main_cluster.js');
const { RebuildMAP_ForDevices } = require('./main_buildObj.js');
let sh = require('../../shared.js');
const CNODA = 'Cnoda';
let cnodaSrv;

let RestartUdev = () => {
	if (glob.world_map.world.udev) {
		logger.debug('enable udev');
		ex.ExecNoOutAsync('udevadm trigger');
	} else logger.debug('disable udev');
};

function WaitTermJNODA() {
	logger.log('WaitTermJNODA');
	if (glob.cluster_stop) {
		logger.log('MAIN exit');
		process.exit(0);
	} else setTimeout(WaitTermJNODA, 200);
}

function DeinitAllAndExit() {
	if (ex.CheckDeinitAllServices() === false) {
		setTimeout(DeinitAllAndExit, 200);
	} else {
		WaitTermJNODA();
	}
}

function Stop() {
	glob.DoExit_Var = true;
	glob.cluster_ready = 0;
	logger.log('main Stop');
	ex.DeinitAllServices();
	DeinitAllAndExit();
}

function DoExit() {
	Stop();
}

let startUpMain = ({ web, webControlAdapter }) => {
	//const __web = require('../web.js');
	web.init();
	glob.web = webControlAdapter; //new __web.control();
	const io_events = webControlAdapter.GetIOEventContext();

	const { BuildDevices } = require('../../buildObj/dyn_devices.js');
	glob.BuildDevices = BuildDevices();

	me = require('./main_evdev.js');
	glob.DevicesList = me.DevicesList;

	io_events.on('to_jnoda', (data) => {
		SendToJnoda(data);
	});

	io_events.on('rebuild', () => {
		logger.log('do rebuild all buildObj');
		glob.enable_rebuild_odm = true;
		sh.RemoveBuildObjFromCache();
		ReBuildAllObj();
	});

	io_events.on('term', () => {
		logger.log('do terminate');
		TryStopJnoda();
		DoExit();
	});

	io_events.on('cnoda', () => {
		logger.log('do restart Cnoda');
		ReStart_CNoda();
	});

	io_events.on('jnoda', () => {
		logger.log('do restart Jnoda');
		ReStart_JNoda();
	});

	io_events.on('udev', () => {
		logger.log('do restart udev');
		RestartUdev();
	});

	io_events.on('stop', () => {
		logger.log('do stop Cnoda');
		//cnoda_srv
		ex.ServiceCtrl(cnodaSrv, 'stop');
	});

	io_events.on('start', () => {
		logger.log('do start Cnoda');
		ex.ServiceCtrl(cnodaSrv, 'start');
	});
};

function ReStart_CNoda() {
	logger.debug('ReStart Cnoda');
	const log = {
		aal_lines_in_block: 1000,
		aal_path: '/var/run/svclog/',
		aal_save_style: 1
	};
	if (glob.websrv.cfg.cn_aal_path !== undefined) {
		log.aal_path = glob.websrv.cfg.cn_aal_path;
		log.aal_lines_in_block = glob.websrv.cfg.cn_aal_lines_in_block;
		log.aal_save_style = glob.websrv.cfg.cn_aal_save_style;
		log.aal_max_blocks = glob.websrv.cfg.cn_aal_max_blocks;
		log.aal_sync_time = 5;
		cnodaSrv = ex.Service(
			c.CNODA_PATH + '/' + CNODA,
			'--conf=' + c.CNODA_PATH + '/Cnoda.json',
			'restart',
			{
				log: log
			}
		);
	} else {
		cnodaSrv = ex.Service(
			c.CNODA_PATH + '/' + CNODA,
			'--conf=' + c.CNODA_PATH + '/Cnoda.json',
			'restart',
			{
				log: log
			}
		);
	}
}
async function Start() {
	mbo.SyncDefaultSettings();
	ReBuildAllObj();
	ReStart_CNoda();
}
function ReBuildAllObj() {
	mbo.StaticGen();
	for (const key in glob.DevicesList) {
		logger.debug('rebuild device BuildObj', key);
		CreateDeviceBuildObj(key);
	}

	RebuildMAP_ForDevices(glob.BuildDevices, glob.DevicesList);
	mbo.PageMAP_ToUnconfigured();
}
async function deleteTmpFiles() {
	logger.debug('DeleteTmpFiles');
	ex.ExecNoOutSync('rm ' + c.DEVID_CACHE_PATH + '/devid.*');
	ex.ExecNoOutSync('rm ' + c.BUILDOBJ_CACHE_PATH + '/buildObj.*');
	ex.ExecNoOutSync('rm ' + c.CACHE_PATH + '/gsm_*');
}

function CreateDeviceBuildObj(objIdx) {
	if (glob.DevicesList[objIdx] === undefined) return;
	const type = glob.DevicesList[objIdx].type;
	if (glob.BuildDevices[type] !== undefined) {
		for (const dynamic in glob.BuildDevices[type].BuildObj) {
			glob.BuildDevices[type].BuildObj[dynamic](
				glob.BuildDevices[type].pname,
				glob.DevicesList[objIdx]
			);
		}
	}
}
function CMD_restart_setting(arrSetting_name) {
	if (mbo.PageMAP_ToUnconfigured() === c.ERROR) {
		logger.debug('CMD_restart_setting send needconf');
		glob.web.SendEventIO_Broadcast(c.GenResponseEventObj({ action: 'needconf', needconf: '' }));
	}

	if (glob.jnoda_is_ready === false) {
		//Если jnoda не запущена, перезагрузить сервера
		logger.debug('Jnoda not ready, restart CNoda and JNoda');
		glob.cluster_ready = 0;
		ReStart_JNoda();
		return;
	}

	arrSetting_name.forEach((item) => {
		let set = sh.GetSettingDevid(item);
		if (set) {
			const pack = { action: 'rst_set', rst_set: { req: 'apply', apply: set } };
			SendToJnoda(c.PackToJnodaEvent(pack));
		}
	});
}

function CMD_server_reboot(srv) {
	///!!! not move ReBuildAllObj, need for dyn device (conf/unconf)
	if (mbo.PageMAP_ToUnconfigured() === c.NO_ERROR) {
		//console.log('PageMAP_ToUnconfigured result==NO_ERROR');
		srv.forEach((srvItem) => {
			switch (srvItem) {
				case 'allsrv': //используется при apply, происходит перезагрузка всех серверов
					logger.debug('srv all restart');
					glob.DoExit_Var = true;
					TryStopJnoda();
					DoExit(); //necron должен затем перезагрузить
					break;
				case 'csrv': //вроде как нигде не используется
					logger.debug('srv c++ restart');
					ReStart_CNoda();
					break;
				case 'jssrv': //шлет только Cnoda при старте
					logger.debug('srv js restart');
					glob.cluster_ready = 0;
					ReStart_JNoda();
					break;
			}
		});
	} else {
		logger.debug('CMD_server_reboot send needconf');
		glob.web.SendEventIO_Broadcast(c.GenResponseEventObj({ action: 'needconf', needconf: '' }));
	}
}

module.exports = {
	Start,
	startUpMain,
	deleteTmpFiles,
	CMD_server_reboot,
	CMD_restart_setting,
	CreateDeviceBuildObj,
	RestartUdev,
	DoExit
};
