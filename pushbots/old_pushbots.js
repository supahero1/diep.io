/*
this code is probably not working already lol.
only for educational purposes
*/

"use strict";
const WebSocket = require("ws");

const server = new WebSocket.Server({ port: process.env.PORT });

//const names = ["team leader pls", "jassou fan", "spin = win", "team pro", "sinx fan", "Fezti fan", "oh bois", "SCORE = SKILL", "no kill pls", "fuck 13", "f22 feedbot", "boisHUN083", "innocent", "diep.io#7444", "DAHL SEXT ME", "TRIPL3 H LOL", "", "LMFAO", "K B K O K I", "KKK BOI, KKK!", "oh boi", "kkk, kkk. kkk!", "u all noobs", "im pro", "fucker", "UR A FUCKER", "NO FEEDING", "carrot x fan", "gay bee", "RENATUS HERE", "REAL OBAMA", "shadbot help", "shadbot servers", "shadbot leaders"];
//const names = [process.env.PROJECT_NAME.match(/botito\-(.*)/)[1]];
const names = [""];
var acceptedIP = [];
const xhr = new XMLRequest();
xhr.open('GET', 'haha real url go brrrr');
xhr.onload = function() {
  acceptedIP = JSON.parse(this.responseText);
};
xhr.onerror = process.exit;
xhr.send(null);

