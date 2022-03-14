let fs = require('fs');
let c = require('./backCore.js');
let crypto = require('crypto');
let sh = require('./shared.js');
let { glob } = require('./web/be/main_global.js');
let { rmBackPath } = require('./configUtil.js');
const { RebuildMAP_ForDevices } = require('./web/be/main_buildObj.js');
let regenBuildObjEmpty = false;
let debug = false;

function log() {
	if (debug) {
		let str = '';
		for (i = 0; i < arguments.length; i++) {
			str += arguments[i] + ' ';
		}

		console.log(str);
	}
}

async function readFile(file) {
	return new Promise((resolve) =>
		fs.readFile(file, (err, data) => {
			resolve({ err: err, data: data });
		})
	);
}

function isNotDeny(group, pname) {
	if (!glob.cache.cache_opts.deny[group]) return true;

	//log('deny',glob.cache.cache_opts.deny);
	let result = glob.cache.cache_opts.deny[group].indexOf(pname) === -1;
	if (result) log('isNotDeny pname', pname, result);

	return result;
}

function regenBuildObjOnSett(pname) {
	log('regenBuildObjOnSett pname', pname);
	if (regenBuildObjEmpty) return;
	if (!glob.cache.cache_opts.regenBuildObj) {
		regenBuildObjEmpty = true;
		return;
	}

	if (!glob.cache.cache_opts.regenBuildObj[pname]) return;

	glob.cache.cache_opts.regenBuildObj[pname].forEach((regenPage) => {
		log('rebuild from regenBuildObjOnSett', regenPage);
		let Boname = `${c.BUILDOBJ_PATH}/${regenPage}.js`;
		fs.stat(Boname, (err) => {
			if (err === null) require(`${c.BUILDOBJ_PATH}/${regenPage}.js`).Build();
		});
	});
}

function reCalcTotalHash() {
	let str = '';
	glob.cache.hashTmap = [];

	for (let n in glob.cache.pages) {
		if (glob.cache.pages[n].hashB) str += glob.cache.pages[n].hashB;
		if (glob.cache.pages[n].hashS) str += glob.cache.pages[n].hashS;
		glob.cache.hashTmap.push(n);
	}

	glob.cache.pageCnt = glob.cache.hashTmap.length;
	// log('reCalcTotalHash hashTmap',glob.cache.hashTmap,'page cnt',glob.cache.pageCnt);

	glob.cache.hashT = crypto.createHash('md5').update(str).digest('hex'); //glob.callback.md5(str);
}

async function syncAllSettings() {
	//log('syncAllSettings');
	let searchedFiles = await new Promise((resolve) =>
		fs.readdir(c.GSETTINGS_STOR, (err, files) => {
			resolve(files);
		})
	);

	// log('syncAllSettings',content);
	for (let n = 0; n < searchedFiles.length; n++) {
		//  log('searchedFiles',searchedFiles[n]);
		let splCont = searchedFiles[n].split('.');
		if (splCont.length === 0) continue;
		let ext = splCont[splCont.length - 1];
		let type = splCont[0];
		// log('splCont',splCont);
		let cfgName = splCont.slice(1, -1).join('.');
		if (
			splCont.length >= 3 &&
			ext === 'set' &&
			type === 'settings' &&
			isNotDeny('setting', cfgName)
		) {
			let fRes = await readFile(c.GSETTINGS_STOR + searchedFiles[n]);
			log('add cfgName', cfgName, 'err', fRes.err, 'rd', c.GSETTINGS_STOR + searchedFiles[n]);
			if (fRes.err === null) {
				//log("sett",cfgName,fRes.data.toString('utf8'));
				//log("");
				let dataToString = fRes.data.toString('utf8');
				try {
					//если файл не парсится, то он пропускается на добавление в БД, возможно настройка повредилась
					JSON.parse(dataToString);
					glob.cache.pages[cfgName] = {
						setting: dataToString,
						hashS: crypto.createHash('md5').update(fRes.data).digest('hex')
					};
				} catch (e) {
					// settErr=1;
					console.log(
						`settings.${cfgName}.set, parse error, data ${dataToString}, skip add to cache`
					);
				}

				if (splCont.length === 3 && isNotDeny('buildObj', cfgName)) {
					//для конфигов их 3х составляющих settings.name.set кэшировать buildObj
					//если кешируется конфиг с buildObj
					let buildObjName = 'buildObj.' + splCont[1] + '.json';
					//log('try add buildObj',c.CACHE_PATH+'/'+buildObjName);
					let bRes = await readFile(c.BUILDOBJ_CACHE_PATH + '/' + buildObjName);
					if (bRes.err === null) {
						log(
							'add buildObj',
							buildObjName,
							'err',
							bRes.err,
							'rd',
							c.CACHE_PATH + '/' + buildObjName
						);
						glob.cache.pages[cfgName].buildObj = bRes.data.toString('utf8');
						glob.cache.pages[cfgName].hashB = crypto
							.createHash('md5')
							.update(bRes.data)
							.digest('hex');
						MergeSettingsBuildObj(cfgName);
						//MergeBuildObjSettings(cfgName);
						// log('glob.cache.pages[cfgName]', glob.cache.pages[cfgName]);
					}
				}
			}
		}
	}
}

