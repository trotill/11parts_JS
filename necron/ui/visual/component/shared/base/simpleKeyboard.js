/**
 * Created by i7 on 19.08.2020.
 */

import { global, MetaVar, mobXstore } from '../../../../engine/___global.js';
import Keyboard from 'react-simple-keyboard';
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';

let changedElement;
let debug = false;
let forceShow = false;
let opts = {
	theme: 'hg-theme-default epKeyboardThemeMain epKeyboardTheme',
	physicalKeyboardHighlight: true,
	syncInstanceInputs: true,
	mergeDisplay: true,
	buttonTheme: [
		{
			class: 'hg-red',
			buttons: 'q w e r t y й ц у к е н'
		}
	],
	layout: {
		default: [
			'@ 1 2 3 4 5 6 7 8 9 0 - + {backspace}',
			'{tab} q w e r t y u i o p [ ] \\',
			'a s d f g h j k l : % {enter}', //;->: `->@,'->%
			'{shift} z x c v b n m , . /',
			'{en} {space} {ru}'
		],
		EN: [
			"~ ! ` # $ ' ^ & * ( ) _ = {backspace}",
			'{tab} Q W E R T Y U I O P [ ] \\',
			"A S D F G H J K L ; ' {enter}",
			'{shift} Z X C V B N M < > ?',
			'{en} {space} {ru}'
		],
		ru: [
			'ё 1 2 3 4 5 6 7 8 9 0 - + {backspace}',
			'{tab} й ц у к е н г ш щ з х ъ',
			'ф ы в а п р о л д ж э \\ {enter}',
			'{shift} я ч с м и т ь б ю .',
			'{en} {space} {ru}'
		],
		RU: [
			'Ё ! " № ; % : ? * ( ) _ = {backspace}',
			'{tab} Й Ц У К Е Н Г Ш Щ З Х Ъ {}',
			'Ф Ы В А П Р О Л Д Ж Э / [ ] {enter}',
			'{shift} Я Ч С М И Т Ь Б Ю ,',
			'{en} {space} {ru}'
		]
	},
	display: {
		'{en}': 'en',
		'{ru}': 'ru',
		'{tab}': 'tab ⇥',
		'{backspace}': 'backspace ←',
		'{enter}': 'enter ↵',
		'{capslock}': 'caps lock ⇪',
		'{shiftleft}': 'shift ⇧',
		'{space}': ' space '
	}
};
let scrollBodyClass = '__simple-keyboard_block_bodyPadding';
function scrollSimpleKeyboard(theInput) {
	let documentHeight = Math.round(window.document.body.clientHeight);
	let addition = 20;
	let keyboardHeight =
		Math.round(window.document.getElementsByClassName('__keyboardScroll')[0].offsetHeight) +
		addition;

	let elem = document.getElementById(theInput);
	let inputTop = elem.getBoundingClientRect().top || 0;
	let docTop = window.document.documentElement.scrollTop || 0;
	let theInputOffsetTop = Math.round(inputTop + docTop);
	if (documentHeight <= theInputOffsetTop + keyboardHeight) {
		let styleElm = window.document.getElementById('__keyboardScroll');
		if (styleElm && styleElm.parentNode !== null) {
			styleElm.parentNode.removeChild(styleElm);
		}

		let style = `<style id="${scrollBodyClass}">.${scrollBodyClass} {padding-bottom:${keyboardHeight}px !important;}</style>`;
		let styleRange = window.document.createRange();
		styleRange.selectNode(window.document.head);
		let styleFragment = styleRange.createContextualFragment(style);
		window.document.head.appendChild(styleFragment);
		window.document.body.classList.add(scrollBodyClass);
	}
	let autoScroll = true;
	let scrollBehavior = 'smooth';
	let scrollDelay = 100;
	if (autoScroll) {
		let userAgent = navigator.userAgent.toLocaleLowerCase('en');
		if (userAgent.indexOf('edge') <= -1 && userAgent.indexOf('.net4') <= -1) {
			let scrollTimeout = setTimeout(function () {
				window.scrollTo({ top: theInputOffsetTop, left: 0, behavior: scrollBehavior });
				clearTimeout(scrollTimeout);
			}, scrollDelay);
		}
	}
}

