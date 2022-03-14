/**
 * Created by Ilya on 30.01.2020.
 */

import { addExampleFormat, global, $ } from '../../../../engine/___global.js';
import { SetMetaForce } from '../../../../engine/_metaVar';
import { AddEventWrapper } from '../../../../engine/event';
import { nu, t, u } from '../../../../engine/_core';
import { PastControllerReact } from '../../../../engine/_pastController';
import { svalueController } from '../../../../engine/var';
import { genBidForDNK } from '../../shared/base/dnk';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { buildObjOnMount, buildObjOnUmount } from '../../../../engine/_buildEng';
import filter from '../../../../engine/filtersV2';
import { makeObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import DateRangePicker from '@wojtekmaj/react-daterange-picker';

import DatePicker from 'react-date-picker';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import moment from 'moment';
import { createElement } from '../componentType';
import { GetAllMeta } from '../../../../engine/_metaVar';

addExampleFormat('CreateInputDNK_repDlgSelect', {
	type: 'dfield',
	id: 'dfield',
	name: 'dfield',
	value: '1',
	isSec: false,
	isRo: false,
	//режим rep - замена значений по списку replace и блокировка значений не из списка
	svalue: ['{"chvar":{"mode":"rep","value":["0","1"],"replace":["On","Off"]}}']
});

addExampleFormat('CreateInputDNKbuttonExColInTable', {
	gazStartMeas: {
		type: 'dfield',
		svalue: [
			'{"chvar":{"mode":"rep","value":["unblock","run","block"],"replace":["verStart","verMRun","verMBlock"]}}'
		],
		isRo: true,
		//format:'int',
		//min:20,
		stylize: {
			changeclass: {
				global: 'dnk_main_global_col_end',
				global_input: 'dnk_inputbutton_global_input',
				input: 'dnk-inputbutton_input'
			},
			link: {
				columns: [
					'y_sga_config_verification_gazBalon_gazBalonName',
					'y_sga_config_verification_gazBalon_gazBalonVerification',
					'y_sga_config_verification_gazBalon_gazBalonValve',
					'y_sga_config_verification_gazBalon_gazRefValue',
					'y_sga_config_verification_gazBalon_gazMeasOld'
				],
				remove: true,
				add: true,
				defvalue: 'block'
			},
			value: {
				10: {
					cond: '<',
					input: 'dnk-inputbutton_input_less10'
				},
				50: {
					cond: '>',
					input: 'dnk-inputbutton_input_less50'
				},
				'...': {
					cond: '==',
					input: 'dnk-inputbutton_input dnk_inputbutton_global_input'
				},
				run: {
					cond: '==',
					input: 'dnk-inputbutton_input_run'
				},
				block: {
					cond: '==',
					input: 'dnk-inputbutton_input_stop'
				}
			}
		},
		event: {
			click: [
				{
					type: 'action',
					param: {
						action: 'gazStartMeas',
						params_provider: 'IdProvider',
						subscribers: []
					}
				}
			]
		}
	}
});

function PlaceLabel(prop: any): JSX.Element {
	let labelName = prop.engValue.Obj['name'];

	if (prop.engValue['showname'] !== undefined) {
		if (prop.engValue['showname'] === false) {
			labelName = '';
		}
	}

	const class_styles = prop.engValue.class_styles;
	if (prop.engValue.ln_add) {
		return (
			<div className={class_styles.input + '_wrapper'}>
				<label className={class_styles.label} id={'lab' + prop.Id}>
					{labelName}
				</label>
			</div>
		);
	} else
		return (
			<label className={class_styles.label} id={'lab' + prop.Id}>
				{labelName}
			</label>
		);
}

const valueController = (Obj: any): any => {
	let tVal;
	if (u(Obj.evalue)) {
		tVal = Obj.evalue;
	} else tVal = Obj.value;

	let value = [];
	if (Array.isArray(tVal)) value = tVal;
	else value[0] = tVal;
	return value;
};

const initValue = (v: any) => {
	const Obj = v.Obj;
	const Id = v.Id;
	const MetaVar = GetAllMeta(Obj.contentClass);
	if (u(Obj.value)) {
		if (MetaVar[Id] === undefined) MetaVar[Id] = {};

		MetaVar[Id].value = Obj.value;
	}
};

const selectChvarMode = (v: any) => {
	const Obj = v.Obj;
	if (u(Obj['isRo']) && Obj['isRo'] === false) {
		v.isRo = false;
		if (nu(Obj.svalue)) {
			Obj.svalue = ['{"chvar":{"mode":"edit"}}'];
		}
		//ChangeMode!!!
		// if (u(Obj.svalue)) {
		const sv = JSON.parse(Obj.svalue);
		if (u(sv.chvar)) {
			if (
				sv.chvar.mode === 'date_one' ||
				sv.chvar.mode === 'date_two' ||
				sv.chvar.mode === 'rep' ||
				sv.chvar.mode === 'edit' ||
				sv.chvar.mode === '/' ||
				sv.chvar.mode === 'time'
			) {
				v.chvar = sv.chvar;
			}
			if (sv.chvar.mode === 'date_one' || sv.chvar.mode === 'date_two' || sv.chvar.mode === 'rep')
				v.cursorEditable = false;
		}
		// }
	} else v.cursorEditable = false;

	if (v.chvar.mode !== 'z') {
		v.class_styles.global_input =
			v.class_styles.global_input + ' ' + v.class_styles.global_input + '_edit';
	}
};

const stylizeValue = (value: any, engValue: any) => {
	const change_class = (cls: any) => {
		let resultInputAddition = '';
		for (const item in cls) {
			if (item === 'cond') continue;

			if (item === 'input') {
				resultInputAddition = cls[item];
			}
		}
		return resultInputAddition;
		//if (!this.mark[n].hasClass(cls)) {
		//	this.mark[n].removeClass();
		//	this.mark[n].addClass(cls);
		//}
	};
	const Obj = engValue.Obj;
	if (engValue.stonval) {
		for (const type in Obj.stylize.value) {
			if (Obj.stylize.value[type].cond === '<') {
				const valNumber = typeof value === 'string' ? parseInt(value) : value;
				if (valNumber < type) {
					return change_class(Obj.stylize.value[type]);
				}
			}
			if (Obj.stylize.value[type].cond === '>') {
				const valNumber = typeof value === 'string' ? parseInt(value) : value;
				if (valNumber > type) {
					return change_class(Obj.stylize.value[type]);
				}
			}
			if (Obj.stylize.value[type].cond === '==') {
				if (value === type) {
					return change_class(Obj.stylize.value[type]);
				}
			}
		}
	}
	return '';
};

const stylizeController = (v: any) => {
	const Obj = v.Obj;
	if (u(Obj.stylize)) {
		if (u(Obj.stylize.link)) {
			if (u(Obj.stylize.link.columns)) {
				v.columns = Obj.stylize.link.columns;
				v.ln_remove = Obj.stylize.link.remove;
				v.ln_add = Obj.stylize.link.add;
				if (v.ln_remove) v.wrapper = true;

				if (u(Obj.stylize.link.defvalue)) {
					v.defvalue.present = true;
					v.defvalue.val = Obj.stylize.link.defvalue;
				}
			}
		}
		if (u(Obj.stylize.value)) {
			v.stonval = true;
		}
	}
};

const selectInputType = (v: any) => {
	const Obj = v.Obj;
	if (u(Obj['isSec']) && Obj['isSec'] === true) {
		v.input_type = 'password';
	}

	if (Obj.isSlide) {
		v.input_type = 'range';
		v.wrapper = true;
	}
	if (u(Obj.format)) v.format = Obj.format;
	if (u(Obj.min)) v.min = Obj.min;
};

const preBuild = (v: any) => {
	// console.log('Input DNK field');
	const defClass = {
		main: 'dnk-inputfield_main',
		global: 'dnk_main_global',
		label: 'dnk-inputlabel',
		input: 'dnk-inputfield_input',
		inputWrapper: '_wrapper',
		inputMain: 'dnk-inputfield_input_main',
		global_input: 'dnk_global_input',
		inputRepItem: 'SelValComboBaseMain inputSelValComboBaseItem',
		inputRepDialog: 'SelValComboBaseMain inputSelValComboBaseMain',
		inputRepOverlay: 'SelValComboBaseOverlay',
		mainSelect: 'SelValComboBaseMainSelect',
		mainChanged: '_changed'
	};

	const wrapStOnVal = (v: any) => v;
	/*if (v.stonval) {
		wrapStOnVal = (v) => makeAutoObservable(v);
	}*/
	if (u(v.Obj.stylize) && u(v.Obj.stylize.changeclass)) {
		v.class_styles = wrapStOnVal($.extend(true, defClass, v.Obj.stylize.changeclass));
	} else {
		v.class_styles = wrapStOnVal(defClass);
	}
	const mainStyle = v.class_styles.main.split(' ')[0];
	v.class_styles.inputRepDialog = mainStyle + v.class_styles.inputRepDialog;
	v.class_styles.inputRepOverlay = mainStyle + v.class_styles.inputRepOverlay;
	v.class_styles.mainChanged = mainStyle + v.class_styles.mainChanged;
	v.class_styles.mainSelect = mainStyle + v.class_styles.mainSelect;

	const inpStyle = v.class_styles.input.split(' ')[0];
	v.class_styles.inputRepItem = inpStyle + v.class_styles.inputRepItem;
	v.class_styles.inputWrapper = inpStyle + v.class_styles.inputWrapper;
};

function InitLocalVar({ blockId, Id, Obj }: any): any {
	class localStore {
		value: any = '';
		changed = false;
		selected = false;
		showRepDialog = false;
		showSelDateDialog: any = false;
		dateDialogRange = false;
		selValue = 0;
		constructor() {
			this.showRepDialog = false;
			this.changed = false;
			this.selected = false;
			this.value = valueController(Obj);
			this.selValue = 0;
			this.dateDialogRange = false;
			makeObservable(this, {
				value: observable,
				changed: observable,
				selected: observable,
				showRepDialog: observable,
				showSelDateDialog: observable
			});
		}
	}

	let stonval = false;
	if (Obj.stylize !== undefined && Obj.stylize.value !== undefined) {
		stonval = true;
	}

	return {
		class_styles: {
			mainChanged: {}
		},
		columns: [],
		Id: Id,
		blockId: blockId,
		Obj: Obj,
		contentClass: Obj.contentClass,
		wrapper: false,
		isRebuild: true,
		isResize: true,
		ln_remove: false,
		ln_add: false,
		label: {},
		isRo: true,
		isSlide: Obj.isSlide,
		cursorEditable: true,
		format: 'string',
		chvar: { mode: 'z' },
		input_type: 'text',
		mark: [],
		min: 0,
		defvalue: {
			present: false,
			val: ''
		},
		stonval: stonval,
		localStore: new localStore()
	};
}
const build = (variables: any) => {
	variables.columns = [];
	variables.wrapper = false;
	variables.isRebuild = true;
	variables.isResize = true;
	variables.ln_remove = false;
	variables.ln_add = false;
	variables.label = {};
	variables.isRo = true;
	variables.cursorEditable = true;
	variables.format = 'string';
	variables.chvar = { mode: 'z' };
	variables.input_type = 'text';
	variables.mark = [];
	variables.min = 0;
	variables.defvalue = {
		present: false,
		val: ''
	};

	variables.stonval = false;
	stylizeController(variables);
	selectInputType(variables);
	initValue(variables);
	selectChvarMode(variables);
};

function convOne(val: any, engValue: any) {
	let r;
	switch (engValue.format) {
		case 'int':
			r = parseInt(val);
			if (isNaN(r)) {
				r = engValue.min;
			}
			val = r;
			break;
		case 'float':
			r = parseFloat(val);
			if (isNaN(r)) r = engValue.min;
			val = r;
			break;
	}
	return val;
}

function changeValueOnInputEdit(Id: string, n: number, engValue: any, value: any) {
	const MetaVar = GetAllMeta(engValue.contentClass);
	if (Array.isArray(MetaVar[Id].value)) {
		if (typeof MetaVar[Id].value[n] == 'number') {
			let cv = Number(value);
			if (isNaN(cv))
				//если новое значение отличается по типу, то меняем тип
				cv = value;
			MetaVar[Id].value[n] = convOne(cv, engValue);
		} else MetaVar[Id].value[n] = convOne(value, engValue);
	} else {
		if (typeof MetaVar[Id].value == 'number') {
			let cv = Number(value);
			if (isNaN(cv))
				//если новое значение отличается по типу, то меняем тип
				cv = value;
			MetaVar[Id].value = convOne(cv, engValue);
		} else MetaVar[Id].value = convOne(value, engValue);
	}
	runInAction(() => {
		engValue.localStore.changed = true;
	});
	//this.setChangedStyleWlink(Id, engValue.columns);
}

function changeValueOnInputSub(Id: string, n: number, engValue: any, value: any) {
	const MetaVar = GetAllMeta(engValue.contentClass);
	if (Array.isArray(MetaVar[Id].value)) {
		MetaVar[Id].value[n] = convOne(Number(value) * engValue.chvar.value, engValue);
	} else {
		MetaVar[Id].value = convOne(Number(value) * engValue.chvar.value, engValue);
	}
	runInAction(() => {
		engValue.localStore.changed = true;
	});
	//this.setChangedStyleWlink(Id, this.columns);
}

function changeValueOnInputTime(Id: string, n: number, engValue: any, value: string) {
	const hhmm = value.split(':');
	const MetaVar = GetAllMeta(engValue.contentClass);
	if (Array.isArray(MetaVar[Id].value)) {
		if (engValue.chvar.format === 'hh:mm') {
			MetaVar[Id].value[n] = convOne(+hhmm[0] * 60 * 60 + +hhmm[1] * 60, engValue); // + (+a[2]);
		} else {
			MetaVar[Id].value[n] = 0;
		}
	} else {
		if (engValue.chvar.format === 'hh:mm') {
			MetaVar[Id].value = convOne(+hhmm[0] * 60 * 60 + +hhmm[1] * 60, engValue); // + (+a[2]);
		} else {
			MetaVar[Id].value = 0;
		}
	}
}

function selectEventHandler(engValue: any, n: number) {
	const Id = engValue.Id;
	const isRo = engValue.isRo;
	const chvar = engValue.chvar;
	const result: any = {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		input: () => {},
		click: undefined
	};
	if (isRo === false) {
		if (chvar.mode === 'edit') {
			result.input = (evt: any) => {
				const value = evt.target.value;
				//setValue(value);
				runInAction(() => {
					engValue.localStore.value[n] = value;
				});
				changeValueOnInputEdit(Id, n, engValue, value);
			};
		}
		if (chvar.mode === '/') {
			result.input = (evt: any) => {
				const value = evt.target.value;
				runInAction(() => {
					engValue.localStore.value[n] = value;
				});
				changeValueOnInputSub(Id, n, engValue, value);
			};
		}
		if (chvar.mode === 'time') {
			result.input = (evt: any): any => {
				const value = evt.target.value;
				runInAction(() => {
					engValue.localStore.value[n] = value;
				});
				changeValueOnInputTime(Id, n, engValue, value);
			};
		}
		if (chvar.mode === 'rep') {
			//('#'+bitid).click(function(){
			result.click = () => {
				if (chvar.mode === 'rep') {
					runInAction(() => {
						engValue.localStore.selValue = n;
						engValue.localStore.showRepDialog = true;
						engValue.localStore.selected = true;
					});
				}
			};
		}
		if (chvar.mode === 'date_one') {
			result.click = () => {
				runInAction(() => {
					engValue.localStore.selValue = n;
					engValue.localStore.showSelDateDialog = true;
					engValue.localStore.selected = true;
					engValue.localStore.dateDialogRange = false;
				});
			};
		}
		if (chvar.mode === 'date_two') {
			result.click = () => {
				runInAction(() => {
					engValue.localStore.selValue = n;
					engValue.localStore.showSelDateDialog = true;
					engValue.localStore.selected = true;
					engValue.localStore.dateDialogRange = true;
				});
			};
		}
	}
	return result;
}

const PlaceInputChild = observer((prop: any): JSX.Element => {
	const engValue = prop.engValue;
	const n = prop.pos;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	const [evt, setEvt] = useState({ click: undefined, input: () => {} });

	const Obj = engValue.Obj;

	let comp_name;
	if (u(Obj.name)) comp_name = Obj.name;
	else comp_name = engValue.Id;
	const readonly = !engValue.cursorEditable;
	const locId = engValue.Id + n;

	useEffect(() => {
		setEvt(selectEventHandler(engValue, n));
	}, []);

	let err;
	if (engValue.cursorEditable) {
		err = filter.check(Obj, engValue.localStore.value[n]);
	}
	let errClass = '';
	if (Array.isArray(err) && err.length !== 0) {
		errClass += ' XFL_error_input';
	}

	const slideTextId = engValue.Id + n + '_out';

	const extendInputStyle = stylizeValue(engValue.localStore.value[n], engValue);
	const slideView: JSX.Element = (
		<input
			key={slideTextId}
			id={slideTextId}
			value={engValue.localStore.value[n]}
			onInput={evt.input}
			className={
				engValue.class_styles.input +
				'_out' +
				' ' +
				engValue.class_styles.global_input +
				' ' +
				extendInputStyle
			}
		/>
	);

	const showValue =
		Number.isNaN(engValue.localStore.value[n]) || engValue.localStore.value[n] === undefined
			? ''
			: engValue.localStore.value[n];

	if (Obj.min !== undefined) {
		return (
			<>
				<input
					key={locId}
					className={
						extendInputStyle +
						' ' +
						engValue.class_styles.input +
						' ' +
						engValue.class_styles.global_input +
						errClass
					}
					type={engValue.input_type}
					id={locId}
					value={showValue}
					readOnly={readonly}
					name={comp_name}
					min={Obj.min}
					max={Obj.max}
					step={Obj.step}
					onClick={evt.click}
					onInput={evt.input}
				/>
				{engValue.isSlide && slideView}
			</>
		);
	} else
		return (
			<>
				<input
					key={locId}
					className={
						extendInputStyle +
						' ' +
						engValue.class_styles.input +
						' ' +
						engValue.class_styles.global_input +
						errClass
					}
					type={engValue.input_type}
					id={locId}
					value={showValue}
					readOnly={readonly}
					name={comp_name}
					onClick={evt.click}
					onInput={evt.input}
				/>
				{engValue.isSlide && slideView}
			</>
		);
});

function PlaceInput(prop: any): JSX.Element {
	const engValue = prop.engValue;

	const MetaVar = GetAllMeta(engValue.contentClass);
	if (MetaVar[engValue.Id] === undefined) MetaVar[engValue.Id] = {};

	function addItem(n: number) {
		const key = engValue.Id + n;
		//engValue.localStore.value[n]=val;
		if (engValue.wrapper) {
			return (
				<div key={key} className={engValue.class_styles.inputWrapper}>
					<PlaceInputChild key={key} engValue={prop.engValue} pos={n} />
				</div>
			);
		} else {
			return <PlaceInputChild key={key} engValue={prop.engValue} pos={n} />;
		}
	}
	const itemView: JSX.Element[] = [];
	engValue.localStore.value.forEach((val: any, n: number) => {
		itemView.push(addItem(n));
	});

	return <div className={engValue.class_styles.inputMain}>{itemView}</div>;
}

const RepDateDialog = observer((prop: any): JSX.Element => {
	const blockId = prop.engValue.blockId;
	const engValue = prop.engValue;

	//useEffect(() => {}, []);
	const [rangeValue, setRangeValue] = useState([new Date(), new Date()]);
	const [value, setValue] = useState(new Date());

	const closeDialog = () => {
		runInAction(() => {
			engValue.localStore.showSelDateDialog = false;
			engValue.localStore.selected = false;
			engValue.localStore.changed = true;
		});
	};
	function onChange(val: any) {
		let dat1: any;
		let dat2: any;
		let ts1: string;
		let ts2: string;
		const format = engValue.chvar.format ?? 'DD/MM/YYYY';

		const MetaVar = GetAllMeta(engValue.contentClass);
		if (engValue.localStore.dateDialogRange) {
			dat1 = new Date(val[0]);
			ts1 = dat1.getTime();
			dat2 = new Date(val[1]);
			ts2 = dat2.getTime();
			setRangeValue([dat1, dat2]);
			MetaVar[blockId].value[0] = convOne(ts1, engValue);
			MetaVar[blockId].value[1] = convOne(ts2, engValue);
			runInAction(() => {
				engValue.localStore.value[0] = moment(parseInt(ts1)).format(format);
				engValue.localStore.value[1] = moment(parseInt(ts2)).format(format);
			});
		} else {
			dat1 = new Date(val);
			ts1 = dat1.getTime();
			setValue(dat1);
			dat1.toJSON();
			MetaVar[blockId].value = convOne(ts1, engValue);
			runInAction(() => {
				engValue.localStore.value[0] = moment(parseInt(ts1)).format(format);
			});
		}

		global.api.storagesEng.detActionsOnInput();
		closeDialog();
	}
	if (engValue.localStore.showSelDateDialog) {
		runInAction(() => {
			engValue.localStore.selected = true;
		});
		return (
			<div>
				<div key={'child'} id={`${blockId}Child`} className={engValue.class_styles.inputRepDialog}>
					{engValue.localStore.dateDialogRange ? (
						<DateRangePicker
							calendarIcon={false}
							clearIcon={false}
							onChange={onChange}
							value={rangeValue}
							isOpen={true}
						/>
					) : (
						<DatePicker
							calendarIcon={null}
							clearIcon={null}
							onChange={onChange}
							value={value}
							isOpen={true}
						/>
					)}
				</div>
				<div key={'over'} className={engValue.class_styles.inputRepOverlay} onClick={closeDialog} />
			</div>
		);
	} else return null;
});

const RepDialog = observer((prop: any): JSX.Element => {
	const blockId = prop.engValue.blockId;
	const engValue = prop.engValue;
	const Id = prop.engValue.Id;

	//const { setShowRepDialog, setValue, setChanged } = useContext(DnkContext);
	const itemsName = engValue.chvar.replace;
	const itemsVal = engValue.chvar.value;
	const closeDialog = () => {
		runInAction(() => {
			engValue.localStore.showRepDialog = false;
			engValue.localStore.selected = false;
			engValue.localStore.changed = true;
		});
	};

	const selectValue = (param: any) => {
		const itemId = param.currentTarget.id;
		const itemNum = parseInt(itemId.match(/\d+$/)[0]);
		const val = itemsVal[itemNum];
		const name = itemsName[itemNum];
		const selValue = engValue.localStore.selValue;
		runInAction(() => {
			engValue.localStore.value[selValue] = t(name);
		});

		//global.MetaVar_BlockOnEvtChanged = true;
		//global.api.storagesEng.detActionsOnInput();
		const MetaVar = GetAllMeta(engValue.contentClass);
		if (Array.isArray(MetaVar[Id].value)) {
			const idx = itemId.match(/(\d+)(?!.*\d)/g);
			MetaVar[Id].value[idx] = convOne(val, engValue);
			//MetaVar[engValue.contentClass][Id].changed = true;
		} else
			MetaVar[Id] = {
				value: convOne(val, engValue)
				//changed: true
			};
		closeDialog();
	};

	if (engValue.localStore.showRepDialog)
		return (
			<div>
				<div key={'child'} id={`${blockId}Child`} className={engValue.class_styles.inputRepDialog}>
					{itemsName.map((val: any, n: number) => {
						return (
							<div
								key={n}
								className={engValue.class_styles.inputRepItem}
								id={`${blockId}Item${n}`}
								onClick={selectValue}
							>
								{t(itemsName[n])}
							</div>
						);
					})}
				</div>
				<div key={'over'} className={engValue.class_styles.inputRepOverlay} onClick={closeDialog} />
			</div>
		);
	else return null;
});

function dnkInputElement(blockId: string, { Id, Obj }: createElement): JSX.Element {
	const engValue = InitLocalVar({ blockId, Id, Obj });
	preBuild(engValue);

	const MetaVar = GetAllMeta(Obj.contentClass);
	const DnkInput = observer(() => {
		//const [showRepDialog, setShowRepDialog] = useState(false);
		const mainClass =
			engValue.class_styles.main + ' ' + engValue.class_styles.global + ' ' + genBidForDNK(Obj);

		useEffect(() => {
			buildObjOnMount(Obj);
			if (Obj.rvalue) {
				const rvalue = JSON.parse(Obj.rvalue);
				AddEventWrapper(
					rvalue,
					function (event: any) {
						const val = event[rvalue.value];

						if (u(MetaVar[Id].changed) && MetaVar[Id].changed === true) {
							if (!Array.isArray(val)) {
								if (val === MetaVar[Id].value) {
									runInAction(() => {
										engValue.localStore.changed = false;
									});
								}
							} else {
								let trig = false;
								for (let n = 0, z = 0; n < val.length; n++) {
									// eslint-disable-next-line no-constant-condition
									while (true) {
										if (MetaVar[Id].value.length > z && MetaVar[Id].value[z] === undefined) {
											z++;
										} else break;
									}

									if (val[n] !== MetaVar[Id].value[z]) {
										trig = true;
										break;
									}
									z++;
								}
								if (!trig) {
									runInAction(() => {
										engValue.localStore.changed = false;
									});
								}
							}
							return;
						}
						const svObj: any = {
							value: val,
							evalue: undefined,
							svalue: undefined
						};

						if (Obj.svalue !== undefined) svObj.svalue = [...Obj.svalue];

						svalueController(svObj);

						//	if (Array.isArray(svObj.value) && Array.isArray(MetaVar[Id].value)) {
						//	if (MetaVar[Id].value.length !== MetaVar[Id].ovsz)
						//если размеры массивов отличаются, то перестроить весь столбец
						//}

						let outval = svObj.value;
						if (u(svObj.evalue)) {
							outval = svObj.evalue;
						}
						if (rvalue.syncMetaVar === 1) {
							//MetaVar синхр. в DNK до прихода события, но если DNK не использ., они синхр. здесь
							SetMetaForce(
								{
									id: Id,
									value: val
								},
								Obj.contentClass
							);
							// MetaVar[Id].value=val;
						}
						if (Array.isArray(outval)) {
							for (let n = 0; n < outval.length; n++) {
								if (u(outval[n])) {
									runInAction(() => {
										engValue.localStore.value[n] = outval[n];
									});
								}
							}
						} else {
							runInAction(() => {
								engValue.localStore.value[0] = outval;
							});
						}
					},
					Id
				);
			}
			return () => {
				buildObjOnUmount(Obj);
			};
		}, []);
		let mainClassWChg = mainClass;
		if (engValue.localStore.changed) {
			mainClassWChg += ' ' + engValue.class_styles.mainChanged;
			MetaVar[Id].changed = true;
		} else {
			MetaVar[Id].changed = false;
		}
		if (engValue.localStore.selected) {
			mainClassWChg += ' ' + engValue.class_styles.mainSelect;
		}
		return (
			<div id={'div' + Id} className={mainClassWChg}>
				<PlaceLabel engValue={engValue} />
				<PlaceInput engValue={engValue} />
				<RepDialog engValue={engValue} />
				<RepDateDialog engValue={engValue} />
			</div>
		);
	});

	build(engValue);
	/*
	if (engValue.isRebuild) {
		let rebuild_event_id = Id + 'Rebuild';
		removeEventFromEventListeners(rebuild_event_id);
		let reb_evlistener = () => {
			remove();
			build();
			eventController(Obj);
		};
		reb_evlistener();
		createEventToEventListeners(rebuild_event_id, reb_evlistener);
	}*/
	return <DnkInput key={Id} />;
}

function dnkInputCreateBase({ PastTo, Id, Obj }: createElement): string {
	const blockId = Id;
	PastControllerReact({
		PastTo,
		Obj,
		Id: blockId,
		ReactElement: dnkInputElement(blockId, { Id, Obj })
	});
	return blockId;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function dnkInputDebug(Obj: any): JSX.Element {
	const blockId = Obj.id;
	return dnkInputElement(blockId, { Id: Obj.id, Obj });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const dnkInputCreate = (PastTo: string, Id: string, Obj: any) => {
	return dnkInputCreateBase({ PastTo, Id, Obj });
};

function modObjForSlider(Obj: any) {
	Obj.isSlide = true;
	if (nu(Obj.min)) Obj.min = 0;

	if (nu(Obj.max)) Obj.max = 100000;

	if (nu(Obj.step)) Obj.step = 10;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const dnkSliderCreate = (PastTo: string, Id: string, Obj: any) => {
	modObjForSlider(Obj);
	return dnkInputCreate(PastTo, Id, Obj);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function dnkSliderDebug(Obj: any): JSX.Element {
	modObjForSlider(Obj);
	return dnkInputDebug(Obj);
}

export default {
	dnkInput: {
		create: dnkInputCreate,
		test: dnkInputDebug
		//create: create
	},
	dnkSlider: {
		//create:create
		create: dnkSliderCreate,
		test: dnkSliderDebug
	}
};
