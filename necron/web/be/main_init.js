const c = require('../../backCore');
const logger = c.getLogger();
let { glob } = require('./main_global.js');
const mbo = require('./main_buildObj.js');
const { Start } = require('./main_services.js');

module.exports = {
	necronInit: async () => {
		mbo.CleanAllMap(glob.world_map);
		glob.world_map.world.static_dev.forEach((item) => {
			let objidx = me.ForceAddToDevList(item.name, '', 'dev', item.devp);
			let interface_type = glob.DevicesList[objidx].type;
			let order = {};

			for (let devId in glob.DevicesList) {
				let type = glob.DevicesList[devId].type;
				if (!order[type])
					order[type] = {
						order: 0
					};

				order[type][devId] = order[type].order;
				order[type].order++;
			}
			let type = glob.DevicesList[objidx].type;
			glob.DevicesList[objidx].order_num = order[type][objidx];
			me.CreateDeviceBuilobjID(
				glob.DevicesList[objidx].id,
				glob.BuildDevices[interface_type].pname + glob.DevicesList[objidx].order_num,
				glob.BuildDevices[interface_type]
			);
		});

		await Start();
		logger.debug('Necron started');
		process.stdin.resume();
	}
};
