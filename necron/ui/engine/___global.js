/**
 * Created by Ilya on 30.01.2020.
 */

import $ from 'jquery';

import calcBrowserMD5 from './___crypto';
import EventEmitter from 'wolfy87-eventemitter';
import { makeAutoObservable } from 'mobx';

//import {setGlobalCallback} from "./eventIoHandlerCore";

window.eparts = {
	//init 11 parts global
	elements: {},
	exampleformat: {},
	entry: () => {},
	prjApi: {
		ShowSlavePage: () => {}
	}
};

let browserGlobal = {};
try {
	if (typeof global != 'undefined') browserGlobal = global;
} catch (e) {
	console.log('global is undefined');
}
let global = {
	inited: false,
	changeCookToStore: true, //заменить куки на локальное хранилище
	TAG_MAIN: 'main',
	TAG_OVERLAY: 'overlay',
	TAG_MESSAGE: 'message',
	TAG_SYSTEM_MESSAGE: 'systemMessage',
	TAG_HEADER: 'page_header',
	TAG_PAGE: 'page_block',
	TAG_PAGECONTENT: 'page-content',
	TAG_TIPS: 'tips_block',
	TAG_FOOTER: 'page_footer',
	SRV_OBJ: {
		client: 'web',
		PageName: undefined,
		PagePrefix: undefined,
		PageRegionName: undefined
	},
	LOCAL: {
		virtGroup: undefined, //группа пользователя, если указано перекрывает действительную, используется в electron приложениях
		wizCmdArray: [],
		SettingInfo: {}
	},
	LANG_SRC: 'en', //Текущий язык
	LANG_NAMES: {}, //Текстовые названия языков
	LANG_LIB: {}, //Словари
	lng_kword_present: false, //уст в 1 если словари успешно подгружены
	doUpdate: false, //производится обновление
	callback: {
		md5: typeof eglobal !== 'undefined' ? eglobal.calcMD5 : calcBrowserMD5, //если используется electron, то считать MD5 с помощью node
		action: {
			system: {},
			event: {}
		}
	},
	//table:{},
	page_info: {
		default_page: '',
		sorted_type: {},
		sorted_style: {
			unconf: []
		},
		spec_pages: ['odm', 'onrdy', 'user_rl']
	},
	electron: {
		require: {}
	},
	settings: {},
	ui_collection: {},
	api: {
		translateEng: {
			t: (obj) => {}
		},
		util: {
			isStringCustom: (value) => typeof value === 'string' || value instanceof String
		},
		storagesEng: {
			detActionsOnInput: undefined,
			detActionsOnUI: undefined
		}
	},
	busy_prio: 0,
	cache: {
		contentClass: {},
		tabTree: {},
		savedAck: {}, //подтверждения сохраняемых конфигов
		uiIdPairs: {},
		uiIdTotalPairs: 0,
		wizLogicParam: {
			ignflt: undefined,
			sysevent: undefined,
			event: undefined,
			contentClass: '',
			pages: undefined
		},
		wizEvent: undefined,
		root_data: {},
		pages: {
			//используется только для кеширования buildObj и setting
			/* _format:{
                hashB:'',//BuildObj MD5
                hashS:'',//Setting MD5
                buildObj:'',
                setting:''
            }*/
		},
		hashT: '0', //общий MD5, всех settings и page
		hashTmap: []
	},
	socket: {
		id: 'client',
		socket_connect: false
	},
	clientId: undefined, //ID клиента
	exampleformat: {}, //Примеры использования элементов
	dnk: {
		overlay_cntr: 0,

		root: {
			exchange: undefined,
			tx_evt_name: 'globDNKtxTopic'
		},
		inited: false
	},
	DNKroot_Deduct: undefined,
	dnkReqInterval: 1000, //Интервал отправки запосов DNK
	dnkReqTimeout: 15000, //Таймаут ответа DNK, после кот. признается недоступность системы
	version: '', //Версия модификации
	disable_timers: 1,
	elements: {},
	MetaVar: {},
	EventListeners: {},
	useVKeyboard: false,
	vKeyboardType: 'simple',
	keepalive: 2000,
	unblockKeepalive: true,
	userEmitter: new EventEmitter(),
	wizardEmitter: new EventEmitter(),
	wizardCallback: undefined,
	defContentClass: '.page_block',
	window: {
		width: 0,
		height: 0
	},
	//MetaVar_BlockOnEvtChanged: false,
	serverEvent: [],
	pctrl: {
		//используется в PastController
	},
	//contentClass:undefined,
	logoutEn: true //разрешить/запретить logout
};

export function setGlobalCallback(name, cb) {
	global.callback[name] = cb;
}

export function getGlobalCallback(name) {
	return global.callback[name];
}

