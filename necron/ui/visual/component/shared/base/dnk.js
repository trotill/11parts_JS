/**
 * Created by Ilya on 16.12.2019.
 */
import { addExampleFormat, global, MetaVar, mobXstore } from '../../../../engine/___global.js';
import { SetMetaForce } from '../../../../engine/_metaVar';
import {
	addEventToEventListeners,
	AddEventWrapper,
	cleanupEventWrapper,
	emitEvent,
	removeEventFromEventListeners,
	SendActionSocketIO
} from '../../../../engine/event';

import { AssertS, nu, t, u } from '../../../../engine/_core';
import {
	BuildObj,
	buildObjOnMount,
	buildObjOnUmount,
	deleteBuildedObj
} from '../../../../engine/_buildEng';
import { PastControllerReact } from '../../../../engine/_pastController';
import { AddWaitOverlay, DeleteWaitOverlay, runui } from '../../../../engine/_util';
import pako from 'pako';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

let dnkDB = {};
//rvalue example
//rvalue: "{"req":"y_sga_error_fspectrError","value":"val","sub":[]}"

addExampleFormat('DNK_Root_ExMin', {
	id: 'th_dnk',
	type: 'dnk_root',
	exchange: {
		send_evt_on_change: false,
		filtresp: {
			condition: '((msg.y.sga.error.fspectrError!=undefined))'
		}
	}
});

addExampleFormat('DNK_Root_ExMax', {
	id: 'root_sns',
	name: 'x.sns',
	type: 'dnk_root',
	exchange: {
		proto: 'mqttevent',
		inittree: {
			editor: 'AventaX_SNS_BuildDefaultTree' //генерирует ожидаемый обьект, обычно используется для первичной инициализации UI, аргумент - отсутствует
		},
		initreq: {
			sequence: JSON.stringify({
				//последовательность для запроса обьекта
				x: {
					wsreq: {
						req: 'x.ws'
					}
				}
			}),
			editor: 'AventaX_EVT_Request' //редактор запроса, перед отправкой sequence, редактирует обьект, аргумент -  sequence
		},
		initresp: {
			sequence: 'x.sns', //в ответ на initreq ждем обьекта который содержит initresp sequence, если он пришел, рисуем DNK
			editor: 'AventaX_SNS_PostProcess' //редактор полученного обьекта впервые перед отображением, аргумент -  полученный обьект
		},
		afterBuild: {
			editor: 'AventaX_SNS_AfterBuild' //вызывается после построения интерфейса, для возможности добавления нестандартных компонентов
			//аргументы дерево компонтов и дерево значений tree и arr
		},
		filtresp: {
			//все что не подходит под условие condition не принадлежит этому dnk_root
			condition:
				'((u(msg.x.sns)&&(msg.x.sns.dtype==1)&&(u(msg.x.sns.store0)||u(msg.x.sns.store1)||u(msg.x.sns.store2)||u(msg.x.sns.store3)))' +
				'||(u(msg.x.ws)&&(u(msg.x.ws.store0)||u(msg.x.ws.store1)||u(msg.x.ws.store2)||u(msg.x.ws.store3))))'
		},
		deduct: {
			editor: 'AventaX_SNS_Deduct' //редактор полученных обьектов, вызывается каждый раз при новых данных, аргумент -  полученный обьект
		}
	},
	past: {
		type: 'appendTo',
		jq: '.sns_col0_row0'
	},
	branch: {
		//level1
		deny: ['heat', { if: 'msg.x.ws.sett.num_stores==1', add: ['store1', 'store2', 'store3'] }],
		prio: ['module_on', 'prog_on'],
		overlay: {
			calculate_temp_out_mode: {
				svalue: ['{"chvar":{"mode":"rep","value":[0,1,2],"replace":["Mode1","Mode2","Mode3"]}}']
			},
			enabled_co2: {
				type: 'dswitch'
			}
		},
		showNod: 'nod', //force display of an empty node
		lang: {
			lid: {
				x_ws_store0_mod_mod_co2_public_t_module_on: 'mod_co2_module_on',
				x_ws_store0_mod_mod_cooler_public_t_module_on: 'mod_cooler_module_on'
			}
		},
		nod: {
			type: 'stab',
			stylize: {
				layout: {
					cols: [25, 25, 25, 25],
					rows: [50, 50],
					items: [3, 3, 3, 100],
					overlay: {
						x_ws_store0_spec: {
							cols: [0, 50],
							rows: [100],
							items: [6, 100]
						}
					}
				}
			}
		},
		leaf: {
			type: 'dfield'
		}
	}
});

