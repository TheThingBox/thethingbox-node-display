/**

Modified for the Thingbox
Digital Airways 2015


**/

/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var debuglength = RED.settings.debugMaxLength||1000;

    function main(config) {
        RED.nodes.createNode(this,config);
        this.active = config.active;
        var node = this;

        this.on("input",function(msg) {
			// If there is a message property, use it instead of the payload: it is human destinated (and payload in machine destinated)
			if(msg.message)
				msg.payload = msg.message;
			if (msg.payload.length > debuglength) {
				msg.payload = msg.payload.substr(0,debuglength) +" ....";
			}
			if (this.active) {
				// node.warn(msg.payload);
				sendDebug({name:this.name,topic:msg.topic,msg:msg.payload,_path:msg._path});
            }
        });
    }

	RED.nodes.registerType("display",main);

    function sendDebug(msg) {
        if (msg.msg instanceof Error) {
            msg.msg = msg.msg.toString();
        } else if (msg.msg instanceof Buffer) {
            msg.msg = msg.msg.toString('hex');
        } else if (typeof msg.msg === 'object') {
            var seen = [];
            if (util.isArray(msg.msg)) {
                msg.format = "array";
            }
            msg.msg = JSON.stringify(msg.msg, function(key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (seen.indexOf(value) !== -1) { return "[circular]"; }
                    seen.push(value);
                }
                return value;
            }," ");
            seen = null;
        } else if (typeof msg.msg === "boolean") {
            msg.msg = msg.msg.toString();
        } else if (typeof msg.msg === "number") {
            msg.msg = msg.msg.toString();
        } else if (msg.msg === 0) {
            msg.msg = "0";
        } else if (msg.msg === null || typeof msg.msg === "undefined") {
            msg.msg = "(undefined)";
        } else {
            msg.msg = msg.msg;
        }

        if (msg.msg.length > debuglength) {
            msg.msg = msg.msg.substr(0,debuglength) +" ....";
        }

        RED.comms.publish("debug",msg);
    }

	

    RED.httpAdmin.post("/debug/:id/:state", RED.auth.needsPermission("debug.write"), function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        var state = req.params.state;
        if (node !== null && typeof node !== "undefined" ) {
            if (state === "enable") {
                node.active = true;
                res.send(200);
            } else if (state === "disable") {
                node.active = false;
                res.send(201);
            } else {
                res.send(404);
            }
        } else {
            res.send(404);
        }
    });
};
