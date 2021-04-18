module.exports = function (RED) {
    const uuid = require('./lib/uuid');
    const request = require('request');

    function ControlBlindNode(config) {
        RED.nodes.createNode(this, config);

        // Retrieve the config node
        this.server = RED.nodes.getNode(config.server);
        console.log("got server", this.server);
        if (!this.server) {
            // No config node configured
            this.error("Control Blinds - No API connection was configured. Please add a Connection to this node.");
        }

        var node = this;
        node.on('input', function (msg) {
            let operation = "5";
            let TempTargetPosition;
            if (msg.payload.siro && msg.payload.siro.operation) {
                switch (msg.payload.siro.operation.toUpperCase()) {
                    case "DOWN":
                        operation = "0";
                        break;
                    case "UP":
                        operation = "1";
                        break;
                    case "STOP":
                        operation = "2";
                        break;
                    case "CHANGE_DIRECTION":
                        operation = "3";
                        break;
                    case "SET_LIMIT":
                        operation = "4";
                        break;
                    case "STATUS":
                        operation = "5";
                        break;
                    case "BATTERY":
                        operation = "6";
                        break;
                    case "STEP_UP":
                        operation = "7";
                        break;
                    case "STEP_DOWN":
                        operation = "8";
                        break;
                    case "SAVE_END_UP":
                        operation = "9";
                        break;
                    case "SAVE_END_DOWN":
                        operation = "10";
                        break;
                    case "SAVE_FAV":
                        operation = "11";
                        break;
                    case "GO_TO_FAV":
                        operation = "12";
                        break;
                    case "SET_END_UP":
                        operation = "13";
                        break;
                    case "SET_END_DOWN":
                        operation = "14";
                        break;
                    case "TARGET_POSITION":
                        operation = "5";
                        TempTargetPosition = msg.payload.siro.targetPosition;
                        break;

                    default:
                        // defaulting to status operation
                        operation = "5";
                        break;
                }
            }
            console.log("msg uuid", config.device, operation);
            let device = JSON.parse(config.device);
            console.log("msg uuid", device, operation);
            formData = {
                accessToken: this.server.AccessToken,
                msgId: uuid.generateUUID().replace(/-/g, '').toUpperCase(),
                mac: device.mac,
                deviceType: device.type,
                operation: operation,
                targetPosition: TempTargetPosition ? TempTargetPosition : undefined
            };
            request.post({
                url: this.server.host + ':' + this.server.port + '/userCenter/deviceService/deviceControl',
                form: formData,
                json: true
            }, function (err, httpResponse, body) {
                if (err) {
                    return node.error('Control failed!');
                }
                ReturnCode = body.retCode;
                if (ReturnCode === "20000") {
                    node.log('Control OK');
                } else if (ReturnCode === "20108") {
                    this.server.login();
                } else if (ReturnCode === "20001") {
                    node.warn("Server überlastet");
                } else {
                    node.error('Control failed. Return Code: ' + ReturnCode);
                    this.server.setConnected(false);
                }
                console.log("posted operation siro",body);
                msg.payload = httpResponse;
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("Control-Blind", ControlBlindNode);
}