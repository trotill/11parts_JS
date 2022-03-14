/**
 * Created by i7 on 08.04.2017.
 */
import { SetMetaBaseUI } from '../../../../engine/_metaVar';
import { addExampleFormat, global } from '../../../../engine/___global.js';
import { t } from '../../../../engine/_core';
import { PastControllerReact } from '../../../../engine/_pastController';
import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { createElement } from '../componentType';
import * as PropTypes from 'prop-types';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

addExampleFormat('comboRadioBase', {
	name: 'sboxradio',
	type: 'sboxradio',
	tabidx: 1,
	value: 'operating_time',
	items_name: ['Operating time', 'Total time', 'CPU temperature'],
	items_val: ['operating_time', 'total_operating_time', 'cpu_temp']
});

function ComboBoxRadioDialog(props: any) {
	const Id = props.Id;
	const arr = props.arr;
	const scProp = props.scProp;
	const [getSelect, setSelect] = useState(
		arr['items_name'].map((value: any, idx: number) => {
			if (idx === props.selValue) return 1;
			else return 0;
		})
	);

	return (
		<div className={scProp.class_map.overlay} id={'block_id'}>
			<div className={scProp.class_map.dialogMain} id={'df' + Id}>
				<div id={Id} className={'Radio' + Id}>
					{arr['items_name'].map((items_name: string, i: number) => {
						let radioDialogItemMain = scProp.class_map.dialogItemMain;
						let radioDialogItemChild = scProp.class_map.dialogItemChild;
						if (getSelect[i] === 1) {
							radioDialogItemMain = scProp.class_map.dialogItemMainSelect;
							radioDialogItemChild = scProp.class_map.dialogItemChildSelect;
						}
						return (
							<div key={'itemMain' + Id + i} className={radioDialogItemMain}>
								<div
									key={'itemChild' + Id + i}
									className={radioDialogItemChild}
									id={'s' + i}
									onClick={() => {
										const selArr = arr['items_name'].map(() => 0);
										selArr[i] = 1;
										setSelect(selArr);
										props.onClickSpan(arr['items_val'][i]);
									}}
								>
									{t(items_name)}
								</div>
							</div>
						);
					})}
				</div>
				<button
					className={scProp.class_map.dialogButton}
					type={'button'}
					style={{ width: '100%' }}
					onClick={props.onClickClose}
				>
					{t('close')}
				</button>
			</div>
		</div>
	);
}

ComboBoxRadioDialog.propTypes = {
	Id: PropTypes.string,
	arr: PropTypes.object,
	onClickSpan: PropTypes.func,
	onClickClose: PropTypes.func,
	onClickSelect: PropTypes.func,
	selValue: PropTypes.number,
	scProp: PropTypes.object,
	show: PropTypes.bool
};

function CreateComboRadio({ PastTo, Id, Obj }: createElement) {
	const arr = Obj;
	const Name = arr['name'] ?? '';

	const defclass = {
		main: 'comboboxRadioMain',
		name: 'comboboxRadioName',
		input: 'comboboxRadioText noselect',
		inputPix: 'comboboxRadioPlus noselect',
		overlay: 'overlay_nofx',
		dialogMain: 'input_form_dialog noselect',
		dialogItemMain: 'radioDialogItemMain',
		dialogItemChild: 'radioDialogItemChild',
		dialogItemMainSelect: 'radioDialogItemMainSelect',
		dialogItemChildSelect: 'radioDialogItemChildSelect',
		dialogButton: 'button_form_dialog'
	};
	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defclass);

	const blockId = Id + 'gen';
	const idxValue = arr['items_val'].indexOf(arr['value']);
	const locObj = {
		id: Id,
		table: arr.table,
		contentClass: arr.contentClass
	};

	function ComboRadio() {
		const [getShowDialog, setShowDialog] = useState(false);
		const [getValueName, setValueName] = useState(arr['items_name'][idxValue]);
		const refValue = useRef(arr['value']);
		let viewDialog = undefined;
		useEffect(() => {
			buildObjOnMount(Obj);
			inputEvent(refValue.current);
			if (arr.rvalue !== undefined) {
				const json = JSON.parse(arr.rvalue);
				AddEventWrapper(
					json,
					function (event: any) {
						const value = event[json.value];
						inputEvent(value);
					},
					Id
				);
			}
			return () => {
				if (arr.rvalue !== undefined) {
					cleanupEventWrapper(Id);
				}
				buildObjOnUmount(Obj);
			};
		}, []);

		const inputEvent = (value: string) => {
			SetMetaBaseUI(locObj, value);
			const idx = arr['items_val'].indexOf(value);
			setValueName(arr['items_name'][idx]);
			refValue.current = value;
		};
		const onClick = () => {
			//  console.log('arr ', arr);
			global.api.storagesEng.detActionsOnInput();
			setShowDialog(true);
			//ComboBoxRadioShow(Id, arr);
		};
		function onClickCloseDialog() {
			global.api.storagesEng.detActionsOnInput();
			setShowDialog(false);
			//setShow(false);
		}
		function onClickSelect(event: any) {
			const value = event.currentTarget.value;
			global.api.storagesEng.detActionsOnInput();
			//var varr = comboValue.split('|');
			//var value = varr[0];
			//var valname = varr[1];
			inputEvent(value);
		}
		function onClickSpan(value: any) {
			//var valname = varr[1];
			inputEvent(value);
		}
		if (getShowDialog) {
			viewDialog = (
				<ComboBoxRadioDialog
					Id={Id}
					arr={arr}
					show={true}
					onClickClose={onClickCloseDialog}
					onClickSelect={onClickSelect}
					onClickSpan={onClickSpan}
					selValue={arr['items_val'].indexOf(refValue.current)}
					scProp={scProp}
				/>
			);
		}

		let NameView;
		if (Name.length !== 0) {
			NameView = <div className={scProp.class_map.name}>{Name}</div>;
		}
		return (
			<div className={scProp.class_map.main} id={blockId}>
				{NameView}
				<div style={{ display: 'flex', cursor: 'pointer' }}>
					<div className={scProp.class_map.input} id={Id} onClick={onClick}>
						{t(getValueName)}
					</div>
					<div className={scProp.class_map.inputPix} onClick={onClick} />
					{viewDialog}
				</div>
			</div>
		);
	}

	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <ComboRadio key={blockId} />
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const comboRadioBase = (PastTo: string, Id: string, Obj: any) => {
	return CreateComboRadio({ PastTo, Id, Obj });
	// new global_elements_comboBoxBase_class(PastTo,id,arr);
};

export default {
	comboBoxRadio: {
		create: comboRadioBase
	}
};
