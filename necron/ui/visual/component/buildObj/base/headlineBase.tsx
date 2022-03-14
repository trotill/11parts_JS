/**
 * Created by i7 on 08.04.2017.
 */

import { PastControllerReact } from '../../../../engine/_pastController';
import { stylizeInsideElement } from '../../../../engine/stylize';
import * as React from 'react';
import { createElement } from '../componentType';
import { useEffect } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

const headlineCreate = ({ PastTo, Id, Obj }: createElement): string => {
	const arr = Obj;
	const defclass = {
		main: 'textdelimiter',
		input: 'p_textdelimiter'
	};

	const scProp = stylizeInsideElement(arr.stylize, arr.value, defclass);

	function HeadLine() {
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		});
		return (
			<div className={scProp.class_map.main}>
				<p className={scProp.class_map.input}>{arr['name']}</p>
			</div>
		);
	}
	const blockId = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <HeadLine key={blockId} />
	});

	return blockId;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const headlineBase = (PastTo: string, Id: string, Obj: any): string => {
	return headlineCreate({ PastTo, Id, Obj });
};

export default {
	headlineBase: {
		create: headlineBase
	}
};
