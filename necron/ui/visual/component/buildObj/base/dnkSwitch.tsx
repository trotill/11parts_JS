/**
 * Created by Ilya on 30.01.2020.
 */
import { addExampleFormat, global } from '../../../../engine/___global.js';

import {
	removeEventFromEventListeners,
	addEventToEventListeners,
	AddEventWrapper,
	sendUserWebEvent,
	cleanupEventWrapper
} from '../../../../engine/event';

import { nu, u } from '../../../../engine/_core';

import { PastControllerReact } from '../../../../engine/_pastController';

import { stylizeInsideElement } from '../../../../engine/stylize';
import { createCookie, readCookie } from '../../../../engine/__cookies';
import { genBidForDNK } from '../../shared/base/dnk';
import { GetAllMeta } from '../../../../engine/_metaVar';
//
import { useEffect, useState, useRef } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import * as React from 'react';
import { createElement } from '../componentType';
import {
	setMetaChange,
	metaIsChange,
	SetMetaForce,
	GetMetaForce
} from '../../../../engine/_metaVar';

addExampleFormat('CreateSwitchDNK', {
	type: 'dswitch',
	id: 'switch',
	name: 'switch',
	value: 0,
	event: {
		user: {
			opts: {
				connectEvent: 0, //1 - повесить эвент на обработчик клика, пользовательский эвент сможет вызывать обработчик
				generateEvent: 0, //1 - генерировать пользовательские эвенты, в обработчике клика, используется если нужна особая обработка по нажатию
				targetElement: 'main' //тип элемента на который необходимо повесить обработчик клика main, desc, switch
			},
			name: 'switchEvent' //имя эвента используется в логике, может быть любым
		}
	}
});

addExampleFormat('SwitchArrayDNK', {
	type: 'dswitch',
	id: 'switch',
	name: 'switch',
	event: {
		user: {
			opts: {
				generateEvent: 0 //1 - генерировать пользовательские эвенты, в обработчике клика, используется если нужна особая обработка по нажатию
			}
		}
	},
	value: ['0', '1']
});

function switchElementArray(blockId: string, { Id, Obj }: createElement): JSX.Element {
	const defClass = {
		main: 'dnk-bitswitcharray_main',
		global: 'dnk_main_global',
		label: 'dnk-bitswitcharray_label',
		inputMain: 'dnk-bitswitcharray_bar',
		inputChild: 'dnk-bitswitcharray_item'
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defClass);
	const blockClass =
		scProp.class_map.main + ' ' + scProp.class_map.global + ' ' + genBidForDNK(Obj);
	const labelName = Obj['name'];
	const labelId = 'label' + Id;
	const MetaVar = GetAllMeta(Obj.contentClass);

	MetaVar[Id] = {
		id: Id,
		value: Obj.value
	};

	let useUserEvent = 0;
	let userEventOpts: any = {};
	if (u(Obj.event) && u(Obj.event.user)) {
		useUserEvent = 1;
		userEventOpts = Obj.event.user.opts;
	}
	function DnkSwitch() {
		const [getActive, setActive] = useState(Obj.value);
		const [getChanged, setChanged] = useState(false);
		useEffect(() => {
			buildObjOnMount(Obj);

			const unchanged_event_id = Id + 'Unchanged';
			const unchanged_evlistener = function () {
				setChanged(false);
			};
			addEventToEventListeners(unchanged_event_id, unchanged_event_id, unchanged_evlistener);
			if (Obj.rvalue) {
				const rvalue = JSON.parse(Obj.rvalue);
				AddEventWrapper(
					rvalue,
					(event: any) => {
						const val = event[rvalue.value];
						for (let n = 0; n < Obj.value.length; n++) {
							input(n, val[n]);
						}
					},
					Id
				);
			}
			return () => {
				buildObjOnUmount(Obj);
				removeEventFromEventListeners(unchanged_event_id);
				if (Obj.rvalue) cleanupEventWrapper(Id);
			};
		}, []);
		function input(pos: number, value: number) {
			const valueArray = [...MetaVar[Id].value];
			valueArray[pos] = value;
			setActive(valueArray);

			MetaVar[Id].value = valueArray;

			const swId = Id + '@' + pos;
			if (useUserEvent && userEventOpts.generateEvent) {
				sendUserWebEvent('switchChange', {
					switchValue: value,
					param: Obj,
					id: swId,
					src: 'click'
				});
			}
		}
		function onClick(event: any) {
			const pos = event.target.id.split('@')[1];
			const value = MetaVar[Id].value[pos] ? 0 : 1;
			MetaVar[Id].changed = true; //Пометка от изменении д.б. раньше input
			input(pos, value);
			setChanged(true);
		}

		let addBlockClass = '';
		if (getChanged) {
			addBlockClass += ' ' + scProp.class_map.global + '_changed';
		}
		const switchItemView: JSX.Element[] = [];
		getActive.forEach((val: number, n: number) => {
			const bitId = Id + '_item@' + n;
			let addChildClass = '';
			if (val) addChildClass = ' ' + scProp.class_map.inputChild + '_is_active';
			switchItemView.push(
				<div
					key={bitId}
					className={scProp.class_map.inputChild + addChildClass}
					id={bitId}
					onClick={onClick}
				/>
			);
		});
		return (
			<div id={blockId} className={blockClass + addBlockClass}>
				<label className={scProp.class_map.label} htmlFor={Id} id={labelId}>
					{labelName}
				</label>
				<div className={scProp.class_map.inputMain} id={Id}>
					{switchItemView}
				</div>
			</div>
		);
	}
	return <DnkSwitch key={Id} />;
}

