/**
 * Created by i7 on 18.03.2018.
 */

import { createElement } from '../componentType';
import * as React from 'react';
import { PastControllerReact } from '../../../../engine/_pastController';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { useEffect } from 'react';

function buttonBaseElement(blockId: string, { PastTo, Id, Obj }: createElement) {
	const defClass = {
		main: 'buttonBaseMain',
		button: 'buttonBaseButton'
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defClass);
	function Button() {
		if (Obj.action !== undefined) {
			alert(`Obsolete button method action ${JSON.stringify(Obj.action)}`);
		}
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		}, []);
		return (
			<div className={scProp.class_map.main} id={Id}>
				<button className={scProp.class_map.button} id={Id + '_but'}>
					{Obj.name}
				</button>
			</div>
		);
	}
	return <Button key={blockId} />;
}

function buttonBaseCreate({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: buttonBaseElement(blockId, { PastTo, Id, Obj })
	});
	return blockId;
}
function buttonBaseDebug(Obj: any) {
	const blockId = Obj.id;
	return buttonBaseElement(blockId, { Id: Obj.id, Obj });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: any, Id: any, Obj: any) => {
	return buttonBaseCreate({ PastTo, Id, Obj });
};

export default {
	buttonBase: {
		create: create,
		test: buttonBaseDebug
	}
};