class createDnkRoot {
	updateObject(target, source) {
		//для мержа обьектов extend и assign не подходят, т.к. требуется дополнить и переопределить если есть что
		for (let elem in source) {
			if (target[elem] === undefined) {
				target[elem] = {};
			}
			if (source[elem] instanceof Object) {
				if (Array.isArray(source[elem])) {
					target[elem] = source[elem];
				} else {
					target[elem] = this.updateObject(target[elem], source[elem]);
				}
			} else {
				target[elem] = source[elem];
			}
		}
		return target;
	}

	test() {
		//тест для дебага
		let target = {
			a: 1,
			b: {
				c: 1,
				d: 2
			}
		};

		let source = {
			n: 1,
			a: 2,
			c: {
				z: 1
			},
			b: {
				c: 100
			}
		};
		let result = this.updateObject(target, source);
		console.log('result ', result);
	}

	ChangeValueDNKChain_bid_comp_val(valnew, valold) {
		let changed = 0;

		if (valold === undefined) return true;

		if (Array.isArray(valnew) === false) {
			if (u(valold) && valold !== valnew) {
				return true;
			}
		} else {
			if (valnew.length !== valold.length) return true;

			for (let z in valnew) {
				if (z === 0) {
					if (typeof valnew[z] == 'object') {
						changed = 1;
						continue;
					}
				}
				if (u(valold) && valold[z] !== valnew[z]) {
					changed = 1;
				}
			}
			if (changed) return true;
		}
		return false;
	}
	ChangeValueDNKChain_bid(args, id, send_evt_on_change, contentClass) {
		let lid = '';
		for (let item in args) {
			lid = id + '_' + item;
			if (args[item] instanceof Object) {
				if (Array.isArray(args[item])) {
					lid = lid.substr(1);
					if (
						!send_evt_on_change ||
						nu(MetaVar[contentClass][lid]) ||
						MetaVar[contentClass][lid].seoc ||
						this.ChangeValueDNKChain_bid_comp_val(args[item], MetaVar[contentClass][lid].value)
					) {
						SetMetaForce(
							{
								id: lid,
								value: args[item]
							},
							contentClass
						);

						emitEvent(lid, { val: args[item] });
						// let we = new window.createCustomEvent(lid, {val: args[item]});//new CustomEvent(idx, {bubbles: true,detail:eventFromUI.d['webevent'].result});
						// webevents.dispatchEvent(we);
						//   console.log("Send evt arr type", lid, 'val', args[item]);
					} else {
						//Если значения одинаковые и статус changed значит подтверждение
						if (MetaVar[contentClass][lid].changed) {
							SetMetaForce(
								{
									id: lid,
									value: args[item]
								},
								contentClass
							);
							emitEvent(lid, { val: args[item] });
							//ClrMetaChange(lid, contentClass);
						}
						/*ClrMetaChange(
							{
								id: lid,
								value: args[item]
							},
							contentClass
						);*/
					}
				} else {
					this.ChangeValueDNKChain_bid(args[item], lid, send_evt_on_change, contentClass);
				}
			} else {
				lid = lid.substr(1);
				if (
					!send_evt_on_change ||
					nu(MetaVar[contentClass][lid]) ||
					MetaVar[contentClass][lid].seoc ||
					this.ChangeValueDNKChain_bid_comp_val(args[item], MetaVar[contentClass][lid].value)
				) {
					SetMetaForce(
						{
							id: lid,
							value: args[item]
						},
						contentClass
					);

					emitEvent(lid, { val: args[item] });
					//let we = new window.createCustomEvent(lid, {val: args[item]});//new CustomEvent(idx, {bubbles: true,detail:eventFromUI.d['webevent'].result});
					//webevents.dispatchEvent(we);

					//console.log("Send evt", lid, 'val', args[item]);
				} else {
					if (MetaVar[contentClass][lid].changed) {
						SetMetaForce(
							{
								id: lid,
								value: args[item]
							},
							contentClass
						);
						emitEvent(lid, { val: args[item] });
						//ClrMetaChange(lid, contentClass);
					}
					/*ClrMetaChange(
						{
							id: lid,
							value: args[item]
						},
						contentClass
					);*/
				}
			}
		}
	}
	ChangeValueDNKChain(args, send_evt_on_change, contentClass) {
		//console.log("ChangeValueDNKChain", args);
		if (args === undefined) return;

		let id = '';
		this.ChangeValueDNKChain_bid(args, id, send_evt_on_change, contentClass);
	}

