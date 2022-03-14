//import "../style/systemDialogs.css";
import { global } from '../../../../engine/___global.js';
import { addEventToEventListeners, SendActionSocketIO } from '../../../../engine/event';
import { runui } from '../../../../engine/_util';
import { t } from '../../../../engine/_core';
import React from 'react';
import ReactDOM, { unmountComponentAtNode } from 'react-dom';
import PropTypes from 'prop-types';

class systemInteractive {
	SendActionActivationData(param) {
		/*
    param={
      key:key
    }
    */
		SendActionSocketIO({
			action: 'activation',
			sub: ['cnoda'],
			data: {
				key: param.key
			}
		});
	}
	SendActionPrivateData(param) {
		/*
    param={
      key:key
    }
    */
		SendActionSocketIO({
			action: 'activation',
			sub: ['cnoda'],
			data: {
				priv: param.priv
			}
		});
	}
	SendActionCnodakgPasswd(param) {
		/*
    param={
      key:key
    }
    */
		SendActionSocketIO({
			action: 'cnodakg',
			sub: ['cnoda'],
			data: param
		});
	}

	constructor() {
		this.dialogMainTag = 'main';
	}
}

systemInteractive.prototype.iframeFullScreen = function (url) {
	function IframeElement({ removeDialog }) {
		function onClick() {
			removeDialog();
		}
		return (
			<div className={'iframeFullScreenMain'}>
				<iframe className={'iframeFullScreenURL'} src={url} />
				<div className={'iframeFullScreenClose'} onClick={onClick}>
					<div className={'iframeFullScreenCloseTxt'}>{t('close')}</div>
				</div>
			</div>
		);
	}

	const tag = document.createElement('div');
	tag.id = 'iFrame';
	document.getElementsByTagName('body').appendChild(tag);

	ReactDOM.render(
		<IframeElement
			removeDialog={() => {
				//domContainer.remove();
				unmountComponentAtNode(tag);
			}}
		/>,
		tag
	);
};

systemInteractive.prototype.privateDialog = function () {
	class PrivateDialog extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				destroy: false,
				input: '',
				saved: false
			};

			addEventToEventListeners('activation', 'actPrivDialog', (args) => {
				if (args.stat === 'privSaved') {
					this.setState({
						saved: true
					});
				}
			});
		}

		handleChange(e) {
			this.setState({ input: e.target.value });
		}
		sendKeyClick() {
			let privStr = this.state.input;
			let err = 0;
			try {
				JSON.parse(privStr);
			} catch (e) {
				err = 1;
			}
			if (err) {
				runui('flymsg', t('pushPrivErr'), null, function () {});
			} else this.props.SendActionPrivateData({ priv: privStr });
			//this.setState({destroy:true})
		}
		laterClick() {
			this.setState({ destroy: true });
			this.props.removeDialog();
		}
		render() {
			let render;
			if (this.state.saved) {
				render = (
					<div id={'systemDialogMain'} style={{ backgroundColor: '#cbcaba' }}>
						<div id={'systemDialogLeft'}>
							<div id={'systemDialogInfo'} style={{ backgroundColor: '#cfec4a', color: 'black' }}>
								{t('privSaved')}
							</div>
							<div id={'systemDialogSendButton'} onClick={this.laterClick.bind(this)}>
								{t('close')}
							</div>
						</div>
					</div>
				);
			} else {
				render = (
					<div id={'systemDialogMain'}>
						<div id={'systemDialogLeft'}>
							<div id={'systemDialogInfo'}>{t('pushPrivate')}</div>
							<textarea id={'systemDialogTextarea'} onClick={this.handleChange.bind(this)} />
							<div id={'systemDialogSendButton'} onClick={this.sendKeyClick.bind(this)}>
								{t('send')}
							</div>
							<div id={'systemDialogSendButton'} onClick={this.laterClick.bind(this)}>
								{t('later')}
							</div>
						</div>
					</div>
				);
			}

			return this.state.destroy ? null : render;
		}
	}

	// let domContainer=document.getElementsByClassName("main")[0];
	PrivateDialog.propTypes = {
		SendActionPrivateData: PropTypes.func,
		removeDialog: PropTypes.func
	};

	const tag = document.createElement('div');
	tag.id = 'reactPriv';
	document.getElementById(this.dialogMainTag).appendChild(tag);

	ReactDOM.render(
		<PrivateDialog
			SendActionPrivateData={this.SendActionPrivateData}
			removeDialog={() => {
				unmountComponentAtNode(tag);
			}}
		/>,
		tag
	);
};

systemInteractive.prototype.licDialog = function (uid) {
	class LicDialog extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				destroy: false,
				input: '',
				activated: false
			};

			addEventToEventListeners('activation', 'actLicDialog', (args) => {
				if (args.stat === 'activated') {
					this.setState({
						activated: true
					});
				}
			});
		}

		handleChange(e) {
			this.setState({ input: e.target.value });
		}
		sendKeyClick() {
			let key = this.state.input;
			this.props.SendActionActivationData({ key: key });
			//this.setState({destroy:true})
		}
		laterClick() {
			this.setState({ destroy: true });
			this.props.removeDialog();
		}
		render() {
			let render;
			if (this.state.activated) {
				render = (
					<div id={'systemDialogMain'} style={{ backgroundColor: '#cbcaba' }}>
						<div id={'systemDialogLeft'}>
							<div id={'systemDialogInfo'} style={{ backgroundColor: '#cfec4a', color: 'black' }}>
								{t('licKeyAccept')}
							</div>
							<div id={'systemDialogSendButton'} onClick={this.laterClick.bind(this)}>
								{t('close')}
							</div>
						</div>
					</div>
				);
			} else {
				render = (
					<div id={'systemDialogMain'}>
						<div id={'systemDialogLeft'}>
							<div id={'systemDialogInfo'}>{t('licInputKey')}</div>
							<div id={'LicDialogUID'}>{this.props.uid}</div>
							<input id={'LicDialogKey'} onChange={this.handleChange.bind(this)} />
							<div id={'systemDialogSendButton'} onClick={this.sendKeyClick.bind(this)}>
								{t('sendKey')}
							</div>
							<div id={'systemDialogSendButton'} onClick={this.laterClick.bind(this)}>
								{t('later')}
							</div>
						</div>
					</div>
				);
			}
			return this.state.destroy ? null : render;
		}
	}

	LicDialog.propTypes = {
		uid: PropTypes.string,
		SendActionActivationData: PropTypes.func,
		removeDialog: PropTypes.func
	};

	const tag = document.createElement('div');
	tag.id = 'reactLic';
	document.getElementById(this.dialogMainTag).appendChild(tag);

	ReactDOM.render(
		<LicDialog
			uid={uid}
			SendActionActivationData={this.SendActionActivationData}
			removeDialog={() => {
				unmountComponentAtNode(tag);
			}}
		/>,
		tag
	);
};

