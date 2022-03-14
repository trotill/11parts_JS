import { global } from '../../../../engine/___global.js';
import { u } from '../../../../engine/_core.js';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { PastControllerReact } from '../../../../engine/_pastController';
import { SetMetaBaseUI } from '../../../../engine/_metaVar';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { svalueController } from '../../../../engine/var';
import { generateClassForUI } from '../../../../engine/generator';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { createElement } from '../componentType';
import filter from '../../../../engine/filtersV2';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

function ErrMessage(props: any) {
	const errInfo = props.errInfo;
	const id = 'fem' + errInfo.xid;
	const bclass = 'btn' + errInfo.XFL.id;
	const cl = 'xflc' + id;
	const infid = cl + 'inf';
	const infomsg = errInfo.msg;

	const [getShowDlg, setShowDlg] = useState(false);
	function errpixOnClick() {
		setShowDlg(!getShowDlg);
	}
	let dialog;
	if (getShowDlg)
		dialog = (
			<div className={'XFL_modal-content ' + cl} id={'u' + id}>
				<div className={'XFL_modal-dialog-content'} id={infid} style={{ fontSize: '12pt' }}>
					{infomsg}
				</div>
			</div>
		);
	else dialog = [];

	return (
		<div>
			<div onClick={errpixOnClick} className={'XFL_errpix ' + bclass} id={id} />
			{dialog}
		</div>
	);
}

function convOne(val: any, format: string, min: number) {
	let r;
	let result;
	switch (format) {
		case 'int':
			r = parseInt(val);
			if (isNaN(r)) {
				r = min;
			}
			result = r;
			break;
		case 'float':
			r = parseFloat(val);
			if (isNaN(r)) r = min;
			result = r;
			break;
		default: {
			result = val;
		}
	}
	return result;
}

function inputBaseCreate({ PastTo, Id, Obj }: createElement): string {
	let format = 'string';
	const min = 0;

	console.log('Input field');
	const blockId = Id + 'Main';
	const wrapId = Id + 'Wrap';

	const defclass = {
		main: 'inputBase_main',
		inputWrap: 'inputBase_inputWrap',
		input: 'inputBase_input',
		inputRo: 'inputBase_inputRo',
		label: 'inputBase_label',
		sec: 'inputBase_sec'
	};
	format = 'string';
	if (u(Obj.format)) format = Obj.format;

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defclass);

	const mainClass = generateClassForUI({
		id: Id,
		class_map: scProp.class_map,
		type: 'main'
	});

	const labelClass = generateClassForUI({
		id: Id,
		class_map: scProp.class_map,
		type: 'label'
	});
	const inpWrapClass = generateClassForUI({
		id: Id,
		class_map: scProp.class_map,
		type: 'inputWrap'
	});

	const passwClass = generateClassForUI({
		id: Id,
		class_map: scProp.class_map,
		type: 'sec'
	});

	let type = 'text';
	let ro = false;
	const locObj = {
		id: Id,
		table: Obj.table,
		contentClass: Obj.contentClass
	};

	if (Obj['isRo'] != null && Obj['isRo'] === true) {
		ro = true;
	}

	if (Obj['isSec'] != null && Obj['isSec'] === true) {
		type = 'password';
	}
	let labelname = Obj['name'];

	if (Obj['showname'] !== undefined) {
		if (Obj['showname'] === false) {
			labelname = '';
		}
	}

	SetMetaBaseUI(locObj, convOne(Obj.value, format, min));
	let intpClass: string;
	if (ro)
		intpClass = generateClassForUI({
			id: Id,
			class_map: scProp.class_map,
			type: 'inputRo'
		});
	else
		intpClass = generateClassForUI({
			id: Id,
			class_map: scProp.class_map,
			type: 'input'
		});

	let value = Obj.value;
	if (u(Obj.evalue)) {
		value = Obj.evalue;
	}

	function InputBase() {
		const [getValue, setValue] = useState(value);
		const [getError, setError] = useState([]);
		const [getErrorInfo, setErrorInfo] = useState([]);
		const [getType, setType] = useState(type);
		let errMsgView;

		if (getErrorInfo.length === 0) {
			errMsgView = [];
		} else errMsgView = <ErrMessage errInfo={getErrorInfo[0]} />;

		const inputEvent = (value: any) => {
			SetMetaBaseUI(locObj, convOne(value, format, min));
			const err = filter.check(Obj, value);
			setErrorInfo(filter.findErrorInfo(Id, Obj.contentClass));
			setValue(value);
			setError(err);
		};
		function onInput(comp: any) {
			inputEvent(comp.currentTarget.value);
			global.api.storagesEng.detActionsOnInput();
		}

		useEffect(() => {
			buildObjOnMount(Obj);
			inputEvent(Obj['value']);
			const useRvalue = Obj.rvalue !== undefined;
			if (useRvalue) {
				const json = JSON.parse(Obj.rvalue);
				AddEventWrapper(
					json,
					function (event: any) {
						Obj.value = event[json.value];
						svalueController(Obj);

						let outval = Obj.value;
						if (u(Obj.evalue)) {
							outval = Obj.evalue;
						}
						inputEvent(outval);
					},
					Id
				);
			}
			return () => {
				if (useRvalue) {
					cleanupEventWrapper(Id);
				}
				buildObjOnUmount(Obj);
			};
		}, []);

		let errClass = '';
		if (Array.isArray(getError) && getError.length !== 0) {
			errClass += ' XFL_error_input';
		}

		let input;
		if (Obj['isDig'] === true) {
			input = (
				<input
					onInput={onInput}
					className={intpClass + errClass}
					type={getType}
					name={Obj['name']}
					id={Id}
					pattern={'-?[0-9.]*(.[0-9.]+)?'}
					value={getValue}
					readOnly={ro}
				/>
			);
		} else {
			input = (
				<input
					onInput={onInput}
					className={intpClass + errClass}
					type={getType}
					name={Obj['name']}
					id={Id}
					value={getValue}
					readOnly={ro}
				/>
			);
		}

		function passwOnClick() {
			if (getType === 'text') {
				setType('password');
			} else {
				setType('text');
			}
		}

		let pwMark;
		if (type === 'password') {
			pwMark = <div className={passwClass} onClick={passwOnClick} />;
		}

		return (
			<div className={mainClass} id={blockId}>
				<label className={labelClass} htmlFor={Id}>
					{labelname}
				</label>
				<div className={inpWrapClass} id={wrapId}>
					{input}
					{pwMark}
					{errMsgView}
				</div>
			</div>
		);
	}

	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <InputBase key={Id} />
	});

	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: string, Id: string, Obj: any) => {
	return inputBaseCreate({ PastTo, Id, Obj });
};

export default {
	inputBase: {
		create: create
	}
};
