const { createReadStream } = require('fs');
const { createInterface } = require('readline');

const srv_r = createInterface({
	input: createReadStream('/var/run/slogger/srv_r'),
	crlfDelay: Infinity
});

const Jn_r = createInterface({
	input: createReadStream('/var/run/slogger/Jn_r'),
	crlfDelay: Infinity
});

const Cnoda = createInterface({
	input: createReadStream(
		'/var/run/slogger/log.wwwpagesnecronCnodaCnoda_--conf=wwwpagesnecronCnodaCnodajson'
	),
	crlfDelay: Infinity
});

const ctrl = {
	runCnoda: true,
	runJnoda: true,
	runSrv: true,
	mask: ''
};

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: 'OHAI> '
});
rl.on('line', (line) => {
	switch (line) {
		case 'srv':
			{
				ctrl.runCnoda = ctrl.runJnoda = false;
				ctrl.runSrv = true;
				console.log(`Set mode srv`);
			}
			break;
		case 'jnoda':
			{
				ctrl.runCnoda = ctrl.runSrv = false;
				ctrl.runJnoda = true;
				console.log(`Set mode jnoda`);
			}
			break;
		case 'cnoda':
			{
				ctrl.runSrv = ctrl.runJnoda = false;
				ctrl.runCnoda = true;
				console.log(`Set mode cnoda`);
			}
			break;
		case '':
			{
				if (ctrl.mask !== '') {
					ctrl.mask = '';
					console.log(`Reset mask, for change mode set [srv/jnoda/cnoda]`);
				} else {
					ctrl.runSrv = ctrl.runCnoda = ctrl.runJnoda = false;
					console.log(`Select mode [srv,jnoda,cnoda]`);
				}
			}
			break;
		default: {
			console.log(`For select mode write - [srv,jnoda,cnoda]`);
			console.log(`Apply mask for default`, line);
			ctrl.mask = line;
		}
	}
	rl.prompt();
}).on('close', () => {
	process.exit(0);
});

srv_r.on('line', (line) => {
	ctrl.runSrv && line.includes(ctrl.mask) && console.log(line);
});

Jn_r.on('line', (line) => {
	ctrl.runJnoda && line.includes(ctrl.mask) && console.log(line);
});

Cnoda.on('line', (line) => {
	ctrl.runCnoda && line.includes(ctrl.mask) && console.log(line);
});
