// ==UserScript==
// @name         SpreadScript
// @author       Shädam
// @match        https://diep.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

let ws = null;
let started = false;
let currentPacket = 0;
let lastPacket = null;
let cycle = 0;
let count = 0;
let lastPacketAt = null;
let time = 40;
let packets = [];
let mouse = [0, 0];
let on = false;
let running = false;
let pingAt = 0;
let pings = [];
let ping = 0;
let side = 1;
let mouseTimeouts = [];
let canvas = null;
let tx = 0;
let ty = 0;
let tr = 0;
let xx = 0;
let yy = 0;
let angle = 0;
let override = false;
let counter = 0;
let autofire = false;
let dead = true;
let died = false;
let biggestBullet = 0;
let findBiggestBullet = true;
let findPlayer = false;
const scale = window.devicePixelRatio;
let c = window.CanvasRenderingContext2D.prototype;
c.UNIQUEarc = c.arc;
c.arc = function(x, y, r, a, b, c) {
  if(findPlayer == true && tr > biggestBullet * 2 && tx > window.innerWidth / 2 - 50 && tx < window.innerWidth / 2 + 50 && ty > window.innerHeight / 2 - 50 && ty < window.innerHeight / 2 + 50) {
    xx = tx;
    yy = ty;
    angle = Math.atan2(mouse[1] - ty, mouse[0] - tx);
    window.input.mouse(mouse[0], mouse[1]);
  }
  this.UNIQUEarc(x, y, r, a, b, c);
};
c.UNIQUEset = c.setTransform;
c.setTransform = function(a, b, c, d, e, f) {
  tx = Math.round(e);
  ty = Math.round(f);
  tr = Math.round(a);
  if(findPlayer == false) {
    angle = Math.atan2(mouse[1] - ty, mouse[0] - tx);
    window.input.mouse(mouse[0], mouse[1]);
  }
  this.UNIQUEset(a, b, c, d, e, f);
};

WebSocket.prototype.UNIQUEsend = WebSocket.prototype.send;
WebSocket = class extends WebSocket {
  constructor(ip) {
    super(ip);
    if(ip.match(/m28/) != null) {
      ws = this;
      biggestBullet = 0;
      if(window.input.UNIQUEmouse == null) {
        window.input.UNIQUEmouse = window.input.mouse;
        window.input.mouse = function(x, y) {
          if(override == true && (autofire == true || running == true)) {
            this.UNIQUEmouse(xx + Math.cos(angle + Math.PI * 75 / 180 * counter/5 * side) * 500, yy + Math.sin(angle + Math.PI * 75 / 180 * counter/5 * side) * 500);
          } else {
            this.UNIQUEmouse(x, y);
          }
        };
        canvas = document.getElementById('canvas');
        const observer = new MutationObserver(function(mutations) {
          for(let mutation of mutations) {
            dead = !dead;
          }
          if(mutations.length == 1 && dead == false) {
            died = false;
          }
          if(dead == true && died == false) {
            died = true;
            on = false;
            autofire = false;
            running = false;
            lastPacket = null;
            for(let timeout of mouseTimeouts) {
              window.clearTimeout(timeout);
            }
            counter = 0;
            override = false;
            ws.UNIQUEonmessage({ data: new Uint8Array([3, 83, 112, 114, 101, 97, 100, 115, 99, 114, 105, 112, 116, 32, 111, 102, 102, 33, 0, 0, 0, 0, 0, 0, 0, 0, 69, 0]).buffer });
          }
        }).observe(document.getElementById('a'), { attributes: true, childList: false, subtree: false });
      }
      this.processor = new Processor([]);
      this.send = function(x) {
        this.UNIQUEonmessage = this.onmessage;
        this.onmessage = function({ data }) {
          this.processor.set(new Uint8Array(data));
          this.processor.parse();
          this.UNIQUEonmessage({ data });
        };
        this.UNIQUEsend(x);
        this.send = function(x) {
          if(x[0] == 5) {
            pingAt = new Date().getTime();
          }
          this.UNIQUEsend(x);
        };
      };
    }
  }
}

function hexLog(stuff){return Array.from(new Uint8Array(stuff)).map(function(a){return a.toString(16).padStart(2,"0")}).join(" ")};

