/**
 * Created by Ilya on 05.07.2018.
 */
const c = require('../../../backCore');
const logger = c.getLogger();
let fs = require('fs');
let ex = require('./../../../exec');
let nm = require('./network_manager.js');

let openvpn_id_srv;
let openvpn_id_clnt;
let l2tp_id;
let ipsec_id;
let icup_int;
let ovpn_int;
let ovpn_int_gvar = { ip: '', force_rst: 0 };

async function fill_xl2tp_conf(obj, saddr) {
	let xl2tp =
		'[global]\n\
access control = yes\n\
listen-addr = ' +
		saddr +
		'\n\
debug tunnel = yes\n\
[lac vpnserver]\n\
lns = ' +
		obj.vpn_server_ipurl +
		'\n\
redial = yes\n\
redial timeout = 5\n\
length bit = yes\n\
refuse pap = ' +
		obj.refusepap +
		'\n\
refuse chap = ' +
		obj.refusechap +
		'\n\
require authentication = ' +
		obj.rauth +
		'\n\
name = ' +
		obj.vpn_user +
		'\n\
ppp debug = yes\n\
pppoptfile = ' +
		c.CACHE_PATH +
		'/l2tp_option.conf\n\
autodial = yes\n';
	//console.log('wr',xl2tp);
	ex.writeFilePromise(c.CACHE_PATH + '/xl2tpd.conf', xl2tp);
}

async function fill_ipsecconf_conf(obj) {
	let ipseccfg =
		'conn %default\n\n\
    ikelifetime=60m\n\
    keylife=20m\n\
    rekeymargin=3m\n\
    keyingtries=1\n\
    keyexchange=ikev2\n\
    authby=secret\n\
    ike=aes256gcm16-aes256gcm12-aes128gcm16-aes128gcm12-sha256-sha1-modp2048-modp4096-modp1024,aes256-aes128-sha256-sha1-modp2048-modp4096-modp1024,3des-sha1-modp1024!\n\
    esp=aes128gcm12-aes128gcm16-aes256gcm12-aes256gcm16-modp2048-modp4096-modp1024,aes128-aes256-sha1-sha256-modp2048-modp4096-modp1024,aes128-sha1-modp2048,aes128-sha1-modp1024,3des-sha1-modp1024,aes128-aes256-sha1-sha256,aes128-sha1,3des-sha1!\n\
\nconn l2tp-psk-client\n\n\
    keyexchange=' +
		obj.ipsec_keyex +
		'\n\
    left=%defaultroute\n\
    auto=add\n\
    authby=secret\n\
    type=transport\n\
    leftprotoport=17/1701\n\
    rightprotoport=17/1701\n\
    right=' +
		obj.vpn_server_ipurl +
		'\n\
    rightid=%any\n\
';
	ex.writeFilePromise(c.CACHE_PATH + '/ipsec.conf', ipseccfg);
}

async function fill_ipsecsecure(obj) {
	let ipsecs = ': PSK "' + obj.ipsec_psk + '"\n';
	ex.writeFilePromise(c.CACHE_PATH + '/ipsec.secrets', ipsecs);
}

async function fill_l2tp_option(obj) {
	let optionf =
		'ipcp-accept-local\n\
ipcp-accept-remote\n\
refuse-eap\n\
require-mschap-v2\n\
noccp\n\
noauth\n\
unit 200\n\
idle 1800\n\
mtu 1410\n\
mru 1410\n\
nodefaultroute\n\
usepeerdns\n\
debug\n\
connect-delay 5000\n\
name ' +
		obj.vpn_user +
		'\n\
password ' +
		obj.vpn_passwd +
		'\n'; //listen-addr = 192.168.0.194\n\
	ex.writeFilePromise(c.CACHE_PATH + '/l2tp_option.conf', optionf);
}

