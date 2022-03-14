/**
 * Created by i7 on 21.01.2018.
 */

import { addExampleFormat } from '../../../../engine/___global.js';
import { AddEventWrapper, cleanupEventWrapper } from '../../../../engine/event';
import { PastControllerReact } from '../../../../engine/_pastController';
import { useEffect, useRef } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import * as React from 'react';
import { stylizeInsideElement } from '../../../../engine/stylize';
import { Chart } from 'chart.js';
import { createElement, elementObjParam } from '../componentType';

addExampleFormat('createGraphBarLine', {
	type: 'graph_bar',
	name: 'CPU load (%)',
	id: 'cpustat',
	style: 'horizontalBar',
	xname: 'Load',
	yname: 'Cpu',
	xscale: 100,
	rvalue: JSON.stringify({
		iface: '',
		req: 'sarcpu',
		req_t: 0,
		name: ['Average'],
		value: ['allload']
	})
});

addExampleFormat('createGraphBarLine', {
	type: 'graph_line',
	name: 'Net speed',
	id: 'netstat',
	style: 'line',
	xname: 'Time',
	yname: 'kb/s (rx+tx)',
	points: 30,
	rvalue: '{"iface":"","req":"sarnet","req_t":0,"name":["ETH0"],"value":["eth0spd"]}'
});

interface graphInter {
	graph: any;
	config: any;
}

function Graph_CreateLine(canvasRef: any, Obj: any): graphInter {
	const ctx = canvasRef.current.getContext('2d');

	const config: any = {
		type: Obj.style,
		data: {
			datasets: []
		},
		options: {
			responsive: true,
			title: {
				display: true,
				text: Obj.name
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [
					{
						display: true,
						scaleLabel: {
							display: true,
							labelString: Obj.xname
						}
					}
				],
				yAxes: [
					{
						display: true,
						scaleLabel: {
							display: true,
							labelString: Obj.yname
						}
					}
				]
			}
		}
	};

	const LineChart = new Chart(ctx, config);
	return { graph: LineChart, config: config };
}

function Graph_CreateBar(canvasRef: any, Obj: any): graphInter {
	const ctx = canvasRef.current.getContext('2d');

	const config: any = {
		type: 'horizontalBar',
		data: {
			datasets: [],
			labels: []
		},
		options: {
			maintainAspectRatio: false,
			responsive: true,
			legend: {
				// position: 'right',
			},
			title: {
				display: true,
				text: Obj.name
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [
					{
						display: true,
						barThickness: 10,
						ticks: {
							beginAtZero: true,
							mirror: true
						}
					}
				],
				yAxes: [
					{
						display: true,
						ticks: {
							beginAtZero: true,
							mirror: true
						}
					}
				]
			}
		}
	};

	const BarChart = new Chart(ctx, config);
	return { graph: BarChart, config: config };
}

