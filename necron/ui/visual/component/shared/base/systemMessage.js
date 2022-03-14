/**
 * Created by Ilya on 29.08.2019.
 */
import { global } from '../../../../engine/___global.js';
import { t } from '../../../../engine/_core';
import { makeAutoObservable } from 'mobx';
import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';

const store = makeAutoObservable({
	hide: true,
	message: []
});

export function hideSystemMessage() {
	store.hide = true;
}
export function showSystemMessage(Message) {
	if (store.hide) store.hide = false;
	store.message.push(Message);
}

const Area = observer(() => {
	return !store.hide ? (
		<div className={'system_info_box'} id={'system_info_box'}>
			<div className={'system_info_box-header'}>{t('system_info_box')}</div>
			<div className={'system_info_box-text_block'}>
				{store.message.map((msg, idx) => {
					return (
						<div key={idx} className={'system_message'}>
							{store.message.length === idx + 1 ? (
								<div className={'spinner_loader_mini_act'} />
							) : (
								<div className={'spinner_loader_mini_pass'} />
							)}
							<div className={'system_info_box-text_block-text'}>{msg}</div>
						</div>
					);
				})}
			</div>
		</div>
	) : null;
});
export function initSystemMessageArea() {
	const domContainer = document.getElementById(global.TAG_SYSTEM_MESSAGE);
	ReactDOM.render(<Area />, domContainer);
}
