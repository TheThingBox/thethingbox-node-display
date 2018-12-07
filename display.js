module.exports = function(RED) {
  "use strict";
  var util = require("util");
  var events = require("events");
  var path = require("path");
  var Mustache = require("mustache");

  var debuglength = RED.settings.debugMaxLength || 1000;
  util.inspect.styles.boolean = "red";

  function DebugNode(n) {
    RED.nodes.createNode(this,n);
    this.name = n.name;
    this.template = n.template;
    this.severity = n.severity || 40;
    this.active = (n.active === null || typeof n.active === "undefined") || n.active;
    var node = this;

    var mustache_left_part = "{"
    var mustache_right_part = "}"

    var levels = {
      off: 1,
      fatal: 10,
      error: 20,
      warn: 30,
      info: 40,
      debug: 50,
      trace: 60,
      audit: 98,
      metric: 99
    };
    var colors = {
      "0": "grey",
      "10": "grey",
      "20": "red",
      "30": "yellow",
      "40": "grey",
      "50": "green",
      "60": "blue"
    };

    this.on("input",function(msg) {
      var output = msg.payload
      var property = 'payload'

      var propertyIsFromMsg = true;
      var showTopic = true;
      var showFormat = true;

      if(msg.message) {
        output = msg.message;
        property = 'message'
      }
      var template = `{{{${property}}}}`

      if(node.template){
        var mustache_left_part_count = 0;
        var mustache_right_part_count = 0;
        for (var i = 0; i < node.template.length; mustache_left_part_count += +(mustache_left_part === node.template[i++]));
        for (var i = 0; i < node.template.length; mustache_right_part_count += +(mustache_right_part === node.template[i++]));
        if(mustache_left_part_count === mustache_right_part_count){
          template = node.template;
          property = template;
          propertyIsFromMsg = false;
          showTopic = false;
          showFormat = false;
        }
      }
      if(typeof output === 'string' || output instanceof String){
        output = Mustache.render(template, RED.util.cloneMessage(msg));
      }
      if (this.active) {
        sendDebug({id:node.id, z:node.z, name:node.name, topic:msg.topic, property:property, msg:output, _path:msg._path, showHeader:false, propertyIsFromMsg:propertyIsFromMsg, showTopic:showTopic, showFormat:showFormat});
      }
    });
  }
  RED.nodes.registerType("display",DebugNode, {
    settings: {
      displayMaxLength: {
        value: 1000
      }
    }
  });

  function sendDebug(msg) {
    // don't put blank errors in sidebar (but do add to logs)
    //if ((msg.msg === "") && (msg.hasOwnProperty("level")) && (msg.level === 20)) { return; }
    msg = RED.util.encodeObject(msg,{maxLength:debuglength});
    RED.comms.publish("debug",msg);
  }
};
