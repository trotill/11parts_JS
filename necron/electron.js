/**
 * Created by i7 on 20.07.2020.
 */

const fs = require('fs');
const execSync = require('child_process').execSync;

let debug = false;

const showGPU = (electr, width, height) => {
	gpu = new electr.BrowserWindow({
		width: width,
		height: height,
		minWidth: width,
		minHeight: height,
		show: true
	});

	gpu.loadURL('chrome://gpu/');
	gpu.setMenuBarVisibility(false);
	if (debug) {
		//(runMode==='desktop') {
		gpu.webContents.openDevTools();
	}

	gpu.once('ready-to-show', () => {});
};
const run = (glob) => {
	let electr;
	let configDir;

	try {
		electr = require('electron');

		//session =electr.session;
		configDir = electr.app.getPath('userData');
		console.log('found electron');

		console.log('electron runner');
	} catch (e) {
		console.log('node runner');
		return;
	}

	try {
		require('electron-reload')(__dirname, { ignored: /tmp|[/\\]\./ });
		console.log('found electron-reload');
	} catch (e) {
		console.log('not found electron-reload');
	}

	let runMode = 'embedded';
	if (!glob) {
		glob = {
			version: '',
			CACHE_PATH: __dirname,
			ROOT_PATH: __dirname,
			websrv: {
				cfg: {
					webElUserPath: undefined,
					webElHwAcc: undefined
				}
			}
		};
		runMode = 'desktop';
	}
	console.log('runMode', runMode);

	if (glob.websrv.cfg.webElUserPath) {
		if (!fs.existsSync(glob.websrv.cfg.webElUserPath)) {
			execSync(`install -d ${glob.websrv.cfg.webElUserPath}`);
		}
		electr.app.setPath('userData', glob.websrv.cfg.webElUserPath);
		configDir = electr.app.getPath('userData');
	}
	console.log('electron version', electr.app.getVersion());
	console.log('userData path', configDir);
	console.log('__dirname', __dirname);

	const c = require('./backCore');

	console.log('CACHE_PATH', c.CACHE_PATH);
	console.log('ROOT_PATH', c.ROOT_PATH);
	console.log('CACHE_PATH_ELJ', c.CACHE_PATH_ELJ);

	const ipcMain = require('electron').ipcMain;

	const path = require('path');
	const http_path = 'electronBase.html';
	let splash_path = 'splashDefault.html';

	function createWindow() {
		// Create the browser window.
		console.log('\n\n\n\n\n\n$$$$$$$$$$$$$$' + __dirname + '$$$$$$$$$$$$$$$$$$\n\n\n\n\n');

		let bwinCfg;
		let width = 1366;
		let height = 768;
		if (runMode === 'embedded') {
			width = parseInt(glob.websrv.cfg.webElXsz);
			height = parseInt(glob.websrv.cfg.webElYsz);
			bwinCfg = {
				//  show: false,
				frame: false,
				width: width,
				height: height,
				show: false,
				minWidth: width,
				minHeight: height,
				resizable: false,
				center: true,
				//  kiosk: true,
				webPreferences: {
					preload: path.join(__dirname, 'electronPreload.js'),
					nodeIntegration: true,
					webSecurity: false,
					disableDialogs: false,
					enableRemoteModule: true
				}
			};
		} else {
			bwinCfg = {
				width: width,
				height: height,
				minWidth: width,
				minHeight: height,
				show: false,
				webPreferences: {
					preload: path.join(__dirname, 'electronPreload.js'),
					nodeIntegration: true
				}
			};
		}

		console.log('runMode', runMode);
		console.log('bwinCfg', bwinCfg);

		let splash = undefined;
		let mainWindow = undefined;
		let closeMainWindow = () => {
			console.log('Close main window');
			mainWindow.close();
		};
		let showMainWindow = (winCfg) => {
			console.log('Show main window');
			mainWindow = new electr.BrowserWindow(winCfg);
			mainWindow.loadFile(http_path);

			mainWindow.once('ready-to-show', () => {
				console.log('Main window show');
			});

			mainWindow.setMenuBarVisibility(false);
			// Open the DevTools.
			if (debug) {
				//(runMode==='desktop') {
				mainWindow.webContents.openDevTools();
			}

			if (!glob.websrv.cfg.webElFrameRate) {
				glob.websrv.cfg.webElFrameRate = 30;
			}
			mainWindow.webContents.setFrameRate(parseInt(glob.websrv.cfg.webElFrameRate));

			console.log('set framerate', glob.websrv.cfg.webElFrameRate);
		};

		if (glob.websrv.cfg.webElSplashPath && glob.websrv.cfg.webElSplashPath.length > 0) {
			if (fs.existsSync(glob.websrv.cfg.webElSplashPath)) {
				splash_path = glob.websrv.cfg.webElSplashPath;
			} else {
				console.log('Splash', glob.websrv.cfg.webElSplashPath, 'not exist');
			}
			//else use default!!!
		} else splash_path = undefined;

		console.log('Select Splash', splash_path, 'webElSplashPath', glob.websrv.cfg.webElSplashPath);
		// splash_path=undefined;
		if (debug) splash_path = undefined;
		if (splash_path) {
			bwinCfg.show = true;
			console.log('Create window');
			splash = new electr.BrowserWindow({
				width: width,
				height: height,
				minWidth: width,
				minHeight: height,
				show: false
			});
			splash.loadFile(splash_path);
			// splash.loadURL('chrome://gpu/')
			splash.setMenuBarVisibility(false);
			if (debug) {
				//(runMode==='desktop') {
				splash.webContents.openDevTools();
			}
			bwinCfg.show = false;
			splash.once('ready-to-show', () => {
				console.log('Show splash');
				splash.show();

				showMainWindow(bwinCfg);
			});
		} else {
			showMainWindow(bwinCfg);
			console.log('Show mainWindow');
			mainWindow.show();
		}

		ipcMain.on('web', (event, param) => {
			console.log('ipcMain', param);
			let action = param.action;
			if (action === 'log') {
				console.log(`UI[${param.log}]`);
			}
			if (action === 'show') {
				console.log('ipcMain Show mainWindow');
				mainWindow.show();
				// showMainWindow(bwinCfg);
				if (splash !== undefined) {
					splash.hide();
				}
			}
			if (action === 'hide') {
				console.log('ipcMain Hide mainWindow');
				mainWindow.hide();
				if (splash) {
					splash.show();
				}
			}
			if (action === 'showGPU') {
				showGPU(electr, width, height);
			}
			if (action === 'restartMain') {
				closeMainWindow();

				showMainWindow(bwinCfg);
				// mainWindow.show();
			}
			if (action === 'openDevTools') {
				mainWindow.webContents.openDevTools();
			}
		});
	}

	electr.app.whenReady().then(() => {
		createWindow();
		electr.app.on('activate', () => {
			if (electr.BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});
	electr.app.on('ready', async () => {
		if (glob.websrv.cfg.webElHwAcc === 'false' || glob.websrv.cfg.webElHwAcc === undefined) {
			electr.app.disableHardwareAcceleration();
			console.log('Disable hardware acceleration');
		} else {
			console.log('Enable hardware acceleration');
		}
	});
	electr.app.on('window-all-closed', function () {
		electr.app.quit();
	});
};
module.exports = {
	run
};
