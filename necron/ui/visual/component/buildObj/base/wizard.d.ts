/**
 * Created by Ilya on 14.02.2019.
 */
declare function WizLogicCleanup(contentClass: string, wizBlockId: string, parentBlockId: string): any;
declare const _default: {
    wizEvent: {
        create: (PastTo: any, Id: any, Obj: any) => string;
    };
    wizLogic: {
        create: (PastTo: any, Id: any, Obj: any) => string;
        cleanup: typeof WizLogicCleanup;
    };
    wizInfo: {
        create: (PastTo: any, Id: any, Obj: any) => string;
    };
    wizNaviCheckbox: {
        create: (PastTo: any, Id: any, Obj: any) => string;
    };
    wizNavi: {
        create: (PastTo: any, Id: any, Obj: any) => string;
    };
    wizNaviHeader: {
        create: (PastTo: any, Id: any, Obj: any) => string;
    };
};
export default _default;