async function fill_openvpn_server(obj) {
	/*
     mode server
     dev tun
     server 10.128.0.0 255.255.255.0
     push "redirect-gateway def1"
     # важно! иначе будем ходить в DNS провайдера
     push "dhcp-option DNS 8.8.8.8"
     tls-server
     ca /www/pages/openvpn/pki/ca.crt
     cert /www/pages/openvpn/pki/issued/server.crt
     key /www/pages/openvpn/pki/private/server.key
     dh /www/pages/openvpn/pki/dh.pem
     proto tcp-server
     port 1194
     # клиенты видят друг друга
     client-to-client
     comp-lzo
     keepalive 10 120
     verb 4
     cipher AES-256-CBC
     user nobody
     group nogroup
     max-clients 10
     askpass /www/pages/openvpn/ovs.pass
     */
	let askpass = obj.pem_srv_passwd;

	await ex.writeFilePromise(c.CACHE_PATH + '/askpass', askpass);

	//server-bridge
	let smode;
	if (obj.vpn_topology === 'bridge') {
		smode = 'server-bridge';
	} else smode = 'server ' + obj.vpn_ip + ' ' + obj.vpn_mask;
	let ovp =
		'mode server\n\
    dev ' +
		obj.vpn_dev +
		'\n\
    ' +
		smode +
		'\n\
    tls-server\n\
    ca ' +
		c.GetSettingPath('ca.crt') +
		'\n\
    cert ' +
		c.GetSettingPath('server.crt') +
		'\n\
    key ' +
		c.GetSettingPath('server.key') +
		'\n\
    dh ' +
		c.GetSettingPath('dh.pem') +
		'\n\
    proto ' +
		obj.proto +
		'\n\
    port ' +
		obj.vpn_port +
		'\n' +
		obj.vpn_opt_list +
		'\n\
    client-to-client\n\
    comp-lzo\n\
    verb 4\n\
    cipher ' +
		obj.vpn_cipher +
		'\n\
    user nobody\n\
    group nogroup\n\
    max-clients ' +
		obj.max_clients +
		'\n\
    askpass ' +
		c.CACHE_PATH +
		'/askpass\n';

	await ex.writeFilePromise(c.CACHE_PATH + '/openvpn_srv.conf', ovp);
}

