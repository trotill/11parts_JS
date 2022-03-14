/// <reference types="react" />
declare function createReactDebug(Obj: any): JSX.Element;
declare const _default: {
    reactjsBase: {
        create: (PastTo: any, Id: any, Obj: any) => any;
        link: (reactHandlerId: any, reactHandler: any) => void;
        test: typeof createReactDebug;
    };
};
export default _default;
