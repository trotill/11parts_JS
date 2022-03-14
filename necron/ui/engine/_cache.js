import { global } from './___global.js';
import { wizConvBuildObjToWiz } from '../visual/component/buildObj/base/wizard_func.ts';
import { u } from './_core';
import { GetAllMeta } from './_metaVar';
import { SendActionSocketIO } from './event';

class cacheAdm {
	constructor() {}
	getBlockReloadStat(contentClass, pageName) {
		let placeOpts =
			global.SRV_OBJ.world.regions[global.SRV_OBJ.PageRegionName].placeOpts[contentClass];
		for (let opt in placeOpts) {
			if (placeOpts[opt].place === 'blockReload') {
				if (placeOpts[opt].opts.page.indexOf(pageName) !== -1) return false;
			}
		}
		return true;
	}
	getReloadOnDiffParamStat(contentClass, pageName, setting) {
		let placeOpts =
			global.SRV_OBJ.world.regions[global.SRV_OBJ.PageRegionName].placeOpts[contentClass];
		for (let opt in placeOpts) {
			if (placeOpts[opt].place === 'reloadParamSettVsMVar') {
				if (placeOpts[opt].opts.page.indexOf(pageName) !== -1) {
					let jsonSett = JSON.parse(setting);
					let MVar = GetAllMeta(contentClass);
					for (let n = 0; n < placeOpts[opt].opts.param.length; n++) {
						let selParam = placeOpts[opt].opts.param[n];
						if (u(MVar[selParam]) && u(jsonSett.d[selParam])) {
							if (MVar[selParam].value !== jsonSett.d[selParam]) return 1;
						}
					}
				}
			}
		}
		return 0;
	}
	detSettChanges(setting) {
		//определяет есть ли отличия новой настройки от MetaVar
		let jsonSett = JSON.parse(setting);
		let jsonSettD = jsonSett.d;
		let MVar = GetAllMeta('.page_block');
		for (let sKey in jsonSettD) {
			if (sKey === 'page') continue;
			if (sKey === 'type') continue;
			if (u(MVar[sKey])) {
				if (MVar[sKey].value !== jsonSettD[sKey]) return 1;
			}
		}
		return 0;
	}
	syncPageCache(items) {
		let contentClass = global.cache.contentClass[global.SRV_OBJ.PageName];
		global.unblockKeepalive = false;
		let pages = items.pages;
		let reInit = false;
		try {
			if (items.hashTmap.length !== 0) reInit = true;
		} catch (e) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
		if (reInit) {
			global.cache.pages = {};
			global.cache.hashTmap = items.hashTmap;
		}
		let rebuildSrcPage = false;
		let subpage = this.getSubpage(global.SRV_OBJ.PageName);
		for (let pname in pages) {
			let spIndexOf = subpage.indexOf(pname);
			if (pages[pname].setting !== undefined) {
				if (pname === global.SRV_OBJ.PageName || spIndexOf !== -1) {
					//если пользователь на выбранной странице
					if (this.getReloadOnDiffParamStat(contentClass, pname, pages[pname].setting)) {
						//если есть отличия MetaVar от новой настройки, то перегенерить страницу
						rebuildSrcPage = true;
					}
				}
				this.addSettingToCache(pname, pages[pname].setting);
			}
			if (pages[pname].buildObj !== undefined) {
				this.addPageToCache(pname, pages[pname].buildObj);
				if (pname === global.SRV_OBJ.PageName) {
					//если пришла стр. на кот. находимся, то перестроить
					rebuildSrcPage = true;
				}
			}
		}
		if (rebuildSrcPage) {
			//перестроение нужно делать, после кэширования всего списка, т.к. это может быть мультистраницы
			if (u(global.cache.contentClass[global.SRV_OBJ.PageName])) {
				if (u(contentClass) && this.getBlockReloadStat(contentClass, global.SRV_OBJ.PageName)) {
					//если страница не заблокирована для обновления, то обновить
					global.callback.BuildPage(() => {}, contentClass, global.SRV_OBJ.PageName);
				}
			}
		}
		global.unblockKeepalive = true;
		// this.reCalcTotalHash();
	}
	reCalcTotalHash() {
		let str = '';
		global.unblockKeepalive = false;
		global.cache.pageCnt = Object.keys(global.cache.pages).length;
		if (global.cache.pageCnt !== global.cache.hashTmap.length) {
			for (let pnD in global.cache.pages) {
				if (global.cache.hashTmap.indexOf(pnD) === -1) {
					console.log('Error hashTmap,', pnD);
				}
			}
			global.unblockKeepalive = true;
			return;
		}

		for (let n = 0; n < global.cache.hashTmap.length; n++) {
			let pName = global.cache.hashTmap[n];
			// if (global.cache.pages[pName]===undefined)
			//    continue;
			if (global.cache.pages[pName].hashB) str += global.cache.pages[pName].hashB;
			if (global.cache.pages[pName].hashS) str += global.cache.pages[pName].hashS;
		}

		global.unblockKeepalive = true;
		global.cache.hashT = global.callback.md5(str);
	}
	respAllHash() {
		global.unblockKeepalive = false;
		let hashList = {};
		for (let page in global.cache.pages) {
			hashList[page] = {
				hashS: global.cache.pages[page].hashS,
				hashB: global.cache.pages[page].hashB
			};
		}
		global.unblockKeepalive = true;
		return hashList;
	}
	genSettingPack(data, sid) {
		return {
			t: [1, 1],
			d: data,
			sid: sid
		};
	}
	addSettingArrayToCache(settingsArr, sid) {
		for (let n = 0; n < settingsArr.length; n++) {
			//в wizard loadset это массив settings, а у страницы это один обьект
			let pageName = settingsArr[n].page;

			let setPack = this.genSettingPack(settingsArr[n], sid);
			if (global.cache?.pages?.[pageName]?.setting) {
				//Если setting не было, значит его нельзя сохранять, предполагается что сервер лучше знает, никакой самоволки на стороне клиента.
				let stPack = JSON.stringify(setPack);
				global.cache.pages[pageName].hashS = global.callback.md5(stPack);
				global.cache.pages[pageName].setting = setPack;
			}
		}
		this.reCalcTotalHash();
	}