async function setup(obj) {
	logger.info('Setup VPN', obj);

	if (icup_int !== undefined) {
		clearInterval(icup_int);
		icup_int = undefined;
	}

	if (ovpn_int !== undefined) {
		clearInterval(ovpn_int);
		ovpn_int = undefined;
	}

	if (obj.vpn_enable === 'true') {
		if (obj.vpn_type === 'ovpn') {
			ex.ServiceCtrl(l2tp_id, 'stop');
			ex.ServiceCtrl(ipsec_id, 'stop');
			if (obj.vpn_netif === undefined) obj.vpn_netif = 'auto';

			if (obj.vpn_role === 'client') {
				ex.ServiceCtrl(openvpn_id_srv, 'stop');
				let vpn_conf = await c.GetSettingPromise('openvpn_client');

				let result = vpn_conf
					.replace(/remote/g, '#')
					.replace(/auth-user-pass/g, '#')
					.replace(/nobind/g, '#');

				let aup = '';
				if (obj.vpn_auth_mode === 'userpasswd') {
					let auth = obj.vpn_user + '\n' + obj.vpn_passwd;
					await ex.writeFilePromise(c.CACHE_PATH + '/vpn_auth.txt', auth);
					aup = aup + 'auth-user-pass ' + c.CACHE_PATH + '/vpn_auth.txt\n';
				} else if (obj.vpn_auth_mode === 'passwd') {
					let askpass = obj.vpn_passwd;
					aup = aup + 'askpass ' + c.CACHE_PATH + '/askpass\n';
					await ex.writeFilePromise(c.CACHE_PATH + '/askpass', askpass);
				}

				let openVpnClientConf =
					'log-append /var/log/openvpn.log\nremote ' +
					obj.vpn_server_ip +
					' ' +
					obj.vpn_server_port +
					'\n' +
					aup +
					result +
					'\nlog-append /var/log/openvpn.log\n';
				await ex.writeFilePromise(c.CACHE_PATH + '/openvpn_client.conf', openVpnClientConf);

				logger.info('Run OpenVPN client mode');
				nm.AddIptablesRule('openvpn_clnt', async function () {
					await ex.ExecPromise(
						c.IPTABLES + ' -I OUTPUT -p tcp --dport ' + obj.vpn_server_port + ' -j ACCEPT'
					);
					await ex.ExecPromise(
						c.IPTABLES + ' -I OUTPUT -p udp --dport ' + obj.vpn_server_port + ' -j ACCEPT'
					);
					await ex.ExecPromise(
						c.IPTABLES +
							' -I INPUT -p tcp --sport ' +
							obj.vpn_server_port +
							' --dport 0:65535 -m state --state ESTABLISHED,RELATED -j ACCEPT'
					);
					await ex.ExecPromise(
						c.IPTABLES +
							' -I INPUT -p udp --sport ' +
							obj.vpn_server_port +
							' --dport 0:65535 -j ACCEPT'
					);
				});

				ovpn_intf = async (cfg) => {
					let ifc;
					let vpnif = cfg.vpn_netif;
					if (cfg.vpn_netif === 'auto') {
						vpnif = nm.GetWANInfo(cfg.vpn_netif).srcwan;
						if (vpnif === '') vpnif = c.BRIDGE_NAME;
						ifc = await nm.GetIfconfig(vpnif);
						//console.log("srcwan",vpnif);
					} else {
						ifc = await nm.GetIfconfig(cfg.vpn_netif);
					}
					let ip = ifc.ip;

					console.log(
						'ovpn bind ip ',
						ip,
						' openvpn_id_clnt',
						openvpn_id_clnt,
						'ovpn_int_gvar',
						ovpn_int_gvar,
						'vpnif',
						vpnif
					);
					//ex.ShowRunarr();
					if (
						(ovpn_int_gvar.ip !== ip || ovpn_int_gvar.force_rst) &&
						vpnif !== 'tun0' &&
						vpnif !== 'tap0'
					) {
						ovpn_int_gvar.force_rst = 0;
						if (ip && ip !== '0.0.0.0') {
							console.log('ovpn restart for net ', ip);
							logger.debug('ovpn restart for net ', ip);
							openvpn_id_clnt = ex.ServiceDiffArgs(
								openvpn_id_clnt,
								'openvpn',
								'--tmp-dir ' +
									c.CACHE_PATH +
									' --config ' +
									c.CACHE_PATH +
									'/openvpn_client.conf --local ' +
									ip,
								'restart',
								{
									aal_lines_in_block: 10000,
									aal_path: '/var/run/svclog/'
								}
							);
						} else {
							console.log('ovpn restart for net auto');
							logger.debug('ovpn restart for net auto');
							openvpn_id_clnt = ex.ServiceDiffArgs(
								openvpn_id_clnt,
								'openvpn',
								'--tmp-dir ' + c.CACHE_PATH + ' --config ' + c.CACHE_PATH + '/openvpn_client.conf',
								'restart',
								{
									aal_lines_in_block: 10000,
									aal_path: '/var/run/svclog/'
								}
							);
						}
						ovpn_int_gvar.ip = ip;
					}
				};
				ovpn_int_gvar.force_rst = 1;
				if (obj.vpn_netif !== 'default') {
					await ovpn_intf(obj);
					ovpn_int = setInterval(ovpn_intf, 1000, obj, openvpn_id_clnt);
				} else
					openvpn_id_clnt = ex.ServiceDiffArgs(
						openvpn_id_clnt,
						'openvpn',
						'--tmp-dir ' + c.CACHE_PATH + ' --config ' + c.CACHE_PATH + '/openvpn_client.conf',
						'restart'
					);
			} else {
				ex.ServiceCtrl(openvpn_id_clnt, 'stop');
				await fill_openvpn_server(obj);
				nm.AddIptablesRule('openvpn_srv', async function () {
					await ex.ExecPromise(
						c.IPTABLES +
							' -I OUTPUT -p tcp --sport ' +
							obj.vpn_port +
							' --dport 0:65535 -m state --state ESTABLISHED,RELATED -j ACCEPT'
					);
					await ex.ExecPromise(
						c.IPTABLES + ' -I OUTPUT -p udp --sport ' + obj.vpn_port + ' --dport 0:65535 -j ACCEPT'
					);

					await ex.ExecPromise(
						c.IPTABLES + ' -I INPUT -p udp --sport 0:65535 --dport ' + obj.vpn_port + ' -j ACCEPT'
					);
					// ex.ExecNoOutSync(c.IPTABLES + " -I INPUT -p udp -m udp --sport "+obj.vpn_port+" -j ACCEPT");
					await ex.ExecPromise(
						c.IPTABLES + ' -I INPUT -p tcp --sport 0:65535 --dport ' + obj.vpn_port + ' -j ACCEPT'
					);
				});
				//Для синхроницации с др. копиями, вдруг в оригинале ошибка
				c.GetSetting('server.crt');
				c.GetSetting('server.key');
				c.GetSetting('ca.crt');
				c.GetSetting('ca.key');
				openvpn_id_srv = ex.Service(
					'openvpn',
					'--tmp-dir ' + c.CACHE_PATH + ' --config ' + c.CACHE_PATH + '/openvpn_srv.conf',
					'restart',
					{
						log: {
							aal_lines_in_block: 10000,
							aal_path: '/var/run/svclog/'
						}
					}
				);
			}
		}
		if (obj.vpn_type === 'l2tp' || obj.vpn_type === 'l2tpipsec') {
			//l2tp - ppp200 device!!!
			if (obj.vpn_type === 'l2tp') ex.ServiceCtrl(ipsec_id, 'stop'); // ex.DeinitService(ipsec_id);
			ex.ServiceCtrl(openvpn_id_srv, 'stop'); // ex.DeinitService(openvpn_id_srv);
			ex.ServiceCtrl(openvpn_id_clnt, 'stop'); // ex.DeinitService(openvpn_id_clnt);
			await fill_l2tp_option(obj);
			await fill_xl2tp_conf(obj, '0.0.0.0');
			logger.info('Run L2TP client mode');
			try {
				fs.mkdirSync('/var/run/xl2tpd/');
			} catch (e) {
				logger.debug('error cfg vpn xl2tpd');
			}
			if (obj.vpn_type === 'l2tpipsec') {
				await fill_ipsecconf_conf(obj);
				await fill_ipsecsecure(obj);
				ipsec_id = ex.Service('ipsec', 'restart --nofork', 'restart');
				let restart_xl2tp = false;
				const IpSecUP = async () => {
					//Автоподьем соединения ipsec, если размер вывода статус меньше 100 байт, значит соединение не поднято
					//setTimeout(IpSecUP,1000);
					let r = await ex.ExecPromise('ipsec status');
					let ret = r.stdout.toString();
					if (ret.length > 100) {
						if (restart_xl2tp) {
							let ip_match = ret.match(/(\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])+/g);
							// console.log("!!!!!!!****ret", ret);
							if (ip_match != null && ip_match.length !== 0) {
								console.log('!!!!!!!****Match l2tp/ipsec net', ip_match[0].replace(/[[\]]/g, ''));
								await fill_xl2tp_conf(obj, ip_match[0].replace(/[[\]]/g, ''));
								l2tp_id = ex.Service('xl2tpd', '-c ' + c.CACHE_PATH + '/xl2tpd.conf -D', 'restart');
								restart_xl2tp = false;
							}
						}
					} else {
						restart_xl2tp = true;
						await ex.ExecPromise('ipsec up l2tp-psk-client');
					}
				};
				icup_int = setInterval(IpSecUP, 1000);
				nm.AddIptablesRule('ipsecl2tp', async () => {
					await ex.ExecPromise(
						c.IPTABLES +
							' -I INPUT -p tcp --dport 500 -m state --state ESTABLISHED,RELATED -j ACCEPT'
					);
					await ex.ExecPromise(c.IPTABLES + ' -I INPUT -p udp --dport 500 -j ACCEPT');
					await ex.ExecPromise(
						c.IPTABLES +
							' -I OUTPUT -p tcp --dport 500 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT'
					);
					await ex.ExecPromise(c.IPTABLES + ' -I OUTPUT -p udp --dport 500 -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I OUTPUT -p udp --dport 4500 -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I INPUT -p udp --dport 4500 -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I INPUT -p esp -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I INPUT -p ah -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I OUTPUT -p esp -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I OUTPUT -p ah -j ACCEPT');
				});
				nm.AddIptablesRule('l2tp', async () => {
					await ex.ExecPromise(c.IPTABLES + ' -I INPUT -p udp --dport 1701 -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I OUTPUT -p udp --dport 1701 -j ACCEPT');
				});
			} else {
				ex.ServiceCtrl(ipsec_id, 'stop'); //ex.DeinitService(ipsec_id);

				l2tp_id = ex.Service('xl2tpd', '-c ' + c.CACHE_PATH + '/xl2tpd.conf -D', 'restart');
				nm.AddIptablesRule('l2tp', async () => {
					await ex.ExecPromise(c.IPTABLES + ' -I INPUT -p udp --dport 1701 -j ACCEPT');
					await ex.ExecPromise(c.IPTABLES + ' -I OUTPUT -p udp --dport 1701 -j ACCEPT');
				});
			}
		}
	} else {
		ex.ServiceCtrl(openvpn_id_clnt, 'stop'); //ex.DeinitService(openvpn_id_clnt);
		ex.ServiceCtrl(openvpn_id_srv, 'stop'); //ex.DeinitService(openvpn_id_srv);
		ex.ServiceCtrl(l2tp_id, 'stop'); //ex.DeinitService(l2tp_id);
		ex.ServiceCtrl(ipsec_id, 'stop'); //ex.DeinitService(ipsec_id);
	}
}

