import { global, mobXstore } from '../../../../engine/___global.js';
import { runui } from '../../../../engine/_util';
import { cValueController, svalueController, valueController } from '../../../../engine/var';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import { PastControllerReact } from '../../../../engine/_pastController';

//import { createElement } from '../componentType';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { t } from '../../../../engine/_core';
import { clearMetaTable } from '../../../../engine/_metaVar';

import { observer } from 'mobx-react';
import { useForceUpdate } from '../../../../engine/sharedReactHook';
import { buildObjOnMount, buildObjOnUmount, deleteBuildedObj } from '../../../../engine/_buildEng';
import { createElement } from '../componentType';

const Context = React.createContext({});

interface provider {
	rowCount?: number;
	rowMap?: any;
	showRm?: any;
	setShowRm?: any;
	setRowMap?: any;
	Id?: string;
	value?: any;
	contentClass?: string;
	forceUpdate?: any;
	setRowCount?: any;
	tableMode?: boolean;
	classMap?: any;
}

function RemoveRow(prop: any) {
	const row = prop.row;
	const show = prop.show;

	const { rowCount, rowMap, setRowMap, Id, value, contentClass, tableMode, classMap } =
		useContext<provider>(Context);

	const removeRow = () => {
		if (rowCount > 0) {
			value.current[row] = undefined;
			const rowMapNew = [...rowMap];
			rowMapNew[row] = false;
			setRowMap(rowMapNew);
			global.api.storagesEng.detActionsOnInput();
			clearMetaTable({ contentClass, Id, row });
		}
	};

	const style: { display: string } = {
		display: undefined
	};
	if (!show) style.display = 'none';
	if (tableMode)
		return (
			<td className={classMap.current.rowRemoveMain}>
				<div className={classMap.current.rowRemoveItem} style={style} onClick={removeRow}>
					{/*<ControlPointIcon />*/}
				</div>
			</td>
		);
	else
		return (
			<div className={classMap.current.rowRemoveMain}>
				<div className={classMap.current.rowRemoveItem} style={style} onClick={removeRow}>
					{/*<ControlPointIcon />*/}
				</div>
			</div>
		);
}

interface inputEventInter {
	layout: any;
	contentClass: string;
	items: any;
	blockId: string;
	Id: string;
	tableMode: boolean;
}

function inputEvent(
	valueArray: any,
	rowIdx: number,
	buildPageData: any,
	{ layout, contentClass, items, blockId, Id, tableMode }: inputEventInter
) {
	let layoutRow = 0;
	let layoutCol = 0;
	//if (valueArray === undefined) return;
	valueArray.forEach((value: any, vid: number) => {
		const element: any = { ...items[vid] };
		element.value = value;
		if (!tableMode) global.api.translateEng.t(element);
		else element.name = '';

		element.contentClass = contentClass;
		element.table = {
			tabId: Id,
			row: rowIdx,
			col: vid
		};
		cValueController(element); //переопределение value константой cvalue
		valueController(element, contentClass); //действия если не задан value
		svalueController(element);
		const elemId = blockId + 'r' + rowIdx + 'e' + vid;
		element.id = elemId;

		if (layout[layoutRow][layoutCol] === undefined) {
			layoutRow++;
			layoutCol = 0;
		}
		const style = tableMode ? {} : { flex: '1 0 ' + layout[layoutRow][layoutCol] + '%' };

		element.past = {
			wrap: {
				Id: element.id + 'Wrap',
				style: style,
				tag: tableMode ? 'td' : 'div'
			}
		};
		layoutCol++;
		const rowPastToId = blockId + 'r' + rowIdx + 'i' + layoutRow;
		const childId = runui(element.type, rowPastToId, elemId, element);
		buildPageData.current[childId] = rowPastToId;
		//});
	});
}

function TableRow(prop: any) {
	const rowView = [];
	const edit = prop.edit;
	const blockId = prop.blockId;
	const layout = prop.layout;

	const { rowCount, rowMap, showRm, tableMode, classMap } = useContext<provider>(Context);

	if (tableMode) {
		const render = [];
		for (let row = 0; row < rowCount; row++) {
			if (rowMap[row]) {
				//layout.forEach((step, idx) => {
				//let row = 0;
				render.push(
					<tr key={blockId + row + 'DataRow' + '0'} className={classMap.current.rowItem}>
						{mobXstore.element.doRender(blockId + 'r' + row + 'i' + '0')}
						{edit && <RemoveRow row={row} show={showRm[row]} />}
					</tr>
				);
				//});
			}
		}
		return <tbody>{render}</tbody>;
	} else {
		for (let row = 0; row < rowCount; row++) {
			const render: any = [];
			if (rowMap[row]) {
				layout.forEach((step: any, idx: number) => {
					render.push(
						<div key={blockId + row + 'DataRow' + idx} className={classMap.current.rowItem}>
							{mobXstore.element.doRender(blockId + 'r' + row + 'i' + idx)}
						</div>
					);
				});
				rowView.push(
					<div key={blockId + row + 'RowD'} className={classMap.current.rowMain}>
						<div
							key={blockId + row + 'RowI'}
							style={{ display: 'flex', flexDirection: 'column' }}
							className={classMap.current.rowMainItem}
						>
							{render}
						</div>
						{edit && <RemoveRow row={row} show={showRm[row]} />}
					</div>
				);
			} else rowView.push(undefined);
		}
		return <div>{rowView}</div>;
	}
}

