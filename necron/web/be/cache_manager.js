/**
 * Created by i7 on 25.11.2017.
 */

const c = require('../../backCore');
const logger = c.getLogger();

const Cache = function () {
	let Total = 0;
	let CacheArr = {};

	this.ClearCache = (acc_arr) => {
		logger.debug('ClearCache ', acc_arr.length);
		if (acc_arr.length === 0) {
			CacheArr = [];
			logger.debug('Remove all account ');
		} else {
			acc_arr.forEach((aArr) => {
				if (CacheArr[aArr]) {
					delete CacheArr[aArr];
					logger.debug('Remove account ', aArr);
				}
			});
		}
	};
	this.ShowAccounts = function () {
		console.log('Show Accounts', CacheArr);
		logger.debug('Show Accounts', CacheArr);
	};

	this.Ins = function (key, value) {
		if (Total > 100) return Total;

		CacheArr[key] = value;
		Total++;

		logger.debug('Ins 1, total ', Total);
		return Total;
	};

	this.Del = function (key) {
		if (Total === 0) return 0;

		for (const n in CacheArr) {
			if (n === key) {
				delete CacheArr[key];
				Total--;
			}
		}

		logger.debug('Del 1, total ', Total, ' obj ', CacheArr);
		return Total;
	};

	this.DelAll = function () {
		if (Total === 0) return 0;

		for (const key in CacheArr) {
			delete CacheArr[key];
		}
		Total = 0;
		logger.debug('Del all CacheArr ', CacheArr);
		return 0;
	};

	this.Find = function (callback, param) {
		for (let n in CacheArr) {
			if (callback(CacheArr[n], param) !== c.ERROR) {
				return c.NO_ERROR;
			}
		}
		return c.ERROR;
	};
};

module.exports = {
	Cache
};