	BuildTree(args) {
		// oldData=this.BuildDNKChainOld(args);
		let rawTree = this.BuildDNKChain(args);
		return this.MergeNodes(rawTree);
	}
	OBSOLETEMergeNodes(rawTree) {
		let __MergeNodesS0 = (rawTree) => {
			let mainNod = undefined;
			for (let elem in rawTree) {
				if (u(rawTree[elem].parent)) {
					//если есть parent значит это узел
					let id = rawTree[elem].id;
					rawTree[elem].spage[id] = __MergeNodesS0(rawTree[elem].spage[id]);
					if (nu(mainNod)) {
						//если first пустой, значит это первый узел
						mainNod = rawTree[elem];
						mainNod.name = rawTree[elem].parent;
						continue;
					}
					if (u(rawTree[elem].united)) {
						//если есть united значит этот узел нужно обьединять с некоторыми узлами
					} else {
						//если нет united значит этот узел нужно обьединять в общий узел

						mainNod.spage[id] = rawTree[elem].spage[id];
						mainNod.items_name.push(rawTree[elem].items_name[0]);
						mainNod.items_val.push(rawTree[elem].items_val[0]);
						mainNod.items_lid.push(rawTree[elem].items_lid[0]);
						rawTree[elem].parent = ''; //помечаем узел для удаления
					}
				}
			}
			return rawTree;
		};
		let dirty = __MergeNodesS0(rawTree);
		let __MergeNodesS1 = (dirty) => {
			for (let elem in dirty) {
				if (u(dirty[elem].parent)) {
					if (dirty[elem].parent.length !== 0) {
						//result[elem] = {};
						for (let id in dirty[elem].spage) {
							//    result[resCntr][id] = {};
							__MergeNodesS1(dirty[elem].spage[id]);
						}
						//delete result[elem];
						//__MergeNodesS1(result[elem],dirty[elem]);
						//result[elem]=dirty[elem];
					} else {
						dirty[elem] = '____';
						//dirty.splice(elem,1);
					}
				}
				//else
				// {
				//   result[resCntr]=dirty[elem];
				//   resCntr++;
				// }
			}
		};
		// let result=[];//=$.extend(false, [],dirty);
		__MergeNodesS1(dirty);
		return dirty;
	}
	MergeNodes(rawTree) {
		let __MergeNodesS0 = (rawTree) => {
			let mainNod = undefined;
			for (let elem in rawTree) {
				if (u(rawTree[elem].parent)) {
					//если есть parent значит это узел
					let id = rawTree[elem].id;
					rawTree[elem].spage[id] = __MergeNodesS0(rawTree[elem].spage[id]);

					if (nu(mainNod)) {
						//если first пустой, значит это первый узел
						mainNod = rawTree[elem];
						mainNod.name = rawTree[elem].parent;
						mainNod.id = rawTree[elem].parent;
						continue;
					}
					if (u(rawTree[elem].united)) {
						//если есть united значит этот узел нужно обьединять с некоторыми узлами
					} else {
						//если нет united значит этот узел нужно обьединять в общий узел

						mainNod.spage[id] = rawTree[elem].spage[id];
						mainNod.items_name.push(rawTree[elem].items_name[0]);
						mainNod.items_val.push(rawTree[elem].items_val[0]);
						mainNod.items_lid.push(rawTree[elem].items_lid[0]);
						rawTree[elem].parent = ''; //помечаем узел для удаления
					}
				}
			}
			return rawTree;
		};
		let dirty = __MergeNodesS0(rawTree);
		let __MergeNodesS1 = (dirty) => {
			for (let elem in dirty) {
				if (u(dirty[elem].parent)) {
					if (dirty[elem].parent.length !== 0) {
						//result[elem] = {};
						for (let id in dirty[elem].spage) {
							//    result[resCntr][id] = {};
							__MergeNodesS1(dirty[elem].spage[id]);
						}
						//delete result[elem];
						//__MergeNodesS1(result[elem],dirty[elem]);
						//result[elem]=dirty[elem];
					} else {
						dirty[elem] = '____';
						//dirty.splice(elem,1);
					}
				}
				//else
				// {
				//   result[resCntr]=dirty[elem];
				//   resCntr++;
				// }
			}
		};
		// let result=[];//=$.extend(false, [],dirty);
		__MergeNodesS1(dirty);
		return dirty;
	}
	BuildDNKChain(args) {
		let branch = args.branch;
		let map = args.map;
		let nested = args.nested;
		let id = args.id;

		let msg = args.msg;
		let contentClass = args.contentClass;

		let valval = [];
		let lid = '';

		if (Object.keys(map).length === 1) {
			let nod = Object.keys(map)[0];
			if (
				nu(branch.showNod) ||
				(u(branch.showNod) && branch.showNod !== nod && branch.showNod.length !== 0)
			) {
				if (nested === 0) lid = nod;
				else lid = id + '_' + nod;

				if (map[nod] instanceof Object && !Array.isArray(map[nod])) {
					valval = this.BuildDNKChain({
						map: map[nod],
						branch: branch.branch,
						nested: nested + 1,
						msg: msg,
						id: lid,
						contentClass: contentClass
					});
					return valval;
				}
			}
		}

		let sorted_obj = [];
		let prio = [];
		if (u(branch.prio)) {
			prio = branch.prio;
		}

		for (let n = 0; n < prio.length; n++) {
			if (u(map[prio[n]])) {
				sorted_obj.push(prio[n]);
			}
		}

		for (let nod in map) {
			if (prio.indexOf(nod) === -1) {
				sorted_obj.push(nod);
			}
		}

		let deny = [];
		let ifr;
		let add;
		if (branch.deny !== undefined) {
			let cd = 0;
			for (; cd < branch.deny.length; cd++) {
				if (branch.deny[cd] instanceof Object) {
					ifr = branch.deny[cd].if;
					add = branch.deny[cd].add;
					if (eval(ifr)) {
						deny = deny.concat(add);
					}
				} else deny.push(branch.deny[cd]);
			}
		}

		let lang_lid = u(branch.lang) && u(branch.lang.lid);
		let lang_hdlr = function (valobj, nod, lid) {
			if (lang_lid) {
				if (u(branch.lang.lid[lid])) valobj.lid = branch.lang.lid[lid];
				else valobj.lid = nod;
			} else valobj.lid = nod;
		};

		for (let nodidx = 0; nodidx < sorted_obj.length; nodidx++) {
			let nod = sorted_obj[nodidx];
			if (nested === 0) lid = nod;
			else lid = id + '_' + nod;

			// if (nod==="emailTab")
			//  debugger;

			if (deny.indexOf(nod) !== -1) continue;

			if (map[nod] instanceof Object) {
				if (Array.isArray(map[nod])) {
					let leaf = $.extend(true, {}, branch.leaf);
					if (nu(branch.leaf)) {
						branch.leaf = {};
					}
					if (u(branch.overlay) && u(branch.overlay[nod])) {
						leaf = this.updateObject(leaf, branch.overlay[nod]);
						// leaf=$.extend(true,leaf,branch.overlay[nod]);
					}
					let valobj;
					try {
						valobj = JSON.parse(JSON.stringify(leaf));
					} catch (e) {
						console.log('dnk json err');
						alert('dnk json err');
						return;
					}
					valobj.id = lid;
					valobj.name = nod;
					valobj.value = map[nod];
					if (u(branch.bid)) {
						valobj.bid = branch.bid;
					} else valobj.bid = (nested + 1).toString();

					if (valobj.type === undefined) {
						alert('Error DNK, set leaf type for ' + valobj.id);
					}
					lang_hdlr(valobj, nod, lid);
					valobj.rvalue = '{"req":"' + lid + '","value":"val","sub":["webui"]}';
					if (nu(MetaVar[contentClass][lid])) MetaVar[contentClass][lid] = {};
					// MetaVar[lid]['value'] =map[nod];

					valval.push(valobj);
				} else {
					let type = AssertS(branch.nod.type);
					if (type.length === 0) alert('Error DNK, set nod type');

					let vid = lid;
					if (vid.length === 0) vid = 'root_dnk';

					let objval_def = {
						name: lid,
						type: type,
						value: '',
						id: vid,
						bid: (nested + 1).toString(),
						parent: id,
						items_name: [],
						items_val: [],
						items_lid: [],
						spage: {}
					};
					let objval;
					//if ((chain.data!=undefined)&&(chain.data.nod!=undefined))
					objval = $.extend(true, objval_def, branch.nod);
					if (u(branch.bid)) {
						objval.bid = branch.bid;
					}
					if (u(branch.overlay) && u(branch.overlay[nod])) {
						objval = this.updateObject(objval, branch.overlay[nod]);
						// objval=$.extend(true,objval,branch.overlay[nod]);
					}
					//  objval=objval_def;
					objval.items_name.push(nod);
					let result = { lid: '' };
					lang_hdlr(result, nod, lid);
					objval.items_lid.push(result.lid);
					let valname = lid;

					objval.items_val.push(valname);
					if (objval.spage[valname] === undefined) objval.spage[valname] = [];
					objval.spage[valname] = this.BuildDNKChain({
						map: map[nod],
						msg: msg,
						branch: branch.branch,
						nested: nested + 1,
						id: lid,
						nod_name: nod,
						contentClass: contentClass
					});

					if (objval.items_name.length !== 0) {
						let founded_id = -1;
						for (let vidx = 0; vidx < valval.length; vidx++) {
							if (valval[vidx].id === objval.id) {
								founded_id = vidx;
							}
						}
						if (founded_id === -1) valval.push(objval);
						else {
							valval[founded_id] = $.extend(false, valval[founded_id], objval);
							// valval[founded_id]=objval;
						}
					}
				}
			} else {
				let leaf = $.extend(true, {}, branch.leaf);
				if (u(branch.overlay) && u(branch.overlay[nod])) {
					leaf = this.updateObject(leaf, branch.overlay[nod]);
					//leaf=$.extend(true,leaf,branch.overlay[nod]);
				}
				let valobj = JSON.parse(JSON.stringify(leaf));
				valobj.id = lid;
				if (u(branch.bid)) {
					valobj.bid = branch.bid;
				} else valobj.bid = (nested + 1).toString();

				valobj.name = nod;
				valobj.value = map[nod];
				lang_hdlr(valobj, nod, lid);
				valobj.rvalue = '{"req":"' + lid + '","value":"val","sub":["webui"]}';
				try {
					if (nu(MetaVar[contentClass][lid])) MetaVar[contentClass][lid] = {};
				} catch (e) {
					// eslint-disable-next-line no-debugger
					debugger;
				}
				// MetaVar[lid]['value'] = map[nod];
				valval.push(valobj);
			}
		}

		return valval;
	}

