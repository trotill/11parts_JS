/**
 * Created by Ilya on 15.11.2019.
 */

const ex = require('./../../../exec');
const c = require('../../../backCore');
const nm = require('./network_manager.js');
const logger = c.getLogger();
let ssdpd_id;

function setup(obj) {
	//ex.DeinitService(ssdpd_id);

	if (obj.ssdEnable === 'true') {
		console.log('SSDPD config');
		if (!obj.ssdUv) obj.ssdUv = '11-parts';
		if (!obj.ssdNint) obj.ssdNint = '300';
		if (!obj.ssdIri) obj.ssdIri = '600';
		if (!obj.ssdTtl) obj.ssdTtl = '2';
		if (!obj.ssdIf) obj.ssdIf = ['br0', 'eth0', 'eth1', 'wlan0', 'wlan1', 'usb0', 'usb1'];

		let ifaces = '';
		obj.ssdIf.forEach((ssdIfN) => {
			ifaces += ` ${ssdIfN}`;
		});
		let cfg = `-d -n -r "${obj.ssdIri}" -i "${obj.ssdNint}" -g "${obj.ssdUv}" -m "${obj.ssdManuf}" -l "${obj.ssdManufUrl}" -e "${obj.ssdModel}" -a "${obj.ssdDevn}" -z "${obj.ssdModelNum}" -y "${obj.ssdSN}" -x "${obj.ssdModURL}" ${ifaces}`;

		nm.AddIptablesRule('ssdpd', () => {
			ex.ExecNoOutSync(c.IPTABLES + ' -A INPUT -p tcp --dport 1900:1901 -j ACCEPT');
		});

		ssdpd_id = ex.Service(c.CNODA_PATH + '/ssdpd', cfg, 'restart');
		nm.Event.on('ReconfRoute', (data) => {
			console.log('ssdpd ReconfRoute, got', data);
			ex.ServiceCtrl(ssdpd_id, 'restart');
		});

		nm.Event.on('SelectWAN', (data) => {
			console.log('ssdpd SelectWAN, got', data);
			ex.ServiceCtrl(ssdpd_id, 'restart');
		});

		nm.Event.on('Run', (data) => {
			console.log('ssdpd Run, got', data);
			ex.ServiceCtrl(ssdpd_id, 'restart');
		});
		console.log('\n\nssdpd restart\n\n', c.CNODA_PATH + '/ssdpd ' + cfg);
		logger.info('Restart SSDP');
	} else {
		ex.ServiceCtrl(ssdpd_id, 'stop');
		logger.info('Disable SSDP');
	}
}

module.exports = {
	setup
};
