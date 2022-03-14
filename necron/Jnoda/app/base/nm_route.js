/**
 * Created by i7 on 07.04.2019.
 */
const ex = require('./../../../exec');
const c = require('../../../backCore');
const logger = c.getLogger();

let DeleteRouteTable = async (tabid) => {
	await ex.ExecPromise('ip route flush table ' + tabid);
	//Delete two rule!!!
	await ex.ExecPromise('ip rule del table ' + tabid);
	await ex.ExecPromise('ip rule del table ' + tabid);
	logger.debug('Delete route and rule for table ', tabid);
};

async function InitRouteTable(param) {
	let i = 0;
	for (const key in param.NetScope) {
		if (key === param.iface) {
			const RouteTabId = i + 10;
			if (param.RouteTable[param.iface]) {
				if (param.RouteTable[param.iface] !== RouteTabId) {
					await DeleteRouteTable(param.RouteTable[param.iface]);
				}
			}

			//else
			param.RouteTable[param.iface] = RouteTabId;
			break;
		}
		i++;
	}
}

module.exports = {
	InitRouteTable,
	DeleteRouteTable
};
