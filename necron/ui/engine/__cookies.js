/**
 * Created by i7 on 09.07.2020.
 */

import { global } from './___global.js';
import { BuildJSON_SendAction } from './_obsolete';
import { GenEvalResponse } from './_core';

//OBSOLETE!!!!!
export function createCookie(name, value, days) {
	global.api.storagesEng.createCookie(name, value, days);
}
export function readCookie(name) {
	return global.api.storagesEng.readCookie(name);
}
export function CheckCookSupport() {
	return global.api.storagesEng.CheckCookSupport();
}
export function eraseCookie(name) {
	global.api.storagesEng.eraseCookie(name);
}
export function eraseAllCookie() {
	global.api.storagesEng.eraseAllCookie();
}
//OBSOLETE!!!!!

global.api.storagesEng = new (class storagesEng {
	constructor() {
		this.prolongTimer = undefined;
		this.prolongTmrComp = undefined;
		this.needProlong = false; //отправить GET запрос при срабатывании таймера пролонгирования кук или нет
		this.actionsOnInput = false;
		this.actionsOnUI = false;
		this.actionsOnUser = false;
		this.oldDate = Date.now();
	}
	//класс для работы с хранением значений, сюда входит логика работы с куками
	sendEmptyGetReq() {
		//отправка пустого запроса, для принудительной отсрочки куки на срок действия
		let xhr = new XMLHttpRequest();
		xhr.open('GET', '/', true);
		xhr.onload = function () {};
		xhr.send(null);
	}

	detActionsOnInput() {
		this.actionsOnInput = true;
	}
	detActionsOnUI() {
		this.actionsOnUI = true;
	}
	detActionsOnUser() {
		this.actionsOnUser = true;
	}
	getActionsState() {
		if (this.actionsOnInput || this.actionsOnUI || this.actionsOnUser) {
			this.actionsOnInput = this.actionsOnUI = this.actionsOnUser = false;
			return true;
		} else {
			this.actionsOnInput = this.actionsOnUI = this.actionsOnUser = false;
			return false;
		}
	}
	logout() {
		console.log('Erase all cookies');
		eraseAllCookie();
		BuildJSON_SendAction(
			'.' + global.TAG_PAGE,
			'rmcookies',
			{
				response: GenEvalResponse('location.href = "/"')
			},
			global.defContentClass
		);
	}
	runProlongCook() {
		let maxAgePoint = Math.round(global.SRV_OBJ.auth_opts.maxAge / 3);
		let maxAgeMs = global.SRV_OBJ.auth_opts.maxAge;

		// this.prolongTimerFull=setTimeout(()=>{
		//     this.logout();
		// },maxAge);
		if (global.SRV_OBJ.AuthState === 0) return;

		this.oldDate = Date.now();
		this.prolongTmrComp = setInterval(() => {
			let srcDate = Date.now();
			//  console.log("diff date",srcDate-this.oldDate,"maxAge",maxAgeMs);
			if (srcDate - this.oldDate > maxAgeMs) {
				this.logout();
				clearInterval(this.prolongTmrComp);
				clearInterval(this.prolongTimer);
			}
		}, 3000);
		if (this.prolongTimer === undefined)
			this.prolongTimer = setInterval(() => {
				if (global.SRV_OBJ.auth_opts.prolong_cook) {
					if (this.getActionsState()) {
						this.sendEmptyGetReq();
						this.oldDate = Date.now();
						// this.prolongTimerFull=setTimeout(()=>{
						//     this.logout();
						// },maxAge);
					}
				}
			}, maxAgePoint);
	}

	eraseAllCookie() {
		if (global.SRV_OBJ.client !== 'electron' && !global.changeCookToStore) {
			let cookies = document.cookie.split(';');
			console.log('eraseAllCookie cookies ', cookies);
			cookies.forEach((cookie) => {
				console.log('Erase cooc ', cookie);
				let eqPos = cookie.indexOf('=');
				let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
				document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
			});
		} else localStorage.clear();
	}

	eraseCookie(name) {
		if (global.SRV_OBJ.client !== 'electron' && !global.changeCookToStore)
			this.createCookie(name, '', -1);
		else localStorage.removeItem(name);

		// downloadSuccessAction({},'rmcookie','success');
	}
	createSSID_Cookie(ssid) {
		document.cookie = encodeURIComponent('ioid') + '=' + encodeURIComponent(ssid) + '; path=/';
	}
	createCookie(name, value, days) {
		let expires;

		if (days) {
			let date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = '; expires=' + date.toGMTString();
		} else {
			expires = '';
		}
		if (global.SRV_OBJ.client === 'electron' || global.changeCookToStore) {
			localStorage.setItem(name, value);
		} else
			document.cookie =
				encodeURIComponent(name) + '=' + encodeURIComponent(value) + expires + '; path=/';
	}

	readCookie(name) {
		if (global.SRV_OBJ.client === 'electron' || global.changeCookToStore) {
			return localStorage.getItem(name);
		} else {
			let nameEQ = encodeURIComponent(name) + '=';
			let ca = document.cookie.split(';');
			for (let i = 0; i < ca.length; i++) {
				let c = ca[i];
				while (c.charAt(0) === ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) === 0)
					return decodeURIComponent(c.substring(nameEQ.length, c.length));
			}
		}
		return null;
	}

	CheckCookSupport() {
		this.createCookie('cooc', 'ok', 1);
		let val = this.readCookie('cooc');
		this.eraseCookie('cooc');
		return val === 'ok';
	}
})();
