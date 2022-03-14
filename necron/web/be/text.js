/**
 * Created by i7 on 26.11.2017.
 */
const crypto = require('crypto');
const c = require('../../backCore');
const logger = c.getLogger();
const belib = require('./belib');

const cookies_opt = {
	maxAge: 31536000000, // would expire after 15 minutes
	httpOnly: true, // The cookie only accessible by the web server
	signed: true // Indicates if the cookie should be signed
};

function GenToken(passwd, rnd) {
	return crypto
		.createHash('md5')
		.update(passwd + rnd)
		.digest('hex');
}

const eng = function (opts) {
	const cm = require('./cache_manager');
	const cache = new cm.Cache();

	if (opts.maxAge) cookies_opt['maxAge'] = opts.maxAge;

	this.CheckPasswd = function (src_pwd, src_rnd, dest) {
		var token = crypto
			.createHash('md5')
			.update(src_pwd + src_rnd)
			.digest('hex');
		if (token === dest) return c.NO_ERROR;
		else return c.ERROR;
	};

	this.RemoveAuthData = function (data) {
		cache.ClearCache(data);
	};
	this.ShowAccounts = function () {
		cache.ShowAccounts();
	};
	this.ProlongCookies = function (res, cookies) {
		if (!cookies || !cookies.token || !cookies.rnd) return c.ERROR;

		const token = cookies.token;
		const rnd = cookies.rnd;
		console.log('Prolong cookies');
		res.cookie('token', token, cookies_opt);
		res.cookie('rnd', rnd, cookies_opt);
		return c.NO_ERROR;
	};

	this.GenCookies = function (res, passwd, rnd) {
		const token = GenToken(passwd, rnd);
		res.cookie('token', token, cookies_opt);
		res.cookie('rnd', rnd, cookies_opt);

		return token;
	};
	function CheckPassword(passwd, login) {
		let grp = '';
		const res = cache.Find(
			function (obj, params) {
				if (typeof obj.passwd != 'undefined') {
					if (obj.passwd === params.passwd) {
						logger.debug('checked');
						grp = obj.group;
						return c.NO_ERROR;
					} else {
						logger.debug('no checked');
						return c.ERROR;
					}
				} else return c.ERROR;
			},
			{ passwd: passwd, login: login }
		);

		return { result: res, group: grp };
	}

	this.CheckFromJson = function (res, passwd, login) {
		logger.debug('Run CheckFromJson ');
		const json_result = {
			respType: 'save_ack',
			result: {
				ack: '',
				page: ''
			}
		};

		const result = CheckPassword(passwd, login);

		if (result.result === c.NO_ERROR) {
			logger.debug('Add to ', login, ' token');
			const rec = {
				token: this.GenCookies(res, passwd, belib.Random()),
				login: login,
				passwd: passwd,
				group: result.group
			};
			cache.Ins(login + result.group, rec);
			json_result.result['ack'] = 'aok';
		} else {
			json_result.result['ack'] = 'secure_err';
		}

		return json_result;
	};

	function CheckToken(token, rnd) {
		let grp = '';
		let login = '';
		// console.log('cache',cache);
		let res = cache.Find(
			(obj, params) => {
				if (obj.token === undefined) return c.ERROR;

				if (obj.token === params.token) {
					grp = obj.group;
					login = obj.login;
					return c.NO_ERROR;
				}

				if (GenToken(obj.passwd, params.rnd) === params.token) {
					//rewrite token
					logger.debug('Rewrite token ');
					obj.token = params.token;
					grp = obj.group;
					login = obj.login;
					return c.NO_ERROR;
				}
				return c.ERROR;
			},
			{ token: token, rnd: rnd }
		);

		return { result: res, group: grp, login: login };
	}

	this.CheckFromCook = function (cookies) {
		const token = cookies.token;
		const rnd = cookies.rnd;

		if (token === false || rnd === false) return { result: c.ERROR };

		return CheckToken(token, rnd);
	};

	this.SyncAccounts = function (accounts) {
		for (const item in accounts) {
			const idx = item + accounts[item].group;
			accounts[item]['token'] = '';
			cache.Ins(idx, accounts[item]);
		}
	};
	this.RemoveAllCookies = function (res) {
		logger.debug('Remove cookies');
		console.log('RemoveAllCookies');

		res.clearCookie('token');
		res.clearCookie('rnd');
		res.clearCookie('io');
	};
};

module.exports = {
	eng
};
