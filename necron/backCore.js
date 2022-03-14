const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const fs = require('fs');

const { glob } = require('./web/be/main_global.js');
const { ConsoleLogger } = require('./logger.js');
const { deflate } = require('zlib');

const {
	PAGE_PREFIX,
	JSON_PACK_TYPE_INIT_ME,
	PROTO_VERS,
	JSON_PACK_TYPE_SEND_EVENT,
	JSON_PACK_TYPE_TO_JNODA,
	JSON_PACK_TYPE_SET_SYSTEM,
	PAGE_REGS_CACHE_MAP,
	CACHE_PATH,
	SETTINGS_STOR,
	CNODA_PATH,
	BUS_PORT_SEND,
	GROUP_ADDR,
	LAN_MODE_STATIC,
	WLAN_IFACES,
	WLAN_TABLE_OFFS,
	DEBUG_IFACE,
	BUS_PORT_RCV,
	BUS_PORT_SEND_WDT,
	BUS_PORT_SEND_CSRV,
	BUS_PORT_RCV_WDT,
	BUS_PORT_WEBUI_TO_CNODA,
	BUS_IP,
	HOSTAPD_CONF,
	HOSTAPD_IFACE,
	BRIDGE_NAME,
	DNSMASK_LEASES_LOG,
	IPTABLES,
	DISABLED_NAT_RULES,
	ROOT_PATH,
	CACHE_PATH_ELJ,
	CACHE_PATH_WEB,
	CACHE_PATH_NEC,
	PPPD_PATH,
	DEVICES_PATH,
	PRJ_DEV_PATH,
	FW_PATH,
	GSMX_DATA_PATH,
	DOWNLOAD_PATH,
	SHARED_PATH,
	SRVIOT_JS_PATH,
	BUILDOBJ_PATH,
	BUILDOBJ_CACHE_PATH,
	NO_ERROR,
	ERROR,
	DEBUG,
	CHECK_IP_DEFAULT,
	CHK_INTERNET_TIME_MS,
	CHK_LINK_TIME_MS,
	UDHCPC_CONFIG,
	UDHCPC_DEBUG_CONFIG,
	JSON_PACK_TYPE_WD_RESTART,
	JSON_PACK_TYPE_FROM_CNODA,
	JSON_PACK_TYPE_TO_CNODA,
	JSON_PACK_TYPE_TO_UI,
	JSON_PACK_TYPE_TO_WEB_SRV,
	GSM_DETECT_SCRIPT,
	PAGE_REGS_USER_MAP,
	DEBUG_BE,
	DEVID_CACHE_PATH,
	WEB_SRV_LOG_FILE,
	JNODA_LOG_FILE,
	GSETTINGS_STOR,
	DEFSETTINGS_STOR,
	LOG_FOLDERS,
	bb_path,
	CNODA_CFG_PATH,
	DHCPCD_CONFIG,
	JNODA_PATH,
	SVCLOG_PARAM_PATH
} = require('./config');

function GenRequestInitMe() {
	console.log('Jnoda init me');
	return JSON.stringify({ t: [JSON_PACK_TYPE_INIT_ME, PROTO_VERS] });
}

function PackToJnodaEvent(evobj) {
	return { t: [JSON_PACK_TYPE_TO_JNODA, PROTO_VERS], d: evobj };
}

function GenSystemPack(json, socket_id) {
	return ConvToCSrvFormat(JSON_PACK_TYPE_SET_SYSTEM, json, socket_id);
}
function GenResponseEventObj(evobj, sid) {
	return {
		t: [JSON_PACK_TYPE_SEND_EVENT, PROTO_VERS],
		d: evobj,
		sid: sid
	};
}

async function GenResponseZipEventObj(evobj, sid) {
	return new Promise((resolve, reject) => {
		deflate(JSON.stringify(evobj), (err, buffer) => {
			console.log('got gzip sz', buffer.length, 'err', err);
			if (err) {
				console.error('An error occurred:', err);
				reject();
			} else {
				resolve({
					t: [JSON_PACK_TYPE_SEND_EVENT, PROTO_VERS],
					d: buffer.toString('base64'),
					comp: 'base64gzip',
					sid: sid
				});
			}
		});
	});
}

