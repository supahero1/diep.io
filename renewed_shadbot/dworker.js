const { parentPort } = require('worker_threads');

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

parentPort.on('message', function(e) {
  parentPort.postMessage([0, e[0]]);
  parentPort.postMessage([1, e[0], DecompressLZ4(e[1])]);
});
