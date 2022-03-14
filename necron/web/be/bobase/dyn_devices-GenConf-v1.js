const c = require('../../../backCore');
const fs = require('fs');
/**
 * Created by i7 on 02.06.2019.
 */
function GenFixedInfoForNet(dev) {
	return [
		{
			id: '_dname',
			type: 'label',
			value: dev.dev_name,
			name: 'Device',
			past: {
				jq: '.router_footer',
				type: 'appendTo'
			}
		},
		{
			type: 'br',
			past: {
				jq: '.router_footer',
				type: 'appendTo'
			}
		}
	];
}

function GenLinkReqInfoWAN(dev) {
	return [
		{
			id: '_lnk',
			type: 'label',
			rvalue:
				'{"iface":"' + dev.type + dev.order_num + '","req":"connect","value":"lnk","req_t":2000}',
			name: 'Link',
			def: 'fault',
			past: {
				jq: '.router_footer',
				type: 'appendTo'
			}
		},
		{
			id: '_int',
			type: 'label',
			rvalue:
				'{"iface":"' + dev.type + dev.order_num + '","req":"connect","value":"int","req_t":2000}',
			name: 'Connect',
			def: 'fault',
			past: {
				jq: '.router_footer',
				type: 'appendTo'
			}
		}
	];
}

function GenLinkReqInfoLAN(dev) {
	return [
		{
			id: '_lnk',
			type: 'label',
			rvalue:
				'{"iface":"' + dev.type + dev.order_num + '","req":"connect","value":"lnk","req_t":2000}',
			name: 'Link',
			def: 'fault',
			past: {
				jq: '.router_footer',
				type: 'appendTo'
			}
		}
	];
}

function GetOverlapped(dev, prefix) {
	let res = [];
	let ext;

	if (arguments.length <= 1) ext = '';
	else ext = '.' + prefix;

	let devexfn = c.PRJ_DEV_PATH + '/' + dev.id + ext + '.js';
	if (!fs.existsSync(devexfn, 'utf8')) {
		devexfn = c.DEVICES_PATH + '/' + dev.id + ext + '.js';
		if (!fs.existsSync(devexfn, 'utf8')) {
			res = [];
			console.log('error overlapped');
			return res;
		}
	}

	console.log('GetOverlapped ', devexfn);
	const js = require(devexfn);
	console.log('Build ', dev);
	res = js.Build(dev);
	return res;
}

function GenConf(dev, conf, iswan) {
	//var devid=SetDeviceID(dev.id);

	let over;
	if (iswan) over = GetOverlapped(dev);
	else over = GetOverlapped(dev, 'lan');

	const fix = GenFixedInfoForNet(dev);
	let fixc;

	if (dev.dev_opts !== undefined) {
		//   console.log("~~~~~~~~~~~dev.dev_opts",dev.dev_opts);
		fix.push({
			type: 'var',
			id: 'dev_opts',
			cvalue: dev.dev_opts,
			value: dev.dev_opts
		});
	}

	fix.push({
		type: 'var',
		id: 'plug',
		name: 'plug',
		value: dev.interface
	});
	fix.push({
		type: 'var',
		id: dev.interface + 'plug',
		name: dev.interface + 'plug',
		value: dev.id
	});
	// console.log("~~~~~~~~~~~fix",fix);
	// logger.debug('!!!!!!!!!!!!!!!!!!!!!!!!!'+over,over);
	if (over.length !== 0) {
		fixc = fix.concat(over);
	} else {
		fixc = fix.concat(conf);
	}
	if (iswan === 1) {
		return fixc.concat(GenLinkReqInfoWAN(dev));
	} else {
		return fixc.concat(GenLinkReqInfoLAN(dev));
	}
}

module.exports = {
	GenConf: GenConf
};
