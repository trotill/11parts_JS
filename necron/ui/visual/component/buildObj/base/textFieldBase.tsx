import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { PastControllerReact } from '../../../../engine/_pastController';
import { SetMetaBaseUI } from '../../../../engine/_metaVar';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { createElement } from '../componentType';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

//declare function textFieldCreate(PastTo:string ,Id: string,Obj: any): string;
function textFieldCreate({ PastTo, Id, Obj }: createElement): string {
	const type = 'text';
	let ro = false;
	const rows = Obj['rows'] === undefined ? Obj['value'].split('\n').length : Obj['rows'];

	if (Obj['isRo'] != null && Obj['isRo'] === true) ro = true;

	const locObj = {
		id: Id,
		table: Obj.table,
		contentClass: Obj.contentClass
	};

	const value = Obj['value'];
	function TextField() {
		function onInput(comp: any) {
			inputEvent(comp.currentTarget.value);
		}
		const [getValue, setValue] = useState(value);

		const inputEvent = (value: any) => {
			setValue(value);
			SetMetaBaseUI(locObj, value);
		};
		useEffect(() => {
			buildObjOnMount(Obj);
			inputEvent(Obj.value);
			const useRvalue = Obj.rvalue !== undefined;
			if (useRvalue) {
				const json = JSON.parse(Obj.rvalue);
				AddEventWrapper(
					json,
					function (event: any) {
						inputEvent(event[json.value]);
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
		//
		return (
			<div className={'textFieldBaseMain'} id={Id + 'Block'}>
				<label className={'textFieldBaseLabel'} htmlFor={Id}>
					{Obj['name']}
				</label>
				<textarea
					onInput={onInput}
					id={Id}
					value={getValue}
					readOnly={ro}
					className={'textFieldBaseInput'}
					itemType={type}
					rows={rows}
					name={Obj['name']}
				/>
			</div>
		);
	}
	PastControllerReact({
		PastTo,
		Obj,
		Id: Id,
		ReactElement: <TextField key={Id} />
	});
	return Id;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: any, Id: any, Obj: any): string => {
	return textFieldCreate({ PastTo, Id, Obj });
};

export default {
	textFieldBase: {
		create: create
	}
};
