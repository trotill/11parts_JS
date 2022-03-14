/**
 * Created by i7 on 21.04.2020.
 */

import { addExampleFormat, MetaVar } from '../../../../engine/___global.js';
import { SetMetaSeoc, SetMeta } from '../../../../engine/_metaVar';
import {
	emitEvent,
	removeEventFromEventListeners,
	addEventToEventListeners
} from '../../../../engine/event';

import { nu, u, t } from '../../../../engine/_core';

import { PastControllerReact } from '../../../../engine/_pastController';

import { stylizeInsideElement } from '../../../../engine/stylize';
import { svalueController } from '../../../../engine/var';
import { runRegistered } from '../../../../engine/registerUI';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Chart from 'chart.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import moment from 'moment';

import { useEffect, useRef } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import * as React from 'react';
import { createElement } from '../componentType';

addExampleFormat('dgraph', {
	id: 'rt_sensors',
	type: 'dgraph',
	name: 'RT Sensors',
	value: [1, 2, 3], //обязательный параметр, может быть пустой. Если есть значения инитит график значениями
	stylize: {
		items_limit: 1000, //необязательный параметр, только для eventFromUI. Если он отстутсвует или 0, то панель используется только для статичных данных с фикс. кол. элементов
		link: {
			//линковка графиков к компоненту. Если отстутвует или совпадает с ID, то это главный комп., ось X
			relate: 'y_sga_sql_demo_conc_graph_ts' //
		},
		show_as: 'vbar',
		color: 'red', //необязательный параметр, если нет то рандомно генерится
		conf: {
			//необязательный параметр, коллбеки для стилей графиков, init генерит главный конфиг, dataset генерит конфиг датасет
			init: 'GraphInitConf', //grp_type,id
			dataset: 'GraphDataSet' //evtarg,data,id
		}
	}
});

const gen_default_init_cfg = (cjs: number, grp_type: string) => {
	const v29: any = {
		type: grp_type,
		data: {
			// labels:[],
			datasets: []
		},
		options: {
			responsive: true,
			title: {
				display: true,
				text: '' //Obj.name
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [
					{
						type: 'time',
						display: true,
						distribution: 'linear',
						time: {
							minUnit: 'second',
							parser: 'MM/DD/YYYY HH:mm',
							tooltipFormat: 'l, LTS',
							displayFormats: {
								second: 'll HH:mm:ss',
								millisecond: 'll HH:mm:ss',
								minute: 'll HH:mm',
								hour: 'll HH',
								day: 'll',
								week: 'll',
								month: 'MMM YYYY',
								quarter: 'MMM YYYY',
								year: 'YYYY'
							}
						},
						scaleLabel: {
							display: true,
							labelString: 'Date'
						}
					}
				],
				yAxes: [
					{
						ticks: {
							beginAtZero: true
						}
					}
				]
			},
			plugins: {
				zoom: {
					pan: {
						enabled: true,
						mode: 'xy'
					},
					zoom: {
						enabled: true,
						mode: 'x'
					}
				}
			}
		}
	};
	const v30: any = {
		type: grp_type,
		data: {
			labels: [],
			datasets: []
		},
		options: {
			responsive: true,
			title: {
				text: '' //Obj.name
			},
			scales: {
				x: {
					type: 'time',
					display: true,
					distribution: 'linear',
					time: {
						//unit: 'minute',
						// round:true,
						//bounds:'ticks',
						minUnit: 'second',
						parser: 'YYYY',
						tooltipFormat: 'l, LTS',
						displayFormats: {
							quarter: 'MMM YYYY'
						}
					},
					scaleLabel: {
						display: true,
						labelString: 'Date'
					},
					ticks: {
						major: {
							enabled: true
						},
						fontStyle: function (context: any) {
							return context.tick && context.tick.major ? 'bold' : undefined;
						},
						fontColor: function (context: any) {
							return context.tick && context.tick.major ? '#FF0000' : undefined;
						}
					}
				},
				y: {
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'value'
					}
				}
			}
		}
	};
	if (cjs >= 3) return v30;
	else return v29;
};
const gen_default_dataset_cfg = (evtArg: any, data: any) => {
	return {
		label: evtArg.dsetname,
		backgroundColor: evtArg.color,
		borderColor: evtArg.color,
		data: data,
		fill: false,
		//categoryPercentage:1,
		// barPercentage: 1,
		barThickness: 10,
		//maxBarThickness: 100,
		//minBarLength: 10,
		uname: evtArg.dsetname
	};
};