function getRandomColor(): string {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function Graph_AddNewDataset(graph: graphInter, dsetname: string, color: string) {
	if (color === undefined) color = getRandomColor();

	type dataset = {
		label: string;
		backgroundColor: string;
		borderColor: string;
		data: any;
		fill: boolean;
		uname: string;
	};
	const new_dataset: dataset = {
		label: dsetname,
		backgroundColor: color,
		borderColor: color,
		data: [],
		fill: false,
		uname: dsetname
	};
	graph.graph.config.data.datasets.push(new_dataset);
}
function Graph_AdmDatasetLine(
	graph: graphInter,
	dsetname: string,
	event: any,
	Obj: any,
	usname: string
) {
	let cnt = 0;
	for (let n = 0; n < graph.config.data.datasets.length; n++) {
		if (graph.config.data.datasets[n].uname === usname) {
			cnt++;
			if (typeof graph.config.data.datasets[n].data == 'undefined')
				graph.config.data.datasets[n].data = [];

			graph.config.data.datasets[n].data.push(event[dsetname]);
			if (graph.config.data.datasets[n].data.length > Obj.points)
				graph.config.data.datasets[n].data.shift();
		}
	}

	if (cnt === 0) {
		Graph_AddNewDataset(graph, usname, undefined);
		const last = graph.config.data.datasets.length - 1;
		graph.config.data['labels'] = [];
		for (let r = 0; r < Obj.points; r++) graph.config.data.labels.push('');

		graph.config.data.datasets[last].data.push(event[dsetname]);
	}
}

function createGraphBarElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	const defClass = {
		main: 'graphBaseBarLine graphBaseBarLine' + Id,
		canvas: 'graphBaseLineCanvas'
	};

	const classMap = stylizeInsideElement(Obj.stylize, Obj.value, defClass).class_map;
	function GraphBarElement() {
		const graph = useRef<graphInter>({ graph: {}, config: {} });
		const canvasRef = useRef(null);
		useEffect(() => {
			buildObjOnMount(Obj);
			graph.current = Graph_CreateBar(canvasRef, Obj);
			if (Obj.style === 'horizontalBarStacked')
				graph.current.config.options.scales.yAxes[0].stacked = true;

			const rvalueUse = Obj.rvalue ?? false;
			if (rvalueUse) {
				const json = JSON.parse(Obj.rvalue);
				let n = 0;
				for (const jName in json.name) {
					if (Obj.colors !== undefined && Obj.colors[n] !== undefined)
						Graph_AddNewDataset(graph.current, json.name[jName], Obj.colors[n]);
					else Graph_AddNewDataset(graph.current, json.name[jName], undefined);
					n++;
					graph.current.config.data.datasets[jName].data.push(0);
				}
				if (Obj.yscale !== undefined) {
					graph.current.config.options.scales.yAxes[0].ticks['max'] = Obj.yscale;
				}
				if (Obj.xscale !== undefined) {
					graph.current.config.options.scales.xAxes[0].ticks['max'] = Obj.xscale;
				}
				graph.current.graph.update();
				AddEventWrapper(
					json,
					function (event: any) {
						console.log('graph ', graph.current);
						let n = 0;
						let val;
						for (const pos in json.value) {
							if (event[json.value[pos]] !== undefined) {
								val = event[json.value[pos]];
								val = val === 0 ? '0.1' : val;
								graph.current.config.data.datasets[n].data[0] = event[json.value[pos]];
								n++;
							}
						}
						graph.current.graph.update();
					},
					Id
				);
			}
			return () => {
				buildObjOnUmount(Obj);
				cleanupEventWrapper(Id);
			};
		});
		return (
			<div className={classMap.main} id={blockId}>
				<canvas ref={canvasRef} className={classMap.canvas} id={Id} />
			</div>
		);
	}
	return <GraphBarElement key={blockId} />;
}

function createGraphLineElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	const defClass = {
		main: 'graphBaseBarLine graphBaseBarLine' + Id,
		canvas: 'graphBaseLineCanvas'
	};

	const classMap = stylizeInsideElement(Obj.stylize, Obj.value, defClass).class_map;
	function GraphLineElement() {
		const graph = useRef<graphInter>({ graph: {}, config: {} });
		const Graph_AdmDataset = useRef(null);
		const canvasRef = useRef(null);
		useEffect(() => {
			buildObjOnMount(Obj);
			graph.current = Graph_CreateLine(canvasRef, Obj);
			Graph_AdmDataset.current = Graph_AdmDatasetLine;
			const rvalueUse = Obj.rvalue ?? false;
			if (rvalueUse) {
				const json = JSON.parse(Obj.rvalue);
				AddEventWrapper(
					json,
					function (event: [any]) {
						if (json.value.length === 0) {
							for (const z in event) {
								Graph_AdmDataset.current(graph.current, z, event, Obj, json.name[z]);
							}
						} else {
							for (let k = 0; k < json.value.length; k++) {
								Graph_AdmDataset.current(graph.current, json.value[k], event, Obj, json.name[k]);
							}
						}
						graph.current.graph.update();
					},
					Id
				);
			}
			return () => {
				buildObjOnUmount(Obj);
				cleanupEventWrapper(Id);
			};
		}, []);
		return (
			<div className={classMap.main} id={blockId}>
				<canvas ref={canvasRef} className={classMap.canvas} id={Id} />
			</div>
		);
	}
	return <GraphLineElement key={blockId} />;
}
function createGraphBarLine({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;

	const graphElement = Obj.style === 'line' ? createGraphLineElement : createGraphBarElement;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: graphElement(blockId, { PastTo, Id, Obj })
	});
	return blockId;
}

function createGraphBarLineReact(Obj: elementObjParam) {
	const blockId = Obj.id;
	const graphElement = Obj.style === 'line' ? createGraphLineElement : createGraphBarElement;
	return graphElement(blockId, { Id: Obj.id, Obj });
}

const graphBarLine = (PastTo: string, Id: string, Obj: elementObjParam) => {
	return createGraphBarLine({ PastTo, Id, Obj });
};

export default {
	graphBase: {
		create: graphBarLine,
		test: createGraphBarLineReact
	}
};
