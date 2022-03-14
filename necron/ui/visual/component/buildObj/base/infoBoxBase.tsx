/**
 * Created by i7 on 08.04.2017.
 */

import { PastControllerReact } from '../../../../engine/_pastController';
import * as React from 'react';
import { createElement } from '../componentType';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { useEffect } from 'react';

function CreateInfoBox({ PastTo, Id, Obj }: createElement) {
	const defclass = {
		main: 'objTextInfoBox',
		descript: 'objTextInfoBoxDescript',
		textinfo: 'objTextInfoBoxValue'
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defclass);
	function InfoBox() {
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		});
		return (
			<div id={Id} className={scProp.class_map.main}>
				<span className={scProp.class_map.descript}>{Obj['head']}</span>
				<div className={scProp.class_map.textinfo}>{Obj['value']}</div>
			</div>
		);
	}
	const blockId = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <InfoBox key={blockId} />
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const infoBoxBase = (PastTo: string, Id: string, Obj: any) => {
	return CreateInfoBox({ PastTo, Id, Obj });
	// new global_elements_comboBoxBase_class(PastTo,id,arr);
};

export default {
	infoBox: {
		create: infoBoxBase
	}
};