async function syncAllBuildObj() {
	let searchedFiles = await new Promise((resolve) =>
		fs.readdir(c.BUILDOBJ_CACHE_PATH, (err, files) => {
			resolve(files);
		})
	);
	for (let n = 0; n < searchedFiles.length; n++) {
		let filename = searchedFiles[n];
		let splCont = searchedFiles[n].split('.');

		if (splCont.length === 0) continue;
		let cfgName = splCont.slice(1, -1).join('.');
		log('buildObj cfgName', cfgName);

		if (!glob.cache.pages[cfgName]) {
			glob.cache.pages[cfgName] = {};
		}
		if (!glob.cache.pages[cfgName].buildObj && isNotDeny('buildObj', cfgName)) {
			let res = await readFile(c.BUILDOBJ_CACHE_PATH + '/' + filename);
			if (res.err === null) {
				log('add buildObj to cache', cfgName);
				glob.cache.pages[cfgName].buildObj = res.data.toString('utf8');
				glob.cache.pages[cfgName].hashB = crypto.createHash('md5').update(res.data).digest('hex');
				// MergeBuildObjSettings(cfgName);
			}
		}
	}
}

function MergeBuildObjSettings(cfgName) {
	if (!glob.cache.pages[cfgName].buildObj) return;

	let objBuildObj = JSON.parse(glob.cache.pages[cfgName].buildObj);

	let objSetting = {
		d: {}
	};
	//еслт setting нет, то подставлять пустой обьект, т.к. могут быть дин значения для подгрузки
	if (glob.cache.pages[cfgName].setting) objSetting = JSON.parse(glob.cache.pages[cfgName].setting);

	let vers = sh.Get_FirstVersionFromObj(objBuildObj);
	let nobj = objBuildObj[vers];

	nobj = sh.Merge_buildObj_settings(nobj, objSetting.d);

	objBuildObj[vers] = nobj;
	// log('src buildObj',glob.cache.pages[cfgName].buildObj);
	glob.cache.pages[cfgName].buildObj = JSON.stringify(objBuildObj);
	// log('new buildObj',glob.cache.pages[cfgName].buildObj);
	glob.cache.pages[cfgName].hashB = crypto
		.createHash('md5')
		.update(glob.cache.pages[cfgName].buildObj)
		.digest('hex');
}

