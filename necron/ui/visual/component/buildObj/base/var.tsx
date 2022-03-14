import { SetMetaForce } from '../../../../engine/_metaVar';
import { CheckJSON_Str } from '../../../../engine/preinit';

import { getGlobalVar, setGlobalVar } from '../../../../engine/___global';
import { createElement } from '../componentType';

function Var({ Id, Obj }: createElement) {
	//  console.log('arr',arr);
	//const InstField=PastTo;
	const id = Id;
	const arr = Obj;
	const contentClass = arr.contentClass;
	if (arr.svalue === undefined) {
		if (arr.cvalue !== undefined) {
			//RO value
			arr.value = arr.cvalue;
		}
		if (arr.value === undefined) {
			alert('undefined var value');
			return id;
		} else {
			SetMetaForce({ id: id, value: arr.value }, contentClass);
			return id;
		}
	}
	//Guard values
	//console.log('arr.svalue[0]',arr.svalue[0]);
	if (CheckJSON_Str(arr.svalue[0]) === '') {
		alert('Incorrect svalue var format (Var)');
		return id;
	}

	const sval = JSON.parse(arr.svalue[0]);
	// console.log('sval',sval);
	if (sval.wrvar !== undefined) {
		arr.value = sval.value;
		if (sval.wrvar !== '') {
			setGlobalVar(sval.wrvar, sval.value);
		}
	} else if (sval.rdvar !== undefined) {
		arr.value = getGlobalVar(sval.rdvar);
	}
	SetMetaForce({ id: id, value: arr.value }, contentClass);
	return id;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const create = (PastTo: any, Id: any, Obj: any): string => {
	return Var({ PastTo, Id, Obj });
};
export default {
	var: {
		create: create,
	},
};