var worker = new Worker(`const { parentPort } = require('worker_threads');
(function() {
  "use strict";
  var root = "object" == typeof window ? window : {},
      NODE_JS = !root.JS_SHA1_NO_NODE_JS && "object" == typeof process && process.versions && process.versions.node;
  NODE_JS && (root = global);
  var COMMON_JS = !root.JS_SHA1_NO_COMMON_JS && "object" == typeof module && module.exports,
      AMD = "function" == typeof define && define.amd,
      HEX_CHARS = "0123456789abcdef".split(""),
      EXTRA = [-2147483648, 8388608, 32768, 128],
      SHIFT = [24, 16, 8, 0],
      OUTPUT_TYPES = ["hex", "array", "digest", "arrayBuffer"],
      blocks = [],
      createOutputMethod = function (t) {
        return function (h) {
          return new Sha1(!0).update(h)[t]()
        }
      },
      createMethod = function () {
        var t = createOutputMethod("hex");
        NODE_JS && (t = nodeWrap(t)), t.create = function () {
          return new Sha1
        }, t.update = function (h) {
          return t.create().update(h)
        };
        for (var h = 0; h < OUTPUT_TYPES.length; ++h) {
          var s = OUTPUT_TYPES[h];
          t[s] = createOutputMethod(s)
        }
        return t
      },
      nodeWrap = function (method) {
        var crypto = eval("require('crypto')"),
            Buffer = eval("require('buffer').Buffer"),
            nodeMethod = function (t) {
              if ("string" == typeof t) return crypto.createHash("sha1").update(t, "utf8").digest("hex");
              if (t.constructor === ArrayBuffer) t = new Uint8Array(t);
              else if (void 0 === t.length) return method(t);
              return crypto.createHash("sha1").update(new Buffer(t)).digest("hex")
            };
        return nodeMethod
      };

  function Sha1(t) {
    t ? (blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0, this.blocks = blocks) : this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], this.h0 = 1732584193, this.h1 = 4023233417, this.h2 = 2562383102, this.h3 = 271733878, this.h4 = 3285377520, this.block = this.start = this.bytes = this.hBytes = 0, this.finalized = this.hashed = !1, this.first = !0
  }
  Sha1.prototype.update = function (t) {
    if (!this.finalized) {
      var h = "string" != typeof t;
      h && t.constructor === root.ArrayBuffer && (t = new Uint8Array(t));
      for (var s, e, i = 0, r = t.length || 0, o = this.blocks; i < r;) {
        if (this.hashed && (this.hashed = !1, o[0] = this.block, o[16] = o[1] = o[2] = o[3] = o[4] = o[5] = o[6] = o[7] = o[8] = o[9] = o[10] = o[11] = o[12] = o[13] = o[14] = o[15] = 0), h)
          for (e = this.start; i < r && e < 64; ++i) o[e >> 2] |= t[i] << SHIFT[3 & e++];
        else
          for (e = this.start; i < r && e < 64; ++i)(s = t.charCodeAt(i)) < 128 ? o[e >> 2] |= s << SHIFT[3 & e++] : s < 2048 ? (o[e >> 2] |= (192 | s >> 6) << SHIFT[3 & e++], o[e >> 2] |= (128 | 63 & s) << SHIFT[3 & e++]) : s < 55296 || s >= 57344 ? (o[e >> 2] |= (224 | s >> 12) << SHIFT[3 & e++], o[e >> 2] |= (128 | s >> 6 & 63) << SHIFT[3 & e++], o[e >> 2] |= (128 | 63 & s) << SHIFT[3 & e++]) : (s = 65536 + ((1023 & s) << 10 | 1023 & t.charCodeAt(++i)), o[e >> 2] |= (240 | s >> 18) << SHIFT[3 & e++], o[e >> 2] |= (128 | s >> 12 & 63) << SHIFT[3 & e++], o[e >> 2] |= (128 | s >> 6 & 63) << SHIFT[3 & e++], o[e >> 2] |= (128 | 63 & s) << SHIFT[3 & e++]);
        this.lastByteIndex = e, this.bytes += e - this.start, e >= 64 ? (this.block = o[16], this.start = e - 64, this.hash(), this.hashed = !0) : this.start = e
      }
      return this.bytes > 4294967295 && (this.hBytes += this.bytes / 4294967296 << 0, this.bytes = this.bytes % 4294967296), this
    }
  }, Sha1.prototype.finalize = function () {
    if (!this.finalized) {
      this.finalized = !0;
      var t = this.blocks,
          h = this.lastByteIndex;
      t[16] = this.block, t[h >> 2] |= EXTRA[3 & h], this.block = t[16], h >= 56 && (this.hashed || this.hash(), t[0] = this.block, t[16] = t[1] = t[2] = t[3] = t[4] = t[5] = t[6] = t[7] = t[8] = t[9] = t[10] = t[11] = t[12] = t[13] = t[14] = t[15] = 0), t[14] = this.hBytes << 3 | this.bytes >>> 29, t[15] = this.bytes << 3, this.hash()
    }
  }, Sha1.prototype.hash = function () {
    var t, h, s = this.h0,
        e = this.h1,
        i = this.h2,
        r = this.h3,
        o = this.h4,
        H = this.blocks;
    for (t = 16; t < 80; ++t) h = H[t - 3] ^ H[t - 8] ^ H[t - 14] ^ H[t - 16], H[t] = h << 1 | h >>> 31;
    for (t = 0; t < 20; t += 5) s = (h = (e = (h = (i = (h = (r = (h = (o = (h = s << 5 | s >>> 27) + (e & i | ~e & r) + o + 1518500249 + H[t] << 0) << 5 | o >>> 27) + (s & (e = e << 30 | e >>> 2) | ~s & i) + r + 1518500249 + H[t + 1] << 0) << 5 | r >>> 27) + (o & (s = s << 30 | s >>> 2) | ~o & e) + i + 1518500249 + H[t + 2] << 0) << 5 | i >>> 27) + (r & (o = o << 30 | o >>> 2) | ~r & s) + e + 1518500249 + H[t + 3] << 0) << 5 | e >>> 27) + (i & (r = r << 30 | r >>> 2) | ~i & o) + s + 1518500249 + H[t + 4] << 0, i = i << 30 | i >>> 2;
    for (; t < 40; t += 5) s = (h = (e = (h = (i = (h = (r = (h = (o = (h = s << 5 | s >>> 27) + (e ^ i ^ r) + o + 1859775393 + H[t] << 0) << 5 | o >>> 27) + (s ^ (e = e << 30 | e >>> 2) ^ i) + r + 1859775393 + H[t + 1] << 0) << 5 | r >>> 27) + (o ^ (s = s << 30 | s >>> 2) ^ e) + i + 1859775393 + H[t + 2] << 0) << 5 | i >>> 27) + (r ^ (o = o << 30 | o >>> 2) ^ s) + e + 1859775393 + H[t + 3] << 0) << 5 | e >>> 27) + (i ^ (r = r << 30 | r >>> 2) ^ o) + s + 1859775393 + H[t + 4] << 0, i = i << 30 | i >>> 2;
    for (; t < 60; t += 5) s = (h = (e = (h = (i = (h = (r = (h = (o = (h = s << 5 | s >>> 27) + (e & i | e & r | i & r) + o - 1894007588 + H[t] << 0) << 5 | o >>> 27) + (s & (e = e << 30 | e >>> 2) | s & i | e & i) + r - 1894007588 + H[t + 1] << 0) << 5 | r >>> 27) + (o & (s = s << 30 | s >>> 2) | o & e | s & e) + i - 1894007588 + H[t + 2] << 0) << 5 | i >>> 27) + (r & (o = o << 30 | o >>> 2) | r & s | o & s) + e - 1894007588 + H[t + 3] << 0) << 5 | e >>> 27) + (i & (r = r << 30 | r >>> 2) | i & o | r & o) + s - 1894007588 + H[t + 4] << 0, i = i << 30 | i >>> 2;
    for (; t < 80; t += 5) s = (h = (e = (h = (i = (h = (r = (h = (o = (h = s << 5 | s >>> 27) + (e ^ i ^ r) + o - 899497514 + H[t] << 0) << 5 | o >>> 27) + (s ^ (e = e << 30 | e >>> 2) ^ i) + r - 899497514 + H[t + 1] << 0) << 5 | r >>> 27) + (o ^ (s = s << 30 | s >>> 2) ^ e) + i - 899497514 + H[t + 2] << 0) << 5 | i >>> 27) + (r ^ (o = o << 30 | o >>> 2) ^ s) + e - 899497514 + H[t + 3] << 0) << 5 | e >>> 27) + (i ^ (r = r << 30 | r >>> 2) ^ o) + s - 899497514 + H[t + 4] << 0, i = i << 30 | i >>> 2;
    this.h0 = this.h0 + s << 0, this.h1 = this.h1 + e << 0, this.h2 = this.h2 + i << 0, this.h3 = this.h3 + r << 0, this.h4 = this.h4 + o << 0
  }, Sha1.prototype.hex = function () {
    this.finalize();
    var t = this.h0,
        h = this.h1,
        s = this.h2,
        e = this.h3,
        i = this.h4;
    return HEX_CHARS[t >> 28 & 15] + HEX_CHARS[t >> 24 & 15] + HEX_CHARS[t >> 20 & 15] + HEX_CHARS[t >> 16 & 15] + HEX_CHARS[t >> 12 & 15] + HEX_CHARS[t >> 8 & 15] + HEX_CHARS[t >> 4 & 15] + HEX_CHARS[15 & t] + HEX_CHARS[h >> 28 & 15] + HEX_CHARS[h >> 24 & 15] + HEX_CHARS[h >> 20 & 15] + HEX_CHARS[h >> 16 & 15] + HEX_CHARS[h >> 12 & 15] + HEX_CHARS[h >> 8 & 15] + HEX_CHARS[h >> 4 & 15] + HEX_CHARS[15 & h] + HEX_CHARS[s >> 28 & 15] + HEX_CHARS[s >> 24 & 15] + HEX_CHARS[s >> 20 & 15] + HEX_CHARS[s >> 16 & 15] + HEX_CHARS[s >> 12 & 15] + HEX_CHARS[s >> 8 & 15] + HEX_CHARS[s >> 4 & 15] + HEX_CHARS[15 & s] + HEX_CHARS[e >> 28 & 15] + HEX_CHARS[e >> 24 & 15] + HEX_CHARS[e >> 20 & 15] + HEX_CHARS[e >> 16 & 15] + HEX_CHARS[e >> 12 & 15] + HEX_CHARS[e >> 8 & 15] + HEX_CHARS[e >> 4 & 15] + HEX_CHARS[15 & e] + HEX_CHARS[i >> 28 & 15] + HEX_CHARS[i >> 24 & 15] + HEX_CHARS[i >> 20 & 15] + HEX_CHARS[i >> 16 & 15] + HEX_CHARS[i >> 12 & 15] + HEX_CHARS[i >> 8 & 15] + HEX_CHARS[i >> 4 & 15] + HEX_CHARS[15 & i]
  }, Sha1.prototype.toString = Sha1.prototype.hex, Sha1.prototype.digest = function () {
    this.finalize();
    var t = this.h0,
        h = this.h1,
        s = this.h2,
        e = this.h3,
        i = this.h4;
    return [t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, 255 & t, h >> 24 & 255, h >> 16 & 255, h >> 8 & 255, 255 & h, s >> 24 & 255, s >> 16 & 255, s >> 8 & 255, 255 & s, e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, 255 & e, i >> 24 & 255, i >> 16 & 255, i >> 8 & 255, 255 & i]
  }, Sha1.prototype.array = Sha1.prototype.digest, Sha1.prototype.arrayBuffer = function () {
    this.finalize();
    var t = new ArrayBuffer(20),
        h = new DataView(t);
    return h.setUint32(0, this.h0), h.setUint32(4, this.h1), h.setUint32(8, this.h2), h.setUint32(12, this.h3), h.setUint32(16, this.h4), t
  };
  root.sha1 = createMethod()
})();
function solve(r, e) {
  for(;;) {
    var a = '';
    var n = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    a += n[Math.random() * n.length | 0];
    if(checc(sha1(r + a + r), e) == true) {
      return a;
    }
  }
}
function checc(b, e) {
  for(var n = 0; n < (e / 4 | 0); ++n) {
    if(b[n] != '0') return false;
  }
  for(n = 4 * (e / 4 | 0); n < e; ++n) {
    if(!(s[b.charCodeAt(n / 4 | 0)] & 1 << (3 & n))) return false;
  }
  return true;
}
const s = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
parentPort.on('message', function(e) {
  parentPort.postMessage([e[0], solve(e[1], e[2])]);
});`, { eval: true });
var nextJobID = 0;
var workerCallbacks = {};
function solve(prefix, difficulty, cb) {
	var id = nextJobID++;
	worker.postMessage([id, prefix, difficulty]);
	workerCallbacks[id] = cb;
}
worker.on('message', function(e) {
	workerCallbacks[e[0]].apply(null, e.slice(1));
  delete workerCallbacks[e[0]];
});

