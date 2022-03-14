/**
 * Created by i7 on 17.02.2020.
 */

import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { PastControllerReact } from '../../../../engine/_pastController';
import { createCookie, readCookie } from '../../../../engine/__cookies';
import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { createElement } from '../componentType';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';

function logBaseCreate({ PastTo, Id, Obj }: createElement) {
	const defclass = {
		main: 'LogField_main',
		info: 'LogField_info',
		head: 'LogField_info_head',
		input: 'LogField_info_comp',
		scroll: 'LogField_info_scroll',
		logView: 'LogField',
		logItemOdd: 'LogFieldParityOdd',
		logItemEven: 'LogFieldParityEven'
	};
	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defclass);

	let scroll_down = 0;
	let scroll_downRc: string;
	const cook_scrl_down = 'LogField-' + Id + '-ScrlDown';
	let regexp = '';
	if (Obj.regexp !== undefined) {
		regexp = Obj.regexp;
	}
	if ((scroll_downRc = readCookie(cook_scrl_down)) == null) scroll_down = 0;
	else scroll_down = parseInt(scroll_downRc);

	const blockId = Id;

	function LogBase() {
		const [getScrollCtrl, setScrollCtrl] = useState('↑');
		const [getRowDataElem, setRowDataElem] = useState([]);
		const scrollIdx = useRef(scroll_down);
		const inputRef = useRef<HTMLInputElement>(null);
		const fieldParity = useRef(0);
		const logFieldRef = useRef<HTMLDivElement>(null);
		const row = useRef(0);
		const draw_arrow = () => {
			if (scrollIdx.current === 0) setScrollCtrl('↑');
			if (scrollIdx.current === 1) setScrollCtrl('↓');
			if (scrollIdx.current === 2) setScrollCtrl('…');
			createCookie(cook_scrl_down, scrollIdx.current, 0);
		};
		useEffect(() => {
			buildObjOnMount(Obj);
			draw_arrow();

			if (Obj.rvalue !== undefined) {
				const json = JSON.parse(Obj.rvalue);

				AddEventWrapper(
					json,
					function (event: any) {
						const value = json.value;
						if (event[value] === undefined) return;

						if (scrollIdx.current !== 2) {
							const showStr = () => {
								const rowName = Id + row.current;
								let v = event[value];
								if (regexp.length !== 0) {
									const rv = event[value].match(regexp);
									if (rv !== null && rv.length === 2) v = rv[1];
								}

								const rdElem = getRowDataElem;
								if (v === '\u0000') v = '';
								else fieldParity.current = Number(!(fieldParity.current & 1));

								rdElem.push({ name: rowName, data: v, fieldParity: fieldParity.current });
								row.current++;
								if (row.current > Obj.rows - 1) {
									rdElem.shift();
								}
								if (scrollIdx.current === 1) logFieldRef.current.scrollTop = 100000; //logFieldRef.current.scroll(0, 100000); // = 100000;
								setRowDataElem([...rdElem]);
							};
							const comp_val = inputRef.current.value;
							if (comp_val.length !== 0) {
								if (event[value].indexOf(comp_val) !== -1) {
									showStr();
								}
							} else showStr();
						}
					},
					Id
				);
			}
			return () => {
				if (Obj.rvalue !== undefined) {
					cleanupEventWrapper(Id);
				}
				buildObjOnUmount(Obj);
			};
		}, []);

		function scrollOnClick() {
			scrollIdx.current++;
			if (scrollIdx.current === 3) scrollIdx.current = 0;
			draw_arrow();
		}

		//fieldStyle.height = '400px';
		return (
			<div className={scProp.class_map.main} id={Id}>
				<div className={scProp.class_map.info}>
					<div className={scProp.class_map.head}>{Obj.name}</div>
					<input ref={inputRef} className={scProp.class_map.input} />
					<div className={scProp.class_map.scroll} onClick={scrollOnClick}>
						{getScrollCtrl}
					</div>
				</div>
				<div ref={logFieldRef} className={scProp.class_map.logView}>
					{getRowDataElem.map((value) => {
						let classN;
						if (value.fieldParity) classN = scProp.class_map.logItemEven;
						else classN = scProp.class_map.logItemOdd;

						return (
							<div key={value.name} id={value.name} className={classN}>
								{value.data}
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <LogBase key={blockId} />
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const logBase = (PastTo: string, Id: string, Obj: any) => {
	return logBaseCreate({ PastTo, Id, Obj });
	// new global_elements_comboBoxBase_class(PastTo,id,arr);
};

export default {
	logBase: {
		create: logBase
	}
};
