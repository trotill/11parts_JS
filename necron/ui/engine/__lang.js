import { global } from './___global.js';
import { u } from './_core';

global.api.translateEng = new (class {
	TranslateBuildObj_eng(pname, arr) {
		const PageName = pname;
		if (global['LANG_LIB']?.[PageName]?.name && arr.lid) {
			const plnglib = global['LANG_LIB'][PageName];
			const vid = arr.lid.replace(/[0-9.]/g, '');

			if (u(plnglib.name[arr.lid])) {
				arr.name = plnglib.name[arr.lid];
				return true;
			} else {
				if (u(plnglib.name[vid])) {
					arr.name = plnglib.name[vid];
					return true;
				}
			}
		}
		return false;
	}

	t(arr) {
		if (arr['lid'] === undefined) arr['lid'] = arr.id;

		const PageName = global.SRV_OBJ.PageName.replace(/[0-9.]/g, '');
		//console.log('Translate pageName', PageName);
		if (this.TranslateBuildObj_eng(PageName, arr) === false) {
			if (global['LANG_LIB']?.[PageName]?.link) {
				global['LANG_LIB'][PageName].link.forEach((linkItem) => {
					this.TranslateBuildObj_eng(linkItem, arr);
				});
			}
		}
	}
})();
