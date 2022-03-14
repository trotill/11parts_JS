export async function registerBaseComponent(componentName) {
	await import(`./../visual/component/buildObj/base/${componentName}.js`)
		.then((compArr) => {
			Object.keys(compArr.default).forEach((cbName) => {
				if (!compArr.default[cbName].create) {
					alert(`Undef base UI component ${cbName}`);
				} else window.eparts.elements[cbName] = compArr.default[cbName];
			});
		})
		.catch((error) => {
			console.log(error);
		});
}

export async function registerShareComponent(componentName) {
	await import(`./../visual/component/shared/base/${componentName}.js`)
		.then((compArr) => {
			Object.keys(compArr.default).forEach((cbName) => {
				if (!compArr.default[cbName].create) {
					alert(`Undef base UI component ${cbName}`);
				} else window.eparts.elements[cbName] = compArr.default[cbName];
			});
		})
		.catch((error) => {
			console.log(error);
		});
}

export async function registerBaseTSXComponent(componentName) {
	await import(`./../visual/component/buildObj/base/${componentName}.tsx`)
		.then((compArr) => {
			Object.keys(compArr.default).forEach((cbName) => {
				//for (let cbName in cbComp) {
				if (!compArr.default[cbName].create) {
					alert(`Undef base UI component ${cbName}`);
				} else window.eparts.elements[cbName] = compArr.default[cbName];
				//debugger;
				// }
			});
		})
		.catch((error) => {
			console.log(error);
		});
}

export function buildComponent(name, { PastTo, id, arr }) {
	window.eparts.elements[name].create(PastTo, id, arr);
}

export function runRegistered(name, mode, ...arg) {
	return window.eparts.elements[name][mode](...arg);
}