systemInteractive.prototype.cnodakgV1SignDialog = function () {
	class CnodakgV1Dialog extends React.Component {
		constructor(props) {
			super(props);
			this.input = '';
			this.log = [];
			this.state = {
				destroy: false,
				input: '',
				log: [],
				keyCount: '',
				wType: 0,
				licKey: ''
			};

			addEventToEventListeners('cnodakgV1', 'cnodakgV1', (args) => {
				if (args.stat === 'ready') {
					this.setState({
						wType: 1
					});
					this.setState({
						input: ''
					});
					let logd = JSON.parse(args.log).d;

					let log = '';
					for (let n = logd.genHistory.length - 1; n >= 0; n--) {
						this.log.push(
							`${logd.genHistory[n].num} (${new Date(
								logd.genHistory[n].ts * 1000
							).toISOString()}) LIC[${logd.genHistory[n].lic}] UID[${logd.genHistory[n].uid}]`
						);
					}
					//this.log.push(log);
					this.setState({
						keyCount: log.count
						//  log:this.log
					});
				}
				if (args.stat === 'licKey') {
					let logd = JSON.parse(args.log).d;
					this.log.unshift(
						`${logd.genHistory[0].num} (${new Date(
							logd.genHistory[0].ts * 1000
						).toISOString()}) LIC[${logd.genHistory[0].lic}] UID[${logd.genHistory[0].uid}]`
					);
					this.setState({
						licKey: args.value
					});
				}
			});
		}

		handleChange(e) {
			this.input = e.target.value;
			this.setState({
				input: this.input
			});
		}
		// handleChangeUID(e) {
		//   this.setState({ input: e.target.value });
		// }
		sendPasswdClick() {
			let key = this.input;
			this.props.SendActionCnodakgPasswd({ passwd: key, version: 1 });
			//this.setState({destroy:true})
		}
		sendUIDClick() {
			let key = this.input;
			this.props.SendActionCnodakgPasswd({ uid: key, version: 1 });
			//this.setState({destroy:true})
		}
		closeClick() {
			this.setState({ destroy: true });
			this.props.removeDialog();
		}
		render() {
			let render;
			if (this.state.wType === 0) {
				render = (
					<div id={'systemDialogMain'}>
						<div id={'systemDialogLeft'}>
							<div id={'systemDialogInfo'}>{t('cnodakgPasswdInfo')}</div>
							<input
								id={'systemDialogInput'}
								type={'password'}
								value={this.state.input}
								onChange={this.handleChange.bind(this)}
							/>
							<div id={'systemDialogSendButton'} onClick={this.sendPasswdClick.bind(this)}>
								{t('send')}
							</div>
							<div id={'systemDialogSendButton'} onClick={this.closeClick.bind(this)}>
								{t('close')}
							</div>
						</div>
					</div>
				);
			} else {
				let dialogLeft = (
					<div id={'systemDialogLeft'}>
						<div id={'systemDialogInfo'}>{t('cnodakgUIDInfo')}</div>
						<input
							id={'systemDialogInput'}
							value={this.state.input}
							onChange={this.handleChange.bind(this)}
						/>
						<div id={'systemCnodakgLic'}>{this.state.licKey}</div>
						<div id={'systemDialogSendButton'} onClick={this.sendUIDClick.bind(this)}>
							{t('send')}
						</div>
						<div id={'systemDialogSendButton'} onClick={this.closeClick.bind(this)}>
							{t('close')}
						</div>
					</div>
				);

				let logElements = [];
				for (let n = 0; n < this.log.length; n++) {
					logElements.push(<div key={n}>{this.log[n]}</div>);
				}

				let dialogRight = (
					<div id={'systemDialogRight'}>
						<div id={'systemDialogLog'} onClick={this.sendPasswdClick.bind(this)}>
							{logElements}
						</div>
					</div>
				);

				render = (
					<div id={'systemDialogMain'}>
						{dialogLeft}
						{dialogRight}
					</div>
				);
			}

			return this.state.destroy ? null : render;
		}
	}

	CnodakgV1Dialog.propTypes = {
		SendActionCnodakgPasswd: PropTypes.func,
		removeDialog: PropTypes.func
	};

	const tag = document.createElement('div');
	tag.id = 'cnodakgV1';
	document.getElementById(this.dialogMainTag).appendChild(tag);

	ReactDOM.render(
		<CnodakgV1Dialog
			SendActionCnodakgPasswd={this.SendActionCnodakgPasswd}
			removeDialog={() => {
				unmountComponentAtNode(tag);
			}}
		/>,
		tag
	);
};

global.api.systemInteractive = new systemInteractive();
