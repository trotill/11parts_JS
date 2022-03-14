/**
 * Created by i7 on 21.03.2017.
 */
let fs = require('fs');
let ex = require('./../../../exec');
let c = require('../../../backCore');
const logger = c.getLogger();
let sh = require('./../../../shared');

const EventEmitter = require('events');
let emi = new EventEmitter.EventEmitter();

let stconf =
	'domain-needed\n\
bogus-priv\n\
domain=gorchakov-dev\n\
quiet-ra\n\
quiet-dhcp\n\
quiet-dhcp6\n\
enable-ra\n\
bind-interfaces\n\
dhcp-option=23,50\n\
dhcp-lease-max=150\n\
dhcp-leasefile=' +
	c.DNSMASK_LEASES_LOG +
	'\n\
keep-in-foreground\n\
cache-size=150\n';

function GenConfigDnsMasq(obj) {
	let param = {
		dhStart: '192.168.0.2',
		dhStop: '192.168.0.255',
		dhEnable: '0',
		dhTime: '2880',
		dhGW: '192.168.0.1',
		dhDNS: '',
		dhDNSex: '',
		dhIface: 'wlan0'
	};

	if (obj.dhIface === 'br0') {
		param.dhGW = sh.GetValJSON_F('router', 'brIP');
	}

	try {
		param.dhStart = obj['dhStart'];
		param.dhStop = obj['dhStop'];
		param.dhEnable = obj['dhEnable'];
		param.dhTime = obj['dhTime'];
		param.dhDNS = obj['dhDNS'];
		param.dhDNSex = obj['dhDNSex'];
		param.dhIface = obj['dhIface'];
	} catch (err) {
		logger.debug('error dhcp_srv');
	}

	let dnsmasqconf = c.CACHE_PATH + '/dnsmasq.conf';
	try {
		fs.unlinkSync(c.DNSMASK_LEASES_LOG);
	} catch (e) {
		logger.debug('error dhcp_srv');
	}
	let stream = fs.createWriteStream(dnsmasqconf);
	stream.once('open', () => {
		logger.debug('Write dnsmasq config, param ', param);
		stream.write(stconf + '\n');
		if (param.dhDNS.length === 0) stream.write('resolv-file=/var/run/resolv.conf\n');
		else {
			stream.write('dhcp-option=6,' + param.dhDNS + ',' + param.dhDNSex + '\n');
			stream.write('server=' + param.dhDNS + '\nserver=' + param.dhDNSex + '\n');
		}

		stream.write('interface=' + param.dhIface + '\n');
		stream.write('dhcp-authoritative\n');
		stream.write('dhcp-range=' + param.dhStart + ',' + param.dhStop + ',' + param.dhTime + 'h\n');
		stream.write('dhcp-option=3,' + param.dhGW + '\n');
		stream.write('dhcp-option=2,255.255.255.0\n');

		obj['tLinkMacIp'].forEach((item) => {
			stream.write('dhcp-host=' + item[0] + ',,' + item[1] + '\n');
		});

		logger.debug('Dnsmasq config success!!');
		stream.end();
	});

	stream.once('close', function () {
		emi.emit('dnsmasq', dnsmasqconf);
	});
}

let service_id;
function StartDnsMasq(dnsmasqconf) {
	service_id = ex.Service(
		'dnsmasq',
		'--log-dhcp --log-async=0 --conf-file=' + dnsmasqconf,
		'restart'
	);
}

function StopDHCP_Server() {
	console.log('StopDHCP_Server');
	ex.ServiceCtrl(service_id, 'stop'); //ex.DeinitService(service_id);
}

function RunDHCP_Server(obj) {
	GenConfigDnsMasq(obj);
	emi.once('dnsmasq', (dnsmasqconf) => {
		StartDnsMasq(dnsmasqconf);
	});

	return 0;
}

function GetLeases() {
	let leas = [];
	let obj = [];

	try {
		let data = fs.readFileSync(c.DNSMASK_LEASES_LOG).toString();
		if (data.length !== 0) {
			let lines = data.split('\n');
			let ps = [];
			lines.forEach(function (line) {
				if (line.length !== 0) {
					ps = line.split(' ', 5);
					obj = [ps[0], ps[1], ps[2], ps[3]];
					leas.push(obj);
				}
			});
		}
	} catch (err) {
		logger.debug('dhcp_srv GetLeases error');
	}

	return leas;
}

module.exports = {
	RunDHCP_Server,
	StopDHCP_Server,
	GetLeases,
	emi
};
