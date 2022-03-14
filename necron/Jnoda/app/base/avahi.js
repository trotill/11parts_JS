/**
 * Created by Ilya on 15.11.2019.
 */
let fs = require('fs');
let ex = require('./../../../exec');
let c = require('../../../backCore');
const logger = c.getLogger();

let avahi_id = {};
let server_section =
	'#browse-domains=0pointer.de, zeroconf.org\n\
use-ipv4=yes\n\
use-ipv6=yes\n\
#deny-interfaces=eth1\n\
#check-response-ttl=no\n\
#use-iff-running=no\n\
enable-dbus=no\n\
#disallow-other-stacks=no\n\
#allow-point-to-point=no\n\
#cache-entries-max=4096\n\
#clients-max=4096\n\
#objects-per-client-max=1024\n\
#entries-per-entry-group-max=32\n\
ratelimit-interval-usec=1000000\n\
ratelimit-burst=1000\n\n';
let wide_area_section = 'enable-wide-area=yes\n\n';
let publish_section =
	'#disable-publishing=no\n\
#disable-user-service-publishing=no\n\
#add-service-cookie=no\n\
#publish-addresses=yes\n\
publish-hinfo=no\n\
publish-workstation=no\n\
#publish-domain=yes\n\
#publish-dns-servers=192.168.50.1, 192.168.50.2\n\
#publish-resolv-conf-dns-servers=yes\n\
#publish-aaaa-on-ipv4=yes\n\
#publish-a-on-ipv6=no\n\n';

let reflector_section = '#enable-reflector=no\n\
#reflect-ipv=no\n\n';

let rlimits_section =
	'#rlimit-as=\n\
rlimit-core=0\n\
rlimit-data=4194304\n\
rlimit-fsize=0\n\
rlimit-nofile=768\n\
rlimit-stack=4194304\n\n';

function setup(obj) {
	if (obj.avEnable === 'true') {
		console.log('AVAHI config');
		if (!obj.avHostname) obj.avHostname = '11-parts';
		if (!obj.avDomainname) obj.avDomainname = '.local';
		let allow_if = '';
		if (obj.avAllowinterfaces && obj.avAllowinterfaces.length > 0) {
			allow_if = 'allow-interfaces=' + obj.avAllowinterfaces;
		}

		let cfg =
			'[server]\n' +
			allow_if +
			'\n\
host-name=' +
			obj.avHostname +
			'\n\
domain-name=' +
			obj.avDomainname +
			'\n\n';
		cfg += !obj.avServer_section ? server_section : obj.avServer_section;
		cfg += '\n[wide-area]\n';
		cfg += !obj.avWide_area_section ? wide_area_section : obj.avWide_area_section;
		cfg += '\n[publish]\n';
		cfg += !obj.avPublish_section ? publish_section : obj.avPublish_section;
		cfg += '\n[reflector]\n';
		cfg += !obj.avReflector_section ? reflector_section : obj.avReflector_section;
		cfg += '\n[rlimits]\n';
		cfg += !obj.avRlimits_section ? rlimits_section : obj.avRlimits_section;

		let avahi_cf = c.CACHE_PATH + '/avahi';
		fs.writeFile(avahi_cf, cfg, 'utf-8', (/*err*/) => {
			avahi_id = ex.Service('avahi-daemon', '-f ' + avahi_cf + ' --no-chroot', 'restart');
			logger.info('Restart mDNS avahi');
		});
	} else {
		logger.info('Disable mDNS avahi');
		ex.ServiceCtrl(avahi_id, 'stop');
	}
}

module.exports = {
	setup
};
