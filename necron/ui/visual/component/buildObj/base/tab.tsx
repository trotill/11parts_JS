/**
 * Created by Ilya on 18.12.2019.
 */
import { addExampleFormat, global, mobXstore, setTabTree } from '../../../../engine/___global.js';

import {
	addEventToEventListeners,
	removeEventFromEventListeners,
	sendUserWebEvent
} from '../../../../engine/event';

import { nu, u } from '../../../../engine/_core';
import {
	BuildObj,
	buildObjOnMount,
	buildObjOnUmount,
	deleteBuildedObj
} from '../../../../engine/_buildEng';
import { PastControllerReact } from '../../../../engine/_pastController';

import { stylizeInsideElement } from '../../../../engine/stylize';
import { createCookie, readCookie } from '../../../../engine/__cookies';
import { genBidForDNK } from '../../shared/base/dnk';
import { createElement } from '../componentType';
import { GetAllMeta } from '../../../../engine/_metaVar';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';

addExampleFormat('Tab', {
	name: 'tab',
	type: 'stab',
	value: 'store0',
	//overlay - переключающиюся табы, стандартный режим, при нажатии на таб происходит переключение. Все групповые элементы обьеденены в одну группу переключения.
	//hideBar - тоже что overlay но меню табов всегда скрыто
	//wrap - тоже что hideBar, но все группы всегда отображаются
	mode: 'overlay', //overlay, wrap, hideBar
	id: 'storages',
	items_name: ['Store0', 'Store1'],
	items_val: ['store0', 'store1'],
	items_lid: ['st0', 'st1'],
	spage: {
		store0: [
			{
				type: 'delim',
				id: 'stdelimone',
				name: 'Store0 delim'
			}
		],
		store1: [
			{
				type: 'delim',
				id: 'stdelimtwo',
				name: 'Store1 delim'
			}
		]
	},
	pastBar: '', //Pastразположить меню, в теле любого компонента
	past: {
		type: 'appendTo',
		jq: '.dnsl_col0_row0'
	},
	event: {
		user: 'userEvent' //переключение вкладок по событиям
	},
	//если есть united значит этот узел нужно обьединять с некоторыми узлами
	//если нет united значит этот узел нужно обьединять в общий узел
	//united поддерживается только при использовании dnk!!!
	united: [],
	stylize: {}
});

addExampleFormat('stylize.layout', {
	layout: {
		cols: [50, 50],
		rows: [50, 50],
		items: [1, 2, 3, 100],
		overlay: {
			hello: {
				cols: [30, 70],
				rows: [50, 50],
				items: [1, 2, 3, 100]
			},
			goodby: {
				cols: [70, 30],
				rows: [20, 20],
				items: [1, 2, 3, 100]
			}
		}
	}
});

function eventWrapper({
	item_val,
	getShowReg,
	setShowReg,
	arr,
	barEnable,
	bar_item_active,
	cook_val_name,
	oldValue,
	MetaVar,
	Id
}: any): any {
	return (evtValue: any) => {
		let switchValue;
		if (evtValue instanceof Object && !Array.isArray(evtValue)) {
			switchValue = item_val;
		} else switchValue = evtValue;

		const showReg = [...getShowReg];
		for (let idx = 0; idx < arr['items_name'].length; idx++) {
			const newValue = arr['items_val'][idx];
			let tabId = '';

			if (barEnable) {
				tabId = 'tabid_' + newValue;
				//  try {
				document.getElementById(tabId).classList.remove(bar_item_active);
				//} catch (e) {}
				//	try {
				document
					.getElementById(tabId)
					.classList.remove(bar_item_active + '_' + arr['items_val'][idx]);
				//} catch (e) {}
			}
			if (arr['items_val'][idx] === switchValue) {
				if (barEnable) {
					document.getElementById(tabId).classList.add(bar_item_active);
					document
						.getElementById(tabId)
						.classList.add(bar_item_active + '_' + arr['items_val'][idx]);
				}

				// var newdata=arr['spage'][newvalue];
				createCookie(cook_val_name, newValue, 0);
				//global.cache.tabTree[arr.parent] = switchValue;
				setTabTree(arr.parent, switchValue);
				if (u(arr.event) && u(arr.event.user)) {
					sendUserWebEvent('tabChange', {
						switchValue: switchValue,
						parent: arr.parent,
						src: 'click'
					});
				}

				//Не перемещать вверх. Должно быть здесь для отделенного бара.
				if (oldValue.current === newValue) return;

				//ShowObj();

				showReg[idx] = true;
				oldValue.current = newValue;
				MetaVar[Id] = {
					id: Id,
					value: arr['items_val'][idx]
				};
			} else {
				showReg[idx] = false;
			}
		}
		setShowReg(showReg);
	};
}

function tabBaseElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	//let Obj = Obj;
	const defClass = {
		main: 'tab_main tab_main_basic',
		bar: 'tab_bar tab_bar_basic',
		bar_item: ['tab_item tab_item_basic'],
		bar_region: 'tab_region tab_region_basic',
		bar_item_active: ['tab_is_active']
	};

	const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defClass);
	const cmap = scProp.class_map;
	if (nu(Obj.mode)) {
		Obj.mode = 'overlay';
	}
	const mode = Obj.mode;
	let showBar = true;
	if (mode === 'wrap') {
		showBar = false;
	}

	if (mode === 'hideBar') {
		showBar = false;
	}
	const regionid = 'region' + Id;
	if (Obj.value === undefined || Obj.value.length === 0) {
		Obj.value = Obj['items_val'][0]; //[Obj['items_val'].lenght];//[0];
	}
	if (nu(Obj['items_lid'])) {
		Obj['items_lid'] = Obj['items_val'] + ''; //string value
	}
	let bar_item_class = '';
	let bar_item_active = '';

	if (Obj['items_val'].indexOf(Obj['value']) === -1) {
		Obj['value'] = Obj['items_val'][0];
	}

	/*function TabBarCreate(){
		function TabBar(){
			return
		}
	}*/
	const MetaVar = GetAllMeta(Obj.contentClass);
	const cook_val_name = 'Tab-' + Id + '-value';
	let act_value: string;
	if ((act_value = readCookie(cook_val_name)) === null) {
		act_value = Obj['value'];
		createCookie(cook_val_name, act_value, 0);
	}

	const renderBarLater = u(Obj.pastBar) && Obj.pastBar.length !== 0;
	const barId = 'bar' + Id;
	const showDefault: boolean[] = new Array(Obj['items_val'].length).fill(false);
	showDefault[Obj['items_val'].indexOf(act_value)] = true;

	const TabBase = observer(() => {
		useRef(true);
		const oldValue = useRef(undefined);
		const [getShowReg, setShowReg] = useState<boolean[]>(showDefault);
		const buildPageData = useRef({});

		const HideObj = () => {
			//let start = Date.now();
			if (mode === 'overlay' || mode === 'hideBar') return { display: 'none' };
			else return ShowObj();
			//alert('Hide'+stop-start+'uS');
		};

		const ShowObj = () => {
			//let start = Date.now();
			return {
				display: 'inherit',
				flex: 'inherit',
				flexDirection: 'inherit'
			};
		};

		//{mobXstore.element.doRender(regionid)}
		const genBarListenerId = (Id: string, idx: number) => {
			return Id + 'EventUser' + idx;
		};
		const genBar = (showBar: boolean, enableBar: boolean) => {
			return Obj['items_val'].map((item_val, i) => {
				const tabid = 'tabid_' + item_val;
				let itemName = Obj['items_name'][i];
				const larr = {
					lid: Obj['items_lid'][i],
					name: itemName
				};
				global.api.translateEng.t(larr);
				itemName = larr.name;

				if (enableBar) {
					if (showBar) {
						if (u(cmap.bar_item[i])) {
							bar_item_class = cmap.bar_item[i];
						}
						if (u(cmap.bar_item_active[i])) {
							bar_item_active = cmap.bar_item_active[i];
						}
					}

					const onClick = eventWrapper({
						item_val,
						getShowReg,
						setShowReg,
						arr: Obj,
						barEnable: showBar,
						bar_item_active,
						cook_val_name,
						oldValue,
						MetaVar,
						Id
					});
					if (u(Obj.event) && u(Obj.event.user)) {
						addEventToEventListeners(
							Obj.event.user + '-' + item_val,
							genBarListenerId(Obj.parent, i),
							onClick
						);
					}
					if (showBar) {
						let barClass = bar_item_class;
						if (act_value === item_val) {
							barClass += ` ${bar_item_active} ${bar_item_active}_${item_val}`; //"tab_is_active");
						}

						return (
							<div key={i} className={barClass} id={tabid} onClick={onClick}>
								{itemName}
							</div>
						);
					} else return null;
				}
			});
		};

		let barContainer = null;
		const generatedBar = genBar(showBar, !renderBarLater);
		if (!renderBarLater && showBar) {
			barContainer = (
				<div className={cmap.bar} id={barId}>
					{generatedBar}
				</div>
			);
		}

		const genRegion = (show: boolean[]) => {
			return Obj['items_val'].map((item_val, i) => {
				let rID = regionid + '_div' + i;
				let BODivClass = '';
				if (u(Obj.items_lid) && u(Obj.items_lid[i]) && u(Obj.bid)) {
					BODivClass = Obj.items_lid[i] + Obj.bid;
					rID = regionid + '_' + BODivClass;
				}
				let style;
				if (show[i]) style = ShowObj();
				else style = HideObj();
				return (
					<div key={rID} className={BODivClass} id={rID} style={style}>
						{mobXstore.element.doRender(rID)}
					</div>
				);
			});
		};
		useEffect(() => {
			buildObjOnMount(Obj);
			if (renderBarLater) {
				const renderVar = genBar(showBar, true); //генережка бар, отделенного от тела
				if (renderVar !== null) {
					barContainer = (
						<div key={barId} className={cmap.bar} id={barId}>
							{renderVar}
						</div>
					);
					mobXstore.element.addBlock(Obj.pastBar, barId, barContainer);
				}
			}
			const parent_data = Obj;
			if (parent_data.id === undefined) {
				console.log('parent_data.id===undefined)');
				// eslint-disable-next-line no-debugger
				debugger;
			}

			let brlid: string;
			Obj['items_val'].forEach((item_val: string, i) => {
				let rID = regionid + '_div' + i;
				if (u(Obj.items_lid) && u(Obj.items_lid[i]) && u(Obj.bid)) {
					rID = regionid + '_' + Obj.items_lid[i] + Obj.bid;
				}
				const tpdata = Object.assign({}, parent_data);
				tpdata.id = rID; //parent_data.id + '_nod' + i;

				if (u(Obj['items_lid'][i])) brlid = Obj['items_lid'][i];
				const child_item = Obj['spage'][item_val];
				buildPageData.current = BuildObj(rID, child_item, {
					parent_data: tpdata,
					branch: Obj['items_val'][i],
					branchLid: brlid,
					contentClass: Obj.contentClass
				});

				if (act_value === item_val) {
					MetaVar[Id] = {
						id: Id,
						value: item_val
					};

					//global.cache.tabTree[Obj.parent] = item_val;
					setTabTree(Obj.parent, item_val);
					if (u(Obj.event) && u(Obj.event.user)) {
						sendUserWebEvent('tabChange', {
							switchValue: item_val,
							parent: Obj.parent,
							src: 'click'
						});
					}
				}
			});

			return () => {
				deleteBuildedObj(buildPageData.current);
				buildObjOnUmount(Obj);
				if (u(Obj.event) && u(Obj.event.user)) {
					Obj['items_val'].forEach((item_val, i: number) => {
						removeEventFromEventListeners(genBarListenerId(Obj.parent, i));
					});
				}
			};
		}, []);

		//firstRun.current = false;
		return (
			<div className={genBidForDNK(Obj)} id={blockId}>
				<div className={cmap.main} id={Id}>
					{barContainer}
					<div className={cmap.bar_region} id={regionid}>
						{genRegion(getShowReg)}
					</div>
				</div>
			</div>
		);
	});

	return <TabBase key={blockId} />;
}

function tabCreateBase({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id + '_gen';
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: tabBaseElement(blockId, { Id, Obj })
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function tabDebug(Obj: any): JSX.Element {
	const blockId = Obj.id + '_gen';
	return tabBaseElement(blockId, { Id: Obj.id, Obj });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const tabCreate = (PastTo: string, Id: string, Obj: any) => {
	return tabCreateBase({ PastTo, Id, Obj });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const wrapTabCreate = (PastTo: string, Id: string, Obj: any) => {
	Obj['mode'] = 'wrap';
	tabCreate(PastTo, Id, Obj);
};

export default {
	stdTab: {
		create: tabCreate,
		test: tabDebug
	},
	wrapTab: {
		create: wrapTabCreate
	}
};
