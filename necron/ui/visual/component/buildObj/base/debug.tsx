import { PastControllerReact } from '../../../../engine/_pastController';
import g from '../../../../engine/___global.js';
import * as React from 'react';
import { createElement } from '../componentType';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { useEffect } from 'react';

const linkTab: { [idx: string]: string } = {
	stop: 'Stop cnoda',
	rebuild: 'Rebuild backend',
	term: 'Reboot all over necron',

	udev: 'Restart udev',
	jnoda: 'Restart jnoda',
	cnoda: 'Restart cnoda',
	start: 'Start cnoda'
};
function DebugLinksGrp() {
	const links = [];

	const click = (lst: string) => {
		window.location.href = `${window.origin}/debug?page=${g.SRV_OBJ.PageRegionName}&action=${lst}`;
	};

	for (const lst in linkTab) {
		links.push(
			<div
				className="debugLinksGrp"
				key={lst}
				onClick={() => {
					click(lst);
				}}
			>
				<div key={'_' + lst} style={{ padding: '0 5px 0 5px' }}>
					{linkTab[lst] + '(' + lst + ')'}
				</div>
			</div>
		);
	}
	//links.push(<div key={2}>{'ee'}</div>);

	return <div className="debugLinksGrpMain">{links}</div>;
}

function debugLinks({ PastTo, Id, Obj }: createElement) {
	const blockId = Id + '_gen';

	function DebugLinks() {
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		});
		return (
			<div className={'debugLinkMain noselect'} id={blockId}>
				<DebugLinksGrp />
			</div>
		);
	}
	PastControllerReact({
		PastTo,
		Obj: Obj,
		Id: blockId,
		ReactElement: <DebugLinks key={blockId} />
	});

	return blockId;
	//new debugLinksClass(PastTo,id,arr);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: string, Id: string, Obj: any): string => {
	return debugLinks({ PastTo, Id, Obj });
};

export default {
	debugLinks: {
		create: create
	}
};