document.addEventListener('mousemove', function(event) {
  mouse = [event.clientX * scale, event.clientY * scale];
  angle = Math.atan2(mouse[1] - yy, mouse[0] - xx);
  window.input.mouse(mouse[0], mouse[1]);
});
document.addEventListener('keydown', function(event) {
  if((event.keyCode == 192 || event.which == 192) && dead == false) {
    on = !on;
    if(on == true && ws != null && ws.readyState == 1) {
      ws.UNIQUEonmessage({ data: new Uint8Array([3, 83, 112, 114, 101, 97, 100, 115, 99, 114, 105, 112, 116, 32, 111, 110, 33, 0, 0, 0, 0, 0, 0, 0, 0, 69, 0]).buffer });
    } else if(ws != null && ws.readyState == 1) {
      ws.UNIQUEonmessage({ data: new Uint8Array([3, 83, 112, 114, 101, 97, 100, 115, 99, 114, 105, 112, 116, 32, 111, 102, 102, 33, 0, 0, 0, 0, 0, 0, 0, 0, 69, 0]).buffer });
    }
  } else if((event.keyCode == 69 || event.which == 69) && dead == false) {
    autofire = !autofire;
    if(autofire == false && running == false) {
      lastPacket = null;
      for(let timeout of mouseTimeouts) {
        window.clearTimeout(timeout);
      }
      counter = 0;
      window.input.mouse(mouse[0], mouse[1]);
      override = false;
      biggestBullet = 0;
    } else if(autofire == true && running == false) {
      lastPacket = null;
      biggestBullet = 0;
    }
  }
});
document.addEventListener('mousedown', function(event) {
  if(event.button == 0 && dead == false) {
    running = true;
    if(autofire == false) {
      lastPacket = null;
      biggestBullet = 0;
    }
  }
});
document.addEventListener('mouseup', function(event) {
  if(event.button == 0 && dead == false) {
    running = false;
    if(autofire == false) {
      for(let timeout of mouseTimeouts) {
        window.clearTimeout(timeout);
      }
      counter = 0;
      window.input.mouse(mouse[0], mouse[1]);
      override = false;
      biggestBullet = 0;
    }
  }
});

