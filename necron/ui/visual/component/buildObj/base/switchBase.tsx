/**
 * Created by i7 on 29.12.2019.
 */

import { addExampleFormat, global, mobXstore } from '../../../../engine/___global.js';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { nu, t, u } from '../../../../engine/_core';
import { deleteBuildedObj, BuildObj } from '../../../../engine/_buildEng';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { PastControllerReact } from '../../../../engine/_pastController';
import { SetMetaBaseUI } from '../../../../engine/_metaVar';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createElement } from '../componentType';
import { useForceUpdate } from '../../../../engine/sharedReactHook';
import { observer } from 'mobx-react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

addExampleFormat('swithEx1', {
	type: 'switch',
	value: 'true',
	id: 'regen_srv',
	name: 'Create server private key/cert and CA',
	data: [
		{
			name: 'Enter server PEM pass phrase',
			type: 'var',
			id: 'pem_srv_passwd',
			value: ''
		}
	]
});

addExampleFormat('swithEx2', {
	type: 'switch',
	value: false,
	id: 'repSMS_smsd',
	name: 'sms reporter via smsd'
});

function inputSwitchCreate({ PastTo, Id, Obj }: createElement): string {
	const arr = Obj;
	let numMode = false;
	let isRo = arr.isRo;
	if (nu(isRo)) isRo = false;

	const defclass = {
		main: 'switchBasePadding',
		mainSwOn: 'on_switch',
		container: 'switchBaseCont',
		inputMain: 'switchBaseMain',
		input: 'switchBaseInput',
		inputOn: 'switchBaseInputSwOn',
		inputOff: 'switchBaseInputOff',
		label: 'switchBaseLabel',
		render: 'switchRender'
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defclass);

	const format = arr.format;
	if (arr.value !== 'true' && arr.value !== 'false') {
		if (arr.value !== '1' && arr.value !== '0' && arr.value !== 1 && arr.value !== 0)
			arr.value = 'false';
		else numMode = true;
	}
	if (u(arr.isNum)) {
		numMode = arr.isNum;
		arr.value = parseInt(arr.value);
	}
	if (arr.name === undefined) arr.name = '';

	const name: string = arr.name;
	const ArrayData = arr.data;
	//let Invert = [];
	//if (arr.invert !== undefined)
	// Invert = arr.invert;

	let Chk = arr.value;
	if (!numMode) {
		if (arr.value === 'true' || arr.value === true || arr.value === '1') Chk = 1;
		else Chk = 0;
	}

	const inpClass = scProp.class_map.input; //'switchBaseInput';
	const locObj = {
		id: Id,
		table: arr.table,
		contentClass: arr.contentClass
	};

	const blockId = Id + '_gen';
	const SwitchBase = observer(() => {
		//const swPadding = undefined;
		const forceUpdate = useForceUpdate();

		const LabelText = useRef(name);
		const renderStyle = useRef('');
		const swOnClassChild = useRef(scProp.class_map.inputOff /*'switchBaseInputOff'*/);
		const swOnClassMain = useRef('');
		const buildPageData = useRef({});
		const checkState = useRef(Chk);

		useEffect(() => {
			buildObjOnMount(Obj);
			showBlock(checkState.current);
			if (ArrayData === undefined && arr.rvalue !== undefined) {
				const json = JSON.parse(arr.rvalue);
				AddEventWrapper(
					json,
					function (event: never) {
						if (
							event[json.value] === 'false' ||
							event[json.value] === '0' ||
							event[json.value] === 0
						) {
							showBlock(0); //setCheck(0);
						} else showBlock(1);
					},
					Id
				);
			}
			return () => {
				//mobXstore.element.removeGroupBlock(blockId);
				deleteBuildedObj(buildPageData.current);
				if (ArrayData === undefined && arr.rvalue !== undefined) {
					cleanupEventWrapper(Id);
				}
				buildObjOnUmount(Obj);
			};
		}, []);

		const renderId = Id + 'sw';
		function showBlock(value: number) {
			if (value === 1) {
				//inp.attr('checked', 'checked');
				swOnClassChild.current = scProp.class_map.inputOn; //'switchBaseInputSwOn';

				if (numMode) {
					if (format === 'int') SetMetaBaseUI(locObj, 1);
					else SetMetaBaseUI(locObj, '1');
				} else SetMetaBaseUI(locObj, 'true');
				//inp.removeClass("switchBaseInputSwOn").addClass("switchBaseInputSwOn");
				if (ArrayData !== undefined) {
					//div.removeClass("on_switch").addClass("on_switch");
					LabelText.current = name;
					swOnClassMain.current = scProp.class_map.mainSwOn; //'on_switch';
					deleteBuildedObj(buildPageData.current);
					buildPageData.current = BuildObj(blockId, ArrayData, {
						parent_data: {
							id: Id
						},
						contentClass: arr.contentClass
					});
					renderStyle.current = scProp.class_map.render;
					/*swPadding = (
                <div id={div_id} className={'div_mdl-switch_padding__divplace'}>
                    {mobXstore.element.doRender(blockId)}
                </div>
            );*/

					//setReBuildObj(true);
				} else {
					if (arr.name !== '') LabelText.current = t('Enable') + ' ' + name;
				}
			} else {
				swOnClassChild.current = scProp.class_map.inputOff; //'switchBaseInputOff';
				if (numMode)
					if (format === 'int') SetMetaBaseUI(locObj, 0);
					else SetMetaBaseUI(locObj, '0');
				else SetMetaBaseUI(locObj, 'false');
				if (ArrayData === undefined) {
					if (arr.name !== '') LabelText.current = t('Disable') + ' ' + name;
				} else {
					LabelText.current = name;
					swOnClassMain.current = '';
					deleteBuildedObj(buildPageData.current);
					renderStyle.current = '';
					//mobXstore.element.removeGroupBlock(blockId);
					//swPadding = undefined;
				}
			}
			forceUpdate();
		}

		const onClick = () => {
			if (!isRo) {
				global.api.storagesEng.detActionsOnInput();
				checkState.current = checkState.current === 0 ? 1 : 0;
				showBlock(checkState.current);
			}
		};
		return (
			<div className={scProp.class_map.main + ' ' + swOnClassMain.current} id={blockId}>
				<div className={scProp.class_map.container}>
					<div className={scProp.class_map.inputMain} onClick={onClick}>
						<div id={Id} className={inpClass + ' ' + swOnClassChild.current} />
					</div>
					<div className={scProp.class_map.label}>{LabelText.current}</div>
				</div>
				<div id={renderId} className={renderStyle.current}>
					{mobXstore.element.doRender(blockId)}
				</div>
			</div>
		);
	});
	PastControllerReact({
		PastTo,
		Obj: arr,
		Id: blockId,
		ReactElement: <SwitchBase key={blockId} />
	});

	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: any, Id: any, Obj: any) => {
	return inputSwitchCreate({ PastTo, Id, Obj });
};

export default {
	switchBase: {
		create: create
	}
};