function ovpn_regen_srv(obj) {
	//obj conte - {ca_passwd,pem_srv_passwd,pem_client_passwd}
	/*#!bin/sh
     /etc/easyrsa/easyrsa "init-pki"
     /etc/easyrsa/easyrsa "build-ca" "test"
     /etc/easyrsa/easyrsa "build-server-full" "server" "test_pem" "test"
     /etc/easyrsa/easyrsa "build-client-full" "client" "test_pem" "test"
     */

	let reg_scr =
		'#!bin/sh\n\
sh /etc/easyrsa/easyrsa "init-pki"\n\
sh /etc/easyrsa/easyrsa "build-ca" ' +
		obj.ca_passwd +
		'\n\
sh /etc/easyrsa/easyrsa "build-server-full" "server" "' +
		obj.pem_srv_passwd +
		'" "' +
		obj.ca_passwd +
		'"\n\
' +
		c.SaveSignSettingForBash(c.CACHE_PATH + '/pki/ca.crt', 'ca.crt') +
		'\n\
' +
		c.SaveSignSettingForBash(c.CACHE_PATH + '/pki/issued/server.crt', 'server.crt') +
		'\n\
' +
		c.SaveSignSettingForBash(c.CACHE_PATH + '/pki/private/ca.key', 'ca.key') +
		'\n\
' +
		c.SaveSignSettingForBash(c.CACHE_PATH + '/pki/private/server.key', 'server.key') +
		'\n';

	fs.writeFileSync(c.CACHE_PATH + '/rovn_s.sh', reg_scr, 'utf-8');
}

