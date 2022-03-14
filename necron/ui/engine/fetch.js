import { global } from './___global.js';

export function getLangLibrary(lang, region) {
	return new Promise((resolve, reject) => {
		let url = global.SRV_OBJ.client === 'electron' ? 'http://localhost' : '';
		fetch(`${url}/lang/${lang}/${region || 'default'}?_${Date.now()}`)
			.then((response) => response.json())
			.then((json) => {
				resolve(json);
			})
			.catch((e) => {
				reject(e);
			});
	});
}

export function post(set, success) {
	let url = global.SRV_OBJ.client === 'electron' ? 'http://localhost' : '';
	return fetch(`${url}/${global.SRV_OBJ.PagePrefix}`, {
		method: 'POST',
		cache: 'no-cache',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(set)
	})
		.then((response) => response.json())
		.then((json) => {
			success(json);
			return true;
		})
		.catch((e) => {
			console.log('Error fetch data', e);
			return false;
		});
}
