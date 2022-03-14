//import "../style/systemScreen.css";
import { global, mobXstore } from '../../../../engine/___global';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { BuildObj } from '../../../../engine/_buildEng';
import { BuildJSON_Auth, t } from '../../../../engine/_core';
import {
	createEventToEventListeners,
	removeEventFromEventListeners
} from '../../../../engine/event';
import { initMetaVarIfUndef } from '../../../../engine/_metaVar';
import { initFilterEng } from '../../../../engine/filter/filterEng';

class systemScreen {}

let screenStore = observable({
	show: true
});

systemScreen.prototype.AuthMainScreen = observer((props) => {
	let clickLogin = () => {
		BuildJSON_Auth('authInput');
		console.log('Go to region');
	};
	useEffect(() => {
		createEventToEventListeners('loginKeyPress', ({ evt }) => {
			if (evt.which === 13) {
				BuildJSON_Auth('authInput');
			}
		});
		createEventToEventListeners('passwordKeyPress', ({ evt }) => {
			if (evt.which === 13) {
				BuildJSON_Auth('authInput');
			}
		});
		let authform = [
			{
				type: 'delim',
				id: 'inlp',
				name: t('Input login/password')
			},
			{
				name: t('Login'),
				type: 'tfield',
				value: '',
				id: 'login',
				isDig: false,
				isSec: false,
				flt: { len: [4, 63], sym: ['en'] },
				event: {
					keypress: [
						{
							type: 'action',
							param: {
								action: 'loginKeyPress'
							}
						}
					]
				}
			},
			{
				name: t('Password'),
				type: 'tfield',
				id: 'password',
				isDig: false,
				isSec: true,
				value: '',
				flt: { len: [4, 63], sym: ['en'] },
				event: {
					keypress: [
						{
							type: 'action',
							param: {
								action: 'passwordKeyPress'
							}
						}
					]
				}
			}
		];
		initMetaVarIfUndef('authInput');
		initFilterEng('authInput');
		BuildObj('authInput', authform);
		mobXstore.element.addBlock(
			'authInput',
			'sendbutton',
			<button key={'loginButton'} className={'loginButton'} onClick={clickLogin}>
				{t('login')}
			</button>
		);
		return () => {
			removeEventFromEventListeners('loginKeyPress');
			removeEventFromEventListeners('passwordKeyPress');
		};
	}, []);

	//$( ".authInput").append('<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect login_button" id=sendbutton>login</button>');
	return (
		<div className={'auth_form'}>
			<div className={'authLogo'} />
			<div className={'authInput'}>{mobXstore.element.doRender('authInput')}</div>
		</div>
	);
});

systemScreen.prototype.AuthMainScreenEntry = function (arg) {
	const tag = document.createElement('div');
	tag.id = arg.id;
	tag.className = arg.id;
	document.getElementById(arg.mainTag).appendChild(tag);

	let element;
	if (arg.vers === undefined) element = this.AuthMainScreen;

	ReactDOM.render(React.createElement(element, arg), tag);
};

systemScreen.prototype.BaseScreenEntry = function (arg) {
	const tag = document.createElement('div');
	tag.id = arg.id;
	tag.className = arg.id;

	document.getElementById(arg.mainTag).appendChild(tag);

	ReactDOM.render(React.createElement(this.BaseScreen, arg), tag);
};

systemScreen.prototype.BaseScreenShow = (stat) => {
	screenStore.show = stat;
};
systemScreen.prototype.BaseScreen = observer((props) => {
	let w = document.documentElement.clientWidth;
	//let h = document.documentElement.clientHeight;
	let reduce = false;
	let showNavi = true;
	if (w < props.minWidth) {
		reduce = true;
		showNavi = false;
	}
	const [getShowNavi, setShowNavi] = useState(showNavi);
	const [getReduce, setReduce] = useState(reduce);

	useEffect(() => {
		let resizeWindow = () => {
			// console.log('resizeWindow eventFromUI',eventFromUI);
			let w = document.documentElement.clientWidth;
			//let h = document.documentElement.clientHeight;
			if (w < props.minWidth) {
				setReduce(true);
				setShowNavi(false);
			} else {
				setReduce(false);
				setShowNavi(true);
			}
		};

		window.addEventListener('resize', resizeWindow);
	}, []);

	let showNaviClick = () => {
		setShowNavi(true);
	};
	let hideNaviClick = () => {
		if (getReduce) {
			setShowNavi(false);
		}
	};

	let reactBaseScreenRightStyle = {};
	let reactBaseScreenLeftStyle = {};
	let header = (
		<div
			style={{
				display: 'flex',
				flexDirection: 'row',
				backgroundColor: props.headerColor
			}}
		>
			<div />
			{React.createElement(
				props.header,
				{ className: global.TAG_HEADER + ' reactBaseScreenHeader' },
				null
			)}
		</div>
	);

	if (!getShowNavi) {
		reactBaseScreenLeftStyle['display'] = 'none';
	}
	if (getReduce) {
		reactBaseScreenRightStyle['marginLeft'] = '0px';
		reactBaseScreenRightStyle['width'] = '100%';

		header = (
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					backgroundColor: props.headerColor
				}}
			>
				<div className={'reactBaseScreenShowNavi'} onClick={showNaviClick}>
					<div className={'reactBaseScreenShowNaviMenu'} />
				</div>
				{React.createElement(
					props.header,
					{ className: global.TAG_HEADER + ' reactBaseScreenHeader' },
					null
				)}
			</div>
		);
	}
	let leftPanel = (
		<div
			id={'reactBaseScreenLeft'}
			className={'reactBaseScreenLeft'}
			style={reactBaseScreenLeftStyle}
		>
			<div className={'left-panel reactBaseScreenLContent'} onClick={hideNaviClick}>
				<div className={'left-panel_title'}>{props.title}</div>
				{React.createElement(props.navi, { className: 'reactBaseScreenNavi' }, null)}
			</div>
		</div>
	);

	let rightPanel = (
		<div
			id={'reactBaseScreenRight'}
			className={'reactBaseScreenRight'}
			style={reactBaseScreenRightStyle}
		>
			{header}
			<main className={'main_class reactBaseScreenMain'}>
				<div className={'page-content reactBaseScreenRContent'}>
					{React.createElement(props.body, { className: global.TAG_PAGE }, null)}
					{React.createElement(props.tips, { className: global.TAG_TIPS }, null)}
					{mobXstore.element.doRender('.page-content')}
				</div>
			</main>
			{React.createElement(
				props.footer,
				{ className: global.TAG_FOOTER + ' reactBaseScreenFooter' },
				null
			)}
		</div>
	);

	let display = 'flex';
	if (!screenStore.show) display = 'none';
	return (
		<div id={'reactBaseScreenMain'} style={{ display: display }}>
			{leftPanel}
			{rightPanel}
		</div>
	);
});

export default new systemScreen();
