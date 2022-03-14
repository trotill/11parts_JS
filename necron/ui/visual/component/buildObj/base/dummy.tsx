import { PastControllerReact } from '../../../../engine/_pastController';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { createElement } from '../componentType';

function dummyElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	function Dummy() {
		const [getShowObj, setShowObj] = useState(false);
		const onClick = () => {
			if (!getShowObj) setShowObj(true);
			else setShowObj(false);
		};

		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		}, []);
		return (
			<div id={Id} className={'dummyMain'}>
				<div
					className={'dummyId'}
					onClick={onClick}
					style={getShowObj ? { backgroundColor: '#011c71' } : {}}
				>
					{Id}
				</div>
				{getShowObj ? (
					<textarea className={'dummyObj'} defaultValue={JSON.stringify(Obj, null, '\t')} />
				) : null}
			</div>
		);
	}
	return <Dummy key={Id} />;
}
function dummyCreateBase({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: dummyElement(blockId, { Id, Obj })
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function dummyDebug(Obj: any): JSX.Element {
	const blockId = Obj.id;
	return dummyElement(blockId, { Id: Obj.id, Obj });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const dummyCreate = (PastTo: string, Id: string, Obj: any) => {
	return dummyCreateBase({ PastTo, Id, Obj });
};

export default {
	dummyDebug,
	dummyCreate
};
