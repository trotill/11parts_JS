import { linkElements } from '../uiLink';
import { AddWaitOverlay, DeleteWaitOverlay, runui } from '../_util';
import { t, BuildJSON_Settings_no_flt } from '../_core';
import { global, mobXstore } from '../___global.js';
import { createCookie, readCookie } from '../__cookies';
import { BuildObj } from '../_buildEng';
import { initPM } from './electronPm';
import React, { useEffect } from 'react';
import { initMetaVarIfUndef } from '../_metaVar';
import { initFilterEng } from '../filter/filterEng';
import ReactDOM from 'react-dom';

export function resetElectron() {
	eglobal.naviIsBuild = false;
}

let InitMQTT = (mqttParam, fe_init) =>
	new Promise((resolve, reject) => {
		let client = eglobal.connect.mqtt.require.connect(mqttParam);
		eglobal.connect.mqtt.client = client;

		client.on('reconnect', () => {
			console.log('MQTT reconnect');

			reject({ action: 'reconnect', err: 0 });
		});
		client.on('close', () => {
			console.log('MQTT close');
			runui('add_overlay', t('Please_wait_conn_lost'), undefined, 120000);
			// client.end();
			reject({ action: 'close', err: 0 });
		});
		client.on('disconnect', () => {
			console.log('MQTT disconnect');
			if (runMode === 'desktop') client.end();
			reject({ action: 'disconnect', err: 0 });
		});
		client.on('offline', () => {
			console.log('MQTT offline');
			reject({ action: 'offline', err: 0 });
		});
		client.on('error', (error) => {
			console.log('MQTT error', error);
			if (runMode === 'desktop') client.end();
			reject({ action: 'error', err: error });
		});
		client.on('connect', () => {
			runui('del_overlay');
			client.subscribe(
				eglobal.connect.mqtt.befeTopic,
				{ qos: eglobal.connect.mqtt.qos },
				function (err) {
					if (err) {
						console.log('Error subscribe to', eglobal.connect.mqtt.befeTopic);
						reject(0);
					} else {
						console.log('MQTT success subscribe to topic', eglobal.connect.mqtt.befeTopic);
						eglobal.publish = (msg) => {
							client.publish(eglobal.connect.mqtt.febeTopic, msg, {
								qos: eglobal.connect.mqtt.qos
							});
						};
						client.subscribe(
							eglobal.connect.mqtt.beioTopic,
							{ qos: eglobal.connect.mqtt.qos },
							function (err) {
								if (err) {
									reject(0);
								} else {
									fe_init();
									resolve(0);
								}
							}
						);
					}
				}
			);
		});
		client.on('message', (topic, message) => {
			let msg = JSON.parse(message);
			if (eglobal.feInited === false) {
				if (msg.d.action !== 'fe_init') {
					console.log('skip message fe not inited!!!');
					return;
				}
			}
			if (topic === 'befe' && msg.d.action === 'serverData') {
				let serverData = msg.d.serverData;
				if (serverData.respType === 'loadSet') {
					eglobal.emitter.emit(`befe@${serverData.setting_name}`, msg);
				}
				if (serverData.respType === 'buildNavi') {
					if (eglobal.naviIsBuild === false) {
						eglobal.emitter.emit(`befe`, msg);
					} else {
						console.log('buildNavi already builded!!!');
					}
					eglobal.naviIsBuild = true;
				} else {
					eglobal.emitter.emit(`befe`, msg);
				}
			} else eglobal.emitter.emit(topic, msg);
		});
	});

async function waitFe_init() {
	return new Promise((resolve, reject) => {
		let tout = setTimeout(() => {
			reject(0);
		}, 5000);
		eglobal.emitter.once('befe', (data) => {
			let msg = data.d;
			if (msg.action === 'fe_init' && eglobal.feInited === false) {
				let scriptTag = document.createElement('script');
				scriptTag.innerHTML = msg.fe_init;
				clearTimeout(tout);
				document.body.appendChild(scriptTag);
				resolve(0);
				eglobal.feInited = true;
			}
		});
	});
}

async function runMQTT(MQTT_Setting) {
	AddWaitOverlay(t('Please_wait_resp'));
	async function fe_init() {
		console.log('fe_init');
		while (eglobal.feInited === false) {
			global.clientId = 'electron_' + runMode + '_' + Math.random().toString(36).substring(7);
			eglobal.publish(
				JSON.stringify(eglobal.c.GenActionPack('fe_init', {}, 'electron', global.clientId))
			);
			await waitFe_init()
				.then(() => {
					console.log('Got fe_init');
				})
				.catch(() => {
					console.log('Not got fe_init');
				});
		}
	}
	await InitMQTT(MQTT_Setting, fe_init)
		.then(async () => {
			console.log('MQTT connect success');
		})
		.catch(async (err) => {
			console.log('Error MQTT connect', err);
			if (runMode === 'desktop') {
				runui('flymsg', 'Fault connect, try again', '');
			}

			console.log('err.action', err.action);
		});
	DeleteWaitOverlay();
}

