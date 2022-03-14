import {
	BuildObj,
	deleteBuildedObj,
	buildObjOnMount,
	buildObjOnUmount
} from '../../../../engine/_buildEng';
import { SetMetaBaseUI } from '../../../../engine/_metaVar';
import { PastControllerReact } from '../../../../engine/_pastController';
import { t } from '../../../../engine/_core';

import { addExampleFormat, global, mobXstore } from '../../../../engine/___global.js';
import { useEffect, useState, useRef } from 'react';
import * as React from 'react';
import { createElement } from '../componentType';
import { useForceUpdate } from '../../../../engine/sharedReactHook';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { observer } from 'mobx-react';

addExampleFormat('comboBoxBase', [
	{
		name: 'Region',
		type: 'sbox',
		value: 'RU',
		id: 'Reg',
		tabidx: 1,
		items_name: ['Russia', 'US'],
		items_val: ['RU', 'US']
	}
]);

function comboBoxBaseCreate({ PastTo, Id, Obj }: createElement) {
	const arr = Obj;
	const Name = arr['name'];
	const block_id = Id + '_gen';
	const defclass = {
		main: 'comboBoxBaseMain noselect',
		name: 'comboBoxBaseLabel',
		select: 'comboBoxBaseSelect',
		overlay: 'comboBoxBaseOverlay',
		optionItem: 'comboBoxBaseOption',
		optionMain: 'comboBoxBaseOptsDlg'
	};
	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defclass);

	if (
		arr.value === undefined ||
		arr.value.length === 0 ||
		arr['items_val'].indexOf(arr.value) === -1
	) {
		arr.value = arr['items_val'][0]; //[arr['items_val'].lenght];//[0];
	}

	const defValName = arr['items_name'][arr['items_val'].indexOf(arr['value'])];
	const locObj = {
		id: Id,
		table: arr.table,
		contentClass: arr.contentClass
	};

	if (arr['data'] !== undefined) {
		arr['spage'] = arr['data'];
	}

	const ComboBoxBase = observer(() => {
		const forceUpdate = useForceUpdate();
		const buildPageData = useRef({});

		const [getNameValue, setNameValue] = useState(defValName);

		const [getShowDialog, setShowDialog] = useState(false);

		// let buildPageData = undefined;
		const inputEvent = (value: string) => {
			SetMetaBaseUI(locObj, value);
		};

		useEffect(() => {
			buildObjOnMount(Obj);
			inputEvent(arr.value);
			showBlock(getNameValue);
			if (arr['spage'] !== undefined) forceUpdate(); //перерендер для вложенного отображения showBlock
			if (arr.rvalue !== undefined) {
				const json = JSON.parse(arr.rvalue);
				AddEventWrapper(
					json,
					function (event: any) {
						const value = event[json.value];
						let idx = arr['items_val'].indexOf(value);
						idx = idx === -1 ? 0 : idx;

						const nameValue = arr['items_name'][idx];

						inputEvent(value);
						setNameValue(nameValue);
						global.api.storagesEng.detActionsOnInput();
						showBlock(nameValue);
					},
					Id
				);
			}
			return () => {
				deleteBuildedObj(buildPageData.current);
				if (arr.rvalue !== undefined) {
					cleanupEventWrapper(Id);
				}
				buildObjOnUmount(Obj);
			};
		}, []);

		let selDialogOverlay: JSX.Element;
		let selDialogOpts: JSX.Element;
		function showSelDialog() {
			if (getShowDialog) return;
			setShowDialog(true);
		}

		function removeDlg() {
			setShowDialog(false);
		}
		function showBlock(nameValue: string) {
			if (arr['spage'] === undefined) return;

			const value = arr['items_val'][arr['items_name'].indexOf(nameValue)];
			deleteBuildedObj(buildPageData.current);
			//mobXstore.element.removeGroupBlock(block_id);
			buildPageData.current = BuildObj(block_id, arr['spage'][value], {
				parent_data: {
					id: Id
				},
				contentClass: arr.contentClass
			});
		}
		function clickSelDialog(evt: any) {
			const numValue = evt.currentTarget.value;
			const value = arr['items_val'][numValue];
			const nameValue = arr['items_name'][numValue];
			inputEvent(value);
			setNameValue(nameValue);
			global.api.storagesEng.detActionsOnInput();
			showBlock(nameValue);
			setShowDialog(false);
		}

		if (getShowDialog) {
			selDialogOverlay = <div className={scProp.class_map.overlay} onClick={removeDlg} />;
			const selDialogOptsElements: any = [];
			//for (let i = 0; i < arr['items_val'].length; i++) {
			arr['items_val'].forEach((value: any, i: number) => {
				const sDlgElement = Id + i;
				selDialogOptsElements.push(
					<option
						value={i}
						id={sDlgElement}
						key={sDlgElement}
						onClick={clickSelDialog}
						className={scProp.class_map.optionItem}
					>
						{t(arr['items_name'][i])}
					</option>
				);
			});

			//}
			selDialogOpts = <div className={scProp.class_map.optionMain}>{selDialogOptsElements}</div>;
		} else {
			selDialogOverlay = undefined;
			selDialogOpts = undefined;
		}
		const renderId = Id + 'Render';
		return (
			<div id={block_id} className={scProp.class_map.main}>
				<label htmlFor={Id} className={scProp.class_map.name}>
					{Name}
				</label>
				<div className={scProp.class_map.select} id={Id} onClick={showSelDialog}>
					{t(getNameValue)}
				</div>
				{selDialogOverlay}
				{selDialogOpts}
				<div id={renderId}>{mobXstore.element.doRender(block_id)}</div>
			</div>
		);
	});

	PastControllerReact({
		PastTo,
		Obj,
		Id: block_id,
		ReactElement: <ComboBoxBase key={block_id} />
	});

	return block_id;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const comboBoxBase = (PastTo: string, Id: string, Obj: any) => {
	return comboBoxBaseCreate({ PastTo, Id, Obj });
	// new global_elements_comboBoxBase_class(PastTo,id,arr);
};
export default {
	comboBoxBase: {
		create: comboBoxBase
	}
};
