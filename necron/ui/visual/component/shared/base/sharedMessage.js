/**
 * Created by i7 on 11.10.2017.
 */

import { global } from '../../../../engine/___global.js';
import { t } from '../../../../engine/_core';
import merge from 'deepmerge';

import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';

import ReactDOM, { unmountComponentAtNode } from 'react-dom';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
let MessageID = 0;

export function flyFieldConfirm(Message, DateStr, FClose, FYes, FNo, Opts) {
	let DefOpts = {
		fclose: FClose,
		fyes: FYes,
		fno: FNo,
		inputField: true,
		date: DateStr,
		slide_time: 0,
		inputId: 'inputId',
		style: {
			main: 'fly_modal',
			content: 'fly_modal-content',
			title: 'fly_modal-title',
			dialog_content: 'fly_modal-dialog-content',
			dialog_action: 'fly_modal-dialog-action',
			button_yes: 'upLeftButton',
			button_no: 'upLeftButton',
			button_close: 'upLeftButton',
			unread: 'fly_sys-event_dlg-unread',
			inputFieldMain: 'fly_inputFieldMain',
			inputFieldInput: 'fly_inputFieldInput',
			inputFieldLabel: 'fly_inputFieldLabel',
			text: {
				yes: 'confirm',
				no: 'noСonfirm',
				close: 'close'
			}
		}
	};
	let param = DefOpts;
	if (Opts) param = merge(DefOpts, Opts); //$.extend(true, DefOpts, Opts);

	const tagMessage = document.createElement('div');
	document.getElementById(global.TAG_MESSAGE).appendChild(tagMessage);

	ReactDOM.render(
		<FlyMessageExtend
			Message={Message}
			Opts={param}
			close={() => {
				ReactDOM.unmountComponentAtNode(tagMessage);
				tagMessage.remove();
			}}
		/>,
		tagMessage
	);
}

function flyMessageSlide(Message, DateStr, SlideTime, Opts) {
	let DefOpts = {
		fclose: undefined,
		fyes: undefined,
		fno: undefined,
		inputField: false,
		date: DateStr,
		slide_time: SlideTime,
		style: {
			main: 'fly_modal',
			content: 'fly_modal-content',
			title: 'fly_modal-title',
			dialog_content: 'fly_modal-dialog-content',
			dialog_action: 'fly_modal-dialog-action',
			button_yes: 'upLeftButton',
			button_no: 'upLeftButton',
			button_close: 'upLeftButton',
			unread: 'fly_sys-event_dlg-unread',
			inputField: 'fly_input_field',
			text: {
				yes: t('yes'),
				no: t('no'),
				close: t('close')
			}
		}
	};

	let param = DefOpts;
	if (Opts) param = merge(DefOpts, Opts);

	const tagMessage = document.createElement('div');
	document.getElementById(global.TAG_MESSAGE).appendChild(tagMessage);
	ReactDOM.render(
		<FlyMessageExtend
			Message={Message}
			Opts={param}
			close={() => {
				ReactDOM.unmountComponentAtNode(tagMessage);
				tagMessage.remove();
			}}
		/>,
		tagMessage
	);

	if (SlideTime !== 0)
		setTimeout(() => {
			ReactDOM.unmountComponentAtNode(tagMessage);
			tagMessage.remove();
			if (MessageID > 0) MessageID--;
		}, param.slide_time);
}

export function flyMessage(Message, DateStr, FClose, FYes, FNo, Opts) {
	let DefOpts = {
		fclose: FClose,
		fyes: FYes,
		fno: FNo,
		inputField: false,
		date: DateStr,
		slide_time: 0,
		style: {
			main: 'fly_modal',
			content: 'fly_modal-content',
			title: 'fly_modal-title',
			dialog_content: 'fly_modal-dialog-content',
			dialog_action: 'fly_modal-dialog-action',
			button_yes: 'upLeftButton',
			button_no: 'upLeftButton',
			button_close: 'upLeftButton',
			unread: 'fly_sys-event_dlg-unread',
			inputField: 'fly_input_field',
			text: {
				yes: 'yes',
				no: 'no',
				close: 'close'
			}
		}
	};
	let param = DefOpts;
	if (Opts) param = merge(DefOpts, Opts);
	if (!param.fclose && !param.fyes && !param.fno) param.fclose = () => {};
	const tagMessage = document.createElement('div');
	document.getElementById(global.TAG_MESSAGE).appendChild(tagMessage);

	ReactDOM.render(
		<FlyMessageExtend
			Message={Message}
			Opts={param}
			close={() => {
				unmountComponentAtNode(tagMessage);
				tagMessage.remove();
			}}
		/>,
		tagMessage
	);
}

