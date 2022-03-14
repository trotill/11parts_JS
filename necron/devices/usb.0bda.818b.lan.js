/**
 * Created by i7 on 13.01.2018.
 */
function Build(dev)
{
    var snum;
    if (dev.order_num==0) snum='';
    else
        snum=dev.order_num.toString();
    var res = [
        {
            type:'delim',
            id:'wiWap',
            name:'WiFi'+snum,
        },
        // {
        //    name:'WiFi mode',
        //    type: 'tfield',
        //    id:'Mode',
        //    value: 'ap',
        //    isRo: true,
        //},
        {
            name: 'WiFi mode',
            type: 'sbox',
            value: 'ap',
            id: 'Mode',
            tabidx: 1,
            items_name: [
                "Access point","Client",
            ],
            items_val: [
                "ap","client_in_br",
            ],
            spage : {
                ap:[
                    {
                        type: 'br',
                    },
                    {
                        name:'SSID',
                        type:'tfield',
                        id:'Ssid',
                        value:'IoT',
                        flt: {len:['3','29'],sym:['en']},
                    },
                    {
                        type: 'br',
                    },
                    {
                        type:'switch',
                        value: false,
                        id:'swapn',
                        name:'Show APN',
                        data:[
                            {
                                name: 'WiFi APN',
                                type: 'table',
                                id: 'apn_tab',
                                edit: false,
                                css:'max-height: 400px; overflow: auto;',
                                tabh: [
                                    //"SSID", "RSSI",
                                    "SSID","Quality","Encrypt","Channel",
                                ],
                                rvalue: [
                                    '{"iface":"'+dev.type+dev.order_num+'","req":"aplist","req_t":10000,"value":[1,3,4,2]}',
                                ],
                                jvalue: {
                                    css:"overflow:auto; color:#000000;text-align:left;max-width:100px"
                                }
                            },
                        ],
                    },
                    {
                        type: 'br',
                    },
                    {
                        type: 'switch',
                        value: true,
                        id: 'Bct',
                        name: 'broadcast SSID',
                    },
                    {
                        name: 'Region',
                        type: 'sbox',
                        value: 'RU',
                        id: 'Reg',
                        tabidx: 1,
                        items_name: [
                            "Russia","US",
                        ],
                        items_val: [
                            "RU","US",
                        ],
                    },
                    {
                        type: 'br',
                    },
                    {
                        name: 'Password',
                        type: 'tfield',
                        id:'Passwd',
                        value: '',
                        flt: {len:['8','63'],sym:['en']},
                    },
                    {
                        type: 'br',
                    },
                    {
                        type:'delim',
                        id:'wiWps',
                        name:'WiFi phy settings',
                    },

                    {
                        name: 'WiFi channel num (2.4G)',
                        type: 'sbox',
                        value: 'auto',
                        id: 'Ch',
                        tabidx: 1,
                        items_name: [
                            "Auto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13",
                        ],
                        items_val: [
                            "auto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13",
                        ],
                    },
                    {

                        name: 'WiFi channel width',
                        type: 'sbox',
                        value: 'auto',
                        id: 'W',
                        tabidx: 1,
                        items_name: [
                            "Auto","20MHz","+40MHz","-40MHz"
                        ],
                        items_val: [
                            "auto", "20", "40+","40-"
                        ]
                    },
                    {
                        type: 'delim',
                        id:'wiWss',
                        name: 'WiFi secure settings',
                    },
                    {
                        name: 'WPA  version',
                        type: 'sbox',
                        value: 'WPA',
                        id: 'Sv',
                        tabidx: 3,
                        items_name: [
                            "WPA","WPA2","Both WPA/WPA2",
                        ],
                        items_val: [
                            "WPA","WPA2","WPAWPA2"
                        ],
                        spage : {
                            WPA:[
                                {
                                    name: 'Secure mode WPA',
                                    type: 'sbox',
                                    value: 'AES',
                                    id: 'SmWPA',
                                    tabidx: 1,
                                    items_name: [
                                        "AES","TKIP",
                                    ],
                                    items_val: [
                                        "AES","TKIP",
                                    ],
                                },
                            ],
                            WPA2:[
                                {
                                    name: 'Secure mode WPA2',
                                    type: 'sbox',
                                    value: 'AES',
                                    id: 'SmWPA2',
                                    tabidx: 1,
                                    items_name: [
                                        "AES","TKIP",
                                    ],
                                    items_val: [
                                        "AES","TKIP",
                                    ],
                                },
                            ],
                            WPAWPA2:[
                                {
                                    name: 'Secure mode WPA',
                                    type: 'sbox',
                                    value: 'TKIP',
                                    id: 'SmWPA',
                                    tabidx: 2,
                                    items_name: [
                                        "AES","TKIP",
                                    ],
                                    items_val: [
                                        "AES","TKIP",
                                    ],
                                },
                                {
                                    name: 'Secure mode WPA2',
                                    type: 'sbox',
                                    value: 'AES',
                                    id: 'SmWPA2',
                                    tabidx: 1,
                                    items_name: [
                                        "AES","TKIP",
                                    ],
                                    items_val: [
                                        "AES","TKIP",
                                    ],
                                },
                            ],
                            //wanif: subpage,
                        },
                    },
                    {
                        type: 'br',
                    },
                    {
                        name: 'Key update interval',
                        type: 'tfield',
                        id: 'KeyInt',
                        value: '86400',
                        flt: {minmax:['1','100000']},
                    },
                ],
                client_in_br:[
                    {
                        name: 'SSID',
                        type: 'tfield',
                        id: 'Ssid',
                        value: '',
                        flt: {len:['3','40'],sym:['en']},
                    },
                    {
                        type: 'br',
                    },
                    {
                        type:'var',
                        id:'dhcp_en',
                        value:'false',
                        name:'udh',
                    },
                    {
                        type: 'switch',
                        value: false,
                        id: 'swapn',
                        name: 'Show APN',
                        data: [
                            {
                                name: 'WiFi APN',
                                type: 'table',
                                id: 'apn_tab',
                                edit: false,
                                css:'max-height: 400px; overflow: auto;',
                                tabh: [
                                    //"SSID", "RSSI",
                                    "SSID","Quality","Encrypt","Channel",
                                ],
                                rvalue: [
                                    '{"iface":"'+dev.type+dev.order_num+'","req":"aplist","req_t":10000,"value":[1,3,4,2]}',
                                ],
                            },
                        ],
                    },
                    {
                        type: 'br',
                    },
                    {
                        name: 'Password',
                        type: 'tfield',
                        id: 'Passwd',
                        value: '',
                        flt: {len:['8','63'],sym:['en']},

                    },
                    {
                        type: 'br',
                    },
                    {
                        name: 'Secure type',
                        type: 'sbox',
                        value: 'WPA',
                        id: 'Sec',
                        tabidx: 1,
                        items_name:  [
                            "WPA enterprise","WPA personal","No secure",
                        ],
                        items_val:  [
                            "WPAe","WPA","NO",
                        ],
                    },
                ],
            }
        }
    ];

    return res;
}


module.exports = {
    Build:Build,
}