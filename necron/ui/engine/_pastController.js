import { mobXstore } from './___global.js';
import { sendUserWebEvent } from './event';
import { nu } from './_core';

import * as React from 'react';

export function PastControllerReact({ PastTo, Obj, Id, ReactElement }) {
	let pastCfg = {};
	if (!Obj.past) {
		pastCfg = {
			type: 'appendTo',
			jq: PastTo
		};
	} else {
		pastCfg = Obj.past;
	}

	if (nu(pastCfg.jq)) {
		pastCfg['jq'] = PastTo;
	}

	sendUserWebEvent('addElement', {
		contentClass: Obj.contentClass,
		id: Id,
		past: pastCfg,
		type: Obj.type
	});

	let placeElement = ReactElement;
	if (pastCfg.wrap) {
		let style = pastCfg.wrap.style ?? {};
		let wId = pastCfg.wrap.Id ?? Id;
		let wrapTag = pastCfg.wrap.tag ?? 'div';
		placeElement = React.createElement(wrapTag, { key: wId, id: wId, style: style }, ReactElement);
	}
	mobXstore.element.addBlock(pastCfg.jq, Id, placeElement);
}
