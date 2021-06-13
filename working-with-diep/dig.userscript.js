// ==UserScript==
// @name         Diep.io Information Gatherer
// @version      1.0
// @author       don_shädministrator
// @match        https://diep.io/
// @grant        none
// @run-at       document-start
// @require      https://raw.githubusercontent.com/Qwokka/wail.min.js/5e32d36bd7a5e0830d1ff4b64d3587aea13f77da/wail.min.js
// ==/UserScript==
"use strict";

var indx1 = 0;
var indx2 = 0;
var for_real1 = 0;
var for_real2 = 0;
var log = 1;
window.stop_log = function() {
  log = 0;
};
window.start_log = function() {
  log = 1;
};
window.stringify_bundle = function() {
  console.log(`const I_JUMP_TABLE = [${window.bundle.incoming_jump_table.join(',')}];
const DECODE_TABLES = [${window.bundle.incoming_decode_tables.map(r => `[${r.join(',')}]`).join(',')}];
const I_JUMP_TIMES = [${window.bundle.incoming_jump_times.join(',')}];

const O_JUMP_TABLE = [${window.bundle.outcoming_jump_table.join(',')}];
const ENCODE_TABLES = [${window.bundle.outcoming_decode_tables.map(r => `[${r.join(',')}]`).join(',')}];
const O_JUMP_TIMES = [${window.bundle.outcoming_jump_times.join(',')}];`);
};
window.stringify_bundle2 = function(a) {
  console.log(`const I_JUMP_TABLE = [${window.bundle.incoming_jump_table.join(',')}];
const DECODE_TABLES = [${window.bundle.incoming_decode_tables.slice(0, a).map(r => `[${r.join(',')}]`).join(',')}];
const I_JUMP_TIMES = [${window.bundle.incoming_jump_times.slice(0, a).join(',')}];

const O_JUMP_TABLE = [${window.bundle.outcoming_jump_table.join(',')}];
const ENCODE_TABLES = [${window.bundle.outcoming_decode_tables.slice(0, a).map(r => `[${r.join(',')}]`).join(',')}];
const O_JUMP_TIMES = [${window.bundle.outcoming_jump_times.slice(0, a).join(',')}];`);
};

const LAST_MODIFIED = 'Sun, 13 Jun 2021 06:52:08 GMT';
const BUILD = '81043a4e0d7341b8da86d629acb1a149d1954528';

const SAMPLES = 32;
const JUMP_TABLE_ADD = 4;
const JUMP_TABLE_VAL1 = 1455 + JUMP_TABLE_ADD;
const JUMP_TABLE_VAL2 = 3580 + JUMP_TABLE_ADD;
const JUMP_TABLE_VAL3 = 2510 + JUMP_TABLE_ADD;
const JUMP_TABLE_VAL4 = 765 + JUMP_TABLE_ADD;
const JUMP_TABLE_LIM1 = 27;
const JUMP_TABLE_LIM2 = 49;
const JUMP_TABLE_LIM3 = 79;
const JUMP_TABLE_XOR  = 80;
const JUMP_TABLE_MUL  = 5;

const DECODE_FUNC = 484;
const DECODE_OFFSET_MAGIC_NUMBER = 4821;
const DECODE_OFFSET_MAGIC_NUMBER_VAR = 26;
const DECODE_OFFSET_TABLE = 5515;
const DECODE_OFFSET_TABLE_LOCATION = 320;
const DECODE_OFFSET_TABLE_LENGTH = 18;
const DECODE_OFFSET_JUMP_TABLE = 181752 >> 2;

const ENCODE_FUNC = 107;
const ENCODE_OFFSET_MAGIC_NUMBER = 2329;
const ENCODE_OFFSET_MAGIC_NUMBER_VAR = 17;
const ENCODE_OFFSET_TABLE = 3187;
const ENCODE_OFFSET_TABLE_LOCATION = 256;
const ENCODE_OFFSET_TABLE_LENGTH = 19;
const ENCODE_OFFSET_JUMP_TABLE = 107016 >> 2;

