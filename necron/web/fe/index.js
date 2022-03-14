/**
 * Created by i7 on 19.11.2017.
 */

const c = require('../../backCore.js');
//const { glob } = require('../be/main_global.js');
//const { pagePrefix } = require('../webGlobal.js');

function fe_init(obj, glob) {
	let basepath = '';
	if (obj.basepath) basepath = obj.basepath;
	const globReduced = {
		CACHE_PATH: c.CACHE_PATH,
		ROOT_PATH: c.ROOT_PATH
	};
	return (
		'window.eparts.entry(' +
		JSON.stringify({
			world: obj.reduced_world,
			PagePrefix: c.PAGE_PREFIX,
			PageRegionName: obj.PageRegionName,
			PageName: obj.PageName,
			AuthState: obj.auth,
			UI: obj.world.ui,
			auth_opts: obj.world.auth_opts,
			group: obj.group,
			login: obj.login,
			version: glob.version,
			basepath: basepath,
			client: obj.client,
			engpath: obj.engpath,
			glob: globReduced
		}) +
		')'
	);
}

function Render(obj, glob) {
	obj.PageName = '';
	return (
		require('./header.js').GenHeader(obj) + `<script>${fe_init(obj, glob)}</script></body>\n</html>`
	);
}

module.exports = {
	Render,
	fe_init
};
