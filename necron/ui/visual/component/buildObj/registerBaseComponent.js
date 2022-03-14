import {
	registerBaseComponent,
	registerBaseTSXComponent,
	registerObsoleteComponent,
	registerShareComponent
} from '../../../engine/registerUI';
//window.eparts.elements[uiname]

let defaultMap = {
	tfield: 'inputBase',
	efield: 'textFieldBase',
	lfield: 'logBase',
	sbox: 'comboBoxBase',
	delim: 'headlineBase',
	switch: 'switchBase',
	graph_line: 'graphBase',
	graph_bar: 'graphBase',
	gfile: 'uploadBase',
	var: 'var',
	errmsg: 'messageErr',
	flymsg: 'messageFly',
	flymsgslide: 'messageFlySlide',
	flyconfirm: 'messageFlyConfirm',
	slidemsg: 'messageSlide',
	add_overlay: 'addWaitOverlay',
	del_overlay: 'delWaitOverlay',
	box: 'boxBase',
	wiznavi: 'wizNavi',
	wiznavi_checkbox: 'wizNaviCheckbox',
	wiznavi_butt: 'wizNavi',
	wizlogic: 'wizLogic',
	wizinfo: 'wizInfo',
	wizevent: 'wizEvent',
	wizevent_msg: 'wizEvent',
	backWizButt: 'wizEvent',
	_wnaback: 'wizEvent',
	_wnamenu: 'wizEvent',
	wiznavi_header: 'wizNaviHeader',

	dnk_root: 'dnk_root',
	dnk_nod: 'dnk_nod',
	plainlayout: 'layoutBase',
	stab: 'stdTab',
	wtab: 'wrapTab',
	dswitch: 'dnkSwitch',
	dfield: 'dnkInput',
	dgraph: 'dnkGraph',
	imgst: 'imgStateBase',
	dpanel: 'dnkPanel',
	dslider: 'dnkSlider',
	reactjs: 'reactjsBase',
	tips: 'tipsBase',
	undefined: 'skip',
	hide: 'skip',
	br: 'skip',
	button_a: 'buttonBase', //'JS_Button_a',
	table: 'tableObsolete', //'JS_CreateTable',
	multiform: 'multiFormBase', //'JS_CreateMultiForm',
	label: 'labelBase', //'JS_CreateLabel',
	infobox: 'infoBoxBase', //'JS_CreateInfoBox',
	debug: 'skip', //'JS_CreateDebug',
	debugLinks: 'debugLinks',
	sboxradio: 'comboBoxRadio' //'JS_ComboBoxRadio',
};

export { defaultMap };

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async function () {
	//await registerBaseComponent('rg_box');
	//await registerBaseComponent('rg_comboBoxBase');
	//await registerBaseComponent('rg_dnk');

	//await registerBaseComponent('rg_dnk_graph');
	//await registerBaseComponent('rg_dnk_input');
	//await registerBaseComponent('rg_dnk_panel');
	//await registerBaseComponent('rg_dnk_switch');

	//await registerBaseComponent('rg_graph');

	//await registerBaseComponent('rg_input_base');
	//registerBaseComponent('rg_keyboard');

	//await registerBaseComponent('rg_log');
	//await registerBaseComponent('rg_reactjs');
	//await registerBaseComponent('rg_rest');
	//await registerBaseComponent('rg_switchBase');

	//await registerBaseComponent('rg_tab');
	//await registerBaseComponent('rg_textFieldBase');
	//await registerBaseComponent('rg_tips');

	//await registerBaseComponent('rg_wizard');
	//await registerBaseComponent('rg_switchBase');
	//await registerBaseComponent('rg_var');
	//await registerBaseComponent('rg_skip');
	//await registerBaseComponent('rg_debug');

	//await registerObsoleteComponent('rg_button');
	//await registerObsoleteComponent('rg_combobox');
	//await registerObsoleteComponent('rg_editlabel');

	//shared
	await registerShareComponent('overlay');
	await registerShareComponent('dnk');
	await registerShareComponent('sharedMessage');
	//base TS

	await registerBaseTSXComponent('inputBase');
	await registerBaseTSXComponent('labelBase');
	await registerBaseTSXComponent('switchBase');
	await registerBaseTSXComponent('textFieldBase');
	await registerBaseTSXComponent('logBase');
	await registerBaseTSXComponent('comboBoxBase');
	await registerBaseTSXComponent('comboRadioBase');
	await registerBaseTSXComponent('tipsBase');
	await registerBaseTSXComponent('boxBase');
	await registerBaseTSXComponent('headlineBase');
	await registerBaseTSXComponent('buttonBase');
	await registerBaseTSXComponent('tab');
	await registerBaseTSXComponent('imageStateBase');
	await registerBaseTSXComponent('uploadBase');
	await registerBaseTSXComponent('layoutBase');
	await registerBaseTSXComponent('multiformBase');
	await registerBaseTSXComponent('reactjsBase');
	await registerBaseTSXComponent('graphBase');
	//base TS
	//DNK
	await registerBaseTSXComponent('dnkGraph');
	await registerBaseTSXComponent('dnkSwitch');
	await registerBaseTSXComponent('dnkPanel');
	await registerBaseTSXComponent('dnkInput');
	//DNK
	await registerBaseTSXComponent('debug');
	await registerBaseTSXComponent('wizard');
	await registerBaseTSXComponent('var');
	await registerBaseTSXComponent('skip');
}
