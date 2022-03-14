import { PastControllerReact } from '../../../../engine/_pastController';
import { stylizeInsideElement } from '../../../../engine/stylize';
import * as React from 'react';
import { createElement } from '../componentType';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { useEffect } from 'react';

function tipsBase({ PastTo, Id, Obj }: createElement) {
	const defClass = {
		main: 'tips_main',
		tips: 'tips_block_tips',
		name: 'tips_block_name'
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defClass);
	function Tips() {
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		});
		return (
			<div id={Id} className={scProp.class_map.main}>
				<div className={scProp.class_map.name} id={Id}>
					{Obj['name'] + ':'}
					<div className={scProp.class_map.tips} id={Id}>
						{Obj['value']}
					</div>
				</div>
			</div>
		);
	}
	const blockId = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <Tips key={Id} />
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: any, Id: any, Obj: any): string => {
	//Obj.past.jq = PastTo;
	return tipsBase({ PastTo, Id, Obj });
};

export default {
	tipsBase: {
		create: create
	}
};