function MergeSettingsBuildObj(cfgName) {
	//корректировка settings по buildObj
	//console.log('MergeSettingsBuildObj',cfgName);
	if (!glob.cache.pages[cfgName].buildObj) {
		log('MergeSettingsBuildObj exit, undefined buildObj');
		return 0;
	}

	let objBuildObj = JSON.parse(glob.cache.pages[cfgName].buildObj);

	let objSetting = {
		d: {},
		t: [1, 1],
		sid: '__gen'
	};
	let dynCfgName = cfgName;

	if (glob.cache.pages[cfgName].setting) {
		let parsedConfig = JSON.parse(glob.cache.pages[cfgName].setting);

		if (parsedConfig.sid === '__gen') {
			//конфига не существует, он сгенерирован
			//нужно его удалить, что бы система его перегенерила
			glob.cache.pages[cfgName].setting = undefined;
		}
	}

	//еслт setting нет, то подставлять пустой обьект, т.к. могут быть дин значения для подгрузки
	if (glob.cache.pages[cfgName].setting) {
		objSetting = JSON.parse(glob.cache.pages[cfgName].setting);
	} else {
		//ищем по devid, можэт это дин конфиг
		dynCfgName = cfgName + '.' + glob.cache.devId[cfgName];
		if (
			glob.cache.devId[cfgName] &&
			glob.cache.pages[dynCfgName] &&
			glob.cache.pages[dynCfgName].setting
		) {
			//  console.log('cfgName',cfgName,'glob.cache.devId[cfgName]',glob.cache.devId[cfgName],'obj',glob.cache.pages[dynCfgName]);
			objSetting = JSON.parse(glob.cache.pages[dynCfgName].setting);
		} else {
			dynCfgName = cfgName;
			//конфиг не найден, генерим по buildObj вирт. конфиг
			//return;
		}
	}

	let vers = sh.Get_FirstVersionFromObj(objBuildObj);
	let nobj = objBuildObj[vers];

	objSetting.d = sh.Merge_settings_buildObj(nobj, objSetting.d);

	if (!objSetting.d.page) {
		objSetting.d.page = cfgName;
		objSetting.d.type = 'settings';
	}
	// log('src buildObj',glob.cache.pages[cfgName].buildObj);
	glob.cache.pages[dynCfgName].setting = JSON.stringify(objSetting);
	// log('new buildObj',glob.cache.pages[cfgName].buildObj);
	glob.cache.pages[dynCfgName].hashS = crypto
		.createHash('md5')
		.update(glob.cache.pages[dynCfgName].setting)
		.digest('hex');
	return 1;
	// console.log('****new config',dynCfgName);
	//  console.log('****glob.cache.pages[cfgName]',glob.cache.pages[dynCfgName]);
}

