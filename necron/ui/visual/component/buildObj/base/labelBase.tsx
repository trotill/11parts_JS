/**
 * Created by i7 on 08.04.2017.
 */

import { SetMetaBaseUI } from '../../../../engine/_metaVar';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';

import { PastControllerReact } from '../../../../engine/_pastController';
import { svalueController } from '../../../../engine/var';

import { useEffect, useState, useRef } from 'react';
import * as React from 'react';
import { createElement } from '../componentType';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

function CreateLabel({ PastTo, Id, Obj }: createElement) {
	const contentClass = Obj.contentClass;
	const arr = Obj;
	const defclass = {
		labelName: 'labelBaseDescription labelBaseMain',
		labelContainer: 'labelBaseMain',
		labelItem: 'labelBaseValue'
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defclass);

	const locObj = {
		id: Id,
		table: Obj.table,
		contentClass: Obj.contentClass
	};
	function Label() {
		const Name = useRef(Obj.name);
		const [getLabel, setLabel] = useState(Obj.value);
		const inputEvent = (value: any) => {
			const result = svalueController({ svalue: Obj.svalue, value });
			let outVal = result.value;
			if (result.evalue !== undefined) {
				outVal = Obj.evalue;
			}
			SetMetaBaseUI(locObj, value);
			setLabel(outVal);
		};
		useEffect(() => {
			buildObjOnMount(Obj);
			inputEvent(getLabel);
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

		let labName = undefined;
		if (Name.current.length !== 0) {
			labName = <div className={scProp.class_map.labelName}>{Name.current + ':'}</div>;
		}
		return (
			<div id={Id} style={{ display: 'flex' }}>
				{labName}
				<div className={scProp.class_map.labelContainer}>
					<div className={scProp.class_map.labelItem}>{getLabel}</div>
				</div>
			</div>
		);
	}
	const block_id = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: block_id,
		ReactElement: <Label key={block_id} />
	});
	return block_id;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const labelBase = (PastTo: string, Id: string, Obj: any) => {
	return CreateLabel({ PastTo, Id, Obj });
	// new global_elements_comboBoxBase_class(PastTo,id,arr);
};

export default {
	labelBase: {
		create: labelBase
	}
};