function ovpn_regen_clnt(obj) {
	//obj conte - {ca_passwd,pem_srv_passwd,pem_client_passwd}
	/*#!bin/sh
     /etc/easyrsa/easyrsa "init-pki"
     /etc/easyrsa/easyrsa "build-ca" "test"
     /etc/easyrsa/easyrsa "build-server-full" "server" "test_pem" "test"
     /etc/easyrsa/easyrsa "build-client-full" "client" "test_pem" "test"
     */
	//Для синхроницации с др. копиями, вдруг в оригинале ошибка
	c.GetSetting('ca.crt');
	c.GetSetting('ca.key');
	let cl_name = Random().toString();
	let reg_scr =
		'#!bin/sh\n\
    sh /etc/easyrsa/easyrsa "init-pki"\n\
    install -d ' +
		c.CACHE_PATH +
		'/pki/issued\n\
    install -d ' +
		c.CACHE_PATH +
		'/pki/private\n\
    install -d ' +
		c.CACHE_PATH +
		'/pki/regs\n\
    install -d ' +
		c.CACHE_PATH +
		'/pki/certs_by_serial\n\
    touch ' +
		c.CACHE_PATH +
		'/pki/index.txt\n\
    echo 01 >' +
		c.CACHE_PATH +
		'/pki/serial\n\
    cp ' +
		c.GSETTINGS_STOR +
		'ca.crt.set ' +
		c.CACHE_PATH +
		'/pki/ca.crt\n\
    cp ' +
		c.GSETTINGS_STOR +
		'ca.key.set ' +
		c.CACHE_PATH +
		'/pki/private/ca.key\n\
sh /etc/easyrsa/easyrsa "build-client-full" ' +
		cl_name +
		' "' +
		obj.pem_client_passwd +
		'" "' +
		obj.ca_passwd +
		'"\n';

	//logger.debug('rovn_c.sh ',reg_scr);
	fs.writeFileSync(c.CACHE_PATH + '/rovn_c.sh', reg_scr, 'utf-8');
	return cl_name;
}