async function syncAllDevId() {
	let searchedFiles = await new Promise((resolve) =>
		fs.readdir(c.DEVID_CACHE_PATH, (err, files) => {
			resolve(files);
		})
	);
	for (let n = 0; n < searchedFiles.length; n++) {
		let filename = searchedFiles[n];
		let splCont = filename.split('.');
		if (splCont.length < 2) {
			log('error watch dev id');
			continue;
		}
		let type = splCont[0];
		let cfgName = splCont.slice(1).join('.');
		if (splCont.length >= 2 && type === 'devid' && isNotDeny('devId', cfgName)) {
			let res = readFile(c.DEVID_CACHE_PATH + '/' + filename);
			if (res.err === null) {
				let clrData = res.data.toString('utf8').replace(/\r?\n/g, '');
				log(
					'devId change',
					cfgName,
					'err',
					res.err,
					'rd',
					c.DEVID_CACHE_PATH + filename,
					'data',
					clrData
				);
				glob.cache.devId[cfgName] = clrData;
				/* let configDynName=cfgName+'.'+clrData;
                    if ((glob.cache.pages[configDynName]!==undefined)&&(glob.cache.pages[configDynName].setting!==undefined)){
                        if ( glob.cache.pages[cfgName]===undefined)
                            glob.cache.pages[cfgName]={
                                setting:'',
                                hashS:''
                            }
                        glob.cache.pages[cfgName].setting=glob.cache.pages[configDynName].setting;
                        glob.cache.pages[cfgName].hashS=glob.cache.pages[configDynName].hashS;
                        log('syncAllDevId: configDynName',configDynName,'cfgName',cfgName,'glob.cache.pages[configDynName].setting', glob.cache.pages[configDynName].setting);

                    }
                    // log('glob.cache.pages', glob.cache.pages);
                    //log('glob.cache.pages[cfgName]', glob.cache.pages[cfgName]);

                    */
			}
		}
	}
}
function watchDevid() {
	fs.watch(c.DEVID_CACHE_PATH, (eventType, filename) => {
		log('di watch', eventType, 'file', filename);
		let splCont = filename.split('.');
		if (splCont.length < 2) {
			log('error watch dev id');
			return;
		}
		//let ext=splCont[splCont.length-1];
		let type = splCont[0];
		let cfgName = splCont.slice(1).join('.');
		if (!isNotDeny('devId', cfgName)) return;

		regenBuildObjOnSett(cfgName);
		if (fs.existsSync(c.DEVID_CACHE_PATH + '/' + filename)) {
			//файл создан или изменен

			if (splCont.length >= 2 && type === 'devid') {
				fs.readFile(c.DEVID_CACHE_PATH + '/' + filename, (err, data) => {
					log('devId change', cfgName, 'err', err, 'rd', c.DEVID_CACHE_PATH + '/' + filename);
					if (err === null) {
						let clrData = data.toString('utf8').replace(/\r?\n/g, '');
						log('setting', cfgName, 'link [settings.' + cfgName + '.' + clrData + '.set]');
						glob.cache.devId[cfgName] = clrData;

						/* let configDynName=cfgName+'.'+clrData;
                            if ((glob.cache.pages[configDynName]!==undefined)&&(glob.cache.pages[configDynName].setting!==undefined)){
                                if ( glob.cache.pages[cfgName]===undefined)
                                    glob.cache.pages[cfgName]={
                                        setting:'',
                                        hashS:''
                                    }

                                log('watchDevid: configDynName',configDynName,'cfgName',cfgName,'glob.cache.pages[configDynName].setting', glob.cache.pages[configDynName].setting);


                                glob.cache.pages[cfgName].setting=glob.cache.pages[configDynName].setting;
                                glob.cache.pages[cfgName].hashS=glob.cache.pages[configDynName].hashS;
                            }
                            // log('glob.cache.pages', glob.cache.pages);
                            //log('glob.cache.pages[cfgName]', glob.cache.pages[cfgName]);
                            *
                            */
					}
				});
			}
		} else {
			//файл удален
			glob.cache.devId[cfgName] = undefined;
		}
		// could be either 'rename' or 'change'. new file eventFromUI and delete
		// also generally emit 'rename'

		//log("settings glob.cache",glob);
	});
}
function watchSettings() {
	let getDynCfg = () => {
		//получение массива конфигов, которые влияют на MAP, для его перестроения
		let res = [];
		for (let dynP in glob.BuildDevices) {
			if (res.indexOf(glob.BuildDevices[dynP].dep_cfg.confname) === -1)
				res.push(glob.BuildDevices[dynP].dep_cfg.confname);
		}
		return res;
	};

	let dynCfgs = getDynCfg();
	fs.watch(c.GSETTINGS_STOR, (eventType, filename) => {
		log('watchSet', eventType);
		log('file', filename);
		if (eventType === 'change') {
			let splCont = filename.split('.');
			let ext = splCont[splCont.length - 1];
			let type = splCont[0];
			let cfgName = splCont.slice(1, -1).join('.');
			if (
				splCont.length >= 3 &&
				ext === 'set' &&
				type === 'settings' &&
				isNotDeny('setting', cfgName)
			) {
				fs.readFile(c.GSETTINGS_STOR + filename, async (err, data) => {
					log(
						'change cfgName',
						cfgName,
						'err',
						err,
						'rd',
						c.GSETTINGS_STOR + filename,
						'data',
						data.toString()
					);
					if (err === null) {
						if (glob.cache.pages[cfgName] && data.length !== 0) {
							// let settUncheck=data.toString('utf8');
							// let settErr=0;
							let dataToString = data.toString('utf8');
							try {
								//иногда ФС, фрагментированно изменяет файл, поэтому JSON не дописывается, это нужно контроллировать
								//если файл не парсится, то происходит пересинхронизация всех настроек
								JSON.parse(dataToString);
							} catch (e) {
								// settErr=1;
								console.log(`reSync all settings, parse ${cfgName} error, data ${dataToString}`);
								await syncAllSettings();
								return;
							}
							glob.cache.pages[cfgName].setting = dataToString;
							log(`glob.cache.pages[cfgName].setting->[${glob.cache.pages[cfgName].setting}]`);
							log(`data.length=${data.length}`);
							//if (glob.cache.pages[cfgName].buildObj!==undefined){
							if (MergeSettingsBuildObj(cfgName) === 0)
								//если buildObj нет, то посчитать md5, иначе он считается автоматом
								glob.cache.pages[cfgName].hashS = crypto
									.createHash('md5')
									.update(data)
									.digest('hex');
							//MergeBuildObjSettings(cfgName);
							// }
							let idx = dynCfgs.indexOf(cfgName);
							if (idx !== -1) {
								log('Rebuild MAP change ', dynCfgs[idx]);
								log('########################');

								RebuildMAP_ForDevices(glob.BuildDevices, glob.DevicesList);
								log('########################');
							}
							regenBuildObjOnSett(cfgName);
						}
						// log('glob.cache.pages', glob.cache.pages);
						//log('glob.cache.pages[cfgName]', glob.cache.pages[cfgName]);
					}
				});
			}
		}
		reCalcTotalHash();
		correctCache();
		// could be either 'rename' or 'change'. new file eventFromUI and delete
		// also generally emit 'rename'

		//log("settings glob.cache",glob);
	});
}

