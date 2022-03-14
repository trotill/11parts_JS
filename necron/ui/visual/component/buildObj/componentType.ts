export interface elementObjParam {
	parent?: any;
	id: string;
	items_lid?: string;
	lid?: string;
	bid?: string;
	pastBar?: any;
	past?: any;
	name?: string;
	action?: any;
	value?: any;
	cvalue?: any;
	svalue?: any;
	rvalue?: any;
	evalue?: any;
	option?: any;
	spage?: any;
	data?: any;
	mode?: string;
	contentClass: string;
	items_name?: [string];
	items_val?: [any];
	table?: any;
	style?: any;
	xscale?: number;
	yscale?: number;
	colors?: string;
	head?: [string];
	isDig?: boolean;
	isSec?: boolean;
	isRo?: boolean;
	isNum?: boolean;
	format?: string;
	rows?: number;
	regexp?: string;
	items?: [any];
	showname?: boolean;
	params?: any;
	param?: any; //uploadBase
	icon?: string;
	pages?: any; //wizard
	navi?: [string]; //wizard
	ignflt?: any; //wizard
	sysevent?: any; //wizard
	event?: any; //wizard
	ppos?: string; //wizard
	nbutt?: [string]; //wizard
	mbutt?: [string]; //wizard
	class?: string; //wizard

	stylize?: {
		reverse: number;
		value: any;
		items_limit: any;
		color: string;
		link: {
			base: string;
			relate: string;
		};
		show_as: string;
		conf: any;
		changeclass: any;
	};
}

export interface createElement {
	PastTo?: string;
	Id: string;
	Obj: elementObjParam;
	opts?: any;
}
