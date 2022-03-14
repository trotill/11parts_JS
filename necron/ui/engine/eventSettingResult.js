import { global } from './___global.js';
import { runui } from './_util';

class eventSettingResult {
	constructor() {}
	sa(data, success_cb) {
		if (data.respType === 'save_ack') {
			data.result['ack'] = data.result['ack'].split('\r').join('');
			switch (data.result['ack']) {
				case 'wait': {
					alert(global['LANG_LIB'].__keywords.Parameters_are_accept);
					break;
				}
				case 'ok': {
					if (success_cb) success_cb();
					break;
				}
				case 'aok': {
					break;
				}
				case 'err_token': {
					break;
				}
				default: {
					var msg;
					if (global['LANG_LIB'].__keywords[data.result['ack']]) {
						msg = global['LANG_LIB'].__keywords[data.result['ack']];
						runui('flymsg', msg, '', () => {});
					} else {
						msg = data.result['ack'];
						console.log('!!!Hide message', msg);
					}
				}
			}
		}
	}
	settResult(result, success_callback) {
		if (Array.isArray(result)) {
			result.forEach((resIdx) => {
				this.sa(resIdx, success_callback);
			});
		} else this.sa(result, success_callback);

		return 'ok';
	}
}

global.api.setting = new eventSettingResult();