function watchBuildObj() {
	fs.watch(c.BUILDOBJ_CACHE_PATH, (eventType, filename) => {
		log('wb watch', eventType);
		log('wb file', filename);
		let splCont = filename.split('.');
		if (splCont.length === 0) return;

		let cfgName = splCont.slice(1, -1).join('.');
		//log("cfgName",cfgName);

		if (!isNotDeny('buildObj', cfgName)) return;

		//появляется при создании или удалении файла
		if (fs.existsSync(c.BUILDOBJ_CACHE_PATH + '/' + filename)) {
			log('add or change ', filename);
			//если файл есть значит он создан или изменен
			fs.readFile(c.BUILDOBJ_CACHE_PATH + '/' + filename, (err, data) => {
				if (err === null) {
					//data
					log('Read buildObj', c.BUILDOBJ_CACHE_PATH + '/' + filename);
					if (glob.cache.pages[cfgName] === undefined) {
						glob.cache.pages[cfgName] = {};
					}
					glob.cache.pages[cfgName].buildObj = data.toString('utf8');
					glob.cache.pages[cfgName].hashB = crypto.createHash('md5').update(data).digest('hex');
					let cfgFile = c.GSETTINGS_STOR + 'settings.' + cfgName + '.set';
					log('Try found config', cfgFile);
					if (isNotDeny('setting', cfgName)) {
						fs.readFile(cfgFile, async (err, data) => {
							if (err === null) {
								log('Merge', cfgFile);
								let dataToString = data.toString('utf8');
								try {
									//иногда ФС, фрагментированно изменяет файл, поэтому JSON не дописывается, это нужно контроллировать
									//если файл не парсится, то происходит пересинхронизация всех настроек
									JSON.parse(dataToString);
								} catch (e) {
									// settErr=1;
									console.log(`reSync all settings, parse ${cfgName} error, data ${dataToString}`);
									await syncAllSettings();
									return;
								}
								glob.cache.pages[cfgName].setting = dataToString;
								glob.cache.pages[cfgName].hashS = crypto
									.createHash('md5')
									.update(data)
									.digest('hex');

								//MergeBuildObjSettings(cfgName);
							} else {
								log('config', cfgFile, 'not found');
								//MergeBuildObjSettings(cfgName);//если нет конфига, мержится пустой конфиг, это нужно для подстановки значений с сервера в buildObj во время генерации
							}
							MergeSettingsBuildObj(cfgName);
						});
					}
				}
			});
		} else {
			//если файла нет значит он удален
			log('removed ', filename);
			//Не удалаять, опасно
			/*if ((glob.cache.pages[cfgName] !== undefined)&&(glob.cache.pages[cfgName].buildObj !== undefined)) {
                glob.cache.pages[cfgName].buildObj=undefined;
                glob.cache.pages[cfgName].hashB='';
            }*/
		}
		reCalcTotalHash();
		correctCache();
		//log("buildObj glob.cache",glob);
	});
}

