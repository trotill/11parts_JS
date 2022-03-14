let events = nodeRequire('events');
let glob = {
	version: 'electron',
	CACHE_PATH: __dirname,
	ROOT_PATH: __dirname,
	DOWNLOAD_PATH: __dirname,
	HOME_PATH: __dirname
};

let fs = nodeRequire('fs');
let p = nodeRequire('path');
let crypto = nodeRequire('crypto');

const electron = nodeRequire('electron');

//if (window.epartsElectron === undefined) window.epartsElectron = {};

const electronIpc = electron.ipcRenderer;
function electronIpcSend(to, data) {
	electronIpc.send(to, data);
}
const { app, dialog, powerMonitor } = electron.remote;

app.getGPUInfo('complete').then((completeObj) => {
	console.dir('GPUInfo', completeObj);
});

glob.HOME_PATH = app.getPath('home');

eglobal = {
	basePath: '',
	connect: {
		mode: 'mqtt',
		mqtt: {
			require: nodeRequire('mqtt'),
			client: undefined,
			febeTopic: 'febe', //FrontEnd to Backend request
			befeTopic: 'befe', //Backend to FrontEnd response
			beioTopic: 'beio', //Backend to FrontEnd eventFromUI
			qos: 2
		}
	},
	fileDialog: {},
	naviIsBuild: false,
	feInited: false,
	prjName: '',
	publish: undefined,
	emitter: new events.EventEmitter(),
	c: nodeRequire('./backCore'),
	eapi: nodeRequire('./web/be/electron_api'),
	calcMD5: (data) => {
		//let encoder = new TextEncoder();
		//  let eData = encoder.encode(data);
		return crypto.createHash('md5').update(data).digest('hex');
	},
	showWDT: {},
	initComplete: () => {
		//функция вызывается приложением, корда оно готово к отображению
		clearTimeout(eglobal.showWDT);
		console.log('Electron, window show, clear wdt');
		electronIpcSend('web', { action: 'show' });
	}
};

let runMode = 'embedded';

function placeCSS(href) {
	let cssTag = document.createElement('link');
	cssTag.rel = 'stylesheet';
	cssTag.href = href;
	document.head.appendChild(cssTag);
}
async function placeJS(src) {
	let scriptTag = document.createElement('script');
	scriptTag.src = src;
	document.body.appendChild(scriptTag);
	let waitload;
	if (src.includes('jquery') && src.includes('plainoverlay') === false) {
		waitload = () =>
			new Promise(
				(resolve) =>
					(scriptTag.onload = function () {
						window.$ = window.jQuery;
						resolve(0);
					})
			);
	} else {
		waitload = () =>
			new Promise(
				(resolve) =>
					(scriptTag.onload = function () {
						resolve(0);
					})
			);
	}
	await waitload();
}

async function fillHtml() {
	// test24();
	let prjs;
	try {
		prjs = fs.readdirSync(eglobal.basePath + 'Projects');
	} catch (e) {
		console.log('Not found ', eglobal.basePath + 'Projects, may be asar use, change base path');
		eglobal.basePath = 'resources/app.asar/';
		prjs = fs.readdirSync(eglobal.basePath + 'Projects');
	}

	if (!fs.existsSync(eglobal.basePath + 'Jnoda')) {
		runMode = 'desktop';
	}
	let prjName = prjs[0];
	eglobal.prjName = prjName;
	console.log('prjName', prjName);
	let menu = nodeRequire(`./Projects/${prjName}/buildObj/menu.js`);
	let world = menu.world;
	let prjTitle = world.name;
	let restartMainTimeOut = 10000;
	if (menu.world.electron_opts !== undefined) {
		if (menu.world.electron_opts.restartMainTimeOut !== undefined) {
			restartMainTimeOut = menu.world.electron_opts.restartMainTimeOut;
		}
	}
	eglobal.showWDT = setTimeout(() => {
		window.epartsElectron.electronIpc.send('web', { action: 'restartMain' });
		console.log('Electron, restart main window');
	}, restartMainTimeOut);

	let titleTag = document.createElement('title');
	titleTag.innerHTML = prjTitle;
	document.head.appendChild(titleTag);
	for (let n = 0; n < world.external_lib.css.length; n++) {
		placeCSS(`ui/external/${world.external_lib.css[n]}`);
		//  res+=`<link rel="stylesheet" href="${basePath}/external/${obj.world.external_lib.css[n]}">\n`;
	}

	let PageRegionName = prjName;
	for (let regn in world.regions) {
		if (world.regions[regn].screens.indexOf('electron') === 0) {
			PageRegionName = regn;
		}
	}

	let region = world.regions[PageRegionName];
	//search dialogs def folders permission for load/save files
	if (region.fileDialog !== undefined) {
		eglobal.fileDialog = region.fileDialog;
	}

	let stylesDir = `Projects/${prjName}/styles`;
	let flp;
	if (PageRegionName === '' || region.clone === undefined) {
		flp = stylesDir + '/' + PageRegionName;
	} else {
		flp = stylesDir + '/' + region.clone;
	}

	// console.log('success2');
	if (PageRegionName !== '') {
		fs.readdirSync(`${eglobal.basePath}${flp}`).forEach(function (file) {
			if (p.extname(file).toLowerCase() === '.css')
				placeCSS(`${stylesDir}/${PageRegionName}/${file}`);
		});
	} else {
		fs.readdirSync(`${eglobal.basePath}${stylesDir}`).forEach(function (file) {
			if (p.extname(file).toLowerCase() === '.css') placeCSS(`${stylesDir}/${file}`);
		});
	}
	placeCSS(`compiled/${eglobal.eapi.bundleName}.css`);

	//*****************JS
	//load shared lib
	for (let n = 0; n < world.external_lib.js.length; n++) {
		await placeJS(`ui/external/${world.external_lib.js[n]}`);
	}

	await placeJS(`compiled/${eglobal.eapi.bundleName}.js`);

	//global.SRV_OBJ.client="electron";
	//    await DoConnect('MQTT');
	window.eparts.entryElectron();
}

window.addEventListener('DOMContentLoaded', () => {
	fillHtml();
});