function modify(bin, imports) {
  var wail = new WailParser(new Uint8Array(bin));
  var decodeFunc = wail.getFunctionIndex(DECODE_FUNC);
  var encodeFunc = wail.getFunctionIndex(ENCODE_FUNC);
  var mainHook1 = wail.addImportEntry({
    moduleStr: "hook",
    fieldStr: "a",
    kind: "func",
    type: wail.addTypeEntry({
      form: "func",
      params: ["i32"]
    })
  });
  var mainHook2 = wail.addImportEntry({
    moduleStr: "hook",
    fieldStr: "b",
    kind: "func",
    type: wail.addTypeEntry({
      form: "func",
      params: ["i32"]
    })
  });
  var mainHook3 = wail.addImportEntry({
    moduleStr: "hook",
    fieldStr: "c",
    kind: "func",
    type: wail.addTypeEntry({
      form: "func",
      params: ["i32", "i32", "i32"]
    })
  });
  var mainHook4 = wail.addImportEntry({
    moduleStr: "hook",
    fieldStr: "d",
    kind: "func",
    type: wail.addTypeEntry({
      form: "func",
      params: ["i32"]
    })
  });
  wail.addCodeElementParser(null, function({ index, bytes }) {
    if(index == decodeFunc.i32()) {
      const reader = new BufferReader(new Uint8Array(1));
      reader.writeAtAnchor([
        ...bytes.slice(0, DECODE_OFFSET_MAGIC_NUMBER),
        OP_GET_LOCAL, DECODE_OFFSET_MAGIC_NUMBER_VAR, OP_CALL, ...VarUint32ToArray(mainHook1.i32()),
        ...bytes.slice(DECODE_OFFSET_MAGIC_NUMBER, DECODE_OFFSET_TABLE),
        OP_GET_GLOBAL, 0, OP_CALL, ...VarUint32ToArray(mainHook2.i32()),
        ...bytes.slice(DECODE_OFFSET_TABLE)]);
      return reader.write();
    } else if(index == encodeFunc.i32()) {
      const reader = new BufferReader(new Uint8Array(1));
      reader.writeAtAnchor([
        ...bytes.slice(0, ENCODE_OFFSET_MAGIC_NUMBER),
        OP_GET_LOCAL, ENCODE_OFFSET_MAGIC_NUMBER_VAR, OP_GET_LOCAL, 1, OP_GET_LOCAL, 2, OP_CALL, ...VarUint32ToArray(mainHook3.i32()),
        ...bytes.slice(ENCODE_OFFSET_MAGIC_NUMBER, ENCODE_OFFSET_TABLE),
        OP_GET_GLOBAL, 0, OP_CALL, ...VarUint32ToArray(mainHook4.i32()),
        ...bytes.slice(ENCODE_OFFSET_TABLE)]);
      return reader.write();
    }
    return false;
  });
  wail.parse();
  return wail.write();
}

const _initWasm = window.WebAssembly.instantiate;
window.WebAssembly.instantiate = function(bin, imports) {
  imports.hook = { a: DECODE_OFFSET_MAGIC_NUMBER_FUNC, b: DECODE_OFFSET_TABLE_FUNC, c: ENCODE_OFFSET_MAGIC_NUMBER_FUNC, d: ENCODE_OFFSET_TABLE_FUNC };
  return _initWasm(modify(bin, imports), imports);
};

function DECODE_OFFSET_MAGIC_NUMBER_FUNC(mg) {
  if(window.bundle.incoming_times < SAMPLES) {
    window.bundle.incoming_jump_times[window.bundle.incoming_times] = mg & 15;
  }
}
function DECODE_OFFSET_TABLE_FUNC(global) {
  if(window.bundle.incoming_times < SAMPLES) {
    window.bundle.incoming_decode_tables[window.bundle.incoming_times] = new Uint8Array(DECODE_OFFSET_TABLE_LENGTH);
    for(let i = 0; i < DECODE_OFFSET_TABLE_LENGTH; ++i) {
      window.bundle.incoming_decode_tables[window.bundle.incoming_times][i] = window.M.HEAPU8[global + DECODE_OFFSET_TABLE_LOCATION + i];
    }
  }
  if(window.bundle.incoming_times == 0) {
    window.bundle.incoming_jump_table_origin = window.M.HEAP32[DECODE_OFFSET_JUMP_TABLE];
    let i = 0;
    let idx;
    do {
      if(i <= JUMP_TABLE_LIM1) {
        idx = window.bundle.incoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL1;
      } else if(i <= JUMP_TABLE_LIM2) {
        idx = window.bundle.incoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL2;
      } else if(i <= JUMP_TABLE_LIM3) {
        idx = window.bundle.incoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL3;
      } else {
        idx = window.bundle.incoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL4;
      }
      window.bundle.incoming_jump_table[i] = window.M.HEAPU8[idx] ^ JUMP_TABLE_XOR;
    } while(++i != 128);
  }
  ++window.bundle.incoming_times;
}

