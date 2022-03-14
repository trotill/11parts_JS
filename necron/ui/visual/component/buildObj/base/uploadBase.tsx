import { global } from '../../../../engine/___global.js';
import { sendUserWebEvent } from '../../../../engine/event';
import { AddWaitOverlay, DeleteWaitOverlay } from '../../../../engine/_util';

import { createCookie, readCookie } from '../../../../engine/__cookies';
import { SetMetaBaseUI } from '../../../../engine/_metaVar';
//import { ElFileDialog } from '../../../shared/electron/el_dialogs';
import { t } from '../../../../engine/_core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import SocketIOFileUpload from 'socketio-file-upload';
import { PastControllerReact } from '../../../../engine/_pastController';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { createElement } from '../componentType';

function createUploadBaseElectron({ PastTo, Id, Obj }: createElement): string {
	const defClass = {
		elMain: 'webCreateFileDownloaderMain',
		elInput: 'webCreateFileDownloaderInput',
		elButtonMain: 'webCreateFileDownloaderBut',
		elButtonIcon: 'material-icons webCreateFileDownloaderIcons'
	};
	const classMap = stylizeInsideElement(Obj.stylize, Obj.value, defClass).class_map;

	const blockId = 'gen' + Id;
	let ivl = 'undef';
	if (Obj.param !== undefined) {
		if (Obj.param.showvalue !== undefined && Obj.param.showvalue === true) ivl = Obj.value;
		else ivl = Obj.name;
	} else {
		if (Obj.name !== undefined) ivl = Obj.name;
		else ivl = '';
	}
	function UploadBase() {
		const [fileName] = useState(ivl);
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		}, []);
		function onClick() {
			global.api.storagesEng.detActionsOnInput();
			let defPath = readCookie('uploadFolder');
			if (defPath == null) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				defPath = glob.HOME_PATH;
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (eglobal.fileDialog !== undefined) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				if (eglobal.fileDialog.loadPath !== undefined) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					defPath = eglobal.fileDialog.loadPath;
				}
			}
			alert('need refact ElFileDialog');
			/*new ElFileDialog(
				{
					baseDir: defPath,
					selectDir: false,
					saveFileMode: false,
					saveFileDef: 'myfile.ko',
					debug: false,
					contentClass: Obj.contentClass
				},
				(loadPath: any) => {
					console.log('Select path', loadPath);
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					if (!fs.lstatSync(loadPath[0]).isFile()) {
						loadPath = undefined;
						console.log('Error file name', loadPath);
					}
					//const loadPath =showOpenDialogSync( null,options);
					if (loadPath !== undefined) {
						console.log('Select file', loadPath);
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						createCookie('uploadFolder', p.dirname(loadPath[0]), 0);
						console.log('MQTT upload file', loadPath);
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						eglobal.eapi.downloadFiles(
							loadPath,
							(data: any) => {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								eglobal.publish(data);
							},
							() => {
								sendUserWebEvent(Id + 'Suc', { fname: loadPath });
								//downloadSuccessAction(Arr,'finish','success');
							}
						);
					}
				}
			);*/
		}
		return (
			<div className={classMap.elMain} id={Obj.id + 'ed'}>
				<input
					className={classMap.elInput}
					placeholder={Obj.name}
					style={{ borderBottom: 0 }}
					id={Obj.id}
					readOnly={true}
					name={Obj.name}
					value={fileName}
					min={1}
					max={255}
				/>
				<div className={classMap.elButtonMain}>
					<i className={classMap.elButtonIcon} onClick={onClick}>
						{Obj.icon}
					</i>
				</div>
			</div>
		);
	}
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <UploadBase key={blockId} />
	});

	return blockId;
}

interface fileUploadInter {
	changeProgress: any;
	inputFileId: string;
	setFileName: any;
	Id: string;
	Obj: any;
}