function getRandomColor() {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function dnkGraphElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	const defClass = {
		main: 'dnk-graph_main',
		global: 'dnk_main_global',
		wrap0: '',
		wrap1: ''
	};

	let grp_chart: any = {};
	const datasets = [];
	let ctx = {};
	let xData: any;
	let config: any = {
		data: undefined
	};
	const contentClass = Obj.contentClass;
	const datasetId: any[] = [];
	const conf: any = {
		init: undefined,
		dataset: undefined
	};

	const cjs = 2.9;
	let value: any;

	if (Array.isArray(Obj.value)) value = Obj.value;
	else value[0] = Obj.value;

	if (u(Obj.evalue) && Array.isArray(Obj.evalue)) {
		value = Obj.evalue;
	}

	let grp_type = 'line';

	let base = false;
	let relate: string;
	let evt_id: string;
	let color: string;
	SetMetaSeoc(Id, 1, contentClass);
	if (u(Obj.stylize)) {
		if (u(Obj.stylize.conf)) {
			conf.init = runRegistered('dnk_root', 'getCallback', Obj.stylize.conf.init);
			if (conf.init === undefined) alert(`Undefined callback graph dnk ${Obj.stylize.conf.init}`);

			conf.dataset = runRegistered('dnk_root', 'getCallback', Obj.stylize.conf.dataset);
		}
		if (u(Obj.stylize.show_as)) {
			if (Obj.stylize.show_as === 'vline') grp_type = 'line';
			if (Obj.stylize.show_as === 'vbar') grp_type = 'bar';
		}
		if (u(Obj.stylize.link)) {
			if (u(Obj.stylize.color)) {
				color = Obj.stylize.color;
			}
			if (u(Obj.stylize.link.base)) {
				base = true;
				relate = Obj.stylize.link.base;
			}

			if (u(Obj.stylize.link.relate)) {
				relate = Obj.stylize.link.relate;
				if (relate === Id) base = true;
				else {
					const ls = Id.lastIndexOf('_');
					const pstr = Id.substring(0, ls);
					if (relate === 'auto') {
						relate = pstr + '_grpTs';
					} else {
						relate = pstr + '_' + relate;
					}
				}
			} else {
				base = true;
			}
		} else {
			base = true;
		}
	}

	const configure = (ctx: any) => {
		if (u(conf.init)) config = conf.init(grp_type, Id);
		else config = gen_default_init_cfg(cjs, grp_type);
		//new Chart(ctx, config);
		return new Chart(ctx, config);
	};

	const draw = (evtArg: any, xdata: any) => {
		//dsetname,color,ydata
		const data: any[] = [];
		let limit = evtArg.limit;
		if (limit === undefined) limit = 1000;

		if (evtArg.cmd === 'rstzoom') {
			grp_chart.resetZoom();
			return;
		}
		if (evtArg.cmd === 'init' || evtArg.cmd === 'add') {
			if (evtArg.cmd === 'init') {
				if (evtArg.color === undefined) evtArg.color = getRandomColor();
			}

			if (evtArg.ydata === undefined) evtArg.ydata = [];

			if (evtArg.ydata.length !== xdata.length) return;

			let idx = 0;
			if ((idx = datasetId.indexOf(evtArg.id)) === -1) {
				datasetId.push(evtArg.id);

				xdata.forEach((item: any, idx: number) => {
					if (idx > limit) data.shift();

					data.push({
						x: moment(item, 'X'), //item,
						y: evtArg.ydata[idx]
					});
				});

				let new_dataset;
				if (u(conf.dataset)) new_dataset = conf.dataset(evtArg, data, evtArg.id);
				else new_dataset = gen_default_dataset_cfg(evtArg, data);
				if (new_dataset !== undefined) {
					datasets.push(new_dataset);
					config.data.datasets.push(new_dataset);
				}
			} else {
				if (nu(config.data.datasets[idx])) return;
				const tot_sz = config.data.datasets[idx].data.length;
				if (tot_sz + xdata.length > limit) {
					config.data.datasets[idx].data.splice(0, tot_sz + xdata.length - limit);
				}
				xdata.forEach((item: any, i: number) => {
					config.data.datasets[idx].data.push({
						x: moment(item, 'X'), //item,
						y: evtArg.ydata[i]
					});
				});
			}
		}
		if (evtArg.cmd === 'clear') {
			let idx = 0;
			if ((idx = datasetId.indexOf(evtArg.id)) >= 0) {
				config.data.datasets[idx].data = [];
			}
		}

		grp_chart.update();
	};

	if (Obj.rvalue) {
		addEventToEventListeners(Id, Id, (evtArg: any) => {
			let val = evtArg.val;
			const sv = svalueController({
				value: val,
				svalue: Obj.svalue
			});
			if (u(sv.evalue) && sv.evalue.length > 0) {
				val = sv.evalue;
			}

			if (base) {
				xData = val;
			} else {
				const tid = Obj.lid ?? Obj.id;
				const cmd = 'add';
				emitEvent(evt_id, {
					color: color,
					dsetname: t(tid),
					ydata: val,
					id: Id,
					cmd: cmd,
					limit: Obj.stylize.items_limit
				});
			}
		});
	}

	if (base) {
		const scProp = stylizeInsideElement(Obj.stylize, Obj.value, defClass);
		const grID = 'graph' + Id;
		const grWrapID1 = 'wrap0' + grID;
		const grWrapID2 = 'wrap1' + grID;
		const DnkGraph = () => {
			const canvas = useRef<HTMLCanvasElement>(null);
			useEffect(() => {
				buildObjOnMount(Obj);

				ctx = canvas.current.getContext('2d');
				grp_chart = configure(ctx);

				if (relate === undefined) evt_id = Id + '_graph';
				else evt_id = relate + '_graph';

				xData = value;

				addEventToEventListeners(evt_id, evt_id, (evtArg: any) => {
					draw(evtArg, xData);
				});

				return () => {
					buildObjOnUmount(Obj);
					if (base) {
						removeEventFromEventListeners(evt_id);
					}
					removeEventFromEventListeners(Id);
				};
			}, []);
			return (
				<div id={grID} className={scProp.class_map.main + ' ' + scProp.class_map.global}>
					<div className={scProp.class_map.wrap0} id={grWrapID1}>
						<div className={scProp.class_map.wrap1} id={grWrapID2}>
							<canvas ref={canvas} id={Id} />
						</div>
					</div>
				</div>
			);
		};
		return <DnkGraph key={Id} />;
	} else {
		evt_id = relate + '_graph';
		let tid = Obj.id;
		if (u(Obj.lid)) tid = Obj.lid;
		//let tz;
		//if (u(Obj.stylize.rvalue_tz)) tz = eval(Obj.stylize.rvalue_tz);
		emitEvent(evt_id, {
			color: color,
			dsetname: t(tid),
			ydata: value,
			id: Id,
			cmd: 'init',
			limit: Obj.stylize.items_limit
		});
		return null;
	}
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const clear = (cols: string[], contentClass: string) => {
	const ClearGraph = (varName: string) => {
		//MetaVar=GetAllMeta(contentClass);
		//MetaVar[contentClass][varname].value = [];
		SetMeta({ id: varName, value: [] }, contentClass);
		const evt_id = cols[0] + '_graph';
		emitEvent(evt_id, {
			id: varName,
			cmd: 'clear'
		});
	};
	cols.forEach((item) => {
		ClearGraph(item);
	});
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const reset_zoom = (Xid: string) => {
	const evt_id = Xid + '_graph';
	emitEvent(evt_id, {
		cmd: 'rstzoom'
	});
};

function dnkGraphCreateBase({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: dnkGraphElement(blockId, { Id, Obj })
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function dnkGraphDebug(Obj: any): JSX.Element {
	const blockId = Obj.id;
	return dnkGraphElement(blockId, { Id: Obj.id, Obj });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const dnkGraphCreate = (PastTo: string, Id: string, Obj: any) => {
	return dnkGraphCreateBase({ PastTo, Id, Obj });
};

export default {
	dnkGraph: {
		//create:create,
		create: dnkGraphCreate,
		test: dnkGraphDebug,
		reset_zoom: reset_zoom,
		clear: clear
	}
};