function TableHeader(prop: any) {
	const { Id, tableMode, classMap } = useContext<provider>(Context);
	const header = prop.header;
	const layout = prop.layout;
	const edit = prop.edit;
	const addCallback = prop.addCallback;
	if (header.length !== 0) {
		let editAddView;

		if (tableMode) {
			if (edit) {
				editAddView = (
					<th className={classMap.current.headerAdd} onClick={addCallback}>
						{/*<ControlPointIcon />*/}
					</th>
				);
			}
			return (
				<thead className={classMap.current.header}>
					<tr className={classMap.current.headerColMain}>
						{layout[0].map((col: any, colIdx: number) => {
							const style = {
								//flex: '1 0 ' + layout[0][colIdx] + '%'
								//flexGrow: layout[0][col],
							};
							return (
								<th
									key={Id + 'HdrCol' + colIdx}
									className={classMap.current.headerColItem}
									style={style}
								>
									{t(header[colIdx])}
								</th>
							);
						})}
						{editAddView}
					</tr>
				</thead>
			);
		} else {
			if (edit) {
				editAddView = (
					<div className={classMap.current.headerAdd} onClick={addCallback}>
						{/*<ControlPointIcon />*/}
					</div>
				);
			}
			return (
				<div className={classMap.current.header}>
					<div className={classMap.current.headerColMain}>
						{layout[0].map((col: any, colIdx: number) => {
							const style = {
								flex: '1 0 ' + layout[0][colIdx] + '%'
								//flexGrow: layout[0][col],
							};
							return (
								<div
									key={Id + 'HdrCol' + colIdx}
									className={classMap.current.headerColItem}
									style={style}
								>
									{t(header[colIdx])}
								</div>
							);
						})}
					</div>
					{editAddView}
				</div>
			);
		}
	} else return undefined;
}

function getClassMap(tableMode: boolean, Obj: any) {
	const defClassTable = {
		wrapper: 'tableWrapper',
		main: 'tableMain',
		description: 'tableDesc',
		descriptionItem: 'tableDescItem',
		header: 'tableHeaderMain',
		headerColMain: 'tableHeaderColBlock',
		headerColItem: 'tableHeaderColItem',
		headerAdd: 'multiformHeaderAdd',
		rowItem: 'tableRowData',
		rowRemoveMain: 'multiformHeaderRmMain',
		rowRemoveItem: 'multiformHeaderRm'
	};
	const defClassMultiform = {
		wrapper: 'multiformWrapper',
		main: 'multiformMain',
		description: 'multiformDesc',
		descriptionItem: 'multiformDescItem',
		header: 'multiformHeaderMain',
		headerColMain: 'multiformHeaderColBlock',
		headerColItem: 'multiformHeaderColItem',
		headerAdd: 'multiformHeaderAdd',
		rowMain: 'multiformRowDMain',
		rowMainItem: 'multiformRowMain',
		rowItem: 'multiformRowData',
		rowRemoveMain: 'multiformHeaderRmMain',
		rowRemoveItem: 'multiformHeaderRm'
	};
	return stylizeInsideElement(
		Obj.stylize,
		Obj.value,
		tableMode ? defClassTable : defClassMultiform
	);
}

