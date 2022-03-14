/**
 * Created by i7 on 14.12.2019.
 */
import { global } from './___global.js';

export function InitMainDefault() {
	for (let regname in global.SRV_OBJ.world.regions) {
		if (global.SRV_OBJ.world.regions[regname]?.screens) {
			for (let n = 0; n < global.SRV_OBJ.world.regions[regname].screens.length; n++) {
				if (global.SRV_OBJ.world.regions[regname].screens[n] === global.SRV_OBJ.ClientScreen) {
					if (global.SRV_OBJ.AuthState === 1 && global.SRV_OBJ.PageRegionName === '')
						document.location.href = global.SRV_OBJ.PagePrefix + '?page=' + regname;
					return;
				}
			}
		}
	}
}