export function setGlobalVar(path, value) {
	let pathPrs = path.split('.');
	if (pathPrs.length > 1 && pathPrs[0] === 'global') {
		let glb = global;
		pathPrs.forEach((objName, index) => {
			if (index !== 0) {
				if (index === pathPrs.length - 1) glb[objName] = value;
				else glb = glb[objName];
			}
		});
	}
}

export function getGlobalVar(path) {
	let pathPrs = path.split('.');
	if (pathPrs.length > 1 && pathPrs[0] === 'global') {
		let glb = global;
		for (let n = 0; n < pathPrs.length; n++) {
			let objName = pathPrs[n];
			if (n !== 0) {
				if (n === pathPrs.length - 1) {
					// console.log("result",glb[objName]);
					return glb[objName];
				} else {
					if (glb[objName] === undefined) break;
					glb = glb[objName];
				}
			}
		}
	}
	alert(`not found global var by path ${path}`);
	return 'empty';
}

export function updateWizLogicParam(Obj) {
	global.cache.wizLogicParam = Obj;
}
//global.defContentClass = global.TAG_PAGECONTENT;
const MetaVar = global.MetaVar;

global.LANG_NAMES = {
	ru: 'Русский',
	en: 'English',
	fr: 'French',
	de: 'Deutch'
};

let __language = undefined;

console.log('global', global);
//global.SRV_OBJ['LANG']='en';
//global['callback']={};

//GlobalArea

global.api.webeventsEng = new (class {
	constructor() {
		this.registered = {};
	}
	//addDocEventListener(idx,listener,id){

	//}
	addEventListener(idx, listener, id) {
		if (!this.registered[idx]) {
			this.registered[idx] = {};
		}
		this.registered[idx][id] = listener;
	}
	removeEventListener(idx, listener, id) {
		// listener=undefined;
		if (!this.registered[idx]) return;

		this.registered[idx][id] = undefined;
		let detRegs = false;
		for (let id in this.registered[idx]) {
			if (this.registered[idx][id]) {
				detRegs = true;
			}
		}
		if (!detRegs) this.registered[idx] = undefined;
	}

	dispatchEvent(evt) {
		let idx = evt.type;
		if (this.registered[idx]) {
			for (let id in this.registered[idx]) this.registered[idx][id](evt);
		}
	}
})();

//webevents=document;
let webevents = global.api.webeventsEng; //события заменены на коллбэки

class systemStore {
	// naviCtrl={};
	//header=[];
	wizNavi = {
		ButtId: [], //button mname
		ButtText: [], //button nname
		Style: {} //button styles -  ButtId:class
	};
	tips = [];
	hideKeyboard = false;
	constructor() {
		makeAutoObservable(this);
	}
}
let elementBlock = {
	'.tips_block': [],
	'.page_block': []
};
class elementStore {
	block = {
		'.tips_block': [],
		'.page_block': []
	};
	event = {};
	constructor() {
		makeAutoObservable(this);
	}

	doRender(parent) {
		if (this.block[parent] === undefined) this.block[parent] = [];

		return this.block[parent].map((item) => {
			return this.getElementCallback({ child: item, parent: parent }).e;
		});
	}
	getElementCallback({ child, parent }) {
		return elementBlock[parent].find((item) => {
			return item.id === child;
		});
	}
	searchBlock(rm_elem) {
		for (const elem in this.block) {
			const item = this.block[elem];
			for (let n = 0; n < item.length; n++) {
				let id = item[n];
				if (id === rm_elem) return { child: id, parent: elem };
			}
			// if (item===rm_elem){
			//    return true;
			// }
		}
		return undefined;
	}
	removeGroupBlock(parent) {
		if (!elementBlock[parent]) return false;

		elementBlock[parent].forEach((elBlock) => {
			if (!this.removeGroupBlock(elBlock.id)) {
				this.removeBlock({ child: elBlock.id, parent: parent });
			}
		});

		elementBlock[parent] = [];
		this.block[parent] = [];
		return true;
	}

	removeBlock({ child, parent }) {
		if (elementBlock[parent]) {
			elementBlock[parent] = elementBlock[parent].filter((item) => {
				return item.id !== child;
			});

			this.block[parent] = this.block[parent].filter((id) => {
				return id !== child;
			});
		}
	}
	addBlock(parent, child, callback) {
		if (!elementBlock[parent]) elementBlock[parent] = [];

		if (Array.isArray(elementBlock[parent])) {
			elementBlock[parent].push({ id: child, e: callback });
			if (!this.block[parent]) this.block[parent] = [];
			this.block[parent].push(child);
		} else {
			alert(`React block ${child} not array. Error add block`);
		}
	}
}

let mobXstore = {
	system: new systemStore(),
	element: new elementStore()
};

function addExampleFormat(name, object) {
	global.exampleformat[name] = object;
}

export function setTabTree(parent, val) {
	global.cache.tabTree[parent] = val;
}
export default global;
export { webevents, global, __language, MetaVar, browserGlobal, $, mobXstore, addExampleFormat };
