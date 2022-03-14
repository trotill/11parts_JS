/**
 * Created by Ilya on 16.12.2019.
 */
 
function mqtt_test(){
    var PORT = 1885;
    var LOGIN="admin";
    var PASSWORD="admin";

    init_paho_mqtt_client({
        port:PORT,
        login:LOGIN,
        password:PASSWORD
    });
}
function init_paho_mqtt_client(params){
// Create a client instance


    client = new Paho.MQTT.Client(location.hostname, params.port, "clientId");

// set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

// connect the client
    if ((params.password!==undefined)&&(params.password.length!==0)) {
        client.connect({
            useSSL: true,
            onSuccess: onConnect,
            userName: params.login,
            password: params.password
        });
    }
    else{
        client.connect({
            onSuccess: onConnect,
        });
    }

    function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log("onConnect");
        client.subscribe("SRVtoSW");
        //  message = new Paho.MQTT.Message("Hello");
        //message.destinationName = "World";
        //client.send(message);
    }

// called when the client loses its connection
    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:"+responseObject.errorMessage);
        }
    }

// called when a message arrives
    function onMessageArrived(message) {
        var json=JSON.parse(message.payloadString);
        console.log("onMessageArrived:",json);
    }
}