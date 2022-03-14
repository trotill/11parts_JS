/**
 * Created by i7 on 29.01.2020.
 */
const c = require('../../../backCore');
const ex = require('./../../../exec');
let serialportgsm = undefined;
let gsmModem = undefined;
let recipients = [];
let getSigTmr = undefined;
let rerun_int = undefined;
let inited = false;
let unsended = {};

let priority = false;
let repSmsSpgReRunIfError = 50;
let repSmsSpgGetSigTout = 60000;
let repSmsSpgWaitCmdTout = 30000;
let repSmsSpgUseRemoveAll = false;

async function stop_unsended_worker() {}
async function run_unsended_worker() {}

async function DeInitSGSM() {
	inited = false;
	if (getSigTmr) {
		await clearTimeout(getSigTmr);
		getSigTmr = undefined;
	}
	if (rerun_int) {
		await clearTimeout(rerun_int);
		rerun_int = undefined;
	}

	await stop_unsended_worker();
	if (gsmModem) {
		await gsmModem.close().catch((e) => {
			console.error(`Catch exept (${e})`);
		});
	}
	gsmModem = undefined;
}

async function ResetOnModemGpio(gpio) {
	console.log('GSM gpio reset on');
	await ex.ExecPromise(`echo ${gpio} > /sys/class/gpio/export`);
	await ex.ExecPromise(`echo out > /sys/class/gpio/gpio${gpio}/direction`);
	await ex.ExecPromise(`echo 0 > /sys/class/gpio/gpio${gpio}/value`);
}

async function HardwareResetGpio(gpio, delay_ms) {
	console.log('GSM modem hardware reset');
	await ResetOnModemGpio(gpio);
	let delay = (ms) => new Promise((resolve) => setInterval(() => resolve(), ms));
	await delay(100);
	await ex.ExecPromise(`echo 1 > /sys/class/gpio/gpio${gpio}/value`);
	console.log('GSM gpio reset off, delay ', delay_ms);
	await delay(delay_ms);
}

