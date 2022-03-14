let glob = {
	reduced_world: {},
	world_map: {},
	web: {},
	io: {},
	DoExit_Var: false,
	electronEn: false,
	cluster_stop: 1,
	cluster_ready: 0,
	log_disabled: true,
	websrv: {
		cfg: {},
		MQTTsendCB: {}
	},
	cnoda_cfg: {},
	version: '',
	busy_list: {},
	ssend: {},
	Server: { UserCount: 0, WEBCliCount: 0, User: {} },
	sendServerInfoStat: false,
	kAlive: {},
	mqMode: false,
	beioTopic: 'beio',
	busy_timeout_tmr: undefined,
	busy_timeout: 300000,
	enable_rebuild_odm: false,
	base_dir: __dirname,
	cache: {
		pages: {
			/*_format:{
                hashB:'',//BuildObj MD5
                hashS:'',//Setting MD5
                buildObj:'',
                setting:''
            }*/
		},
		devId: {
			_format: 'data'
		},
		pageCnt: 0,
		hashT: '', //MD5 hash BuildObj ans Setting
		cache_opts: {
			deny: {
				buildObj: [],
				setting: ['dnk', 'distro'],
				devId: []
			}
		}
	},
	BuildDevices: {},
	DevicesList: {},
	jnoda_is_ready: false,
	mod: {
		watcher: {}
	}
};

module.exports = {
	glob
};