function GenActionPack(action, data, client, sid) {
	if (client === undefined) client = '';

	let body = {
		action: action,
		client: client
	};
	body[action] = data;
	return GenResponseEventObj(body, sid);
}

function GenWebeventPack(req, result) {
	let data = {
		req: req,
		result: result
	};
	return GenActionPack('webevent', data);
}
function GenPageRegsInCacheMAP_Name(mapfn) {
	return CACHE_PATH + '/' + mapfn + PAGE_REGS_CACHE_MAP;
}

function FindSetting(name) {
	let cname = SETTINGS_STOR[0] + '/' + name + '.set';
	if (fs.existsSync(cname)) return true;
	else {
		cname = SETTINGS_STOR[1] + '/' + name + '.set';
		return fs.existsSync(cname);
	}
}

function GetSettingPath(name) {
	let cname = SETTINGS_STOR[0] + name + '.set';
	if (fs.existsSync(cname)) return cname;
	else GetSetting(name); //Sync setting, may be default

	if (fs.existsSync(cname)) return cname;

	return '';
}

function GetSetting(name) {
	let cfgBaseNameSpl = name.split('.');
	let cfgBaseName;

	if (cfgBaseNameSpl.length >= 2 && cfgBaseNameSpl[0] === 'settings') {
		cfgBaseName = cfgBaseNameSpl.slice(1).join('.');
	}

	if (cfgBaseName && glob?.cache?.pages?.[cfgBaseName]) {
		if (glob.cache.pages[cfgBaseName].setting) {
			console.log('Load settings from cache', cfgBaseName);
			return glob.cache.pages[cfgBaseName].setting;
		} else {
			console.log('Settings for', cfgBaseName, 'not exists');
			return '{}';
		}
	}

	console.log(
		`Load settings ${CNODA_PATH}/gset ${name} ${SETTINGS_STOR[0]} ${SETTINGS_STOR[1]} ${SETTINGS_STOR[2]}`
	);
	return execSync(
		`${CNODA_PATH}/gset ${name} ${SETTINGS_STOR[0]} ${SETTINGS_STOR[1]} ${SETTINGS_STOR[2]}`
	);
}

function GetSettingPromise(name) {
	let cfgBaseNameSpl = name.split('.');
	let cfgBaseName;

	if (cfgBaseNameSpl.length >= 2 && cfgBaseNameSpl[0] === 'settings') {
		cfgBaseName = cfgBaseNameSpl.slice(1).join('.');
	}

	if (cfgBaseName && glob?.cache?.pages?.[cfgBaseName]) {
		if (glob.cache.pages[cfgBaseName].setting) {
			console.log('Load settings from cache', cfgBaseName);
			return glob.cache.pages[cfgBaseName].setting;
		} else {
			console.log('Settings for', cfgBaseName, 'not exists');
			return '{}';
		}
	}

	console.log(
		`Load settings prom /gset ${name} ${SETTINGS_STOR[0]} ${SETTINGS_STOR[1]} ${SETTINGS_STOR[2]}`
	);
	return new Promise((resolve) =>
		exec(
			`${CNODA_PATH}/gset ${name} ${SETTINGS_STOR[0]} ${SETTINGS_STOR[1]} ${SETTINGS_STOR[2]}`,
			(error, stdout) => {
				resolve(stdout);
			}
		)
	);
}

function SaveSignSettingForBash(orig_file, sett_name) {
	return `cat ${orig_file}|${CNODA_PATH}/sset ${sett_name} ${SETTINGS_STOR[0]} ${SETTINGS_STOR[1]}`;
}

function SaveFileToSettingStor(name, data) {
	fs.writeFileSync(SETTINGS_STOR[0] + '/' + name, data, 'utf-8');
	fs.writeFileSync(SETTINGS_STOR[1] + '/' + name, data, 'utf-8');
}

function SaveSignSetting(sett_name, data) {
	SaveFileToSettingStor(sett_name + '.set', data);
	SaveSignSettingForBash(SETTINGS_STOR[0] + '/' + sett_name + '.set', sett_name);
}

function ConvertSettingsToShort(json) {
	const out = { type: 'settings', page: json['PageName'] };

	const data = json['data'];

	for (const idx in data) {
		if (data[idx].value) out[idx] = data[idx].value;
	}
	return out;
}

