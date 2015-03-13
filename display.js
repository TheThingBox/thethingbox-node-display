module.exports = function(RED) {
    "use strict";
    var debuglength = RED.settings.debugMaxLength||1000;

    function main(config) {
        RED.nodes.createNode(this,config);
        this.active = config.active;
        var node = this;
        this.on("input",function(msg) {
			if (msg.payload.length > debuglength) {
				msg.payload = msg.payload.substr(0,debuglength) +" ....";
			}
			if (this.active) {
				node.warn(msg.payload);
				node.log(msg.payload);
			}
        });
    }
	RED.nodes.registerType("display",main);
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
}
