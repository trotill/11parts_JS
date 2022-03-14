/**
 * Created by Ilya on 20.12.2019.
 */
import { global } from './___global.js';
import { BuildObj } from './_buildEng';
import { buildComponent } from './registerUI';

global.exampleformat.stylize = {
	changeclass: {
		global: '',
		input: ['almev_panel_col_input']
	},
	change: {
		//id:{class_src:class_dst}
		power_off_but: { Button_a_cont: 'poweroff_button' }
	},
	style: {
		//id:'css'
		power_off: 'display: inline-block;float: right;'
	},
	changemulti: '',
	add: '',
	layout: [
		{
			cols: [10, 15, 5, 50, 10, 10],
			rows: [100],
			items: [1, 1, 1, 1, 1, 1]
		},
		{
			cols: [100],
			rows: [100],
			items: [2000],
			arrange: [
				{
					id: 'alm_n',
					type: 'dpanel',
					name: 'num',
					value: 'num'
				}
			]
		}
	],
	items_limit: 1000 //макс. кол. значений в value, если он массив
};

//param.parent_data.stylize.layout
export function TreeFillLayout(arg) {
	let PastTo = arg.PastTo;
	let layout = arg.layout;
	let id = arg.id;
	let data = arg.data;
	let param = arg.param;

	let rules = layout;
	if (layout?.overlay?.[param.branch]) {
		rules = layout.overlay[param.branch];
	}

	stylizeLayout({
		PastTo,
		id,
		arr: data,
		rules,
		contentClass: arg.contentClass
	});
}

export function stylizeLayoutArrange(arg) {
	let lrule = arg.rules;
	let PastTo = arg.PastTo;
	if (lrule.arrange) {
		lrule.arrange = arg.contentClass;
		BuildObj(PastTo, lrule.arrange, {
			contentClass: arg.contentClass,
			parent_data: {
				id: arg.id
			}
		});
	}
}
function stylizeLayout(arg) {
	let lrule = arg.rules;
	if (!lrule || !lrule.rows || !lrule.cols) return;

	let arr = arg.arr;
	let PastTo = arg.PastTo;
	let id = 'stylize-layout' + arg.id;
	//arr.id+"_col"+col+"_row"+row;

	buildComponent('layoutBase', {
		PastTo,
		id,
		arr: {
			params: lrule,
			contentClass: arg.contentClass
		}
	});

	let iptr = 0;
	for (let n in arr) {
		if (arr[n]?.['past']?.['jq']) {
			iptr++;
		} else break;
	}
	if (arr.length <= iptr) return;

	lrule.rows.forEach((rowItem, row) => {
		lrule.cols.forEach((colItem, col) => {
			for (let n = 0; n < lrule.items[col + row * lrule.cols.length]; n++) {
				let jq = id + '_col' + col + '_row' + row;
				if (arr[iptr]?.id && !arr[iptr]['past']) {
					arr[iptr]['past'] = {
						type: 'appendTo',
						jq: jq
					};
				}
				iptr++;
				if (arr.length <= iptr) return;
			}
		});
	});
}

export function stylizeInsideElement(stylize, value, defclass) {
	let d;
	let c;
	let elcounter = 0;
	let items_limit = 0;
	if (stylize) {
		if (stylize.changeclass) {
			d = $.extend(true, defclass, stylize.changeclass);
		} else {
			d = defclass;
		}

		if (stylize.items_limit) {
			items_limit = stylize.items_limit;
		}
	} else d = defclass;

	if (value && Array.isArray(value) && typeof value[0] == 'object') {
		c = $.extend(true, d, value[0].changeclass);
		elcounter = 1;
	} else {
		c = d;
	}

	return {
		first_value_offs: elcounter,
		class_map: c,
		items_limit: items_limit
	};
}

//example dynamicCSS('.avclnt', 'display:none;');
export function dynamicCSS(selector, style) {
	if (!document.styleSheets) return;
	if (document.getElementsByTagName('head').length === 0) return;

	for (let sheet_idx in document.styleSheets) {
		let sheet = document.styleSheets[sheet_idx];
		let cssRules = sheet.cssRules;
		for (let rule_idx in cssRules) {
			let selectorText = cssRules[rule_idx].selectorText;
			if (selectorText && selectorText === selector) {
				cssRules[rule_idx].cssText = selector + ' { ' + style + ' }';
				cssRules[rule_idx].style.cssText = style;
			}
		}
	}
}

export class doStyle {
	changeStylesheetRule(stylesheet, selector, property) {
		// Make the strings lowercase
		let sel = selector.toLowerCase();
		for (let i = 0; i < stylesheet.cssRules.length; i++) {
			let rule = stylesheet.cssRules[i];
			if (rule.selectorText === sel) {
				for (let prop in property) {
					rule.style[prop] = property[prop];
				}
				return 1;
			}
		}

		return 0;
	}
	changeStyle(selector, property) {
		for (let n = 0; n < document.styleSheets.length; n++) {
			if (this.changeStylesheetRule(document.styleSheets[n], selector, property)) break;
		}
	}
	constructor() {}
}