function Random() {
	let min = 28374;
	let max = 874436212;
	let rand = min - 0.5 + Math.random() * (max - min + 1);
	rand = Math.round(rand);
	return rand;
}

function ovpn_regen_clnt_cfg(obj) {
	let cl_name = obj.client_name;
	console.log(
		'ovpn_regen_clnt_cfg param',
		obj,
		'search ',
		c.CACHE_PATH + '/pki/issued/' + cl_name + '.crt ',
		c.CACHE_PATH + '/pki/private/' + cl_name + '.key'
	);
	if (
		fs.existsSync(c.CACHE_PATH + '/pki/issued/' + cl_name + '.crt') === false ||
		fs.existsSync(c.CACHE_PATH + '/pki/private/' + cl_name + '.key') === false
	)
		return '';

	let ca_sert = c.GetSetting('ca.crt');
	let clntCrt = fs.readFileSync(c.CACHE_PATH + '/pki/issued/' + cl_name + '.crt').toString();
	let clnt_sert = clntCrt.substring(clntCrt.lastIndexOf('-----BEGIN CERTIFICATE-----'));
	let clnt_key = fs.readFileSync(c.CACHE_PATH + '/pki/private/' + cl_name + '.key');
	let proto = obj.proto === 'udp' ? 'udp' : 'tcp';
	if (obj.vpn_clntopts === undefined) obj.vpn_clntopts = '';
	let clnt =
		'client\n\
proto ' +
		proto +
		'\n\
dev ' +
		obj.vpn_dev +
		'\n\
remote <Please specify VPN server IP addr> <Please specify VPN server port>\n\
persist-key\n\
persist-tun\n\
cipher ' +
		obj.vpn_cipher +
		'\n' +
		obj.vpn_clntopts +
		'\n\
comp-lzo\n\
verb 3\n\n\
<ca>\n' +
		ca_sert +
		'\n</ca>\n\n\n\
<cert>\n' +
		clnt_sert +
		'\n</cert>\n\n\n\
<key>\n' +
		clnt_key +
		'\n</key>\n\n\n';

	const fname = Random().toString() + Random().toString() + 'openvpn_client.ovpn';
	fs.writeFileSync(c.CACHE_PATH_WEB + '/' + fname, clnt, 'utf-8');
	return fname;
}

module.exports = {
	setup,
	ovpn_regen_srv,
	ovpn_regen_clnt,
	ovpn_regen_clnt_cfg
};