let Processor = function(packet) {
  this.buffer = Array.from(new Uint8Array(packet));
  this.at = 0;

  this._buffer = new ArrayBuffer(4);
  this.u8 = new Uint8Array(this._buffer);
  this.float = new Float32Array(this._buffer);
};
Processor.prototype.set = function(array) {
  this.buffer = Array.from(new Uint8Array(array));
  this.at = 0;
};
Processor.prototype.writeVU = function(number) {
  let vu = [];
  while (true) {
    if (number > 0x7f) {
      vu[vu.length] = (number & 0x7f) | 0x80;
      number >>= 7;
    } else {
      vu[vu.length] = number;
      break;
    }
  }
  return vu;
};
Processor.prototype.readVU = function() {
  let number = 0;
  let count = 0;
  do {
    number |= (this.buffer[this.at] & 0x7f) << (7 * count++);
  } while((this.buffer[this.at++] >> 7) == 1);
  return number;
};
Processor.prototype.writeVI = function(number) {
  number <<= 1;
  if (number < 0) {
    number = ~number;
  }
  return this.writeVU(number);
};
Processor.prototype.readVI = function() {
  let vu = this.readVU();
  const sign = vu & 1;
  vu >>= 1;
  if(sign == 1) {
    vu = ~vu;
  }
  return vu;
};
Processor.prototype.readString = function() {
  let output = "";
  while(this.buffer[this.at] != 0) {
    output += String.fromCharCode(this.buffer[this.at++]);
  }
  this.at++;
  return this.decodeURI(output);
};
Processor.prototype.readFloat = function() {
  this.u8.set([this.buffer[this.at++], this.buffer[this.at++], this.buffer[this.at++], this.buffer[this.at++]]);
  return this.float[0];
};
Processor.prototype.decodeURI = function(string) {
  return decodeURIComponent(string.split("").map(function(char) {
    return `%${char.charCodeAt().toString(16).padStart(2, "0")}`;
  }).join(""));
};
Processor.prototype.decompressLZ4 = function() {
  const finalLength = (this.buffer[4] << 24) | (this.buffer[3] << 16) | (this.buffer[2] << 8) | this.buffer[1];
  this.at = 5;
  let output = [];
  while(true) {
    const token = this.buffer[this.at++];
    let literalLength = token >> 4;
    if(literalLength == 0xf) {
      do {
        literalLength += this.buffer[this.at];
      } while(this.buffer[this.at++] == 0xff);
    }
    output = [...output, ...this.buffer.slice(this.at, this.at + literalLength)];
    this.at += literalLength;
    if(this.at >= this.buffer.length - 1) {
      break;
    }
    const copyStart = output.length - ((this.buffer[++this.at] << 8) | this.buffer[this.at++ - 1]);
    let copyLength = token & 0xf;
    if(copyLength == 0xf) {
      do {
        copyLength += this.buffer[this.at];
      } while(this.buffer[this.at++] == 0xff);
    }
    copyLength += 4;
    if(copyStart + copyLength <= output.length) {
      output = [...output, ...output.slice(copyStart, copyStart + copyLength)];
    } else {
      let oldLength = output.length;
      output = [...output, ...output.slice(copyStart, output.length)];
      for(let i = 0; i < copyStart + copyLength - oldLength; i++) {
        output[output.length] = output[oldLength + i];
      }
    }
  }
  if(output.length == finalLength) {
    this.buffer = output;
    this.at = 1;
  }
};
Processor.prototype.readID = function() {
  const val = this.readVU();
  if(val != 0) {
    return [val, this.readVU()];
  } else {
    return 0;
  }
};
Processor.prototype.readCF = function(argumentHandler = function() {
  return this.readVI();
}) {
  const output = [];
  let count = 0;
  output[0] = [this.buffer[this.at] ^ 1, argumentHandler.call(this, this.buffer[this.at++] ^ 1)];
  while(this.buffer[this.at] ^ 1 != 0 && this.at < this.buffer.length) {
    output[output.length] = [(this.buffer[this.at] ^ 1) + output[output.length - 1][0], argumentHandler.call(this, (this.buffer[this.at++] ^ 1) + output[output.length - 1][0])];
  }
  this.at++;
  return output;
};
Processor.prototype.readIDBackwards = function() {
  let count = 0;
  while(count < 2) {
    if((this.buffer[this.at] >> 7) == 0) {
      count++;
    }
    this.at--;
  }
  this.at++;
};
Processor.prototype.parse = function() {
  const op = this.readVU();
  if(op == 0 || op == 2) {
    if(this.buffer.length == 1) {
      return;
    }
    let clearCount = false;
    if(lastPacketAt != null) {
      if(packets.length == 16) {
        packets.shift();
      }
      packets[packets.length] = new Date().getTime() - lastPacketAt;
      for(let i = 0; i < packets.length; i++) {
        time += packets[i];
      }
      time /= packets.length;
      time = Math.round(time);
    }
    lastPacketAt = new Date().getTime();
    if(op == 2) {
      this.decompressLZ4();
    }
    currentPacket = this.readVU();
    this.findPlayerIDByForce();
    const string = Array.from(this.buffer).map(r => r.toString(16).padStart(2, "0")).join("");
    const bulletCreations = string.match(/000200070001(.{96})/g);
    if(bulletCreations != null) {
      const pro = new Processor([]);
      for(let i = 0; i < bulletCreations.length; i++) {
        pro.set(bulletCreations[i].substring(12).match(/.{2}/g).map(r => parseInt(r, 16)));
        pro.readVU();
        pro.readVU();
        pro.readVU();
        //
        pro.readVU();
        pro.readVU(); // trivial id
        const realOwnerID = pro.readVU();
        if(this.id != null && realOwnerID == this.id) {
          pro.readVU();
          pro.readFloat();
          pro.readVU();
          pro.readVU();
          pro.readVU();
          pro.readVU();
          pro.readFloat();
          pro.readVU();
          const radius = pro.readFloat() | 0;
          if(radius > biggestBullet) {
            biggestBullet = radius;
          }
          if((findBiggestBullet == false && radius == 32) || (findBiggestBullet == true && radius == biggestBullet)) {
            clearCount = true;
            if(lastPacket == null) {
              lastPacket = currentPacket;
            } else if(running == true || autofire == true) {
              cycle = currentPacket - lastPacket;
              lastPacket = currentPacket;
            }
          } else if(findBiggestBullet == true && radius < biggestBullet && lastPacket != null && currentPacket - lastPacket > cycle) {
            biggestBullet = 0;
          }
        }
      }
    }
    if((running == true || autofire == true) && on == true && ++count == cycle - Math.round(ping / time)) {
      side = ~side + 1;
      override = true;
      counter = 1;
      for(let timeout of mouseTimeouts) {
        window.clearTimeout(timeout);
      }
      for(let i = 0; i < 5; i++) {
        mouseTimeouts[i] = window.setTimeout(function() {
          //side = ~side + 1;
          //if(Math.random() > 0.5) {
            //side = ~side + 1;
          //}
          window.input.mouse(mouse[0], mouse[1]);
          counter++;
        }, Math.round((Math.round(cycle / 5) * time) * i * 0.86));
      }
      mouseTimeouts[5] = window.setTimeout(function() {
        counter = 0;
        window.input.mouse(mouse[0], mouse[1]);
        override = false;
      }, Math.round((Math.round(cycle / 5) * time) * 5 * 0.86));
    }
    if(clearCount == true) {
      count = 0;
    }
  } else if(op == 5) {
    if((cycle > 0 && pings.length == cycle) || (cycle < 1 && pings.length == 10)) {
      pings.shift();
    }
    pings[pings.length] = new Date().getTime() - pingAt;
    ping = 0;
    for(let i = 0; i < pings.length; i++) {
      ping += pings[i];
    }
    ping /= pings.length;
    ping = Math.round(ping);
  }
};
Processor.prototype.findPlayerIDByForce = function() {
  const result = this.buffer.map(r => String.fromCharCode(r)).join("").indexOf("\x01\x00\x02\x00\x05\x03\x00\x03\x01");
  const result2 = this.buffer.map(r => String.fromCharCode(r)).join("").indexOf("Regen");
  if(result == -1 || result2 == -1) {
    return;
  } else {
    this.at = result - 1;
    this.readIDBackwards();
    this.id2 = this.readVU();
    this.id = this.readVU();
  }
};