function ENCODE_OFFSET_MAGIC_NUMBER_FUNC(mg, packet, len) {
  if(window.bundle.outcoming_times < SAMPLES) {
    window.bundle.outcoming_jump_times[window.bundle.outcoming_times] = mg & 15;
    //console.log(`before encode: `, Array.from(window.M.HEAPU8.subarray(packet, packet + len)).map(r => r.toString(16).padStart(2, "0")).join(' '));
  }
}
function ENCODE_OFFSET_TABLE_FUNC(global) {
  if(window.bundle.outcoming_times < SAMPLES) {
    window.bundle.outcoming_decode_tables[window.bundle.outcoming_times] = new Uint8Array(ENCODE_OFFSET_TABLE_LENGTH);
    for(let i = 0; i < ENCODE_OFFSET_TABLE_LENGTH; ++i) {
      window.bundle.outcoming_decode_tables[window.bundle.outcoming_times][i] = window.M.HEAPU8[global + ENCODE_OFFSET_TABLE_LOCATION + i];
    }
  }
  if(window.bundle.outcoming_times == 0) {
    window.bundle.outcoming_jump_table_origin = window.M.HEAP32[ENCODE_OFFSET_JUMP_TABLE];
    let i = 0;
    let idx;
    do {
      if(i <= JUMP_TABLE_LIM1) {
        idx = window.bundle.outcoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL1;
      } else if(i <= JUMP_TABLE_LIM2) {
        idx = window.bundle.outcoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL2;
      } else if(i <= JUMP_TABLE_LIM3) {
        idx = window.bundle.outcoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL3;
      } else {
        idx = window.bundle.outcoming_jump_table_origin + i * JUMP_TABLE_MUL + JUMP_TABLE_VAL4;
      }
      window.bundle.outcoming_jump_table[i] = window.M.HEAPU8[idx] ^ JUMP_TABLE_XOR;
    } while(++i != 128);
  }
  ++window.bundle.outcoming_times;
}

window.bundle = {
  incoming_jump_table_origin: 0,
  incoming_jump_table: new Uint8Array(128),
  incoming_decode_tables: new Array(SAMPLES),
  incoming_jump_times: new Array(SAMPLES),
  incoming_times: 0,

  outcoming_jump_table_origin: 0,
  outcoming_jump_table: new Uint8Array(128),
  outcoming_decode_tables: new Array(SAMPLES),
  outcoming_jump_times: new Array(SAMPLES),
  outcoming_times: 0,

  data: [],
  dataIndex: 0,

  hmm: ''
};

function hook(a, b, c) {
  Object.defineProperty(a, b, {
    set: c,
    configurable: true,
    enumerable: true
  });
}

WebSocket = class extends WebSocket {
  constructor(ip) {
    if(ip == null) return;
    super(ip);
    console.log(ip);
    if(ip.match(/m28/) != null) {
      window.ws = this;
      for_real1 = 0;
      for_real2 = 0;
      indx1 = 0;
      indx2 = 0;
      window.bundle.incoming = 0;
      window.bundle.outcoming = 0;
      hook(this, "onmessage", function(to) {
        delete this.onmessage;
        this.onmessage = function(x) {
          if(for_real1 == 0 && x.data.byteLength > 1) {
            for_real1 = 1;
          }
          if(indx1 < SAMPLES && for_real1 == 1) {
            if(log) {
              const a = indx1;
              console.log(`got ${a} `, Array.from(new Uint8Array(x.data)).map(r => r.toString(16).padStart(2, "0")).join(' '));
              //window.a.set(new Uint8Array(x.data));
              //window.a.decodePacket();
              //if(a != 0 && window.a.buffer[0] == 2) {
                //window.a.dLZ4();
              //}
              //console.log(`decoded ${a} `, Array.from(window.a.buffer).map(r => r.toString(16).padStart(2, "0")).join(' '));
            }
          }
          to.call(this, x);
          if(for_real1 == 1) {
            ++indx1;
          }
        };
      });
      this._$send = this.send;
      this.send = function(x) {
        if(indx2++ < SAMPLES && log) console.log(Array.from(new Uint8Array(x)).map(r => r.toString(16).padStart(2, "0")).join(' '));
        this._$send(x);
      };
    }
  }
}

var postRun;

var trye = 0;