const FlyMessageExtend = ({ Message, Opts, close }) => {
	let style = Opts.style;
	MessageID++;
	const closeClick = () => {
		MessageID--;
		if (MessageID === 0) Opts.fclose();
		close();
	};
	const yesClick = () => {
		MessageID--;
		if (MessageID === 0) Opts.fyes();
		close();
	};
	const noClick = () => {
		MessageID--;
		if (MessageID === 0) Opts.fno();
		close();
	};

	return (
		<div className={style.main}>
			<Draggable bounds="parent" handle="strong">
				<div className={style.content}>
					<strong>
						<div className={style.title} dangerouslySetInnerHTML={{ __html: Opts.date }} />
					</strong>
					<div className={style.dialog_content} dangerouslySetInnerHTML={{ __html: Message }} />
					{Opts.inputField && (
						<div className={style.inputFieldMain}>
							<div className={style.inputFieldLabel}>{t('FLY_INPUT_FIELD')}</div>
							<input className={style.inputFieldInput} type={'text'} id={Opts.inputId} />
						</div>
					)}
					<div key={'acts'} className={style.dialog_action}>
						{Opts.fclose && (
							<button onClick={closeClick} className={style.button_close} type={'button'}>
								{t(style.text.close)}
							</button>
						)}
						{Opts.fyes && (
							<button onClick={yesClick} className={style.button_yes} type={'button'}>
								{t(style.text.yes)}
							</button>
						)}
						{Opts.fno && (
							<button onClick={noClick} className={style.button_no} type={'button'}>
								{t(style.text.no)}
							</button>
						)}
						{MessageID > 1 && (
							<div className={style.unread}>{t('Unread message') + ' ' + MessageID}</div>
						)}
					</div>
				</div>
			</Draggable>
		</div>
	);
};

FlyMessageExtend.propTypes = {
	Message: PropTypes.string,
	Opts: PropTypes.object,
	close: PropTypes.func
};

let slmCnt = 0;
const SlideMessageExtend = ({ Message, Opts, close }) => {
	const [swOff, swOffCb] = useState(false);
	useEffect(() => {
		slmCnt += 5;
		setTimeout(() => {
			swOffCb(true);
		}, Opts.tout1);
		setTimeout(() => {
			slmCnt -= 5;
			close();
		}, Opts.tout2);
	}, []);

	let top = 40 + slmCnt;

	return (
		<div style={{ top: top + '%' }} className={!swOff ? Opts.class1 : Opts.class2}>
			{Message}
		</div>
	);
};

SlideMessageExtend.propTypes = {
	Message: PropTypes.string,
	Opts: PropTypes.object,
	close: PropTypes.func
};
function slideMessage(Message, Opts) {
	let DefOpts = {
		tout1: 4000,
		tout2: 5000,
		class1: 'slide_message animated bounceInRight',
		class2: 'slide_message animated bounceInRight bounceOutRight'
	};

	let param = DefOpts;
	if (Opts) param = merge(DefOpts, Opts);

	const tagMessage = document.createElement('div');
	document.getElementById(global.TAG_MESSAGE).appendChild(tagMessage);
	console.log('Message', Message, Opts);
	ReactDOM.render(
		<SlideMessageExtend
			Message={Message}
			Opts={param}
			close={() => {
				ReactDOM.unmountComponentAtNode(tagMessage);
				tagMessage.remove();
			}}
		/>,
		tagMessage
	);
}

let errMsgStor = makeAutoObservable({
	msg: []
});

function errMessage(XFL, message) {
	errMsgStor.msg.push({ message, xid: XFL.id });
}

export function initErrorMessageArea() {
	const tagMessage = document.createElement('div');
	document.getElementById(global.TAG_MESSAGE).appendChild(tagMessage);
	ReactDOM.render(<ErrMessageArea />, tagMessage);
}

const ErrMessageArea = observer(() => {
	return (
		<div>
			{errMsgStor.msg.map(({ message }, idx) => {
				return (
					<ErrMessageExtern
						infomsg={message}
						key={idx}
						close={() => {
							errMsgStor.msg.splice(idx, 1);
						}}
					/>
				);
			})}
		</div>
	);
});

function ErrMessageExtern({ infomsg, close }) {
	return (
		<div className={'fly_modal-content_block'}>
			<Draggable bounds="parent">
				<div className={'fly_modal-content xfl_message'}>
					<div className={'fly_modal-title'}>{t('Error')}</div>
					<div
						className={'fly_modal-dialog-content'}
						dangerouslySetInnerHTML={{ __html: infomsg }}
					/>
					<div className={'fly_modal-dialog-action'}>
						<button className={'upLeftButton'} onClick={close}>
							{t('close')}
						</button>
					</div>
				</div>
			</Draggable>
		</div>
	);
}
ErrMessageExtern.propTypes = {
	infomsg: PropTypes.string,
	close: PropTypes.func
};
function closeFieldErrMessage(xid) {
	const rmIdx = errMsgStor.msg.findIndex((item) => item.xid === xid);
	errMsgStor.msg.splice(rmIdx, 1);
}

function closeAnyFieldErrMessage() {
	errMsgStor.msg = [];
}

export default {
	messageErr: {
		create: errMessage,
		close: closeFieldErrMessage,
		closeAny: closeAnyFieldErrMessage
	},
	messageSlide: {
		create: slideMessage
	},
	messageFly: {
		create: flyMessage
	},
	messageFlySlide: {
		create: flyMessageSlide
	},
	messageFlyConfirm: {
		create: flyFieldConfirm
	}
};