	rootBuild(PastTo, msg, arr) {
		let rootbo = this.BuildTree({
			branch: arr.branch,
			map: msg,
			msg: msg,
			nested: 0,
			id: '',
			contentClass: arr.contentClass
			// PastTo:'.dnkroot_main'
		});

		/*if (u(arr.past)) {
			for (let elem in rootbo) {
				if (rootbo[elem] !== '____') rootbo[elem].past = arr.past;
			}
		}*/
		//console.log("JSON string",JSON.stringify(rootbo));

		let buildResult = BuildObj(PastTo, rootbo, {
			contentClass: arr.contentClass,
			parent_data: {
				id: arr.id
			}
		});
		if (u(this.afterBuild.editor)) dnkDB[this.afterBuild.editor](rootbo, arr);
		return buildResult;
		// componentHandler.upgradeAllRegistered();
	}

	clearSendData(data) {
		//Защита от полей null и undefined. В систему нельзя передавать неопределенности.
		let result;
		if (data instanceof Object) {
			if (Array.isArray(data)) {
				result = [];
				//for (let z=data.length;z>=0;z--) {
				//    if ((data[z]==undefined)||(data[z]==null))
				//        data.splice(z, 1);
				// }
				result = data.filter((value) => {
					return value !== null && value !== undefined;
				});
				return result;
			} else {
				result = {};
				for (let nod in data) {
					if (data[nod] instanceof Object) {
						result[nod] = {};
						result[nod] = this.clearSendData(data[nod], result[nod]);
					} else {
						if (data[nod] !== undefined && data[nod] != null) {
							result[nod] = data[nod];
						}
					}
				}
			}
		} else if (data !== undefined && data !== null) {
			result = data;
		}
		return result;
	}

