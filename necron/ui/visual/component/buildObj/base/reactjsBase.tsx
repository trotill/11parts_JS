import { PastControllerReact } from '../../../../engine/_pastController';
import { useEffect } from 'react';
import * as React from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { createElement, elementObjParam } from '../componentType';

interface reactDBinter {
	[HandlerId: string]: (Obj: any) => JSX.Element;
}

const reactDB: reactDBinter = {};

function createReactElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	function ReactElement() {
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		}, []);
		return reactDB[blockId](Obj);
	}
	return <ReactElement key={blockId} />;
}
function createReact({ PastTo, Id, Obj }: createElement) {
	const blockId = Id;

	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: createReactElement(blockId, { PastTo, Id, Obj })
	});
	return blockId;
}
function createReactDebug(Obj: elementObjParam) {
	const blockId = Obj.id;
	return createReactElement(blockId, { Id: Obj.id, Obj });
}

const create = (PastTo: string, Id: string, Obj: elementObjParam) => {
	return createReact({ PastTo, Id, Obj });
};

export default {
	reactjsBase: {
		create: create,
		link: (reactHandlerId: string, reactHandler: (Obj: any) => JSX.Element) => {
			reactDB[reactHandlerId] = reactHandler;
		},
		test: createReactDebug
	}
};
