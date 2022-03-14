/**
 * Created by i7 on 12.08.2020.
 */

let fs = require('fs');
let path = require('path');
let c = require('../../backCore.js');
const webConst = require('../fe/constFe.js');

function downloadFile(file, send_cb, success_cb, sid) {
	fs.stat(file, (err, stats) => {
		if (err) {
			console.log('downloadFile: Error download file', file, 'stats', stats);
		} else {
			console.log('downloadFile: Found file', file, 'stats', stats);

			fs.open(file, 'r', function (err, fd) {
				if (err) throw err;
				let CHUNK_SIZE = 1 * 1024 * 1024;
				let buffer = Buffer.alloc(CHUNK_SIZE);
				let chunk = 1;
				let size = stats.size;
				let chunkMax = Math.trunc(size / CHUNK_SIZE);
				if (size % CHUNK_SIZE !== 0) chunkMax++;
				let fname = path.basename(file);
				let pauseSizeCntr = 0;
				function readNextChunk() {
					fs.read(fd, buffer, 0, CHUNK_SIZE, null, function (err, nread) {
						if (err) throw err;

						if (nread === 0) {
							// done reading file, do any necessary finalization steps

							fs.close(fd, function (err) {
								if (err) throw err;
							});
							success_cb();
							return;
						}

						let data;
						if (nread < CHUNK_SIZE) data = buffer.slice(0, nread);
						else data = buffer;

						let sendData = {
							data: data.toString('base64'),
							chunkSz: data.length,
							chunkNum: chunk,
							chunkMax: chunkMax,
							size: size,
							name: fname
						};

						console.log('downloadFile: send chunk', chunk, '/', chunkMax);
						send_cb(JSON.stringify(c.GenActionPack('fileChunk', sendData, 'electron', sid)));

						chunk++;
						pauseSizeCntr += CHUNK_SIZE;
						if (pauseSizeCntr > 100000000)
							//overflow protection
							setTimeout(() => {
								pauseSizeCntr = 0;
								readNextChunk();
							}, 1000);
						else readNextChunk();
						// do something with `data`, then call `readNextChunk();`
					});
				}
				readNextChunk();
			});
			//fs.readFile(file,(err,data)=>{

			//});
		}
	});
}
function downloadFiles(files, send_cb, success_cb, sid) {
	if (files === undefined || files == null) return;
	files.forEach((file) => {
		downloadFile(file, send_cb, success_cb, sid);
	});
}

let uploadChunkDB = {};
let uploadChunkTmr = {};
function uploadChunkedFile(event, download_path, interactive, error_cb, contentClass) {
	let fpath = download_path + '/' + event.d.fileChunk.name;
	let chunkNum = event.d.fileChunk.chunkNum;
	let chunkMax = event.d.fileChunk.chunkMax;
	let removeChunks = (fpath, chunkMax) => {
		for (let chunk = 1; chunk <= chunkMax; chunk++) {
			let fpnChunk = fpath + chunk;
			if (fs.existsSync(fpnChunk)) {
				fs.unlinkSync(fpnChunk);
			}
		}
	};
	if (chunkNum === 1) {
		//Remove oldest chunk
		removeChunks(fpath, event.d.fileChunk.chunkMax);
	}

	if (uploadChunkDB[event.d.fileChunk.name] === undefined) {
		uploadChunkDB[event.d.fileChunk.name] = [];

		for (let z = 0; z < chunkMax; z++) {
			uploadChunkDB[event.d.fileChunk.name][z] = false;
		}
	}

	if (uploadChunkTmr[event.d.fileChunk.name] !== undefined)
		clearTimeout(uploadChunkTmr[event.d.fileChunk.name]);

	uploadChunkTmr[event.d.fileChunk.name] = setTimeout(() => {
		console.log(`upload ${event.d.fileChunk.name} error`);
		removeChunks(fpath, event.d.fileChunk.chunkMax);
		error_cb('Error transferring file');
	}, 5000);

	let moveFile = (savePath) => {
		if (fs.existsSync(savePath)) {
			fs.unlinkSync(savePath);
		}
		for (let chunk = 1; chunk <= event.d.fileChunk.chunkMax; chunk++) {
			let fpnChunk = download_path + '/' + event.d.fileChunk.name + chunk;
			let buf = fs.readFileSync(fpnChunk);
			fs.unlinkSync(fpnChunk);
			fs.appendFileSync(savePath, buf);
		}
	};
	fs.writeFile(fpath + chunkNum, Buffer.from(event.d.fileChunk.data, 'base64'), (err) => {
		if (uploadChunkDB[event.d.fileChunk.name] === undefined) return;
		console.log(
			`writen chunk ${event.d.fileChunk.chunkNum}/${event.d.fileChunk.chunkMax} size ${event.d.fileChunk.data.length}`
		);
		uploadChunkDB[event.d.fileChunk.name][chunkNum - 1] = true;

		let transReady = true;
		for (let z = 0; z < chunkMax; z++) {
			if (uploadChunkDB[event.d.fileChunk.name][z] === false) {
				transReady = false;
				break;
			}
		}

		if (transReady) {
			if (fs.existsSync(fpath)) {
				fs.unlinkSync(fpath);
			}
			clearTimeout(uploadChunkTmr[event.d.fileChunk.name]);
			uploadChunkTmr[event.d.fileChunk.name] = undefined;
			uploadChunkDB[event.d.fileChunk.name] = undefined;
			console.log(`got File ${event.d.fileChunk.name} CACHE_PATH=${download_path}`);
			for (let chunk = 1; chunk <= event.d.fileChunk.chunkMax; chunk++) {
				let fpnChunk = fpath + chunk;
				if (!fs.existsSync(fpnChunk)) {
					removeChunks(fpath, event.d.fileChunk.chunkMax);

					if (interactive) {
						alert(`${t('Error transferring file')} ${event.d.fileChunk.name}, ${t('try again')}`);
					} else {
						console.log('Error transferring file', event.d.fileChunk.name, 'try again');
					}
					return;
				}
			}

			console.log('transferring file, ok');
			let savePath = download_path + '/' + event.d.fileChunk.name;
			if (interactive) {
				let defPath = readCookie('saveFolder');
				if (defPath == null) {
					defPath = glob.HOME_PATH;
				}
				if (eglobal.fileDialog !== undefined) {
					if (eglobal.fileDialog.savePath !== undefined) {
						defPath = eglobal.fileDialog.savePath;
					}
				}
				/* let options = {
                    title: t("Save file"),
                    defaultPath: defPath + '/' + eventFromUI.d.fileChunk.name,
                    buttonLabel: t("Save"),
                    filters: [
                        {name: 'All Files', extensions: ['*']}
                    ]
                }*/

				//savePath = dialog.showSaveDialogSync(null, options);
				new elFileDialog(
					{
						baseDir: defPath,
						selectDir: false,
						saveFileMode: true,
						saveFileDef: event.d.fileChunk.name,
						debug: false,
						contentClass: contentClass
					},
					(sPath) => {
						savePath = sPath[0];
						console.log('Select path', savePath);
						if (savePath !== undefined) {
							createCookie('saveFolder', path.dirname(savePath), 0);
						}
						if (savePath !== undefined) {
							moveFile(savePath);
							console.log('File transition success', savePath);
						}
					}
				);
			} else {
				if (savePath !== undefined) {
					moveFile(savePath);
					console.log('File transition success', savePath);
				}
			}
		}
	});
}
module.exports = {
	downloadFiles,
	downloadFile,
	uploadChunkedFile,
	exec: require('child_process').exec,
	execSync: require('child_process').execSync,
	bundleName: webConst.bundleName
};
