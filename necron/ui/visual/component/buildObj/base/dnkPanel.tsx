/**
 * Created by Ilya on 30.01.2020.
 */

import { addExampleFormat, global } from '../../../../engine/___global.js';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';

import { nu, u } from '../../../../engine/_core';
import { PastControllerReact } from '../../../../engine/_pastController';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { svalueController } from '../../../../engine/var';
import { genBidForDNK } from '../../shared/base/dnk';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { createElement } from '../componentType';
import { GetAllMeta } from '../../../../engine/_metaVar';

addExampleFormat('createPanelDNK_v1', {
	id: 'stat_humidifier',
	type: 'dpanel',
	name: 'Sensors RT',
	value: ['УВЛАЖНИТЕЛЬ', 'Пассивен', '95% 15 через 30 мин'],

	stylize: {
		items_limit: 1000, //необязательный параметр, только для eventFromUI. Если он отстутсвует или 0, то панель используется только для статичных данных с фикс. кол. элементов
		reverse: 1, //необязательный параметр, только для eventFromUI. Если он присутствует и не 0, то элементы панели отображаются реверсивно, например 3,2,1
		changeclass: {
			main: 'wst_panel_main_humidifier wst_panel_on',
			global: 'wst_panel_global',
			input: ['wst_panel_input1', 'wst_panel_input2', 'wst_panel_input3']
		}
	}
});

addExampleFormat('createPanelDNK_v2', {
	id: 'stat_humidifier',
	type: 'dpanel',
	name: 'Sensors RT',
	value: [
		{
			changeclass: {
				main: 'wst_panel_main_humidifier wst_panel_on',
				global: 'wst_panel_global',
				input: ['wst_panel_input1', 'wst_panel_input2', 'wst_panel_input3']
			}
		},
		'УВЛАЖНИТЕЛЬ',
		'Пассивен',
		'95% 15 через 30 мин'
	]
});

const external: any = {
	doClear: {}
};

const clear = (panelArray: string[]): any => {
	const ClearCol = (Id: string) => {
		if (external.doClear !== undefined) external.doClear[Id]();
	};
	panelArray.forEach((panelId) => {
		ClearCol(panelId);
	});
};

function panelElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	const defClass = {
		main: 'dnk-panel_main',
		global: 'dnk_main_global',
		input: ['dnk-panel_child']
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defClass);
	const mainClassStyle =
		scProp.class_map.main + ' ' + scProp.class_map.global + ' ' + genBidForDNK(Obj);
	let value = [];

	if (nu(Obj.value)) {
		value[0] = Obj['name'];
	} else {
		svalueController(Obj);
		if (u(Obj.evalue)) Obj.value = Obj.evalue;

		if (Array.isArray(Obj.value)) value = Obj.value;
		else value[0] = Obj.value;
	}
	const input_class = scProp.class_map.input[0] ?? '';

	const MetaVar = GetAllMeta(Obj.contentClass);

	if (nu(MetaVar[Id]) || nu(MetaVar[Id].value)) {
		MetaVar[Id].value = value;
	}

	const total_values = value.length;
	let markedMode = false;
	if (u(MetaVar[Id].mark)) {
		if (MetaVar[Id].mark.length === total_values) {
			markedMode = true;
		}
	}
	const initValuePack: any[] = [];
	const baseInputClass: string[] = [];
	for (let n = 0; n < total_values; n++) {
		if (u(scProp.class_map.input[n])) {
			baseInputClass[n] = scProp.class_map.input[n];
		} else {
			if (scProp.class_map.input.length !== 0)
				baseInputClass[n] = scProp.class_map.input[scProp.class_map.input.length - 1];
		}
		let elementClass = baseInputClass[n];
		if (markedMode) elementClass += ' ' + MetaVar[Id].mark[n];
		initValuePack.push({
			key: Id + n,
			value: value[n + scProp.first_value_offs],
			style: elementClass
		});
	}

	let placeToBack = true;

	if (u(Obj.stylize)) {
		if (u(Obj.stylize.reverse) && Obj.stylize.reverse !== 0) placeToBack = false;
	}

	let rvalue: any;
	if (u(Obj.rvalue)) {
		rvalue = JSON.parse(Obj.rvalue);
	}
	//scProp.items_limit = 500;
	function Panel() {
		const sourceValue = useRef(initValuePack);
		const [getBaseIdx, setBaseIdx] = useState({ low: 0, high: total_values });
		const getBaseIdxRef = useRef(getBaseIdx);
		//Из за использования обьекта в useState, при его изменении генерится новая ссылка в getBaseIdx,
		//из за этого содержимое в evHandler не изменяется, для этого сделано преобразование в getBaseIdxRef
		getBaseIdxRef.current = getBaseIdx;
		const evHandler = (event: any) => {
			let valSrc = event[rvalue.value];
			const getBaseIdx = getBaseIdxRef.current;
			const res = svalueController({
				value: valSrc,
				svalue: Obj.svalue
			});
			if (u(res.evalue)) {
				valSrc = res.evalue;
			} else valSrc = res.value;

			let val = [];
			if (Array.isArray(valSrc)) {
				val = valSrc;
			} else {
				val[0] = valSrc;
			}

			if (scProp.items_limit === 0) {
				for (let n = 0, cntR = getBaseIdx.low; n < val.length; n++, cntR++) {
					let elementClass = baseInputClass[n] ?? '';
					if (markedMode) elementClass += ' ' + MetaVar[Id].mark[n];

					sourceValue.current[n] = {
						value: val[n],
						style: elementClass,
						key: Id + cntR
					};
					if (u(val[n])) {
						if (nu(MetaVar[Id].value)) MetaVar[Id].value = [];
						MetaVar[Id].value[n] = val[n];
					}
					setBaseIdx({
						low: getBaseIdx.low,
						high: getBaseIdx.high
					});
				}
			} else {
				let baseIdxLow = getBaseIdx.low;
				if (scProp.items_limit <= getBaseIdx.high - getBaseIdx.low) {
					const delCount = getBaseIdx.high - scProp.items_limit - getBaseIdx.low + 1;
					if (delCount !== 0) {
						//console.time('SLICE');
						sourceValue.current = sourceValue.current.slice(delCount, sourceValue.current.length);
						//console.timeEnd('SLICE');
					}
					baseIdxLow += val.length;
				}

				for (let n = 0, cntr = getBaseIdx.high; n < val.length; n++, cntr++) {
					let style = input_class;
					if (u(MetaVar[Id].mark)) {
						style += ' ' + MetaVar[Id].mark[n];
					}
					const pack = {
						value: val[n],
						style: style,
						key: Id + cntr
					};
					sourceValue.current.push(pack);
				}
				setBaseIdx({
					low: baseIdxLow,
					high: getBaseIdx.high + val.length
				});
			}
		};

		useEffect(() => {
			buildObjOnMount(Obj);
			if (rvalue !== undefined) {
				AddEventWrapper(rvalue, evHandler, Id);
			}
			return () => {
				buildObjOnUmount(Obj);
				cleanupEventWrapper(Id);
			};
		}, []);

		const view: JSX.Element[] = [];

		external.doClear[Id] = () => {
			sourceValue.current = [];
			setBaseIdx({
				low: 0,
				high: 0
			});
			MetaVar[Obj.contentClass][Id].value = [];
		};

		if (placeToBack)
			sourceValue.current.forEach((val) => {
				view.push(
					<div className={val.style} id={val.Id} key={val.key}>
						{val.value}
					</div>
				);
			});
		else
			sourceValue.current.reduceRight((r, val) => {
				view.push(
					<div className={val.style} id={val.Id} key={val.key}>
						{val.value}
					</div>
				);
			}, null);

		return (
			<div id={Id} className={mainClassStyle}>
				{view}
			</div>
		);
	}
	return <Panel key={Id} />;
}
function panelCreateBase({ PastTo, Id, Obj }: createElement): string {
	const blockId = 'div' + Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: panelElement(blockId, { Id, Obj })
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function panelDebug(Obj: any) {
	const blockId = 'div' + Obj.id;
	return panelElement(blockId, { Id: Obj.id, Obj });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const panelCreate = (PastTo: string, Id: string, Obj: any) => {
	return panelCreateBase({ PastTo, Id, Obj });
};

export default {
	dnkPanel: {
		//create:create,
		create: panelCreate,
		test: panelDebug,
		clear: clear
	}
};