let SimpleKeyboard = observer((props) => {
	const [input, setInput] = useState('');
	const [layout, setLayout] = useState('default');
	const keyboard = useRef();

	const onChange = (input) => {
		setInput(input);
		changedElement.value = input;
		let genInputEvent = new Event('input', { bubbles: true });
		changedElement.dispatchEvent(genInputEvent);
		console.log('Input changed', input);
	};

	function handleShift() {
		let currentLayout = layout;
		let shiftToggle;
		if (currentLayout === 'default') shiftToggle = 'EN';
		if (currentLayout === 'EN') shiftToggle = 'default';
		if (currentLayout === 'ru') shiftToggle = 'RU';
		if (currentLayout === 'RU') shiftToggle = 'ru';

		setLayout(shiftToggle);
	}

	function handleSwToLang(lang) {
		setLayout(lang);
	}

	const onKeyPress = (button) => {
		if (button === '{space}') button = ' ';
		if (button === '{enter}') {
			button = '\n';
		}
		if (button.length > 1) {
			if (button === '{shift}' || button === '{lock}') handleShift();

			if (button === '{ru}') handleSwToLang('ru');

			if (button === '{en}') handleSwToLang('default');
		}
	};

	//let [getHide, setHide] = useState(true);
	useEffect(() => {
		let main = document.getElementsByClassName(props.classContainer);
		main[0].onclick = (event) => {
			if (
				(event.target.tagName === 'INPUT' &&
					(event.target.type === 'text' || event.target.type === 'password') &&
					event.target.readOnly === false) ||
				event.target.type === 'textarea'
			) {
				changedElement = event.target;
				const input = event.target.value;
				setInput(input);
				keyboard.current.setInput(input);

				mobXstore.system.hideKeyboard = false;
				scrollSimpleKeyboard(changedElement.id);
				changedElement.onkeyup = (event) => {
					const input = event.target.value;
					setInput(input);
					keyboard.current.setInput(input);
				};
			} else {
				if (!forceShow && event.target.parentNode.className !== 'hg-row') {
					//если клик не по клавиатуре то скрыть ее и удалит клас скрола
					mobXstore.system.hideKeyboard = true;
					let body = document.getElementsByClassName(scrollBodyClass);
					if (body.length !== 0) {
						body[0].classList.remove(scrollBodyClass);
					}
				}
			}
		};
	}, []);

	let debugView = [];
	if (debug) {
		const onChangeInput = (event) => {
			const input = event.target.value;
			setInput(input);
			keyboard.current.setInput(input);
		};
		debugView = (
			<input
				value={input}
				placeholder={'Tap on the virtual keyboard to start'}
				onChange={onChangeInput}
			/>
		);
	}
	let dispStyle = 'inherit';
	if (mobXstore.system.hideKeyboard) {
		dispStyle = 'none';
	}
	return (
		<div className="keyboardBase __keyboardScroll" style={{ display: dispStyle }}>
			{debugView}
			<Keyboard
				keyboardRef={(r) => (keyboard.current = r)}
				onChange={onChange}
				onKeyPress={onKeyPress}
				layoutName={layout}
				theme={opts.theme}
				buttonTheme={opts.buttonTheme}
				physicalKeyboardHighlight={opts.physicalKeyboardHighlight}
				syncInstanceInputs={opts.syncInstanceInputs}
				mergeDisplay={opts.mergeDisplay}
				layout={opts.layout}
				display={opts.display}
			/>
		</div>
	);
});

export function forceShowKeyboard() {
	mobXstore.system.hideKeyboard = false;
	forceShow = true;
}
export function forceHideKeyboard() {
	forceShow = false;
	mobXstore.system.hideKeyboard = true;
}
export function useSimpleKeyboard(classContainer = 'main') {
	const tag = document.createElement('div');
	tag.className = '__simple-keyboard_block';
	document.getElementById(classContainer).appendChild(tag);

	ReactDOM.render(<SimpleKeyboard classContainer={classContainer} />, tag);
}
