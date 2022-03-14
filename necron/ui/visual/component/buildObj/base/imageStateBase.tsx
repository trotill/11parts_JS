/**
 * Created by i7 on 04.01.2020.
 */

import { addExampleFormat } from '../../../../engine/___global.js';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { u } from '../../../../engine/_core';
import { PastControllerReact } from '../../../../engine/_pastController';
import { svalueController } from '../../../../engine/var';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { createElement } from '../componentType';

addExampleFormat('imageState', {
	name: 'Relay state',
	type: 'imgst',
	id: 'rlState',
	value: 0,
	rvalue: '{"iface":"","args":"","req":"relay","req_t":0,"name":["relay"],"value":["relay"]}',
	svalue: [
		'{"chvar":{"mode":"rep","value":[0,1],"replace":["rlState-main_img_off","rlState-main_img_on"]}}'
	],
	past: {
		jq: '.router_footer',
		type: 'appendTo'
	}
});

function createImageState({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;
	const sValue = Obj.svalue;
	const defClass = {
		main: 'ImageStateMain',
		info: 'ImageStateMainInfo',
		image: 'ImageStateMainImg'
	};
	const classMap = stylizeInsideElement(Obj.stylize, Obj.value, defClass).class_map;

	const svInit = svalueController(Obj);
	function ImageState() {
		const [getClass, setClass] = useState(svInit.evalue);
		useEffect(() => {
			buildObjOnMount(Obj);
			const useRvalue = Obj.rvalue !== undefined;
			if (useRvalue) {
				const json = JSON.parse(Obj.rvalue);
				AddEventWrapper(
					json,
					function (event: any) {
						const evValue = event[json.value];
						const sVal = svalueController({ value: evValue, svalue: sValue });
						let value;
						if (u(sVal.evalue)) value = sVal.evalue;
						else value = event[json.value];
						setClass(value);
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
		});
		return (
			<div className={classMap.main} id={Id + '-main'}>
				<div className={classMap.info} id={Id + '-main_info'}>
					<div className={`${classMap.image} ${getClass}`} id={Id + '-main_img'} />
				</div>
			</div>
		);
	}
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <ImageState key={blockId} />
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: string, Id: string, Obj: any) => {
	return createImageState({ PastTo, Id, Obj });
};

export default {
	imgStateBase: {
		create: create
	}
};