let abcdefg = setInterval(function() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'haha real url go brrr');
  xhr.onload = function() {
    acceptedIP = JSON.parse(this.responseText);
  };
  xhr.send(null);
}, 1e6);

let bots = [];
let servers = {};
function isTaken(id, party) {
  if(party.length == 8 || party == "") {
    if(servers[id] == null) {
      servers[id] = 0;
      return false;
    } else {
      return true;
    }
  } else if(servers[id + party] == null) {
    servers[id + party] = 0;
    return false;
  } else {
    return true;
  }
}
function increaseCount(id, party) {
  if(party.length == 8 || party == "") {
    servers[id]++;
  } else {
    servers[id + party]++;
  }
}
function decreaseCount(id, party) {
  if(party.length == 8 || party == "") {
    servers[id]--;
  } else {
    servers[id + party]--;
  }
}
function getCount(id, party) {
  if(party.length == 8 || party == "") {
    return servers[id];
  } else {
    return servers[id + party];
  }
}
function resetCount(id, party) {
  if(party.length == 8 || party == "") {
    servers[id] = null;
  } else {
    servers[id + party] = null;
  }
}
async function connectBots(serverID, party, truth, web) {
  if(isTaken(serverID, party) == true) {
    await disconnectBots(serverID, party);
  }
  await reconnectBot(serverID, party, truth, web);
  setTimeout(async function() {
    //await reconnectBot(serverID, party, truth, web);
  }, 5e2);
}
function checkForOptimise() {
  let dedCount = 0;
  for(let i = 0; i < bots.length; i++) {
    if(bots[i] == null || bots[i].readyState > 1) {
      dedCount++;
    }
  }
  if(dedCount == bots.length) {
    bots = [];
  }
}
function disconnectBots(id, party) {
  return new Promise(function(resolve) {
    let count = getCount(id, party);
    for(let i = 0; i < bots.length; i++) {
      if(bots[i] != null && bots[i].serverID == id && bots[i].party == party) {
        bots[i].onclose = bots[i].onerror = function() {};
        if(bots[i].readyState == 1) {
          bots[i].close();
          count--;
          decreaseCount(id, party);
        } else if(bots[i].readyState == 0) {
          bots[i].onopen = function() {
            this.close();
            decreaseCount(id, party);
            if(--count == 0) {
              checkForOptimise();
              resetCount(id, party);
              resolve();
            }
          };
        } else {
          count--;
          decreaseCount(id, party);
        }
      } else if(bots[i] == null) {
        count--;
        decreaseCount(id, party);
      }
    }
    if(count <= 0) {
      checkForOptimise();
      resetCount(id, party);
      resolve();
    }
  });
}
function disconnectBot(i) {
  return new Promise(function(resolve) {
    if(bots[i] != null) {
      bots[i].onclose = bots[i].onerror = function() {};
      if(bots[i].readyState == 1) {
        bots[i].close();
        decreaseCount(bots[i].serverID, bots[i].party);
        if(getCount(bots[i].serverID, bots[i].party) == 0) {
          resetCount(bots[i].serverID, bots[i].party);
        }
        checkForOptimise();
        resolve();
      } else if(bots[i].readyState == 0) {
        bots[i].onopen = function() {
          this.close();
          decreaseCount(this.serverID, this.party);
          if(getCount(this.serverID, this.party) == 0) {
            resetCount(this.serverID, this.party);
          }
          checkForOptimise();
          resolve();
        };
      } else {
        resolve();
      }
    }
  });
}
function reconnectBot(serverID, party = "", truth, web, id = bots.length) {
  return new Promise(function(resolve) {
    const ws = new WebSocket(`wss://${serverID}.s.m28n.net`, {
      "origin": "https://diep.io",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4143.120 Safari/537.36",
      "pragma": "no-cache",
      "connection": "Upgrade",
      "upgrade": "websocket",
      "cache-control": "no-cache",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US;q=0.8,en;q=0.7",
      "host": `${serverID}.s.m28n.net`
    });
    ws.id = id;
    ws.serverID = serverID;
    ws.party = party;
    ws.web = web;
    ws._send = ws.send;
    ws.onopen = function() {
      if(this.web.readyState == 1) {
        this.web.send(new Uint8Array([4]));
      }
      this.processor = new Processor([], this);
      this.onmessage = function(x) {
        let data = new Uint8Array(x.data);
        this.processor.set(data);
        this.processor.parse();
        if(data[0] == 5) {
          setTimeout(function() {
            ws.send(new Uint8Array([5]));
          }, 5e2);
        } else if(data[0] == 6 && this.web.readyState == 1) {
          this.web.send(new Uint8Array([0, this.id, ...Array.from(data.subarray(1)).map(r => r.toString(16).padStart(2, "0").split("").reverse().join("")).join("").split("").map(r => r.charCodeAt())]));
        }
        /*if(truth == 0) {
          this.onmessage = function(x) {
            console.log(`received a message with op ${new Uint8Array(x.data)[0]}`);
            let data = new Uint8Array(x.data);
            this.processor.set(data);
            this.processor.parse();
            if(data[0] == 5) {
              setTimeout(function() {
                ws.send(new Uint8Array([5]));
              }, 5e2);
            } else if(data[0] == 6 && this.web.readyState == 1) {
              this.web.send(new Uint8Array([0, this.id, ...Array.from(data.subarray(1)).map(r => r.toString(16).padStart(2, "0").split("").reverse().join("")).join("").split("").map(r => r.charCodeAt())]));
            }
          };
        } else {
          this.onmessage = function(x) {
            let data = new Uint8Array(x.data);
            this.processor.set(data);
            this.processor.parse();
            if(data[0] == 5) {
              setTimeout(function() {
                ws.send(new Uint8Array([5]));
              }, 5e2);
            }
            const angle = Math.atan2(-this.processor.y, -this.processor.x);
            let keys = 0x81;
            const e = Math.PI / 8;
            if(angle >= -e && angle < e) {
              keys |= 16;
            } else if(angle >= e && angle < e * 3) {
              keys |= 24;
            } else if(angle >= e * 3 && angle < e * 5) {
              keys |= 8;
            } else if(angle >= e * 5 && angle < e * 7) {
              keys |= 12;
            } else if(angle >= e * 7 || angle < -e * 7) {
              keys |= 4;
            } else if(angle >= -e * 7 && angle < -e * 5) {
              keys |= 6;
            } else if(angle >= -e * 5 && angle < -e * 3) {
              keys |= 2;
            } else {
              keys |= 18;
            }
            const angle2 = Math.atan2(this.processor.y, this.processor.x);
            this.processor.float[0] = this.processor.x + Math.cos(angle2) * 1000;
            const mx = this.processor.writeVI(this.processor.u8[0] << 24 | this.processor.u8[1] << 16 | this.processor.u8[2] << 8 | this.processor.u8[3]);
            this.processor.float[0] = this.processor.y + Math.sin(angle2) * 1000;
            const my = this.processor.writeVI(this.processor.u8[0] << 24 | this.processor.u8[1] << 16 | this.processor.u8[2] << 8 | this.processor.u8[3]);
            if(this.processor.canSpawn != false) this.send(new Uint8Array([2, ...names[Math.floor(Math.random() * names.length)].split("").map(r => r.charCodeAt())]));
            this.send(new Uint8Array([1, keys, 18, ...mx, ...my]));
            this.send(new Uint8Array([3, 4, 1]));
            this.send(new Uint8Array([3, 6, 1]));
            this.send(new Uint8Array([3, 10, 1]));
            this.send(new Uint8Array([4, 86]));
            this.send(new Uint8Array([4, 76]));
          };
        }*/
        this.send(new Uint8Array([5]));
        resolve(ws);
      };
      this.send(new Uint8Array([0]));
    };
    ws.onclose = ws.onerror = async function(e) {
      console.log(e.message || e.reason);
      console.log('closed / errored');
      setTimeout(async function() {
        resolve(await reconnectBot(serverID, party, truth, web, id));
      }.bind(this), 1e3);
      if(this.web.readyState == 1) {
        this.web.send(new Uint8Array([5]));
      }
      //resolve();
    };
    bots[id] = ws;
    increaseCount(serverID, party);
  });
}
function updateBots(data, serverID, party) {
  const repel = data[0];
  data = data.slice(1);
  for(let i = 0; i < bots.length; i++) {
    if(bots[i] != null && bots[i].readyState == 1 && bots[i].serverID == serverID && bots[i].party == party) {
      if(bots[i].preventing == null) {
        bots[i].processor.set(data);
        const playerx = bots[i].processor.readVI();
        const playery = bots[i].processor.readVI();
        let angle, shootingAngle;
        if(repel == 0) {
          angle = Math.atan2(playery - bots[i].processor.y, playerx - bots[i].processor.x);
          shootingAngle = Math.atan2(bots[i].processor.y - playery, bots[i].processor.x - playerx);
        } else {
          angle = Math.atan2(bots[i].processor.y - playery, bots[i].processor.x - playerx);
          shootingAngle = Math.atan2(playery - bots[i].processor.y, playerx - bots[i].processor.x);
        }
        bots[i].processor.mx = (bots[i].processor.x + Math.cos(shootingAngle) * 1000) | 0;
        bots[i].processor.my = (bots[i].processor.y + Math.sin(shootingAngle) * 1000) | 0;
        let keys = 0x81;
        const e = Math.PI / 8;
        if(angle >= -e && angle < e) {
          keys |= 16;
        } else if(angle >= e && angle < e * 3) {
          keys |= 24;
        } else if(angle >= e * 3 && angle < e * 5) {
          keys |= 8;
        } else if(angle >= e * 5 && angle < e * 7) {
          keys |= 12;
        } else if(angle >= e * 7 || angle < -e * 7) {
          keys |= 4;
        } else if(angle >= -e * 7 && angle < -e * 5) {
          keys |= 6;
        } else if(angle >= -e * 5 && angle < -e * 3) {
          keys |= 2;
        } else {
          keys |= 18;
        }
        bots[i].processor.float[0] = bots[i].processor.mx;
        const mx = bots[i].processor.writeVI(bots[i].processor.u8[0] << 24 | bots[i].processor.u8[1] << 16 | bots[i].processor.u8[2] << 8 | bots[i].processor.u8[3]);
        bots[i].processor.float[0] = bots[i].processor.my;
        const my = bots[i].processor.writeVI(bots[i].processor.u8[0] << 24 | bots[i].processor.u8[1] << 16 | bots[i].processor.u8[2] << 8 | bots[i].processor.u8[3]);
        if(bots[i].processor.canSpawn != false) {
          bots[i].send(new Uint8Array([2, ...names[Math.floor(Math.random() * names.length)].split("").map(r => r.charCodeAt())]));
          bots[i].processor.canSpawn = false;
          setTimeout(function() {
            if(bots[i] != null && bots[i].processor != null) {
              bots[i].processor.canSpawn = true;
            }
          }, 2e3);
        }
        bots[i].send(new Uint8Array([1, keys, 16, ...mx, ...my]));
        bots[i].send(new Uint8Array([3, 6, 1]));
      } else {
        bots[i].a = !bots[i].a;
        if(bots[i].processor.canSpawn != false) {
          bots[i].send(new Uint8Array([2, ...names[Math.floor(Math.random() * names.length)].split("").map(r => r.charCodeAt())]));
          bots[i].processor.canSpawn = false;
          setTimeout(function() {
            if(bots[i] != null && bots[i].processor != null) {
              bots[i].processor.canSpawn = true;
            }
          }, 2e3);
        }
        if(bots[i].a == true) {
          bots[i].send(new Uint8Array([1, 0x8a, 16, 0, 0]));
        } else {
          bots[i].send(new Uint8Array([1, 0x80, 16, 0, 0]));
        }
      }
    }
  }
}
let int, inter;
server.on("connection", function(websocket, request) {
  console.log("someone connected!")
  const ip = request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
  if(acceptedIP.find(r => r == ip) == null) {
    return console.log(`rejected ip ${ip}`);
  } else {
    console.log(`accepted ip ${ip}`);
  }
  var serverID = null;
  var party = null;
  websocket.on("message", async function(message) {
    message = Array.from(new Uint8Array(message));
    const op = message[0];
    message = message.slice(1);
    switch(op) {
      case 0: {
        process.exit();
        break;
      }
      case 1: {
        serverID = message.slice(0, 4).map(r => String.fromCharCode(r)).join("");
        party = message.slice(4).map(r => String.fromCharCode(r)).join("");
        await connectBots(serverID, party, 0, websocket);
        break;
      }
      case 2: {
        clearInterval(int);
        updateBots(message, serverID, party);
        int = setInterval(updateBots, 50, message, serverID, party); // 90ms
        websocket.send(new Uint8Array([255]));
        break;
      }
      case 3: {
        if(message[0] == 0) {
          await disconnectBots(message.slice(1, 5).map(r => String.fromCharCode(r)).join(""), message.slice(5).map(r => String.fromCharCode(r)).join(""));
        } else {
          await disconnectBot(message[1]);
        }
        break;
      }
      case 4: {
        const id = message.slice(0, 4).map(r => String.fromCharCode(r)).join("");
        serverID = id;
        const party = message.slice(4).map(r => String.fromCharCode(r)).join("");
        await connectBots(id, party, 1);
        break;
      }
      case 5: {
        if(bots[message[0]] != null && bots[message[0]].readyState == 1) {
          if(bots[message[0]].preventing == null) {
            bots[message[0]].preventing = true;
            bots[message[0]].a = false;
          } else {
            bots[message[0]].preventing = null;
          }
        }
        break;
      }
      case 6: {
        for(let i = 0; i < bots.length; i++) {
          if(bots[i] != null && bots[i].readyState == 1 && bots[i].serverID == serverID && bots[i].party == party) {
            bots[i].preventing = true;
          }
        }
        break;
      }
      case 7: {
        for(let i = 0; i < bots.length; i++) {
          if(bots[i] != null && bots[i].readyState == 1 && bots[i].serverID == serverID && bots[i].party == party) {
            bots[i].preventing = null;
          }
        }
        break;
      }
      default: {
        return;
      }
    }
  });
  inter = setInterval(function() {
    if(websocket.readyState == 1) {
      websocket.send(new Uint8Array([255]));
    } else {
      clearInterval(inter);
    }
  }, 1e3);
  websocket.on("close", function() {
    clearInterval(int);
  });
  websocket.on("error", function() {
    clearInterval(int);
  });
});

