/**
 * Created by i7 on 02.01.2018.
 */
let c = require('../../backCore.js');
let fs = require('fs');

function Load_buildNavi(PageRegionName, group) {
	let fname_obj = c.GenPageRegsInCacheMAP_Name(`${PageRegionName}.${group}`);
	let json = fs.readFileSync(fname_obj, 'utf8');

	return { result: json, respType: 'buildNavi' };
}

module.exports = {
	Load_buildNavi
};