function fileUploadConfig({ changeProgress, inputFileId, setFileName, Id, Obj }: fileUploadInter) {
	const instance = new SocketIOFileUpload(global.socket, {
		chunkSize: 1024 * 100
	});

	instance.listenOnInput(document.getElementById(inputFileId));
	instance.addEventListener('start', () => {
		AddWaitOverlay(t('WriteWait'));
		global.api.storagesEng.detActionsOnInput();
	});
	instance.addEventListener('progress', (evt: any) => {
		console.log('progress', evt);
		const percent = (evt.bytesLoaded / evt.file.size) * 100;
		changeProgress(percent);
	});

	instance.addEventListener('complete', (evt: any) => {
		console.log('complete', evt);

		const fName = evt.file.name;
		if (evt.success === false) {
			sendUserWebEvent(Id + 'Err', { fname: fName, err: 'error', stat: 'error' });
		} else {
			setFileName(fName);
			SetMetaBaseUI(Obj, fName);
			sendUserWebEvent(Id + 'Suc', { fname: fName });
		}
		DeleteWaitOverlay();
	});
	instance.addEventListener('error', (evt: any) => {
		const fName = evt.file.name;
		DeleteWaitOverlay();
		sendUserWebEvent(Id + 'Err', { fname: fName, err: 'error', stat: 'error' });
	});
}
function createUploadBaseWEB({ PastTo, Id, Obj }: createElement): string {
	const defClass = {
		main: 'webCreateFileDownloaderMain',
		input: 'webCreateFileDownloaderInput',
		buttonMain: 'webCreateFileDownloaderBut',
		buttonIcon: 'material-icons webCreateFileDownloaderIcons',
		buttonInput: 'webFileDownloaderFile',
		progressMain: 'webFileDownloaderProgress',
		progressItem: 'webFileDownloaderPrItem'
	};
	const classMap = stylizeInsideElement(Obj.stylize, Obj.value, defClass).class_map;

	const blockId = 'gen' + Id;
	let ivl = 'undef';
	if (Obj.param !== undefined) {
		if (Obj.param.showvalue !== undefined && Obj.param.showvalue === true) ivl = Obj.value;
		else ivl = t(Obj.name);
	} else {
		if (Obj.name !== undefined) ivl = t(Obj.name);
		else ivl = '';
	}
	const inputFileId = Obj.id + 'inp';
	function UploadBase() {
		const progress = useRef<HTMLDivElement>(null);
		const progStep = useRef(1);
		const [progEl, setProgEl] = useState('0%');
		const [fileName, setFileName] = useState(ivl);

		const elemStyle = {
			width: progEl
		};
		const changeProgress = (percent: string) => {
			setProgEl(percent + '%');
		};
		useEffect(() => {
			buildObjOnMount(Obj);
			progStep.current = (progress.current.offsetWidth - 8) / 100;
			fileUploadConfig({ changeProgress, inputFileId, setFileName, Id, Obj });
			return () => {
				buildObjOnUmount(Obj);
			};
		}, []);
		return (
			<form id={blockId} method={'post'} encType={'multipart/form-data'}>
				<div className={classMap.main} id={Obj.id + 'ed'}>
					<div className={classMap.input} style={{ borderBottom: 0 }} id={Obj.id}>
						{fileName}
					</div>
					<div className={classMap.buttonMain}>
						<i className={classMap.buttonIcon}>{Obj.icon}</i>
						<input type={'file'} className={classMap.buttonInput} id={inputFileId} />
					</div>
					<div className={classMap.progressMain} ref={progress}>
						<div className={classMap.progressItem} style={elemStyle} id={Obj.id + 'pr'} />
					</div>
				</div>
			</form>
		);
	}
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <UploadBase key={blockId} />
	});

	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: string, Id: string, Obj: any) => {
	if (global.SRV_OBJ.client === 'electron') {
		return createUploadBaseElectron({ PastTo, Id, Obj });
	} else return createUploadBaseWEB({ PastTo, Id, Obj });
};

export default {
	uploadBase: {
		create: create
	}
};