async function removeAllSMS(gsmModem) {
	console.log('removeAllSMS');
	gsmModem.getSimInbox((arg) => {
		if (arg === undefined || arg.data === undefined) return;

		for (let msg = 0; msg < arg.data.length; msg++) {
			gsmModem.deleteMessage(
				arg.data[msg],
				(arg) => {
					console.log(`Message ${arg} deleted!`);
				},
				repSmsSpgWaitCmdTout
			);
		}
		if (repSmsSpgUseRemoveAll === 'true') {
			gsmModem.deleteAllSimMessages(() => {
				console.log('All SMS deleted');
			});
		}
	}, repSmsSpgWaitCmdTout);
}
async function setup(objd) {
	if (serialportgsm) await DeInitSGSM();

	if (objd.repSMS_SerialPortGSM === 'true' && objd.repEnable === 'true') {
		if (serialportgsm === undefined) serialportgsm = require('serialport-gsm');

		console.log('serialport-gsm', objd);
		repSmsSpgGetSigTout = objd.repSmsSpgGetSigTout === undefined ? 5000 : objd.repSmsSpgGetSigTout;
		repSmsSpgReRunIfError =
			objd.repSmsSpgReRunIfError === undefined ? 50 : objd.repSmsSpgReRunIfError;
		repSmsSpgWaitCmdTout =
			objd.repSmsSpgWaitCmdTout === undefined ? 5000 : objd.repSmsSpgWaitCmdTout;
		repSmsSpgUseRemoveAll = objd.repSmsSpgUseRemoveAll;
		repSmsSpgRecvEventCMD =
			objd.repSmsSpgRecvEvent === undefined ? 'AT+CNMI=2,1' : objd.repSmsSpgRecvEvent;
		console.log('serialport-gsm switch on');
		if (objd.repSMSEnable === 'true') {
			console.log('sms eng switch on');

			let options = {
				baudRate: parseInt(objd.repSMS_SerialPortGSM_baudrate),
				dataBits: 8,
				stopBits: 1,
				parity: 'none',
				rtscts: false,
				xon: false,
				xoff: false,
				xany: false,
				autoDeleteOnReceive: true,
				enableConcatenation: true,
				incomingCallIndication: true,
				incomingSMSIndication: true,
				pin: objd.repSMS_SerialPortGSM_pin,
				customInitCommand: objd.repSMS_SerialPortGSM_init_cmd,
				logger: ''
			};
			if (objd.repSMS_SerialPortGSM_logger === 'console') options.logger = console;

			var pdu_mode = 'PDU';
			var event_state = objd.repSMS_SerialPortGSM_event_state;
			var event_sms = objd.repSMS_SerialPortGSM_event_sms;
			var event_incall = objd.repSMS_SerialPortGSM_event_incall;
			if (objd.repSMS_SerialPortGSM_pdu === 'false') {
				pdu_mode = 'SMS';
			}

			let executeCmd = (CMD) => {
				if (CMD === undefined) return;

				if (CMD.length !== 0) {
					gsmModem.executeCommand(
						CMD,
						(result, err) => {
							console.log(`###### Execute command`, CMD);
							if (err) {
								console.log(`###### Error - ${err}`);
							} else {
								console.log(`###### Result ${JSON.stringify(result)}`);
							}
						},
						priority,
						repSmsSpgWaitCmdTout
					);
				}
			};

			let run = async () => {
				await DeInitSGSM();
				await run_unsended_worker();
				if (objd.repSMS_SerialPortGSM_rstGpio && objd.repSMS_SerialPortGSM_rstGpio.length !== 0) {
					await HardwareResetGpio(
						objd.repSMS_SerialPortGSM_rstGpio,
						objd.repSMS_SerialPortGSM_rstGpioDelay
					);
				}

				console.log(`Run new serial connect ${objd.repSMS_SerialPortGSM_tty} opts`, options);
				// if (port_closed) {
				gsmModem = serialportgsm.Modem();
				console.log(`Open port ${objd.repSMS_SerialPortGSM_tty}`);
				let initModem = async () =>
					new Promise((resolve, reject) => {
						gsmModem.open(objd.repSMS_SerialPortGSM_tty, options).catch((e) => {
							console.error(`Catch exept (${e})`);
							reject(false);
						});
						gsmModem.on('open', () => {
							console.log(`Modem Sucessfully Opened`);
							executeCmd(objd.repSMS_SerialPortGSM_executeCommand);

							resolve(
								new Promise((resolve, reject) => {
									gsmModem.initializeModem(
										(msg, err) => {
											if (err) {
												console.log(`Error Initializing Modem - ${err}`);
												reject(false);
											} else {
												console.log(`InitModemResponse: ${JSON.stringify(msg)}`);
												resolve(true);
											}
										},
										priority,
										repSmsSpgWaitCmdTout
									);
								})
							);
						});
					})
						.then(() => {
							return true;
						})
						.catch(() => {
							return false;
						});

				let result = false;
				let cntr = 0;
				while ((result = await initModem()) === false) {
					await gsmModem.close().catch((e) => {
						console.error(`Catch exept (${e})`);
					});
					gsmModem = undefined;
					gsmModem = serialportgsm.Modem();
					console.log('\n###### GSM result', result, 'try again');
					cntr++;
					if (cntr === repSmsSpgReRunIfError) {
						console.error(
							`###### GSM modem restart ${cntr} times. Modem is dead, please restart system`
						);
						break;
					}
				}
				console.log('\nGSM result', result, '\n');
				if (result) {
					console.log(`Configuring Modem for Mode: ${pdu_mode}`);
					gsmModem.setModemMode((msg, err) => {
						if (objd.repSmsSpgNotRmSmsAfterInit === 'true') {
							console.log(`Skip remove SMS on SIM after init`);
						} else removeAllSMS(gsmModem);

						if (err) {
							console.log(`Error Setting Modem Mode - ${err}`);
						} else {
							console.log(`Set Mode: ${JSON.stringify(msg)}`);
						}

						executeCmd(objd.repSMS_SerialPortGSM_exeAfterInitCMD);
						executeCmd(repSmsSpgRecvEventCMD);

						if (event_state.length !== 0) {
							let get_sig = () => {
								console.log(`###### get_sig`);
								gsmModem.getNetworkSignal(
									async (result, err) => {
										console.log(`###### getNetworkSignal`);
										if (err) {
											console.log(`Error retrieving Signal Strength - ${err}`);
										} else {
											console.log(`###### Signal Strength: ${JSON.stringify(result)}`);
											if (result.status === 'success') {
												let wed = {};
												wed.quality = result.data.signalQuality;
												wed.strength = result.data.signalStrength;
												c.ProcessSend(c.GenWebeventPack(event_state, wed));
											}
											if (objd.repSmsSpgRecvSMSFromSim === 'true') {
												console.log(`######  getSimInbox`);
												gsmModem.getSimInbox((arg) => {
													if (arg === undefined || arg.data === undefined) return;
													for (let msg = 0; msg < arg.data.length; msg++) {
														console.log(`######  getSimInbox msg`, arg.data[msg]);
														c.ProcessSend(c.GenWebeventPack(event_sms, arg.data[msg]));
													}
													removeAllSMS(gsmModem);
												}, repSmsSpgWaitCmdTout);
											}
										}
										getSigTmr = setTimeout(get_sig, repSmsSpgGetSigTout);
									},
									priority,
									repSmsSpgWaitCmdTout
								);
							};
							get_sig();
						}
					}, pdu_mode);

					gsmModem.on('onNewMessage', (data) => {
						//whole message data
						console.log(`###### Event New Message: ` + JSON.stringify(data));
						if (objd.repSmsSpgRecvSMSFromSim === 'true') {
							console.log(`Skip resend SMS, use recvSMSFromSim mode`);
							return;
						}
						removeAllSMS(gsmModem);
						if (event_sms.length !== 0) c.ProcessSend(c.GenWebeventPack(event_sms, data));
					});
					gsmModem.on('onNewIncomingCall', (data) => {
						//whole message data
						console.log(`###### Event Incoming Call: ` + JSON.stringify(data));
						if (event_incall.length !== 0) c.ProcessSend(c.GenWebeventPack(event_incall, data));
					});
					// unexpected_closure = true;
					gsmModem.on('close', async (data) => {
						//whole message data
						console.log(`Event Close: ` + JSON.stringify(data));
						//inited=false;
						if (inited) {
							inited = false;
							await run();
						}
					});
					gsmModem.on('onNewMessageIndicator', (data) => {
						//indicator for new message only (sender, timeSent)
						console.log(`Event New Message Indication: ` + JSON.stringify(data));
					});
					gsmModem.on('onSendingMessage', (data) => {
						//whole message data
						console.log(`###### Event Sending Message: ` + JSON.stringify(data));
					});
					gsmModem.on('onMemoryFull', (data) => {
						//whole message data
						console.log(`Event Memory Full: ` + JSON.stringify(data));
					});
					inited = true;
				} else {
					console.log('GSM modem is closed forever\n');
					inited = false;
				}
			};
			serialportgsm.list(async (err, result) => {
				console.log('serial port list', result);
				await run();
			});

			recipients = [];
			for (let idx = 0; idx < objd['repSMS_sms_recipients'].length; idx++) {
				recipients.push(objd['repSMS_sms_recipients'][idx][0]);
			}
		} else {
			console.log('sms eng switch off');
		}
	} else {
		console.log('serialport-gsm switch off');
		if (serialportgsm) await DeInitSGSM();
		if (objd.repSMS_SerialPortGSM_rstGpio && objd.repSMS_SerialPortGSM_rstGpio.length !== 0) {
			await ResetOnModemGpio(objd.repSMS_SerialPortGSM_rstGpio);
		}
	}
}

function send_sms(data) {
	/* sendsms format
     To: +79117088473

     test
     */
	console.log('send_sms ', data);
	if (gsmModem === undefined) return;

	let recpt = data.recipients === undefined ? recipients : data.recipients;
	console.log('recpt ', recpt);
	recpt.forEach((recptItem) => {
		if (inited) {
			gsmModem.sendSMS(recptItem, data.text, false, (result) => {
				console.log(
					`Callback Send: Message ID: ${result.data.messageId},` +
						`${result.data.response} To: ${result.data.recipient} ${JSON.stringify(result)}`
				);
				let status = result.status;

				if (status !== 'success') unsended[result.data.messageId] = result.data;
			});
		} else {
			unsended[recptItem] = {
				recipient: recptItem,
				message: data.text
			};
		}
	});
}

function breakcall() {
	console.log(`try breakcall`);
	if (inited) {
		gsmModem.hangupCall((result) => {
			console.log(`hangupCall result ${JSON.stringify(result)}`);
		});
	}
}

module.exports = {
	setup,
	send_sms,
	breakcall
};
