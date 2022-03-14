//const { glob } = require('./be/main_global.js');
//const { world_map } = glob;
const text = require('./be/text');
//const au = new text.eng(world_map.world.auth_opts);

class WebAuth extends text.eng {
	constructor({ glob }) {
		super(glob.world_map.world.auth_opts);
	}
}
module.exports = {
	WebAuth
};
