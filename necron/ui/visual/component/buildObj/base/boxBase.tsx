/**
 * Created by i7 on 09.02.2020.
 */
import {
	BuildObj,
	deleteBuildedObj,
	buildObjOnMount,
	buildObjOnUmount
} from '../../../../engine/_buildEng';
import { PastControllerReact } from '../../../../engine/_pastController';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { mobXstore } from '../../../../engine/___global';
import { useForceUpdate } from '../../../../engine/sharedReactHook';
import { createElement } from '../componentType';
import { observer } from 'mobx-react';

function createBox({ PastTo, Id, Obj }: createElement) {
	const blockId = Id;
	const contId = Id + '_body';
	const BoxBase = observer(() => {
		const name = useRef(Obj.name);
		const buildPageData = useRef({});
		const forceUpdate = useForceUpdate();
		useEffect(() => {
			buildObjOnMount(Obj);
			buildPageData.current = BuildObj(contId, Obj.data, {
				parent_data: {
					id: Id
				},
				contentClass: Obj.contentClass
			});
			forceUpdate();
			return () => {
				deleteBuildedObj(buildPageData.current);
				buildObjOnUmount(Obj);
			};
		}, []);
		let showHeader = undefined;
		if (name.current !== undefined) {
			showHeader = (
				<div className={'box_base box_header'} id={Id + '_head'}>
					{name.current}
				</div>
			);
		}
		return (
			<div className={'box_base box_main'} id={Id}>
				{showHeader}
				<div className={'box_base box_body'} id={contId}>
					{mobXstore.element.doRender(contId)}
				</div>
			</div>
		);
	});
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <BoxBase key={blockId} />
	});

	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: string, Id: string, Obj: any): string => {
	return createBox({ PastTo, Id, Obj });
};

export default {
	boxBase: {
		create: create
	}
};