	getSubpage(pageName) {
		if (!global.cache?.pages?.[pageName]?.subpage) return [];
		return global.cache.pages[pageName].subpage;
	}
	addPageToCache(pageName, textData) {
		if (global.cache.pages[pageName] === undefined)
			global.cache.pages[pageName] = {
				buildObj: '',
				hashB: ''
			};

		global.cache.pages[pageName].hashB = global.callback.md5(textData);
		let parsedData = JSON.parse(textData);
		global.cache.pages[pageName].buildObj = wizConvBuildObjToWiz(
			pageName,
			parsedData[Object.keys(parsedData)[0]]
		);
		const wlogic = global.cache.pages[pageName].buildObj.find((elem) => elem.type === 'wizlogic');
		global.cache.pages[pageName].subpage = [];
		if (wlogic.pages) {
			for (let p in wlogic.pages) {
				global.cache.pages[pageName].subpage.push(p);
			}
		}

		this.reCalcTotalHash();
		//Regexp only symbols replace(/[^\w]/g, "")
	}
	addSettingToCache(pageName, textData) {
		if (!global.cache.pages[pageName])
			global.cache.pages[pageName] = {
				setting: '',
				hashS: ''
			};

		global.cache.pages[pageName].hashS = global.callback.md5(textData);
		global.cache.pages[pageName].setting = JSON.parse(textData);
		this.reCalcTotalHash();
		//Regexp only symbols replace(/[^\w]/g, "")
	}
	getSettingFull(name) {
		if (global.cache?.pages?.[name]?.setting) return global.cache.pages[name].setting;
		else return { d: undefined };
	}
	getSettingData(name) {
		return this.getSettingFull(name).d;
	}
	reqAllHash() {
		SendActionSocketIO({
			action: 'respAllHash',
			data: {
				client: global.SRV_OBJ.client,
				ts: Math.floor(Date.now() / 1000),
				hashT: global.cache.hashT,
				hashMap: global.cache.cacheAdm.respAllHash(),
				PageRegionName: global.SRV_OBJ.PageRegionName
			}
		});
	}
}

global.cache.cacheAdm = new cacheAdm();