function send_to_cnoda(ssend, json) {
	if (ssend && json) {
		let buf = Buffer.from(json, 'utf8');

		try {
			ssend.send(buf, 0, buf.byteLength, BUS_PORT_SEND, GROUP_ADDR);
		} catch (e) {
			console.log('Error send data to Cnoda');
		}
	}
}

function ConvToCSrvFormat(cmd, json, socket_id) {
	const out = {
		t: [cmd, 1],
		d: json,
		sid: socket_id
	};

	return JSON.stringify(out);
}

let process_shutdown = 0;
function ProcessSend(obj, logger) {
	if (!logger)
		logger = (arg) => {
			console.log(arg);
		};
	try {
		if (process_shutdown === 0) {
			process.send(obj);
		}
	} catch (e) {
		logger('Process send error', e);
	}
}

let logger = ConsoleLogger;

module.exports = {
	PAGE_PREFIX,
	process_shutdown,
	LAN_MODE_STATIC,
	WLAN_IFACES,
	WLAN_TABLE_OFFS,
	DEBUG_IFACE,
	BUS_PORT_SEND,
	BUS_PORT_RCV,
	BUS_PORT_SEND_WDT,
	BUS_PORT_RCV_WDT,
	BUS_PORT_SEND_CSRV,
	BUS_PORT_WEBUI_TO_CNODA,
	BUS_IP,
	GROUP_ADDR,
	HOSTAPD_CONF,
	HOSTAPD_IFACE,
	BRIDGE_NAME,
	DNSMASK_LEASES_LOG,
	IPTABLES,
	DISABLED_NAT_RULES,
	ROOT_PATH,
	CACHE_PATH,
	CACHE_PATH_ELJ,
	CACHE_PATH_WEB,
	CACHE_PATH_NEC,
	PPPD_PATH,
	DEVICES_PATH,
	PRJ_DEV_PATH,
	FW_PATH,
	GSMX_DATA_PATH,
	DOWNLOAD_PATH,
	SHARED_PATH,
	SRVIOT_JS_PATH,
	BUILDOBJ_PATH,
	BUILDOBJ_CACHE_PATH,
	CNODA_PATH,
	NO_ERROR,
	ERROR,
	DEBUG,
	CHECK_IP_DEFAULT,
	CHK_INTERNET_TIME_MS,
	CHK_LINK_TIME_MS,
	UDHCPC_CONFIG,

	UDHCPC_DEBUG_CONFIG,
	JSON_PACK_TYPE_WD_RESTART,
	JSON_PACK_TYPE_SEND_EVENT,
	PROTO_VERS,
	JSON_PACK_TYPE_SET_SYSTEM,
	JSON_PACK_TYPE_TO_JNODA,
	JSON_PACK_TYPE_FROM_CNODA,
	JSON_PACK_TYPE_TO_CNODA,
	JSON_PACK_TYPE_TO_UI,
	JSON_PACK_TYPE_TO_WEB_SRV,
	GSM_DETECT_SCRIPT,
	PAGE_REGS_USER_MAP,
	DEBUG_BE,
	DEVID_CACHE_PATH,
	JNODA_LOG_FILE,
	WEB_SRV_LOG_FILE,
	GSETTINGS_STOR,
	DEFSETTINGS_STOR,
	LOG_FOLDERS,
	bb_path,
	CNODA_CFG_PATH,
	DHCPCD_CONFIG,
	JNODA_PATH,
	SVCLOG_PARAM_PATH,
	GetSetting,
	GetSettingPromise,
	GetSettingPath,
	SaveSignSettingForBash,
	SaveFileToSettingStor,
	SaveSignSetting,
	FindSetting,
	ConvertSettingsToShort,
	send_to_cnoda,
	ConvToCSrvFormat,
	GenSystemPack,
	GenWebeventPack,
	GenActionPack,
	GenRequestInitMe,
	GenResponseZipEventObj,
	GenResponseEventObj,
	PackToJnodaEvent,
	GenPageRegsInCacheMAP_Name,
	ProcessSend,
	getLogger: () => logger,
	setLogger: (l) => {
		logger = l;
	}
};
