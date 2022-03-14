/**
 * Created by i7 on 12.08.2020.
 */
import { global } from './___global.js';
import { t } from './_core';
import { runui } from './_util';

export function elDownloadRemoteFile(arrFname) {
	let Request = {
		arrFname: arrFname
	};
	eglobal.publish(
		JSON.stringify(
			eglobal.c.GenActionPack(
				'download',
				{
					group: global.SRV_OBJ.group,
					login: global.SRV_OBJ.login,
					version: global.SRV_OBJ.version,
					data: Request
				},
				global.SRV_OBJ.client,
				global.clientId
			)
		)
	);
}

export function elFileChunk(event) {
	eglobal.eapi.uploadChunkedFile(
		event,
		glob.DOWNLOAD_PATH,
		true,
		(err) => {
			//Error transferring file
			runui('flymsg', t(err), '', () => {});
		},
		'electron'
	);
	return 'ok';
}
