export default {
	skip: {
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		create: (PastTo: string, Id: string, Obj: any): string => {
			console.log(`Skip build ${Id} element, placed on ${PastTo}, with args ${Obj}`);
			return Id;
		},
	},
};