function multiformCreate({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;

	const option = Obj.option ?? {
		direction: 'column'
	};
	const defValue = option.default;
	//let wrap = Obj.wrap;
	let initValue: any;

	const items = Obj.items;
	const layout = option.map ?? [[]];
	let header = option.header ?? [];
	const edit = option.edit ?? false;
	let tableMode = false;
	if (items === undefined) {
		alert('Multiform error,  not found items');
	}

	if (Obj.value === undefined || Obj.value.length === 0) {
		initValue = [];
	} else {
		initValue = Obj.value;
	}

	if (layout.length === 1) {
		tableMode = true;
	} else {
		header = [''];
	}

	if (layout[0].length === 0) {
		let len: number;
		if (tableMode) {
			len = 100 / header.length;
			header.forEach(() => {
				layout[0].push(len);
			});
		} else {
			len = 100 / initValue[0].length;
			initValue[0].forEach(() => {
				layout[0].push(len);
			});
		}
	}

	const contentClass = Obj.contentClass;

	const rowMapDef: any = [];
	initValue.forEach((val: any) => {
		if (val !== undefined) {
			rowMapDef.push(true);
		} else rowMapDef.push(false);
	});
	const initRowCount = initValue.length;

	const scProp = getClassMap(tableMode, Obj);

	const Multiform = observer(() => {
		const value = useRef([...initValue]);
		const classMap = useRef({ ...scProp.class_map });
		const firstRender = useRef(true);
		const [rowCount, setRowCount] = useState(initRowCount);
		const [rowMap, setRowMap] = useState(rowMapDef);
		const [showRm, setShowRm] = useState(rowMapDef);
		const forceUpdate = useForceUpdate();
		const buildPageData = useRef({});
		//let rowView = [];

		useEffect(() => {
			buildObjOnMount(Obj);
			value.current.forEach((valueArray, rowIdx) => {
				if (rowMap[rowIdx]) {
					return inputEvent(valueArray, rowIdx, buildPageData, {
						blockId,
						Id,
						layout,
						contentClass,
						items,
						tableMode
					});
				}
			});
			forceUpdate();
			return () => {
				deleteBuildedObj(buildPageData.current);
				buildObjOnUmount(Obj);
			};
		}, []);
		useEffect(() => {
			//inputEvent(value);
			if (!firstRender.current) {
				let newRowValue;
				if (value.current.length !== 0) {
					newRowValue = value.current.reverse().find((value) => {
						return value ?? false;
					});
				}
				newRowValue = newRowValue ?? defValue; //initValue[0];
				value.current.push(newRowValue);
				inputEvent(newRowValue, rowMap.length - 1, buildPageData, {
					blockId,
					Id,
					layout,
					contentClass,
					items,
					tableMode
				});
				const newShowRm = [...showRm];
				newShowRm[newShowRm.length - 1] = true;
				setShowRm(newShowRm);
				//forceUpdate();
			} else firstRender.current = false;
		}, [rowCount]);

		const addCallback = () => {
			//rowMap.push(true);
			setRowCount(rowCount + 1);
			const newRowMap = [...rowMap];
			newRowMap.push(true);
			setRowMap(newRowMap);
			const newShowRm = [...showRm]; //Механизм отображения значка удал. строки. Эта муть для отображения значка после отображения строки, а не до.
			newShowRm.push(false);
			setShowRm(newShowRm);
		};
		//useEffect(() => {
		//	inputEvent(value);
		//}, [rowCount]);

		let dataView;
		if (tableMode) {
			dataView = (
				<table className={classMap.current.main} id={blockId}>
					<TableHeader header={header} layout={layout} edit={edit} addCallback={addCallback} />
					<TableRow blockId={blockId} layout={layout} edit={edit} />
				</table>
			);
		} else {
			dataView = (
				<div className={classMap.current.main} id={blockId}>
					<TableHeader header={header} layout={layout} edit={edit} addCallback={addCallback} />
					<TableRow blockId={blockId} layout={layout} edit={edit} />
				</div>
			);
		}
		const tableView = (
			<Context.Provider
				value={{
					rowCount,
					rowMap,
					showRm,
					setShowRm,
					setRowMap,
					Id,
					value,
					contentClass,
					forceUpdate,
					setRowCount,
					tableMode,
					classMap
				}}
			>
				{dataView}
			</Context.Provider>
		);
		let mainView;
		if (Obj.name !== undefined && Obj.name.length > 0) {
			mainView = (
				<div className={classMap.current.wrapper}>
					<div className={classMap.current.description}>
						<div className={classMap.current.descriptionItem}>{Obj.name}</div>
					</div>
					{tableView}
				</div>
			);
		} else mainView = tableView;

		return mainView;
	});
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <Multiform key={blockId} />
	});

	return blockId;
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createMulti = (PastTo: string, Id: string, Obj: any) => {
	return multiformCreate({ PastTo, Id, Obj });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createTable = (PastTo: string, Id: string, Obj: any) => {
	return createMulti(PastTo, Id, Obj); //for obsolete compatible
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createObsoleteTable = (PastTo: string, Id: string, Obj: any) => {
	const defValue = [];
	for (const item in Obj.jvalue.obj) {
		defValue.push(Obj.jvalue.obj[item].value);
	}
	const convObj = {
		type: Obj.type,
		name: Obj.name,
		id: Obj.id,
		value: Obj.value,
		contentClass: Obj.contentClass,
		option: {
			header: Obj.tabh,
			edit: Obj.edit,
			default: defValue
		},
		items: Obj.jvalue.obj
	};
	return multiformCreate({ PastTo, Id, Obj: convObj });
};

export default {
	multiFormBase: {
		create: createMulti
	},
	tableBase: {
		create: createTable
	},
	tableObsolete: {
		create: createObsoleteTable
	}
};