function dumpCachesRd() {
	log('--cache DUMP RD--');
	for (let pn in glob.cache.pages) {
		// if (glob.cache.pages[pn].buildObj!==undefined) {
		log('--PAGE B', pn, '[', glob.cache.pages[pn].hashB, '], S [', glob.cache.pages[pn].hashS, ']');
		// }

		log('--');
	}
}
function dumpCaches() {
	log('--cache DUMP--');
	for (let pn in glob.cache.pages) {
		if (glob.cache.pages[pn].buildObj) {
			log('--PAGE buildObj', pn, 'md5', glob.cache.pages[pn].hashB);
			log(glob.cache.pages[pn].buildObj);
		} else {
			log('--PAGE buildObj', pn, 'NOT Applied');
		}
		log('--');
		if (glob.cache.pages[pn].setting) {
			log('--PAGE setting', pn, 'md5', glob.cache.pages[pn].hashS);
			log(glob.cache.pages[pn].setting);
		} else {
			log('--PAGE setting', pn, 'NOT Applied');
		}
		log('--');
	}
}

function correctCache() {
	for (let pn in glob.cache.devId) {
		//заполнение настроек buildObj в зависимости от динамических конфигов
		if (glob.cache.pages[pn]) {
			let dynPn = pn + '.' + glob.cache.devId[pn];
			if (glob.cache.pages[dynPn]) {
				if (glob.cache.pages[dynPn].hashS !== glob.cache.pages[pn].hashS) {
					glob.cache.pages[pn].setting = glob.cache.pages[dynPn].setting;
					glob.cache.pages[pn].hashS = glob.cache.pages[dynPn].hashS;
				}
			}
		}
	}
}

function watchRebuildMAP() {
	log('@@@@@@@@@@@@@@@@@@@@@@@@@@@watchRebuildMAP');
	log('$$$$$$$$$$$$$$$$$$$$$$$$$$$watchRebuildMAP');
	let getDynCfg = () => {
		let res = [];
		for (let dynP in glob.BuildDevices) {
			if (res.indexOf(glob.BuildDevices[dynP].dep_cfg.confname) === -1)
				res.push(glob.BuildDevices[dynP].dep_cfg.confname);
		}
		return res;
	};

	let dynCfgs = getDynCfg();
	log('dynCfgs', dynCfgs);
	for (let n = 0; n < dynCfgs.length; n++) {
		let fileNameCfg = c.GSETTINGS_STOR + 'settings.' + dynCfgs[n] + '.set';
		log('Watch dyn for change', fileNameCfg);
		fs.watch(fileNameCfg, () => {
			log('Rebuild MAP change ', dynCfgs[n], 'devlist', glob.DevicesList);
			RebuildMAP_ForDevices(glob.BuildDevices, glob.DevicesList);
		});
	}
}

async function syncDefSettings() {
	let defSettingDir = c.DEFSETTINGS_STOR;
	let destSettingDir = c.GSETTINGS_STOR;
	let fileList = fs.readdirSync(defSettingDir);
	for (let n = 0; n < fileList.length; n++) {
		let fPath = rmBackPath(defSettingDir + '/' + fileList[n]);
		let dstFPath = rmBackPath(destSettingDir + '/' + fileList[n]);
		console.log('Try sync setting file', dstFPath, 'from', fPath);
		// console.log("fs.promises.stat",fs.promises)
		if (fs.promises) {
			await fs.promises.stat(dstFPath).catch(async () => {
				await fs.promises.copyFile(fPath, dstFPath).catch(() => {
					console.log('Error sync setting file', dstFPath);
				});
				console.log('Sync setting file', dstFPath);
			});
		} else {
			//console.log("Run oldest nodejs version -",process.version);
			if (!fs.existsSync(dstFPath)) {
				fs.copyFileSync(fPath, dstFPath);
				console.log('Sync setting file', dstFPath);
			}
		}
	}
}

async function init() {
	await syncDefSettings();
	await syncAllSettings();
	await syncAllBuildObj();
	await syncAllDevId();
	watchBuildObj();
	watchSettings();
	watchDevid();
	// watchRebuildMAP();
	correctCache();
	reCalcTotalHash();
	dumpCaches();
}

module.exports = {
	init,
	correctCache,
	dumpCachesRd,
	reCalcTotalHash
};
