/**
 * Created by Ilya on 18.12.2019.
 */

import { addExampleFormat, mobXstore } from '../../../../engine/___global.js';
import { u } from '../../../../engine/_core';
import { PastControllerReact } from '../../../../engine/_pastController';
import * as React from 'react';
import { useEffect } from 'react';
import { observer } from 'mobx-react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { createElement } from '../componentType';

addExampleFormat('plainLayout', {
	id: 'viewl',
	name: 'layout',
	type: 'plainlayout',
	params: {
		cols: [10, 20, 50],
		rows: [50, 50]
	},
	past: {
		type: 'insertBefore',
		jq: '.page-content'
	}
});

function createLayout({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;
	if (!u(Obj.params) || !u(Obj.params.rows) || !u(Obj.params.cols)) return blockId;
	const defClass = {
		main: 'plainlayout',
		row: 'plainlayout_div_row',
		col: 'plainlayout_div_col'
	};
	const classMap = stylizeInsideElement(Obj.stylize, Obj.value, defClass).class_map;
	const Layout = observer(() => {
		useEffect(() => {
			buildObjOnMount(Obj);
			return () => {
				buildObjOnUmount(Obj);
			};
		});
		return (
			<div className={classMap.main} id={Id}>
				{Obj.params.rows.map((row: string, rowIdx: number) => {
					const rGid = Id + rowIdx;
					return (
						<div
							key={rGid}
							id={rGid}
							className={`${rGid} ${classMap.row}`}
							style={{ flexBasis: row + '%' }}
						>
							{Obj.params.cols.map((col: string, colIdx: number) => {
								const gid = Id + '_col' + colIdx + '_row' + rowIdx;
								return (
									<div
										id={gid}
										key={gid}
										className={`${gid}  ${classMap.col}`}
										style={{ flexBasis: col + '%' }}
									>
										{mobXstore.element.doRender(gid)}
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		);
	});
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: <Layout key={blockId} />
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: string, Id: string, Obj: any) => {
	return createLayout({ PastTo, Id, Obj });
};
export default {
	layoutBase: {
		create: create
	}
};
