import { getGlobalCallback, global, MetaVar, mobXstore } from './___global.js';
import { nu, u } from './_core';

import { initMetaVar } from './_metaVar';
import { stylizeLayoutArrange, TreeFillLayout } from './stylize';
import { runui } from './_util';
import { eventController } from './event';
import { FillSettingsToBuildObjValue } from './value_extractor';
import { cValueController, svalueController, valueController } from './var';

function autoPlacerBuildEng(data, placeOpts, page) {
	if (!Array.isArray(data) || !placeOpts) return data;
	placeOpts.forEach((placeOptsIdx) => {
		switch (placeOptsIdx.place) {
			case 'tips':
				{
					let langPageName = page.replace(/[0-9.]/g, '');
					if (placeOptsIdx?.opts?.showOffPage) {
						if (placeOptsIdx.opts.showOffPage.find((showOffPageItem) => showOffPageItem === page))
							break;
					}

					let tipsElements = [];
					data.forEach((dataEdx) => {
						let pOps = placeOptsIdx.opts;
						let elLang;
						if (u(dataEdx.id) && u(global.LANG_LIB[langPageName])) {
							//если в словаре есть страница
							if (
								u(global.LANG_LIB[langPageName].tips) && //если есть блок подсказок и подсказка
								u(global.LANG_LIB[langPageName].tips[dataEdx.id])
							) {
								elLang = global.LANG_LIB[langPageName].tips[dataEdx.id];
							} else {
								if (u(global.LANG_LIB[langPageName].link)) {
									global.LANG_LIB[langPageName].link.forEach((linkItem) => {
										let link = linkItem.replace(/[0-9.]/g, '');
										//если есть блок подсказок и подсказка
										if (global.LANG_LIB?.[link]?.tips?.[dataEdx.id]) {
											elLang = global.LANG_LIB[link].tips[dataEdx.id];
										}
									});
								}
							}
							if (u(elLang)) {
								// let tips=pOps;
								let name = dataEdx.name;
								let lid = dataEdx.id;
								if (pOps?.showOffName?.[page] === dataEdx.id) {
									name = '';
									lid = '';
								}

								tipsElements.push({
									type: pOps.type,
									id: dataEdx.id + 'Tips',
									value: elLang,
									name: name,
									past: pOps.past,
									lid: lid
								});
							}
						}
					});

					if (tipsElements.length !== 0) data = data.concat(tipsElements);
				}
				break;
		}
	});

	return data;
}

function BuildObjUI(Obj) {
	//обработчик свойства ui элемента, используется в постобработке
	if (Obj.ui) {
		if (u(Obj.ui.editor)) {
			//коллбэк обработчика, используется если нужно заменить значение параметра элемента
			// переменной из клиента или выполнить алгоритм с учетом переменных клиента
			Obj = getGlobalCallback(Obj.ui.editor)(Obj);
		}
	}
	return Obj;
}

export function buildObjOnMount(Obj) {
	if (Obj.__buildEng) {
		Obj.__buildEng.mount();
	}
}
export function buildObjOnUmount(Obj) {
	if (Obj.__buildEng) {
		Obj.__buildEng.umount();
	}
}