Object.defineProperty(Object.prototype, "postRun", {
  get: function() {
    return postRun;
  },
  set: function(to) {
    postRun = to;
    if(Object.getOwnPropertyNames(this).length == 0 && trye++ == 1) {
      window.Module = this;
      window.M = this;
      hook(this, "asm", function(to) {
        if(to == null) return;
        delete this.asm;
        this.asm = to;
        window.u8  = this.HEAPU8;
        window.u16 = this.HEAPU16;
        window.u32 = this.HEAPU32;
        window.i8  = this.HEAP8;
        window.i16 = this.HEAP16;
        window.i32 = this.HEAP32;
        window.f32 = this.HEAPF32;
      });
    }
  },
  configurable: true,
  enumerable: true
});


// PACKET ENCODING/DECODING


function Shädam() {
  this.buffer = null;
  this.b = new ArrayBuffer(4);
  this.u = new Uint8Array(this.b);
  this.f = new Float32Array(this.b);
  this.at = 0;

  this.outcoming = -1;
  this.incoming = -1;
}
Shädam.prototype.set = function(a, b) {
  this.buffer = a;
  this.at = b || 0;
};
Shädam.prototype.reset = function() {
  this.outcoming = -1;
  this.incoming = -1;
};
Shädam.prototype.getU = function() {
  let number = 0;
  let count = 0;
  do {
    number |= (this.buffer[this.at] & 0x7f) << (7 * count++);
  } while((this.buffer[this.at++] >> 7) == 1);
  return number;
};
Shädam.prototype.getI = function() {
  const i = this.getU();
  return 0 - (i & 1) ^ i >>> 1;
};
Shädam.prototype.getF = function() {
  this.u.set([this.buffer[this.at++], this.buffer[this.at++], this.buffer[this.at++], this.buffer[this.at++]]);
  return this.f[0];
};
Shädam.prototype.getS = function() {
  const len = this.at;
  while(this.buffer[this.at++] != 0);
  return decodeURIComponent(Array.from(this.buffer.subarray(len, this.at - 1)).map(r => `%${r.toString(16).padStart(2, '0')}`).join(''));
};
Shädam.prototype.dLZ4 = function() {
  const finalLength = (this.buffer[4] << 24) | (this.buffer[3] << 16) | (this.buffer[2] << 8) | this.buffer[1];
  this.at = 5;
  let i;
  var output = [];
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
      for(i = 0; i < copyStart + copyLength - oldLength; i++) {
        output[output.length] = output[oldLength + i];
      }
    }
  }
  if(output.length == finalLength) {
    this.buffer = new Uint8Array(output);
    this.at = 1;
  }
};
Shädam.prototype.getFi = function(handler) {
  var a = [];
  var lI = 0;
  ++this.at;
  while(this.buffer[this.at] ^ 1) {
    lI += this.buffer[this.at++] ^ 1;
    a[a.length] = lI;
    handler(lI);
  }
  ++this.at;
  return a;
};
Shädam.prototype.decodeHeader = function(idx) {
  var i = 0;
  var a = idx;
  if(a == 0) {
    return a;
  }
  while(1) {
    a = I_JUMP_TABLE[a];
    if(i++ == I_JUMP_TIMES[this.incoming]) {
      break;
    }
  }
  return a;
};
Shädam.prototype.encodeHeader = function(idx) {
  var i = 0;
  var a = idx;
  while(1) {
    a = O_JUMP_TABLE[a];
    if(i++ == O_JUMP_TIMES[this.outcoming]) {
      break;
    }
  }
  return a;
};
Shädam.prototype.decodePacket = function() {
  if(++this.incoming >= SAMPLES) {
    return 1;
  }
  this.buffer[0] = this.decodeHeader(this.buffer[0]);
  if(this.buffer.length < 2) {
    return 0;
  }
  for(var i = 1; i < this.buffer.length; ++i) {
    this.buffer[i] = this.buffer[i] ^ DECODE_TABLES[this.incoming][i % DECODE_OFFSET_TABLE_LENGTH];
  }
  return 0;
};
Shädam.prototype.encodePacket = function() {
  if(++this.outcoming >= SAMPLES) {
    return 1;
  }
  this.buffer[0] = this.encodeHeader(this.buffer[0]);
  if(this.buffer.length < 2) {
    return 0;
  }
  for(var i = 1; i < this.buffer.length; ++i) {
    this.buffer[i] = this.buffer[i] ^ ENCODE_TABLES[this.outcoming][i % ENCODE_OFFSET_TABLE_LENGTH];
  }
  return 0;
};
window.a = new Shädam();
/*
a.set("".split(' ').map(r => parseInt(r, 16)));
a.decodePacket();
a.dLZ4();
console.log(a.buffer);


a.set("".split(' ').map(r => parseInt(r, 16)));
a.decodePacket();
console.log(a.buffer);
*/
