function DecompressLZ4(packet) {
  const length = (packet[4] << 24) | (packet[3] << 16) | (packet[2] << 8) | packet[1];
  var at = 5;
  var aat = 0;
  var output = [];
  var token = 0;
  var literalLength = 0;
  var copyStart = 0;
  var copyLength = 0;
  var oldLength = 0;
  var i = 0;
  while(true) {
    token = packet[at++];
    literalLength = token >> 4;
    if(literalLength == 0xf) {
      do {
        literalLength += packet[at];
      } while(packet[at++] == 0xff);
    }
    for(i = at; i < at + literalLength; i++) {
      output[aat++] = packet[i];
    }
    at += literalLength;
    if(at >= packet.length - 1) {
      break;
    }
    copyStart = output.length - ((packet[++at] << 8) | packet[at++ - 1]);
    copyLength = token & 0xf;
    if(copyLength == 0xf) {
      do {
        copyLength += packet[at];
      } while(packet[at++] == 0xff);
    }
    copyLength += 4;
    if(copyStart + copyLength <= output.length) {
      for(i = copyStart; i < copyStart + copyLength; i++) {
        output[aat++] = output[i];
      }
    } else {
      oldLength = output.length;
      for(i = copyStart; i < oldLength; i++) {
        output[aat++] = output[i];
      }
      for(let i = 0; i < copyStart + copyLength - oldLength; i++) {
        output[aat++] = output[oldLength + i];
      }
    }
  }
  return output;
}

const Packet = function(packet) {
  this.packet = packet;
  this.at = 0;
};
Packet.prototype.readVU = function() {
  var number = 0;
  var count = 0;
  do {
    number |= (this.packet[this.at] & 0x7f) << (7 * count++);
  } while((this.packet[this.at++] >> 7) == 1);
  return number;
};
Packet.prototype.writeVU = function(num) {
  let output = [];
  while(num > 0x7f) {
    output[output.length] = (num & 0x7f) | 0x80;
    num >>>= 7;
  }
  output[output.length] = num;
  return output;
};

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8082 });

let pending;

server.on('connection', function(ws) {
  if(pending != undefined) {
    ws.send(pending);
    pending = undefined;
  }
  ws.on('message', function(message) {
    const data = new Packet(new Uint8Array(message));
    const id = data.readVU();
    const result = DecompressLZ4(data.packet.subarray(data.at));
    if(ws.readyState == 1) {
      ws.send(new Uint8Array([...data.writeVU(id), ...result]));
    } else {
      pending = new Uint8Array([...data.writeVU(id), ...result]);
    }
  });
  ws.on('close', function() {});
  ws.on('error', function() {});
});