function switchElementSingle(blockId: string, { Id, Obj }: createElement): JSX.Element {
	const defClass = {
		main: 'dnk-bitswitch_main',
		global: 'dnk_main_global',
		label: 'dnk-bitswitch_label',
		input: 'dnk-bitswitch_input'
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defClass);

	const blockClass =
		scProp.class_map.main + ' ' + scProp.class_map.global + ' ' + genBidForDNK(Obj);
	const labelName = Obj['name'];

	const labelId = 'label' + Id;

	let useCook = false;
	const swCookName = 'div' + Id + '-oneSw';
	if (nu(Obj.value) || Obj.value === 'undefined' || u(Obj.cvalue)) {
		//undefined or "undefined" for DNK create in editor
		Obj.value = 0;
		useCook = true;
	}
	if (useCook) {
		let val;
		if ((val = readCookie(swCookName)) == null) {
			if (u(Obj.cvalue)) {
				//Если есть cvalue, но нет куки, то использовать cvalue для инициализации
				Obj.value = Obj.cvalue;
			} else Obj.value = 0;
			createCookie(swCookName, Obj.value, 0);
		} else Obj.value = parseInt(val);
	}

	const contentClass = Obj.contentClass;
	//const MetaVar = GetAllMeta(contentClass)[Id]; //global.MetaVar[Obj.contentClass];

	//if (useCook) {//при использовании кук, логика MetaVar блокируется
	SetMetaForce(
		{
			id: Id,
			value: Obj.value
		},
		contentClass
	);
	// }

	if (Obj.isRo === undefined) Obj.isRo = false;

	let useUserEvent = 0;
	let userEventOpts: any = {};
	let userEventName = '';
	if (u(Obj.event) && u(Obj.event.user)) {
		useUserEvent = 1;
		userEventOpts = Obj.event.user.opts;
		userEventName = Obj.event.user.name;
	}

	function DnkSwitch() {
		const [getActive, setActive] = useState(Number(Obj.value));
		const [getChanged, setChanged] = useState(false);
		const refActive = useRef(getActive);
		refActive.current = getActive;

		useEffect(() => {
			buildObjOnMount(Obj);
			if (useUserEvent && userEventOpts.connectEvent) {
				addEventToEventListeners(userEventName + '-' + Id, Id + 'EventUser', onClick);
			}

			const unchanged_event_id = Id + 'Unchanged';
			const unchanged_evlistener = function () {
				setChanged(false);
			};
			addEventToEventListeners(unchanged_event_id, unchanged_event_id, unchanged_evlistener);
			if (Obj.rvalue) {
				const rvalue = JSON.parse(Obj.rvalue);
				AddEventWrapper(
					rvalue,
					(event: any) => {
						if (useCook)
							//при использовании кук, блокируется удаленная синхронизация
							return;

						//console.log('Get SwitchDNK eventFromUI ', eventFromUI[rvalue.value]);
						const val = Number(event[rvalue.value]);
						if (metaIsChange(Id, contentClass)) {
							if (refActive.current === val) {
								//не убирать setMetaChange, долго перерендится, поэтому он долже дублироваться здесь
								setMetaChange(Id, false, contentClass);
								setChanged(false);
							}
							return;
						}

						input(val);
					},
					Id
				);
			}
			return () => {
				buildObjOnUmount(Obj);
				removeEventFromEventListeners(Id + 'EventUser');
				removeEventFromEventListeners(unchanged_event_id);
				if (Obj.rvalue) cleanupEventWrapper(Id);
			};
		}, []);
		function input(value: number) {
			if (value > 0) {
				setActive(1);
				if (useCook) createCookie(swCookName, 1, 0);
			} else {
				setActive(0);
				if (useCook) createCookie(swCookName, 0, 0);
			}

			//MetaVar.value = value;
			SetMetaForce(
				{
					id: Id,
					value: value
				},
				contentClass
			);
			if (useUserEvent && userEventOpts.generateEvent) {
				sendUserWebEvent('switchChange', {
					switchValue: value,
					param: Obj,
					id: Id,
					src: 'click'
				});
			}
		}
		function onClick() {
			let value = GetMetaForce(Id, contentClass).value ? 0 : 1;
			if (useCook) value = parseInt(readCookie(swCookName));
			//if (!useCook) {
			//при использовании кук, логика MetaVar блокируется
			//MetaVar[Id].changed = true; //Пометка от изменении д.б. раньше input
			//}
			setMetaChange(Id, true, contentClass);
			input(value);
			setChanged(true);
		}
		let clickMain;
		let clickLabel;
		let clickSwitch;
		if (useUserEvent) {
			clickMain = userEventOpts.targetElement === 'main' ? onClick : undefined;
			clickLabel = userEventOpts.targetElement === 'desc' ? onClick : undefined;
			clickSwitch = userEventOpts.targetElement === 'switch' ? onClick : undefined;
		} else {
			clickSwitch = onClick;
		}

		let addChildClass = '';
		if (getActive) addChildClass = ' ' + scProp.class_map.input + '_is_active';

		let addBlockClass = '';
		if (getChanged) {
			addBlockClass += ' ' + scProp.class_map.global + '_changed';
		}
		//setMetaChange(Id, getChanged, contentClass);
		return (
			<div id={blockId} className={blockClass + addBlockClass} onClick={clickMain}>
				<label className={scProp.class_map.label} htmlFor={Id} id={labelId} onClick={clickLabel}>
					{labelName}
				</label>
				<div className={scProp.class_map.input + addChildClass} id={Id} onClick={clickSwitch} />
			</div>
		);
	}
	return <DnkSwitch key={Id} />;
}

function switchElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	if (Array.isArray(Obj.value) && Obj.value.length > 1) {
		return switchElementArray(blockId, { Id, Obj });
	} else return switchElementSingle(blockId, { Id, Obj });
}

function switchCreateBase({ PastTo, Id, Obj }: createElement): string {
	const blockId = 'block_' + Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: switchElement(blockId, { Id, Obj })
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function switchDebug(Obj: any) {
	const blockId = 'block_' + Obj.id;
	return switchElement(blockId, { Id: Obj.id, Obj });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const switchCreate = (PastTo: string, Id: string, Obj: any) => {
	return switchCreateBase({ PastTo, Id, Obj });
};

export default {
	dnkSwitch: {
		//create:create
		create: switchCreate,
		test: switchDebug
	}
};