	createElement(blockId, { Obj }) {
		//  this.test();
		let contentClass = Obj.contentClass;
		let inited = false;
		let tx_evt_name = 'dnk_tx_topic';
		if (u(Obj.tx_evt_name)) tx_evt_name = Obj.tx_evt_name;

		let only_evt = !u(Obj.branch);

		let disable_overlay = false;
		if (only_evt) {
			disable_overlay = true;
			inited = true;
		}
		let tx_topic = u(Obj.exchange.tx_topic) ? Obj.exchange.tx_topic : 'SWtoSRVa';
		let initreq = Obj.exchange.initreq;
		initreq = u(initreq) ? initreq : {};
		let buildst = false;
		let initresp = Obj.exchange.initresp;
		initresp = u(initresp) ? initresp : {};
		let filtresp = Obj.exchange.filtresp;
		filtresp = u(filtresp) ? filtresp : {};
		let inittree = Obj.exchange.inittree;
		inittree = u(inittree) ? inittree : {};
		this.afterBuild = Obj.exchange.afterBuild;
		this.afterBuild = u(this.afterBuild) ? this.afterBuild : {};

		let deduct = Obj.exchange.deduct;
		deduct = u(deduct) ? deduct : {};
		let send_evt_on_change;
		if (u(Obj.exchange.send_evt_on_change)) {
			send_evt_on_change = Obj.exchange.send_evt_on_change;
		} else send_evt_on_change = true;

		//}
		let waitdata;
		let repeatInterval;
		let repeatTimeout;

		repeatTimeout = setTimeout(function () {
			clearInterval(repeatInterval);
		}, global.dnkReqTimeout);

		if (disable_overlay === false) {
			AddWaitOverlay(t('Please_wait_dnk'));
			if (global.disable_timers === 0) {
				waitdata = setTimeout(function () {
					DeleteWaitOverlay();
					clearInterval(repeatTimeout);
					runui('flymsg', global['LANG_LIB'].__keywords.server_not_respond, '');
				}, global.dnkReqTimeout);
			}

			global.dnk.overlay_cntr++;
		}

		let irsec = '';
		if (u(initreq.sequence)) irsec = initreq.sequence;

		if (u(initreq.editor)) {
			irsec = dnkDB[initreq.editor](irsec, contentClass);
		}

		if (irsec.length !== 0) {
			SendActionSocketIO({
				action: Obj.exchange.proto,
				data: { src: tx_topic, msg: irsec }
			});
			repeatInterval = setInterval(function () {
				if (!inited) {
					SendActionSocketIO({
						action: Obj.exchange.proto,
						data: { src: tx_topic, msg: irsec }
					});
				}
				//runui('flymsg', "." + global.TAG_MAIN, global['LANG_LIB'].__keywords.server_not_respond, '');
			}, global.dnkReqInterval);
		}

		let DnkRoot = observer(() => {
			const buildPageData = useRef({});
			useEffect(() => {
				buildObjOnMount(Obj);
				if (u(inittree.editor)) {
					let tree = dnkDB[inittree.editor](contentClass);
					buildPageData.current = this.rootBuild(blockId, tree, Obj);
					buildst = true;
				}

				addEventToEventListeners(tx_evt_name, tx_evt_name, (event) => {
					if (event === null || Object.keys(event).length === 0) return;

					delete event.evt;
					delete event.contentClass;
					let nev = this.clearSendData(event);
					//console.warn(`DNK send ${tx_evt_name} ${JSON.stringify(eventFromUI)} Id ${Obj.id}`);
					SendActionSocketIO({
						action: Obj.exchange.proto,
						data: { src: tx_topic, msg: JSON.stringify(nev) }
					});
				});
				AddEventWrapper(
					{ req: 'dnk' },
					(event) => {
						if (typeof event.msg != 'object') return;

						//console.log("this",this);

						let msg = event.msg;
						if (nu(msg)) return;
						//console.warn('msg', JSON.stringify(msg).substring(0, 20));
						if (u(msg.comp)) {
							if (msg.comp === 'base64gzip') {
								// let eb64=atob(msg.data);
								let eb64 = Uint8Array.from(atob(msg.data), (c) => c.charCodeAt(0));
								// let eb64=Buffer.from(msg.data, 'utf8');
								let inflate = pako.inflate(eb64);
								let msgString = new TextDecoder('utf-8').decode(inflate);
								msg = JSON.parse(msgString);
							}
						}
						if (u(msg.id)) {
							if (msg.id !== global.clientId) return;
						}
						if (inited) {
							if (u(filtresp)) {
								try {
									if (u(filtresp.condition) && eval(filtresp.condition) === false) {
										return;
									}
								} catch (e) {
									// debugger;
									return;
								}
							} else return;
						}
						//  if (eventFromUI.msg.length> 2000)
						let initmatch = false;
						if (!inited) {
							try {
								if (u(initresp.sequence)) {
									initmatch = u(eval('msg.' + initresp.sequence));
								}
								if (u(initresp.condition)) {
									initmatch = !!eval(initresp.condition);
								}
							} catch (e) {
								console.log('error DNK init');
							}

							if (initmatch) {
								console.log('EVENT DNK msglen', msg.length, msg);

								if (u(initresp.editor)) {
									msg = dnkDB[initresp.editor](msg, contentClass);
								}
								if (!buildst) {
									buildPageData.current = this.rootBuild(blockId, msg, Obj);
									buildst = true;
								} else {
									if (u(deduct.editor)) {
										msg = dnkDB[deduct.editor](msg, contentClass);
									}
								}
								this.ChangeValueDNKChain(msg, send_evt_on_change, contentClass);

								if (disable_overlay === false) {
									global.dnk.overlay_cntr--;
									if (global.dnk.overlay_cntr <= 0) {
										DeleteWaitOverlay();
									}
								}
								clearTimeout(waitdata);
								clearTimeout(repeatTimeout);
								clearInterval(repeatInterval);
								inited = true;
							}
						} else {
							if (u(deduct.editor)) {
								msg = dnkDB[deduct.editor](msg, contentClass);
							}
							this.ChangeValueDNKChain(msg, send_evt_on_change, contentClass);
						}
					},
					blockId
				);
				return () => {
					removeEventFromEventListeners(tx_evt_name);
					cleanupEventWrapper(blockId);
					deleteBuildedObj(buildPageData.current);
					buildObjOnUmount(Obj);
				};
			}, []);

			return (
				<div className={'dnkroot_main'} id={blockId}>
					{mobXstore.element.doRender(blockId)}
				</div>
			);
		});
		return <DnkRoot key={blockId} />;
	}
	create({ PastTo, Id, Obj }) {
		let blockId = Id;
		PastControllerReact({
			PastTo,
			Obj,
			Id: blockId,
			ReactElement: this.createElement(blockId, { PastTo, Id, Obj })
		});
		return blockId;
	}
}

export function genBidForDNK(arr) {
	let bidClass = '';
	if (u(arr.bid)) {
		bidClass = '__bid-' + arr.bid;
	}

	return bidClass;
}

let localDnkRoot = (PastTo, Id, Obj) => {
	let dnkRoot = new createDnkRoot();
	return dnkRoot.create({ PastTo, Id, Obj });
};

let globalDnkRoot = () => {
	if (nu(global.DNKroot_Deduct))
		global.DNKroot_Deduct = () => {
			console.log('Please set global.DNKroot_Deduct');
		};
	let dnkRoot = new createDnkRoot();
	return dnkRoot.create({ PastTo: 'body', Id: 'globDNKroot', Obj: global.dnk.root });
};

let test = (PastTo, Id, Obj) => {
	let dnkRoot = new createDnkRoot();
	let blockId = Id;
	return dnkRoot.createElement(blockId, { PastTo, Obj });
};

let dnk_root = {
	create: localDnkRoot,
	test: test,
	link: (id, cb) => {
		dnkDB[id] = cb;
	},
	getCallback: (id) => {
		return dnkDB[id];
	},
	global: globalDnkRoot
};

export default {
	dnk_root,
	dnk_nod: {
		create: (PastTo) => {
			return PastTo;
		}
	}
};
