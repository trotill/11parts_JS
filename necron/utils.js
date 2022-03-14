/**
 * Created by i7 on 30.05.2019.
 */

const c = require('./backCore.js');
const fs = require('fs');
const path = require('path');
const { glob } = require('./web/be/main_global.js');

function createBuildObj(result, name) {
	const ext = path.extname(name);
	let baseName;

	if (ext) {
		baseName = path.basename(name).replace(ext, '');
	} else baseName = name;

	const fname = c.BUILDOBJ_CACHE_PATH + '/buildObj.' + baseName + '.json';

	const data = JSON.stringify(result);
	fs.writeFileSync(fname, data, 'utf-8');
	return data;
}

function match_p(regexp, text) {
	let tmp;
	if ((tmp = text.match(regexp)) != null) return tmp[1];
	else return undefined;
}

function gen_buildobj(filename, VERS) {
	const scriptName = filename.slice(filename.lastIndexOf(path.sep) + 1, filename.length - 3); //path.basename(__filename);
	const result = {};
	const js_file = c.bb_path + '/' + scriptName + '_v' + VERS;
	if (glob.enable_rebuild_odm) {
		delete require.cache[require.resolve(js_file)];
	}
	result[scriptName] = require(js_file).Build();
	return createBuildObj(result, scriptName);
}

function gen_savesett(filename, VERS, args, vsett) {
	const scriptName = filename.slice(filename.lastIndexOf(path.sep) + 1, filename.length - 3); //path.basename(__filename);
	return require(c.bb_path + '/' + scriptName + '_v' + VERS)[
		!vsett ? 'SaveSettings' : 'SaveSettingsV2'
	](args.obj, args.vers);
}
module.exports = {
	match_p,
	gen_buildobj,
	gen_savesett,
	createBuildObj
};
