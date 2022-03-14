/**
 * Created by i7 on 14.12.2019.
 */
import { global } from '../../../../engine/___global.js';
import { t, u } from '../../../../engine/_core.js';
import * as React from 'react';
import ReactDOM, { unmountComponentAtNode } from 'react-dom';

const overlayTimeout = 60000;
let overlayId;

function Overlay({ message }) {
	if (!message) message = t('Please_wait_dev_busy');
	return (
		<div className={'overlayMain'}>
			<div className={'overlayMain-ProgressBar overlayMain-Stripes animated reverse slower'}>
				<span className={'overlayMain-ProgressBarInner'} />
			</div>
			<div className={'overlayblock animated  rubberBand'}>{message}</div>
		</div>
	);
}

let add = (message, timeout) => {
	const domContainer = document.getElementById(global.TAG_OVERLAY);
	if (domContainer) {
		ReactDOM.render(<Overlay message={message} />, domContainer);
		if (overlayId) clearTimeout(overlayId);

		if (!timeout) timeout = overlayTimeout;

		overlayId = setTimeout(() => {
			del();
		}, timeout);
	}
};
let del = () => {
	const domContainer = document.getElementById(global.TAG_OVERLAY);
	if (domContainer) {
		unmountComponentAtNode(domContainer);
		if (u(overlayId)) clearTimeout(overlayId);
	}
};

let addWaitOverlay = {
	create: add
};

let delWaitOverlay = {
	create: del
};

export default { addWaitOverlay, delWaitOverlay };
