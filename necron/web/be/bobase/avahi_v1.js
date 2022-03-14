/**
 * Created by Ilya on 15.11.2019.
 */

const server_section =
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

const wide_area_section = 'enable-wide-area=yes\n\n';
const publish_section =
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

const reflector_section = '#enable-reflector=no\n\
#reflect-ipv=no\n\n';

const rlimits_section =
	'#rlimit-as=\n\
rlimit-core=0\n\
rlimit-data=4194304\n\
rlimit-fsize=0\n\
rlimit-nofile=768\n\
rlimit-stack=4194304\n\n';

function Build() {
	return [
		{
			type: 'delim',
			id: 'avMdns_dm',
			name: 'mDNS config'
		},
		{
			type: 'label',
			id: 'avmDname',
			svalue: [
				'{"readfile":"avahi","sep":"","value":"avHostname"}',
				'{"readfile":"avahi","sep":".","value":"avDomainname"}'
			],
			name: 'mDNS link'
		},
		{
			type: 'switch',
			value: false,
			id: 'avEnable',
			name: 'Enable avahi daemon'
		},
		{
			name: 'Hostname',
			type: 'tfield',
			id: 'avHostname',
			value: '',
			flt: { len: ['2', '63'], sym: ['ens'] }
		},
		{
			name: 'Domain',
			type: 'tfield',
			id: 'avDomainname',
			value: '',
			flt: { len: ['2', '63'], sym: ['ens'] }
		},
		{
			name: 'Allow interfaces',
			type: 'tfield',
			id: 'avAllowinterfaces',
			value: ''
		},
		{
			name: 'Server section',
			type: 'efield',
			id: 'avServer_section',
			value: server_section
		},
		{
			name: 'Wide-area section',
			type: 'efield',
			id: 'avWide_area_section',
			value: wide_area_section
		},
		{
			name: 'Publish section',
			type: 'efield',
			id: 'avPublish_section',
			value: publish_section
		},
		{
			name: 'Reflector section',
			type: 'efield',
			id: 'avReflector_section',
			value: reflector_section
		},
		{
			name: 'Rlimits section',
			type: 'efield',
			id: 'avRlimits_section',
			value: rlimits_section
		}
	];
}

module.exports = {
	Build: Build
};