function ConfigureConnectMQTTExtra({ authform }) {
	const click = async () => {
		let settings = BuildJSON_Settings_no_flt('electronConnect', 'authElInput').settings;
		createCookie('mqttHost', settings.host, 0);
		createCookie('mqttPort', settings.port, 0);
		createCookie('mqttKeepalive', settings.keepalive, 0);
		createCookie('mqttAuthMode', settings.authMode, 0);
		createCookie('mqttPassword', settings.password, 0);
		createCookie('mqttLogin', settings.login, 0);
		let MQTT_Setting = {
			port: Number.parseInt(settings.port),
			host: settings.host,
			keepalive: Number.parseInt(settings.keepalive)
		};
		if (settings.authMode === 'logpassw' && settings.password.length !== 0) {
			MQTT_Setting['password'] = settings.password;
			MQTT_Setting['username'] = settings.login;
		}
		await runMQTT(MQTT_Setting);
	};
	useEffect(() => {
		initMetaVarIfUndef('authElInput');
		initFilterEng('authElInput');
		BuildObj('authElInput', authform);
		mobXstore.element.addBlock(
			'authElInput',
			'sendbutton',
			<button key={'loginButton'} className={'loginButton'} onClick={click}>
				{t('login')}
			</button>
		);
	}, []);

	return (
		<div className={'mainElectron'}>
			<div className={'reception'}>
				<div className={'auth_form'}>
					<div className={'auth_form_logo'} />
					<div className={'authElInput'}>{mobXstore.element.doRender('authElInput')}</div>
				</div>
			</div>
		</div>
	);
}
async function ConfigureConnectMQTT() {
	global.callback.DelTips = () => {};
	let mqttHost = readCookie('mqttHost');
	if (mqttHost === undefined) mqttHost = 'localhost';

	let mqttPort = readCookie('mqttPort');
	if (mqttPort === undefined) mqttPort = 1883;

	let mqttKeepalive = readCookie('mqttKeepalive');
	if (mqttKeepalive === undefined) mqttKeepalive = 60;

	let mqttAuthMode = readCookie('mqttAuthMode');
	if (mqttAuthMode === undefined) mqttAuthMode = 'logpassw';

	let mqttLogin = readCookie('mqttLogin');
	if (mqttLogin === undefined) mqttLogin = '';

	let mqttPassword = readCookie('mqttPassword');
	if (mqttPassword === undefined) mqttPassword = '';

	const authform = [
		{
			type: 'delim',
			id: 'inmq',
			name: 'Set up an MQTT connection'
		},
		{
			name: 'URL',
			type: 'tfield',
			value: mqttHost,
			id: 'host',
			flt: { sym: ['url'] }
		},
		{
			name: 'Port',
			type: 'tfield',
			value: mqttPort,
			id: 'port',
			flt: { minmax: [0, 65535] }
		},
		{
			name: 'Keepalive',
			type: 'tfield',
			value: mqttKeepalive,
			id: 'keepalive',
			flt: { minmax: [0, 65535] }
		},
		{
			name: 'Authentication',
			type: 'sbox',
			value: mqttAuthMode,
			id: 'authMode',
			tabidx: 1,
			items_name: ['Login/Password'],
			items_val: ['logpassw'],
			spage: {
				logpassw: [
					{
						type: 'delim',
						id: 'inlp',
						name: 'Input login/password'
					},
					{
						name: 'Login',
						type: 'tfield',
						value: mqttLogin,
						id: 'login',
						isDig: false,
						isSec: false,
						flt: { len: [4, 63], sym: ['en'] }
					},
					{
						name: 'Password',
						type: 'tfield',
						id: 'password',
						isDig: false,
						isSec: true,
						value: mqttPassword,
						flt: { len: [4, 63], sym: ['en'] }
					}
				]
			}
		}
	];

	global.SRV_OBJ.PageName = 'login';
	const tag = document.createElement('div');
	document.getElementsByTagName('body').appendChild(tag);

	ReactDOM.render(<ConfigureConnectMQTTExtra authform={authform} />, tag);
}

async function DoConnect(type) {
	if (type === 'MQTT') {
		//mqtt=require('mqtt');

		let mqttParam;
		//linkMinimalUI();
		if (runMode === 'embedded') {
			glob.DOWNLOAD_PATH = eglobal.c.DOWNLOAD_PATH;
			mqttParam = {
				port: 1883,
				host: 'localhost',
				keepalive: 60
			};
			await runMQTT(mqttParam);
			// InitMQTT(mqttParam);
		} else {
			glob.DOWNLOAD_PATH = app.getPath('cache');
			fs.stat(glob.DOWNLOAD_PATH, (err /*, stats*/) => {
				if (err) {
					fs.mkdirSync(glob.DOWNLOAD_PATH);
				}
				ConfigureConnectMQTT();
			});
		}
	}
}

export async function electronInit() {
	await linkElements();
	await DoConnect('MQTT');
	initPM(powerMonitor, electronIpcSend);
}
