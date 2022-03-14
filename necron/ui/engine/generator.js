

export function generateClassForUI(param){
    /*{
       class_map:class_map,
       type:"main",
       id:"id"
    }*/
    let mainClass=param.class_map[param.type]
    return mainClass+' _'+param.type+param.id;
}
