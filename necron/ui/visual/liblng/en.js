/**
 * Created by i7 on 30.01.2018.
 */
const __language_def = {
	__keywords: {
		apply: 'apply',
		lic_error: 'got to service, license error',
		clean_nm: 'clean',
		save_nm: 'save',
		save_rb: 'save',
		apply_one_nm: 'apply',
		apply_one: 'apply',
		apply_nm: 'apply',
		update_page: 'update',
		load_obj: 'load',
		_wnamenu: 'home',
		_wnaback: 'back',
		save: 'save',
		close: 'close',
		logout: 'logout',
		menu: 'home',
		language: 'language',
		click_to_apply: 'click to apply',
		Setting: 'Settings',
		Please_wait_dev_busy: 'Please wait, device is busy',
		device: 'device',
		Add: 'Add',
		Remove: 'Remove',
		Please_wait_resp: 'Please wait response',
		Please_wait_conn_lost: 'Please wait, connect is lost...',
		Please_wait_dict_download: 'Please wait, dictionary download...',
		Parameters_are_accept: 'Parameters are accepted',
		Error: 'Error',
		Enable: 'Enable',
		Disable: 'Disable',
		update_err: 'Update error, check firmare',
		update_ok: 'Firmware success, do update',
		secure_err: 'Password or login is not correct, try again',
		secure_changed: 'Login/password changed',
		secure_err_prio: 'Error user priority',
		jnodaReady: 'Server ready',
		request_err: 'incorrect request, ooops bug!!!',
		cookies_problem: 'Cookies are disabled, please enable them',
		screen_problem:
			'Not supported display resolution. The screen width must be greater than 640. Rotate the device 90° and press "close"',
		field: 'Field',
		xfl_ip: ' field contains incorrect IP address, the correct example (192.168.0.1)',
		xfl_mac: ' field contains incorrect MAC address, the correct example (00:80:0F:95:19:0F)',
		xfl_ln_min: ' (min len ',
		xfl_ln_max: ' (max len ',
		xfl_ln_elen: ' field contains incorrect length ',
		xfl_mm_max: ' (max num ',
		xfl_mm_min: ' (min num ',
		xfl_hhmm: ' contains incorrect time, valid format is HH:MM',
		xfl_mm_enum: ' field contains incorrect number ',
		xfl_email: 'contains an invalid email address, example youmail@mail.com',
		xfln: ' contains invalid character, only integers are allowed',
		xflf: ' contains invalid character, only numbers are allowed',
		server_not_respond: 'Server not respond',
		GET_LOG_WAIT: 'Compress file, please wait',
		PASSWD_REGEN: 'Password regen',
		JNODA_INITED: 'JS server inited',
		file_err: 'The file is damaged or missing, try again',
		ROLLOUT_CFG_ERROR:
			'Error, configuration not accepted. The configuration file is corrupted or not from this device',
		ROLLOUT_CFG_OK: 'The configuration is accepted, reboot the device.',
		AUTORIZE: 'Input login/password',
		uprep_wcheck: 'checking the contents of the firmware file',
		uprep_wcheck_ok: 'the firmware file is correct',
		uprep_wcheck_err: 'the firmware file is not correct',
		uprep_wfinalize: 'preparation for flashing a file to the system',
		uprep_wfinalize_ok: 'the preparation stage for the upgrade was successful',
		uprep_wfinalize_err: 'the preparation stage for the upgrade failed ',
		uevt_start_update: 'start update',
		uevt_write_rfs_img: 'write root image',
		uevt_write_fit_img: 'write system image',
		uevt_backup_sett: 'save settings',
		uevt_end_update_ok: 'system updated',
		uevt_end_update_err: 'update error, system not updated',
		uevt_ok_rb: 'reboot, preparing to launch the updated version',
		uevt_error: 'update failed',
		uprep_complete: 'update completed',
		uprep_start_search: 'search for device firmware on external drives',
		uprep_end_search: 'firmware search completed',
		uprep_identical: 'update is not required, the device has the same firmware version',
		uprep_err_hardware: 'firmware is not intended for this hardware',
		uprep_reboot: 'start update, reboot',
		'firmware file': 'firmware file',
		'found firmware file': 'found firmware file',
		'check firmware': 'integrity check started',
		'is bad': 'damaged',
		'is correct': 'correct',
		'finalize update file': 'preparing for firmware file',
		'select version': 'selected version',
		system_info_box:
			'Service panel, please wait for the operation to complete, do not refresh the page',
		// ----------- update
		'WAN side': 'WAN',
		'Bridge side': 'bridge',
		'Settings will be applied': 'Settings will be applied',
		Wizard: 'Settings Assistant',
		wiz_saved: 'Settings saved',
		wiz_applied: 'Settings saved, configuration applied',

		Manual: 'Manual',
		Name: 'Name',
		Access: 'Access',
		'From WAN port': 'From WAN port',
		'To LAN port': 'To LAN port',
		'To IP': 'In IP LAN',
		Type: 'Type',
		Address: 'Address',
		'Use unterval': 'by interval',
		'On event': 'by eventFromUI',
		'IP address': 'IP address',
		'On / Off': 'On / Off',
		'Net side': 'Network',
		Proto: 'Protocol',
		Direction: 'Direction',
		Port: 'Port',
		'Net direction': 'Direction',
		Input: 'Input',
		Output: 'Output',

		'No compress': 'No compression',
		'Compress WEB trafic': 'Compress WEB traffic',

		promo1: 'Promo',
		'page.ro':
			'For security reasons, changes on this page are blocked (demo mode). To evaluate this functionality, purchase the ADK6ull development kit. ',
		// Please_wait_dev_busy: 'Please wait, device is busy',
		// PAIR_ID_NOT_DIFF: "Channel IDs must be different",
		CREATE_VPN_KEY_SERT:
			'All current OpenVPN client keys will become invalid and will need to be recreated.',
		RBACK_FACTORY:
			'This action will result in the rollback of all your settings to the factory settings',
		CLEAN_DF_WARN: 'All user section data will be deleted',
		APPLY_ONE: 'Applying configuration',
		APPLY: 'Server reboot, wait a few seconds',
		OVPN_REGEN_SRV_READY:
			'The keys and certificates have been created, you need to restart the OpenVPN server. Restart now?',
		REMOVE_ALL: 'Delete all data',
		OPEN_VPN_REGEN_KEY_SERT_SRV:
			'Regeneration of the server key / certificate and certificate authority key / certificate',
		OPEN_VPN_REGEN_KEY_SERT_CLNT: 'Regeneration of the client config (* .ovpn)',
		ERR_UPLOAD_OPENVPN_CONFIG: 'OpenVPN config not found, please upload ovpn file',
		ERR_OPEN_VPN_REGEN_KEY_SERT: 'Please create a server key / certificate, settings are ignored',
		ERROR_TRY_AGAIN: 'Unknown error, try again',
		SECURE_OVPN_FILE_WBDELETE: 'The generated config will be deleted after 15 seconds',
		SECURE_OVPN_FILE_DELETE: 'Generated config deleted',
		ERR_OPEN_VPN_REGEN_CLIENT: 'Error creating key or client certificate, try again',
		NEED_REBOOT: 'Device restart required',
		NOT_DETECT_HTTPS_SEC: 'Please upload the network key and certificate',
		SECURE_DIFF_PASSWD: 'New and Copy new passwords is differents',
		FW_UPLOADED: 'Firmware uploaded',
		FW_NOT_UPLOADED: 'Firmware upload error',
		SEND_SETTINGS_ERROR: 'Configuration transfer error, try again',
		SELWAN_ERROR_PRIO: 'Error network priority',
		'Static IP': 'Static IP',
		DownloadWait: 'Loading ... Please wait ...',
		WriteWait: 'Recording ... Please wait ...',
		NeedConf: 'Unconfigured tabs detected.  N Please configure them.',
		noname: 'no name',
		conn_ok: 'Connection established',
		xfldesc:
			'contains an invalid character, only English, Russian letters are allowed, numbers and symbols are _',
		xflen: 'contains an invalid character, only English letters and numbers are allowed',
		xflens:
			"contains an invalid character, only English letters, numbers and characters are allowed -_ @ # $% & *! '",
		xflern: 'contains an invalid character, only English, Russian letters and numbers are allowed',
		xflerns:
			'contains an invalid character, only English, Russian letters, numbers and characters are allowed -_ @ # $% & *! \'" = + ? / ',
		xflhex:
			'contains an invalid character, only hexadecimal values ​​are allowed in the format 0xAABBCC',
		xflurl:
			'contains an invalid character in the URL, only English, Russian letters, numbers and characters are allowed:.-_',
		xfl_phone:
			'contains an invalid phone number, the number must contain a + sign, 11 digits and is written without the separator characters, example number +79997776655',
		xfleEnp:
			"contains an invalid character, only English letters, numbers and characters are allowed -_ @ # $% & *! '",
		Please_wait_dnk: 'Please wait, waiting for current data',
		'Unread message': 'Unread messages',
		selFileDir: 'select',
		cancel: 'cancel'
	},
	dhcp_server: {
		tips: {
			__pub:
				'DHCP server configuration of the local network interfaces that are integrated into the network bridge and binding of the IP clients to the MAC',
			brIP: 'IP address of network interfaces',
			dhEnable: 'Enable / disable DHCP server',
			dhStart: 'The initial IP address that can be issued by DHCP',
			dhStop: 'The final IP address that DHCP can issue',
			dhTime: 'Time to re-issue IP',
			dhGW: 'IP address of the gateway (bridge address / address of all local interfaces)',
			dhDNS: 'Primary DNS server address',
			dhDNSex: 'Additional DNS server address',
			tLinkMacIp: 'Table of matching / binding IP addresses and MAC',
			tDHCP_List: 'The list of clients that received the IP address from DHCP'
		}
	},
	afirewall: {
		tips: {
			__pub: 'Firewall settings',
			tMACblk: 'Select the access type (Allow allow, Deny disable)',
			tMACtab: 'Specify in the table the MAC addresses to which the selected rule applies'
		}
	},
	aforwarding: {
		tips: {
			__pub: 'Forwarding settings',
			PortRed: 'Enable traffic redirection',
			tNRedir:
				'Specify from which port the external WAN (From WAN port) network, to which port in the LAN (To LAN port) with the specified IP (To IP), redirect traffic',
			enDMZ: 'Enable DMZ (the device with the specified IP will be available from the WAN)',
			ipDMZ: 'The IP address of the device to which access is required'
		}
	},
	wifi_network: {
		tips: {
			__pub: 'WiFi settings in client mode',
			_dname: 'Used modem',
			Mode: 'Mode',
			Ssid: 'The name of the access point to which you want to connect',
			swapn: 'View the closest APNs',
			Passwd: 'Password from access point',
			Sec: 'Type of protection'
		}
	},
	wifi_networklan: {
		tips: {
			__pub: 'WiFi settings in access point mode',
			_dname: 'Used modem',
			Ssid: 'Access Point Name',
			swapn: 'View the closest APNs',
			Bct: 'Broadcast the network name, if off, the network can not be found by name',
			Reg: 'Enter your region',
			Passwd: 'Access Point Password',
			WDS: 'Enable WDS',
			M: 'WiFi mode',
			W: 'WiFi bandwidth',
			Ch: 'Selecting the preferred channel',
			Sec: 'Defines the protection algorithm',
			KeyInt: 'The frequency of updating encryption keys'
		}
	},
	ethernet_networklan: {
		tips: {
			__pub: 'Ethernet Settings',
			FakeMac: 'If you want to change the MAC address, activate this item',
			delimMac: 'Specify the MAC address',
			Mac: 'MAC address'
		}
	},
	ethernet_network: {
		tips: {
			__pub: 'Ethernet Settings',
			Mode: 'Selecting the method of obtaining IP',
			Ip: 'IP address of the network',
			Ms: 'Network Mask',
			Gw: 'Gateway IP',
			FakeMac: 'If you want to change the MAC address, activate this item',
			delimMac: 'Specify the MAC address',
			Mac: 'MAC address'
		}
	},
	gsm_network: {
		tips: {
			__pub: 'Cellular connection settings',
			mmode: 'Specifies through which driver the system will interact with the modem',
			edrv: 'Virtual Ethernet USB-CDC driver, or QMI, or NDI',
			eif: 'Interface name in OS',
			smgsm:
				'If the default settings do not work, select advanced.This mode allows you to edit the pppd scripts ',
			apn: 'Operator access point name',
			cdev: 'Virtual serial port for modem management, for example sending SMS',
			ddev: 'Virtual serial port for data transfer',
			dnum: 'Usually * 99 *** 1 #, depends on the operator',
			conscr: 'Used by the pppd daemon to raise the connection',
			disscr: 'Used by the pppd daemon to correctly terminate the connection',
			auth: 'Needed if the operator requires (usually not required)',
			uname: 'Username',
			upasswd: 'User password',
			atype:
				'Specifies how the password / login is transmitted to the operator when connected (usually not required)',
			pset: 'Select Manual if the modem does not access the Internet with Auto mode and set the correct port numbers. \
Modem ports in RAS mode, these are USB-COM virtual ports, they can be from 1 to 8, depending on the model of the modem. If they are not properly configured \
the modem does not go online. If this did not help try to clarify (in Google), does ATI require the initialization string, if so then try with it. ',
			atid: 'Required if the modem does not go online due to the manufacturer\'s characteristics. For example, for almost all huawey modems to work, you must specify AT^NDISDUP=1,1,"internet"\\r\\n',
			atic: 'Required if the modem does not go online due to the manufacturer\'s characteristics. For example, for almost all huawey modems to work, you must specify AT^NDISDUP=1,1,"internet"\\r\\n'
		}
	},
	reboot: {
		tips: {
			__pub: 'Restart',
			reboot_btn: 'Reboot device'
		},
		name: {
			askreb: 'Reboot device?'
		}
	},
	update: {
		tips: {
			__pub: 'Updating the device software',
			update:
				'Specify a full update mode or an update with saving settings (Update, with save conf)',
			fw: 'Specify software'
		},
		name: {
			fw: 'Please select firmware'
		}
	},
	state: {
		tips: {
			__pub: 'General statistics',
			show_det: 'Show details of this WAN connection',
			show_detl: 'Show details of this LAN connection',
			netstat:
				'The graph shows how many kbytes per second is transmitted plus received by a specific interface'
		}
	},
	secure: {
		tips: {
			__pub: 'Security Settings',
			slog: 'Enter the current login (default admin)',
			spass: 'Specify the current password (admin by default)',
			nlog: 'Enter a new login, at least 5 characters long',
			npass: 'Enter a new password, at least 5 characters long',
			cnpass: 'Enter a copy of the new password'
		}
	},
	device: {
		tips: {
			__pub: 'Device Settings',
			hostname: 'Input device name',
			askfact: 'Remove all settings and firmware',
			ihttp: 'Select HTTPS for best secure, or HTTP if not req secure',
			hport: 'HTTP port (usually 80 or 8080)',
			gzip_en: 'Enable compress trafic with use GZIP',
			gzip_thr:
				'Select threshold in byte. Packages with a size less than the threshold are not compressed',
			hsport: 'HTTPS port (usually 443)',
			httpkey: 'TLS private key',
			httpcert: 'TLS certificate',
			ishttp:
				'Select betwen self-signed and normal certificate. Self-signed certificate does not require external certification authority'
		},
		name: {}
	},
	websrv: {
		tips: {
			webPostDebug:
				'<br>Rebuild all BuildObj (rebuild)<br>' +
				'http://192.168.20.221/debug?page=sga&action=rebuild<br><br>' +
				'Restart udev<br>' +
				'http://192.168.20.221/debug?page=sga&action=udev<br><br>' +
				'Restart jnoda<br>' +
				'http://192.168.20.221/debug?page=sga&action=jnoda<br><br>' +
				'Restart cnoda<br>' +
				'http://192.168.20.221/debug?page=sga&action=cnoda<br><br>' +
				'Stop cnoda<br>' +
				'http://192.168.20.221/debug?page=sga&action=stop<br><br>' +
				'Run cnoda<br>' +
				'http://192.168.20.221/debug?page=sga&action=start<br><br>' +
				'Reload all<br>' +
				'http://192.168.20.221/debug?page=sga&action=term'
		},
		name: {},
		tips_jpg: {}
	},
	sshd: {
		tips: {
			__pub:
				'Example config without password and keys<br>' +
				'UsePrivilegeSeparation - No<br>' +
				'StrinctModes - No<br>' +
				'PermitRootLogin - Yes<br>' +
				'RSAAutentication - No<br>' +
				'PubkeyAuthentication No<br>' +
				'PermitEmptyPassword - Yes<br>' +
				'ChallengeResponseAuthetication - No<br>' +
				'PasswordAuthetication - Yes<br>'
		}
	}
};

module.exports = {
	__language_def
};
