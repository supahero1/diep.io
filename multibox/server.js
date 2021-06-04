"use strict";

const WebSocket = require('ws');
const Server = new WebSocket.Server({ port: 8090 });
Server.on("connection", function(ws) {
  ws.on("message", function(msg) {
    Server.clients.forEach(function(client) {
      if(client != ws && client.readyState == WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
  ws.on("error", function() {});
  ws.on("close", function() {});
});