let Processor = function(packet, socket) {
  this.buffer = Array.from(new Uint8Array(packet));
  this.at = 0;

  this._buffer = new ArrayBuffer(4);
  this.u8 = new Uint8Array(this._buffer);
  this.float = new Float32Array(this._buffer);

  this.id = 0;
  this.id2 = 0;
  this.socket = socket;
  
  this.canSpawn = true;

  this.x = 0;
  this.y = 0;
  this.mx = 0;
  this.my = 0;
};
Processor.prototype.set = function(array) {
  this.buffer = Array.from(new Uint8Array(array));
  this.at = 0;
};
Processor.prototype.writeVU = function(number) {
  let vu = [];
  while(number > 0x7f) {
    vu[vu.length] = (number & 0x7f) | 0x80;
    number >>= 7;
  }
  vu[vu.length] = number;
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
  if(number < 0) {
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
    if(op == 2) {
      this.decompressLZ4();
    }
    this.findPlayerIDByForce();
    this.findPlayerUpdateByForce();
  } else if(op == 11) {
    const difficulty = this.readVU();
    solve(this.readString(), difficulty, function(result) {
      if(this.socket.readyState == 1) {
        this.socket.send(new Uint8Array([10, ...result.split('').map(r => r.charCodeAt()), 0]));
      }
    }.bind(this));
  } else if(op == 1) {
    this.socket.send(new Uint8Array([0, ...Array.from(this.buffer.slice(1)), 0, ...this.socket.party.split("").map(r => r.charCodeAt()), 0, 0]));
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
    if(this.socket.web.readyState == 1 && this.id != 0) {
      this.socket.web.send(new Uint8Array([2, ...this.writeVU(this.id)]));
    }
    this.id2 = this.readVU();
    this.id = this.readVU();
    if(this.socket.web.readyState == 1) {
      this.socket.web.send(new Uint8Array([1, ...this.writeVU(this.id)]));
    }
  }
};
Processor.prototype.findPlayerUpdateByForce = function() {
  let continues = 1;
  const testString = `${this.writeVU(this.id2).map(r => r.toString(16).padStart(2, "0")).join("")}${this.writeVU(this.id).map(r => r.toString(16).padStart(2, "0")).join("")}0001`;
  const result = this.buffer.map(r => r.toString(16).padStart(2, "0")).join("").indexOf(testString);
  if(result == -1) {
    return;
  } else {
    this.at = result / 2 + testString.length / 2;
    this.readCF(function(field) {
      if(continues == 0) {
        return;
      }
      switch(field) {
        case 0: {
          this.at--;
          break;
        }
        case 1: {
          this.y = this.readVI();
          break;
        }
        case 2: {
          this.readVI();
          break;
        }
        case 3: {
          this.x = this.readVI();
          break;
        }
        default: {
          continues = 0;
          break;
        }
      }
    });
  }
};
console.log("running!");
