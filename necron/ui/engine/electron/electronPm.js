import { sendUserWebEvent } from '../event';

export function initPM(powerMonitor, electronIpc) {
	powerMonitor.on('suspend', () => {
		console.log('The system is going to sleep');
		electronIpc('web', { action: 'log', log: 'The system is going to sleep' });
	});

	powerMonitor.on('resume', () => {
		console.log('The system is resuming');
		electronIpc('web', { action: 'log', log: 'The system is resuming' });
	});

	powerMonitor.on('on-ac', () => {
		console.log('The system is on AC Power (charging)');
		electronIpc('web', { action: 'log', log: 'The system is on AC Power (charging)' });
	});

	powerMonitor.on('on-battery', () => {
		console.log('The system is on Battery Power');
		electronIpc('web', { action: 'log', log: 'The system is on Battery Power' });
	});

	powerMonitor.on('shutdown', () => {
		console.log('The system is Shutting Down');
		electronIpc('web', { action: 'log', log: 'The system is Shutting Down' });
	});

	powerMonitor.on('lock-screen', () => {
		console.log('The system is about to be locked');
		electronIpc('web', { action: 'log', log: 'The system is about to be locked' });
	});

	powerMonitor.on('unlock-screen', () => {
		console.log('The system is unlocked');
		electronIpc('web', { action: 'log', log: 'The system is unlocked' });
	});
	setInterval(() => {
		const state = powerMonitor.getSystemIdleState(4);
		console.log('Current System State - ', state);

		const idle = powerMonitor.getSystemIdleTime();
		console.log('Current System Idle Time - ', idle);

		sendUserWebEvent('powerMonitor', { state: state, idle: idle });
		//sendUserWebEvent("sendIPC",{action:"log","log":`state ${state} idle ${idle}`});
	}, 5000);
}
