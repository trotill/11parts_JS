/**
 * Created by i7 on 14.01.2020.
 */
function Build() {
	const smsd_data = [
		{
			type: 'switch',
			value: false,
			id: 'repSMS_smsd',
			name: 'sms reporter via smsd'
		},
		{
			type: 'tfield',
			value: '/dev/ttyUSB0',
			id: 'repSMS_smsd_tty',
			name: 'TTY port for SMS'
		},
		{
			type: 'tfield',
			value: '',
			id: 'repSMS_smsd_pin',
			name: 'Pin code'
		},
		{
			type: 'switch',
			value: false,
			id: 'repSMS_smsd_incoming',
			name: 'incoming message'
		}
	];
	/*
     //repSMS_SerialPortGSM
     //repSMS_SerialPortGSM_baudrate
     //repSMS_SerialPortGSM_pin
     //repSMS_SerialPortGSM_tty
     //repSMS_SerialPortGSM_event_incall
     //repSMS_SerialPortGSM_event_state
     //repSMS_SerialPortGSM_event_sms
     //repSMS_SerialPortGSM_init_cmd
     //repSMS_SerialPortGSM_logger ['','console','debug']
     //repSMS_SerialPortGSM_pdu ['true','false']
     //repSMS_sms_recipients

     */

	const SerialPortGSM_data = [
		{
			type: 'switch',
			value: false,
			id: 'repSMS_SerialPortGSM',
			name: 'sms reporter via serialport-gsm'
		},
		{
			type: 'tfield',
			value: '/dev/ttyUSB0',
			id: 'repSMS_SerialPortGSM_tty',
			name: 'TTY port for SMS'
		},
		{
			type: 'tfield',
			value: '',
			id: 'repSMS_SerialPortGSM_pin',
			name: 'Pin code'
		},
		{
			type: 'tfield',
			value: '',
			id: 'repSMS_SerialPortGSM_rstGpio',
			name: 'Reset gpio'
		},
		{
			type: 'tfield',
			value: '',
			id: 'repSMS_SerialPortGSM_rstGpioDelay',
			name: 'Reset gpio timeout'
		},

		//
		{
			name: 'Baudrate',
			type: 'sbox',
			value: '115200',
			id: 'repSMS_SerialPortGSM_baudrate',
			tabidx: 1,
			items_name: [
				'921600',
				'460800',
				'230400',
				'115200',
				'57600',
				'38400',
				'19200',
				'9600',
				'4800',
				'2400',
				'1200'
			],
			items_val: [
				'921600',
				'460800',
				'230400',
				'115200',
				'57600',
				'38400',
				'19200',
				'9600',
				'4800',
				'2400',
				'1200'
			]
		},
		{
			name: 'Logger mode',
			type: 'sbox',
			value: '',
			id: 'repSMS_SerialPortGSM_logger',
			tabidx: 1,
			items_name: ['None', 'Console', 'Debug'],
			items_val: ['', 'console', 'debug']
		},
		{
			type: 'tfield',
			value: '',
			id: 'repSMS_SerialPortGSM_init_cmd',
			name: 'Modem init CMD'
		},
		//AT&F Reset AT Command Settings to Factory Default Values
		{
			type: 'tfield',
			value: '',
			id: 'repSMS_SerialPortGSM_executeCommand',
			name: 'Execute command into init'
		},
		{
			type: 'tfield',
			value: '',
			id: 'repSMS_SerialPortGSM_exeAfterInitCMD',
			name: 'Execute command after init'
		},
		{
			type: 'tfield',
			value: 'spgIncall',
			id: 'repSMS_SerialPortGSM_event_incall',
			name: 'In call event name'
		},
		{
			type: 'tfield',
			value: 'spgState',
			id: 'repSMS_SerialPortGSM_event_state',
			name: 'Quality status event name'
		},
		{
			type: 'tfield',
			value: 'spgSMS',
			id: 'repSMS_SerialPortGSM_event_sms',
			name: 'Recive SMS event name'
		},
		{
			type: 'switch',
			value: false,
			id: 'repSMS_SerialPortGSM_pdu',
			name: 'PDU mode'
		},
		{
			type: 'switch',
			value: false,
			id: 'repSmsSpgRecvSMSFromSim',
			name: 'Receive SMS from SIM card only, without onNewMessage'
		},
		{
			type: 'switch',
			value: false,
			id: 'repSmsSpgNotRmSmsAfterInit',
			name: 'Not remove all SMS from SIM after init modem'
		},
		{
			type: 'switch',
			value: false,
			id: 'repSmsSpgUseRemoveAll',
			name: 'Use remove all SMS, ATI command (unsupport many modems)'
		},
		{
			name: 'AT+CNMI (enable indication of receiving SMS)',
			type: 'sbox',
			value: '',
			id: 'repSmsSpgRecvEvent',
			tabidx: 1,
			items_name: ['Only eventFromUI', 'Event with content', 'None'],
			items_val: ['AT+CNMI=2,1', 'AT+CNMI=2,2', '']
		},
		{
			type: 'tfield',
			value: 5000,
			format: 'int',
			id: 'repSmsSpgGetSigTout',
			name: 'Signal stretch poll timeout'
		},
		{
			type: 'tfield',
			value: 5000,
			format: 'int',
			id: 'repSmsSpgWaitCmdTout',
			name: 'Wait modem response timeout on CMD'
		},
		{
			type: 'tfield',
			value: 50,
			format: 'int',
			id: 'repSmsSpgReRunIfError',
			name: 'Rerun count if modem not response'
		}
	];

	const nodemailer_data = [
		{
			type: 'switch',
			value: false,
			id: 'repEmail_nm',
			name: 'email reporter via nodemailer'
		},
		{
			name: 'SMTP server URL',
			type: 'tfield',
			id: 'repEmail_nm_SMTP_host',
			value: 'smtp.yandex.ru'
			//flt: {len:['2','63'],sym:['url']},
		},
		{
			name: 'SMTP server Port',
			type: 'tfield',
			id: 'repEmail_nm_SMTP_port',
			value: '465'
			// flt: {len:['2','63'],sym:['url']},
		},
		{
			name: 'SMTP from field',
			type: 'tfield',
			id: 'repEmail_nm_SMTP_from',
			value: 'device_reporter@11-parts.com'
			// flt: {len:['2','63'],sym:['ens']},
		},
		{
			name: 'SMTP subject field',
			type: 'tfield',
			id: 'repEmail_nm_SMTP_subj',
			value: '11-parts'
			// flt: {len:['2','63'],sym:['erns']},
		},
		{
			name: 'SMTP login',
			type: 'tfield',
			id: 'repEmail_nm_SMTP_user',
			value: 'device_reporter@11-parts.com'
			// flt: {len:['2','63'],sym:['ens']},
		},
		{
			name: 'SMTP password',
			type: 'tfield',
			id: 'repEmail_nm_SMTP_passwd',
			value: 'Devrep2020'
			//flt: {len:['2','63'],sym:['ens']},
		}

		//from: 'device_reporter@11-parts.com',
	];

	const email_data = [
		{
			type: 'switch',
			value: false,
			id: 'repShowNodemailer',
			name: 'show nodemailer',
			data: nodemailer_data
		},
		{
			name: 'Test mail data',
			type: 'var',
			id: 'repSendTestMail_Text',
			value: 'Test mail. Hello!!!'
		},
		{
			name: 'eMail recipients',
			type: 'table',
			id: 'repEmail_recipients',
			edit: true,
			tabh: ['eMail'],
			jvalue: {
				obj: [
					{
						name: 'eMail',
						type: 'tfield',
						showname: false,
						// flt: {len:['2','63'],sym:['ens']},
						fltsett: { event: false }, //eventFromUI disable
						value: '',
						css: 'width:100%'
					}
				]
			}
		},
		{
			type: 'button_a',
			value: false,
			id: 'repSendTestMail',
			name: 'Send test mail',
			event: {
				click: [
					{
						type: 'action',
						param: {
							action: 'repSendTestMail',
							subscribers: ['cnoda'],
							params_provider: 'SettingsProvider'
						}
					}
				]
			}
		}

		//from: 'device_reporter@11-parts.com',
	];

	const sms_data = [
		{
			type: 'switch',
			value: false,
			id: 'repShowSmsd',
			name: 'show SMSd',
			data: smsd_data
		},
		{
			type: 'switch',
			value: false,
			id: 'repShowSerialPortGSM',
			name: 'show SerialPortGSM',
			data: SerialPortGSM_data
		},
		{
			name: 'Test sms data',
			type: 'var',
			id: 'repSendTestSMS_Text',
			value: 'Test sms. Hello!!!'
		},
		{
			name: 'SMS recipients',
			type: 'table',
			id: 'repSMS_sms_recipients',
			edit: true,
			tabh: ['tel'],
			value: [[]],
			jvalue: {
				obj: [
					{
						name: 'tel',
						type: 'tfield',
						showname: false,
						// flt: {len:['2','63'],sym:['ens']},
						fltsett: { event: false }, //eventFromUI disable
						value: '',
						flt: { chain: ['phone'] },
						css: 'width:100%'
					}
				]
			}
		},
		{
			name: 'SMS senders',
			type: 'table',
			id: 'repSMS_sms_senders',
			edit: true,
			tabh: ['tel'],
			value: [[]],
			jvalue: {
				obj: [
					{
						name: 'tel',
						type: 'tfield',
						showname: false,
						// flt: {len:['2','63'],sym:['ens']},
						fltsett: { event: false }, //eventFromUI disable
						value: '',
						flt: { chain: ['phone'] },
						css: 'width:100%'
					}
				]
			}
		},
		{
			type: 'button_a',
			value: false,
			id: 'repSendTestSMS',
			name: 'Send test sms',
			event: {
				click: [
					{
						type: 'action',
						param: {
							action: 'repSendTestSMS',
							subscribers: ['cnoda'],
							params_provider: 'SettingsProvider'
						}
					}
				]
			}
		}
		//from: 'device_reporter@11-parts.com',
	];
	//
	const rep_data = [
		{
			type: 'switch',
			value: false,
			id: 'repEmailEnable',
			name: 'email reporter',
			data: email_data
		},
		{
			type: 'switch',
			value: false,
			id: 'repSMSEnable',
			name: 'SMS reporter',
			data: sms_data
		},
		{
			name: 'Language',
			type: 'sbox',
			value: 'RU',
			id: 'repLang',
			tabidx: 1,
			items_name: ['RU', 'EN'],
			items_val: ['ru', 'en']
		}
	];
	return [
		{
			type: 'switch',
			value: false,
			id: 'repEnable',
			name: 'reporter',
			data: rep_data
		}
	];
}

function SaveSettings(obj, vers) {
	const stat = 'ok';

	console.log('SaveSettings obj', obj);
	console.log('VERS', vers);

	if (obj['repEmail_nm_SMTP_port'] === '465') obj['repEmail_nm_SMTP_secure'] = 'true';
	else obj['repEmail_nm_SMTP_secure'] = 'false';

	if (!obj['repEmail_nm_SMTP_from'] || obj['repEmail_nm_SMTP_from'].length === 0) {
		obj['repEmail_nm_SMTP_from'] = obj['repEmail_nm_SMTP_user'];
	}

	return { stat: stat, result: obj };
}

module.exports = {
	Build,
	SaveSettings
};