export function BuildObj(PastTo, data, param) {
	/*
    param:{
        parent_data:{
           stylize:{
                layout:xxx
           },
           id:xxxx,
           branch:xxxx
        }
    }
     */
	//var index;

	let InstField;
	let layout_mode = false;
	let contentClass;
	let result = {};
	if (nu(param) || nu(param.contentClass)) {
		contentClass = PastTo; //global.defContentClass;
		initMetaVar(contentClass);
	} else contentClass = param.contentClass;

	let placeOpts;
	if (
		global.SRV_OBJ.PageRegionName.length !== 0 &&
		u(global.SRV_OBJ.world.regions[global.SRV_OBJ.PageRegionName].placeOpts)
	)
		placeOpts = global.SRV_OBJ.world.regions[global.SRV_OBJ.PageRegionName].placeOpts[contentClass];
	else placeOpts = [];

	if (nu(global.pctrl[contentClass])) {
		global.pctrl[contentClass] = [];
	}
	if (data) {
		if (param?.parent_data?.stylize?.layout) {
			//branch
			layout_mode = true;
			let layout_arg = param.parent_data.stylize.layout;
			let layout_ins = layout_arg;

			if (layout_arg.overlay) {
				if (layout_arg.overlay[param.branch]) layout_ins = layout_arg.overlay[param.branch];
				else if (layout_arg.overlay[param.branchLid])
					layout_ins = layout_arg.overlay[param.branchLid];
			}

			if (Array.isArray(layout_ins)) {
				for (const layout in layout_ins) {
					TreeFillLayout({
						layout: layout_ins[layout],
						data,
						PastTo,
						id: param.parent_data.id + '_' + param.branch + '_' + layout,
						param,
						contentClass
					});
				}
			} else
				TreeFillLayout({
					layout: layout_ins,
					data,
					PastTo,
					id: param.parent_data.id,
					param,
					contentClass
				});
		}

		if (param?.parent_data) {
			global.cache.root_data[param.parent_data.id] = {};
		}

		data = autoPlacerBuildEng(data, placeOpts, global.SRV_OBJ.PageName);

		data.forEach((dataIdx) => {
			console.log('BUILD ', dataIdx);
			let arr = dataIdx;
			if (typeof arr !== 'object' || !arr) return;
			const id = !arr['id'] ? arr['type'] : arr['id'];

			console.log('id ' + id);
			InstField = PastTo;

			global.api.translateEng.t(arr);

			if (MetaVar[contentClass]?.[arr.id]?.value) {
				console.log('arr.id', arr.id, 'MetaVar[arr.id]', MetaVar[contentClass][arr.id].value);
				arr.value = MetaVar[contentClass][arr.id].value;
			}

			if (arr.value === '') {
				FillSettingsToBuildObjValue(arr);
			}
			cValueController(arr); //переопределение value константой svalue
			valueController(arr, contentClass); //действия если не задан value
			svalueController(arr); //преобразование одного или массива значачений, по массиву svalue. Каждое значение преобразуется одинаково, массивом svalue

			arr.contentClass = contentClass;
			arr = BuildObjUI(arr);
			arr.__buildEng = new (class {
				constructor() {
					this.mountResult = [];
				}

				mount() {
					this.mountResult = eventController(arr);
				}
				umount() {
					this.mountResult.forEach((umountCb) => {
						umountCb();
					});
				}
			})();
			let block_id = runui(arr['type'], InstField, id, arr, {
				parent_data: {
					id
				}
			});
			if (arr?.past?.jq) {
				result[block_id] = arr.past.jq;
			} else {
				result[block_id] = InstField;
			}

			if (param?.parent_data) {
				if (nu(block_id)) {
					block_id = id;
				}
				global.cache.root_data[param.parent_data.id][id] = {
					PastTo: InstField,
					id: block_id,
					pid: param.parent_data.id,
					cid: id
				};
			}
		});

		if (layout_mode) {
			if (Array.isArray(param.parent_data.stylize.layout)) {
				for (const lay in param.parent_data.stylize.layout) {
					const layout = param.parent_data.stylize.layout[lay];
					let rules = param.parent_data.stylize.layout[lay];
					if (layout?.overlay?.[param.branch]) {
						rules = layout.overlay[param.branch];
					}
					stylizeLayoutArrange({
						PastTo,
						id: param.parent_data.id,
						arr: data,
						rules
					});
				}
			}
		}
	}
	return result;
}

export function deleteBuildedObj(createdObj) {
	for (const child in createdObj) {
		let parent = createdObj[child];
		mobXstore.element.removeBlock({ child, parent });
	}
}
