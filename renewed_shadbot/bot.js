'use strict';

const Discord = require('discord.js');
const Client = new Discord.Client();
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const https = require('https');
const WebSocket = require('ws');
const FileSystem = require('fs');
const { Worker } = require('worker_threads');

var Config = {};
var HelpingConfig = {};

const Owner = '801347663110340629';

const LatestBuild = 'c94fc18cf6171f8d502f5c979488e143f1e5f74f';
const LatestDate = 'Sun, 14 Feb 2021 06:49:06 GMT';
var Unsafe = false;

const DiepServers = {};

const Messages = {};
const Cycles = {};
const Times = {};

const Errors = [];

var worker = new Worker('./worker.js', { type: "text/javascript" });
var nextJobID = 0;
var workerCallbacks = {};
function solve(prefix, difficulty, cb) {
  var id = nextJobID++;
  if(nextJobID == 1000000) {
    nextJobID = 0;
  }
  workerCallbacks[id] = {
    callback: cb,
    timer: setTimeout(function() {
      delete workerCallbacks[id];
      solve(prefix, difficulty, cb);
    }, 100)
  };
  worker.postMessage([id, prefix, difficulty]);
}
worker.on('message', function(e) {
  if(e[0] == 0) {
    clearTimeout(workerCallbacks[e[1]].timer);
  } else {
    workerCallbacks[e[1]].callback.apply(null, e.slice(2));
    delete workerCallbacks[e[1]];
  }
});

var dworker = new Worker('./dworker.js', { type: "text/javascript" });
function decompress(packet, cb) {
  var id = nextJobID++;
  if(nextJobID == 1000000) {
    nextJobID = 0;
  }
  workerCallbacks[id] = {
    callback: cb,
    timer: setTimeout(function() {
      decompress(packet, cb);
    }, 100)
  };
  dworker.postMessage([id, packet]);
}
dworker.on('message', function(e) {
  if(e[0] == 0) {
    clearTimeout(workerCallbacks[e[1]].timer);
  } else {
    workerCallbacks[e[1]].callback.apply(null, e.slice(2));
    delete workerCallbacks[e[1]];
  }
});
function async_decompress(packet) {
  return new Promise(function(resolve) {
    var id = nextJobID++;
    if(nextJobID == 1000000) {
      nextJobID = 0;
    }
    workerCallbacks[id] = {
      callback: resolve,
      timer: setTimeout(async function() {
        await async_decompress(packet);
        resolve();
      }, 100)
    };
    dworker.postMessage([id, packet]);
  });
}

const SAMPLES = 32;
const DECODE_OFFSET_TABLE_LENGTH = 23;
const ENCODE_OFFSET_TABLE_LENGTH = 21;

const TICK_XOR = 13925979;

const I_JUMP_TABLE = [102,1,52,92,78,48,121,26,70,25,3,64,35,65,126,89,122,91,40,60,93,67,79,108,45,21,6,88,15,33,16,63,101,11,94,103,66,53,107,98,97,95,24,84,17,28,2,54,55,41,75,106,112,19,69,105,83,127,119,12,68,0,31,38,82,9,13,111,71,49,104,47,62,118,115,76,50,125,80,27,100,36,22,37,85,109,77,120,59,81,43,57,46,58,86,90,116,114,87,51,20,34,117,42,7,99,32,72,96,14,4,61,5,39,29,73,56,10,113,123,18,110,8,30,44,74,23,124];
const DECODE_TABLES = [[29,105,233,9,233,137,137,9,201,233,201,169,217,201,9,201,169,169,73,73,105,105,201],[41,233,169,169,105,9,137,9,201,105,169,201,9,169,201,201,233,105,169,233,169,169,105],[169,105,137,73,73,105,105,169,137,105,105,233,105,41,169,169,9,41,201,233,233,233,105],[73,137,41,169,233,169,169,9,41,169,137,41,137,41,201,169,105,41,73,137,201,73,73],[105,41,201,233,137,233,137,169,41,105,73,137,105,201,105,41,41,73,41,105,233,9,169],[73,169,41,137,233,105,233,169,73,105,201,137,9,73,201,105,169,105,137,169,137,73,9],[201,73,169,73,73,169,169,137,73,233,169,9,233,73,73,41,137,201,137,169,137,169,201],[169,73,73,105,105,105,41,73,105,9,73,201,137,137,201,169,233,233,169,137,73,41,169],[73,73,73,9,169,233,105,169,9,41,137,137,73,233,73,169,233,9,9,73,201,105,105],[137,137,201,105,137,233,9,105,233,73,137,233,41,73,41,73,73,9,233,73,41,105,137],[9,201,233,169,41,169,169,9,169,9,169,201,73,137,169,169,105,137,9,105,105,41,73],[169,41,73,201,41,73,73,201,9,201,9,137,169,41,9,105,169,105,233,41,137,41,9],[233,137,41,169,233,233,41,41,105,105,73,169,201,105,41,9,73,169,9,137,137,169,41],[233,41,201,169,201,9,137,169,41,41,9,201,105,137,233,169,9,169,41,9,169,105,233],[169,169,105,73,105,137,105,105,105,73,201,169,41,233,137,201,201,41,41,201,169,137,73],[233,9,9,233,41,41,105,137,201,9,137,105,137,201,233,105,73,137,73,169,201,137,169],[233,137,9,201,233,233,137,105,201,169,41,201,105,201,105,105,9,201,137,137,105,233,41],[233,233,137,137,41,41,201,201,73,105,105,41,201,73,73,201,137,9,41,9,201,233,233],[41,105,169,73,169,201,73,201,105,137,105,137,41,169,105,169,201,105,233,41,137,233,105],[137,105,137,233,73,201,73,9,137,137,137,73,169,233,137,105,233,137,137,201,169,9,73],[137,9,41,201,169,41,201,105,201,41,9,233,41,137,73,9,137,73,137,105,41,137,73],[137,41,73,9,105,201,233,9,201,201,9,105,137,73,105,137,73,9,137,169,169,233,105],[41,233,73,105,73,41,9,105,233,73,137,9,73,233,201,233,201,137,137,105,73,137,233],[201,137,41,169,73,105,137,169,201,169,9,137,41,233,137,137,105,137,169,9,169,105,201],[73,233,41,105,169,233,137,201,73,9,201,9,137,201,137,233,41,41,169,169,137,105,169],[201,41,137,105,105,41,73,137,41,233,73,137,41,169,201,105,169,105,9,169,105,233,105],[105,105,9,9,9,169,73,105,137,169,73,169,137,41,41,137,233,233,169,169,201,201,201],[137,105,41,201,105,137,201,41,105,41,201,73,9,41,105,9,41,233,9,105,201,41,9],[169,9,201,9,41,41,105,201,201,169,9,137,169,137,73,41,105,41,9,137,201,41,201],[233,169,233,233,201,137,73,137,233,137,9,73,105,233,137,41,233,137,73,41,137,201,9],[41,137,41,9,105,41,41,233,9,9,9,9,41,169,137,169,201,137,169,105,41,73,73],[105,105,201,169,9,169,201,9,105,169,105,169,137,105,137,41,169,233,9,41,137,233,201]];
const I_JUMP_TIMES = [13,0,2,8,10,0,2,8,10,0,2,8,10,0,2,8,10,0,2,8,10,0,2,8,10,0,2,8,10,0,2,8];

const O_JUMP_TABLE = [0,10,123,112,6,5,89,42,27,97,32,19,40,55,84,20,18,15,28,30,11,58,126,111,124,48,96,117,109,116,60,41,100,120,25,83,127,125,62,4,99,107,21,43,53,92,95,22,33,54,74,31,76,88,2,93,49,61,81,3,113,98,121,37,91,36,59,72,103,67,56,90,26,66,8,14,50,9,44,108,114,69,57,23,101,75,29,64,106,47,38,16,115,80,63,17,70,82,77,79,52,7,94,34,104,65,110,71,78,85,86,73,35,12,119,13,45,1,24,51,118,87,102,39,46,68,105,122];
const ENCODE_TABLES = [[23,144,197,70,252,17,79,94,132,232,163,225,80,121,187,198,96,237,43,109,222],[154,102,5,46,201,9,68,214,133,73,117,29,92,103,208,121,115,193,124,247,99],[93,112,247,127,80,4,75,233,44,170,218,146,186,133,162,194,30,118,213,81,90],[95,146,36,102,206,115,48,229,144,66,109,175,15,35,211,13,130,42,190,152,86],[162,240,70,81,144,201,18,31,142,108,22,20,92,75,7,39,133,2,91,25,68],[87,133,191,176,140,150,246,214,181,17,200,218,149,11,161,47,223,254,118,38,48],[115,8,66,254,72,10,220,59,159,7,20,251,178,96,38,180,78,240,57,78,25],[168,83,212,128,250,64,183,211,136,130,13,12,211,89,114,187,252,207,146,79,22],[84,156,125,29,127,197,233,74,143,195,231,165,195,141,108,93,14,68,243,18,47],[222,31,189,147,91,82,102,21,111,75,99,54,63,51,145,178,14,139,104,251,227],[13,3,150,196,62,64,80,209,15,95,212,201,86,208,147,186,14,150,49,78,213],[137,140,63,156,115,78,251,195,29,93,7,95,48,41,144,112,83,222,98,184,144],[23,174,17,145,254,210,190,26,227,254,122,223,245,132,238,213,159,52,237,106,235],[225,31,44,92,78,136,118,211,71,167,79,219,216,72,162,123,86,147,131,216,217],[46,57,167,203,224,105,88,79,222,169,15,215,169,9,120,167,47,37,139,127,13],[117,120,189,135,188,41,161,255,117,170,186,45,183,248,174,160,138,226,187,221,141],[132,199,61,182,162,195,167,84,213,233,88,194,120,159,233,125,136,146,99,119,177],[15,173,141,152,148,41,47,175,155,212,182,52,49,148,185,229,149,14,61,196,108],[215,24,21,126,26,47,38,211,191,228,70,45,149,86,217,188,105,67,135,12,214],[11,41,92,210,238,201,222,193,11,83,114,57,126,222,128,9,105,42,32,154,125],[39,85,172,139,128,30,57,237,248,108,103,149,127,20,22,166,189,39,61,53,135],[225,253,128,103,63,117,159,99,88,83,254,158,3,230,179,15,55,57,228,153,191],[84,106,51,24,235,182,134,98,238,4,245,82,187,26,64,110,45,236,100,220,106],[44,93,22,99,208,217,68,129,224,145,124,47,200,170,166,243,143,183,27,91,98],[81,34,108,82,197,50,142,102,18,39,35,197,167,56,58,14,143,152,230,191,128],[16,52,67,83,122,114,249,172,176,160,142,212,192,117,11,92,81,108,162,123,73],[58,103,226,28,20,244,0,155,101,74,56,215,25,155,12,157,69,127,6,225,222],[173,252,115,87,236,0,89,245,243,139,217,12,251,180,89,244,37,76,189,3,69],[131,72,51,138,229,216,247,212,113,107,47,158,44,134,2,90,52,101,107,105,96],[24,62,157,47,38,164,212,14,124,17,36,233,124,225,176,198,181,151,156,250,146],[85,14,119,49,157,141,6,1,6,108,252,0,170,3,138,70,223,50,206,17,41],[219,210,127,182,226,87,243,204,87,60,220,125,204,27,209,66,246,234,53,203,188]];
const O_JUMP_TIMES = [11,5,7,15,9,9,7,13,1,7,11,7,5,3,5,11,11,9,1,5,13,11,13,15,11,11,5,11,15,15,7,9];

const TANKS = [
  'Tank',
  'Twin',
  'Triplet',
  'Triple Shot',
  'Quad Tank',
  'Octo Tank',
  'Sniper',
  'Machine Gun',
  'Flank Guard',
  'Tri-Angle',
  'Destroyer',
  'Overseer',
  'Overlord',
  'Twin-Flank',
  'Penta Shot',
  'Assassin',
  'Arena Closer',
  'Necromancer',
  'Triple Twin',
  'Hunter',
  'Gunner',
  'Stalker',
  'Ranger',
  'Booster',
  'Fighter',
  'Hybrid',
  'Manager',
  'Mothership',
  'Predator',
  'Sprayer',
  '', // deleted
  'Trapper',
  'Gunner Trapper',
  'Overtrapper',
  'Mega Trapper',
  'Tri-Trapper',
  'Smasher',
  '', // deleted
  'Landmine',
  'Auto Gunner',
  'Auto 5',
  'Auto 3',
  'Spread Shot',
  'Streamliner',
  'Auto Trapper',
  '', // Destroyer Dominator
  '', // Gunner Dominator
  '', // Trapper Dominator
  'Battleship',
  'Annihilator',
  'Auto Smasher',
  'Spike',
  'Factory',
  'Ball',
  'Skimmer',
  'Rocketeer'
];

const COLORS = ['no color', '', '', 'blue', 'red', 'purple', 'green', '', '', '', '', '', '', 'no color'];
const DISCORD_COLORS = [':white_circle:', '', '', ':blue_circle:', ':red_circle:', ':purple_circle:', ':green_circle:', '', '', '', '', '', '', ':white_circle:'];
const COUNTER = [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':keycap_ten:'];

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
  try {
    return decodeURIComponent(Array.from(this.buffer).slice(len, this.at - 1).map(r => `%${r.toString(16).padStart(2, '0')}`).join(''));
  } catch(err) {
    return '';
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
Shädam.prototype.extractScoreboard = function() {
  //console.log(this.buffer.hex());
  var i = 0;
  this.at = 1;
  const ticks = this.getU() ^ TICK_XOR; // encoded tick
  this.getU(); // encoded delete count
  this.getU(); // update count
  this.at += 6;
  const scoreboard = {
    count: 0,
    entries: [{name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""},
              {name:"",score:0,tank:0,color:0,suffix:""}],
    uptime: ticks
  };
  this.getF();
  this.at += 5;
  for(i = 0; i < 10; ++i) {
    scoreboard.entries[i].color = this.getU();
  }
  for(i = 0; i < 10; ++i) {
    scoreboard.entries[i].name = this.getS();
  }
  for(i = 0; i < 10; ++i) {
    scoreboard.entries[i].suffix = this.getS();
  }
  this.getU();
  this.getF();
  this.getF();
  this.getF();
  this.getU();
  this.getF();
  this.getF();
  for(i = 0; i < 10; ++i) {
    scoreboard.entries[i].tank = TANKS[this.getI()];
  }
  scoreboard.count = this.getU();
  this.getF();
  for(i = 0; i < 10; ++i) {
    scoreboard.entries[i].score = this.getF() | 0;
  }
  return scoreboard;
};

String.prototype.FullTrim = function() {
  var at = -1;
  var len = 0;
  var dis = this;
  const spaces = [];
  while(++at < this.length) {
    if(this[at] == ' ') {
      len++;
    } else if(len > 1) {
      spaces[spaces.length] = [at - len + 1, at];
      len = 0;
    } else {
      len = 0;
    }
  }
  var leng = 0;
  for(let i = spaces.length - 1; i > -1; i--) {
    leng = dis.length;
    dis = dis.substring(0, spaces[i][0]) + dis.substring(spaces[i][1], leng);
  }
  return dis;
};
String.prototype.GetSmartSplitIndex = function(threshold, noSpace = false) {
  const part = this.substring(0, threshold);
  var index = part.lastIndexOf('\n');
  if(index != -1 || (index = part.lastIndexOf(' '), noSpace == false && index != -1)) {
    return index;
  } else {
    return threshold;
  }
};
String.prototype.ReduceEvalPacket = function() {
  let a = this.match(/(\w+)=function\(\)/)[1];
  let b = this.match(/function\(\w+,(\w+)\){var (\w+)/);
  return this
    .replace(/if\(!window\).*(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\((\w{1,2}),(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\);};.*/,`$1($2,$3);};`)
    .replace(/function \w+\(\w+\){.*?}(?=\w)(?!else)(?!continue)(?!break)/,"")
    .replace(/,window.*?\(\)(?=;)/,"")
    .replace(new RegExp(`,${a}=function.*?${a}\\(\\)`),`;${b[2]}(${b[1]}+1)`);
};
Array.prototype.hex = function() {
  return this.map(r => r.toString(16).padStart(2, "0")).join(' ');
};
Uint8Array.prototype.hex = function() {
  return Array.from(this).hex();
};
Int8Array.prototype.hex = function() {
  return Array.from(this).hex();
};
ArrayBuffer.prototype.hex = function() {
  return (new Uint8Array(this)).hex();
};

function ReadConfig() {
  return new Promise(function(resolve) {
    FileSystem.readFile('./config', function(error, data) {
      if(error == null) {
        var newData = '';
        for(let i = 0; i < data.length; i++) {
          newData += String.fromCharCode(data[i]);
        }
        Config = JSON.parse(newData);
        resolve();
      }
    });
  });
}

function WriteConfig() {
  return new Promise(async function(resolve) {
    CleanConfig();
    var string = JSON.stringify(Config);
    var file = new Uint8Array(string.length);
    for(let i = 0; i < string.length; i++) {
      file[i] = string.charCodeAt(i);
    }
    await FileSystem.writeFile('./config', file, function() {});
    resolve();
  });
}

function ReadVarUint(packet, at) {
  var number = 0;
  var count = 0;
  do {
    number |= (packet[at] & 0x7f) << (7 * count++);
  } while((packet[at++] >> 7) == 1);
  return [number, count];
}

function WriteVarUint(number) {
  let vu = [];
  while(number > 0x7f) {
    vu[vu.length] = (number & 0x7f) | 0x80;
    number >>>= 7;
  }
  vu[vu.length] = number;
  return vu;
}

function XHR(method, url, data = null, headers = []) {
  return new Promise(function(resolve) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onerror = function(error) {
      resolve([0, error]);
    };
    xhr.onload = function() {
      resolve([1, this.responseText, this]);
    };
    for(let i = 0; i < headers.length; i++) {
      xhr.setRequestHeader(headers[i][0], headers[i][1]);
    }
    xhr.send(data);
  });
}

const _https_get = https.get;
https.get = function(...args) {
  if(args[0]?.headers) {
     args[0].headers = {
     Host: args[0].host,
     Connection: undefined,
     Pragma: undefined,
     'Cache-Control': undefined,
     'User-Agent': undefined,
     Upgrade: undefined,
     Origin: undefined,
     'Sec-WebSocket-Version': undefined,
     'Accept-Encoding': undefined,
     'Accept-Language': undefined,
     'Sec-WebSocket-Key': undefined,
     'Sec-WebSocket-Extensions': undefined,
     ...args[0].headers,
     };
     Object.keys(args[0].headers).forEach((key) => {
    if(!args[0].headers[key]) {
      delete args[0].headers[key];
    }
  });
}
return _https_get(...args);
};

function DiepWebSocket(serverID) {
  return new Promise(function(resolve) {
    let resolved = false;
    const ws = new WebSocket(`wss://${serverID}.s.m28n.net`, {
      "origin": "https://diep.io",
      rejectUnauthorized: false,
      headers: {
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    ws.binaryType = 'arraybuffer';
    ws.onopen = function() {
      if(resolved == false) {
        resolved = true;
        resolve([1, ws]);
      } else {
        this.close();
      }
    };
    ws.onclose = function() {
      if(resolved == false) {
        resolved = true;
        resolve([0, "Close event has been dispatched prematurely."]);
      }
    }
    ws.onerror = function(error) {
      if(resolved == false) {
        resolved = true;
        resolve([0, error.message]);
      }
    };
  });
}

function DiepHandshake(socket, getPacketID, party = '') {
  return new Promise(async function(resolve) {
    var resolved = false;
    const res = await XHR('HEAD', 'https://diep.io');
    if(res[0] == 1) {
      if(res[2].getResponseHeader('last-modified') != LatestDate) {
        Unsafe = true;
        return resolve([0, `Mismatch in latest modified date: received ${res[2].getResponseHeader('last-modified')}, but have ${LatestDate} as the latest.`]);
      }
    } else {
      return resolve([0, 'Couldn\'t connect to https://diep.io for some reason.']);
    }
    socket.parser = new Shädam();
    socket.onmessage = async function(x) {
      var data = new Uint8Array(x.data);
      if(resolved == false) {
        this.parser.set(data);
        this.parser.decodePacket();
        if(this.parser.buffer[0] == 2) {
          this.parser.buffer = await async_decompress(this.parser.buffer);
        }
        switch(this.parser.buffer[0]) {
          case 1: {
            resolved = true;
            return resolve([0, `The party is invalid or the server is not a diep.io server.`]);
          }
          case 11: {
            const difficulty = ReadVarUint(data, 1);
            var str = '';
            for(let i = 1 + difficulty[1]; i < data.length - 1; i++) {
              str += String.fromCharCode(data[i]);
            }
            solve(str, difficulty[0], function(result) {
              if(this.readyState == 1) {
                this.parser.set(new Uint8Array([10, ...result.split('').map(r => r.charCodeAt()), 0]));
                this.parser.encodePacket();
                this.send(this.parser.buffer);
              }
            }.bind(this));
            break;
          }
          case 13: {
            const id = ReadVarUint(this.parser.buffer, 1);
            var code = Array.from(this.parser.buffer).slice(1 + id[1]).map(r => String.fromCharCode(r)).join('');
            code = code.ReduceEvalPacket();
            (new Function(code))()(function(result) {
              this.parser.set(new Uint8Array([11, ...WriteVarUint(id[0]), ...WriteVarUint(result)]));
              this.parser.encodePacket();
              this.send(this.parser.buffer);
            }.bind(this));
            break;
          }
          case getPacketID: {
            resolved = true;
            return resolve([1, this]);
          }
          default: {
            break;
          }
        }
      } else {
        this.close();
      }
    };
    socket.onclose = function() {
      if(resolved == false) {
        resolved = true;
        resolve([0, 'Socket closed prematurely.']);
      }
    };
    setTimeout(function() {
      if(resolved == false) {
        resolved = true;
        if(socket.readyState == 1) {
          socket.close();
        }
        resolve([0, 'The server did not finish processing our requests within 1 minute.']);
      }
    }, 6e4);
    socket.send(new Uint8Array([0, ...LatestBuild.split('').map(r => r.charCodeAt()), 0, 0, ...party.split('').map(r => r.charCodeAt()), 0, 0]));
  });
}

function GetScoreboard(id) {
  return new Promise(async function(resolve) {
    const socket = await DiepWebSocket(id);
    if(socket[0] == 0) {
      return resolve(socket);
    }
    const handshake = await DiepHandshake(socket[1], 0);
    if(handshake[0] == 1) {
      return resolve([1, handshake[1].parser.extractScoreboard()]);
    } else {
      return resolve(handshake);
    }
  });
}

function ParseLink(link) {
  link = link.toLowerCase().trim();
  const firstMatch = link.match(/diep\.?io\/\#?(.*)/);
  if(firstMatch == null) {
    return [0, `Invalid format of link [${link}].`];
  }
  let serverID = firstMatch[1].match(/^([0-9a-f]{8})/);
  if(serverID == null) {
    return [0, `Invalid format of link [${link}].`];
  }
  serverID = serverID[1].match(/[0-9a-z]{2}/g).map(r => String.fromCharCode(parseInt(r.split('').reverse().join(''), 16))).join('');
  if(serverID.match(/[^a-z0-9]/) != null) {
    return [0, `Invalid link [${link}].`];
  }
  if(firstMatch[1].substring(8, 10) != '00' || firstMatch[1].length < 11) {
    return [1, serverID, ''];
  } else {
    const party = firstMatch[1].substring(10).match(/^([0-9a-f]{8,14})/);
    if(party == null) {
      return [0, `Invalid party of link [${link}]`];
    }
    return [1, serverID, party[1]];
  }
}

function StringTime(time) {
  const times = [];
  if(time >= 6048e5) {
    times[times.length] = `${(time / 6048e5) | 0} week${((time / 6048e5) | 0) === 1 ? '' : 's'}`;
    time -= ((time / 6048e5) | 0) * 6048e5;
  }
  if(time >= 864e5) {
    times[times.length] = `${(time / 864e5) | 0} day${((time / 864e5) | 0) === 1 ? '' : 's'}`;
    time -= ((time / 864e5) | 0) * 864e5;
  }
  if(time >= 36e5) {
    times[times.length] = `${(time / 36e5) | 0} hour${((time / 36e5) | 0) === 1 ? '' : 's'}`;
    time -= ((time / 36e5) | 0) * 36e5;
  }
  if(time >= 6e4) {
    times[times.length] = `${(time / 6e4) | 0} minute${((time / 6e4) | 0) === 1 ? '' : 's'}`;
    time -= ((time / 6e4) | 0) * 6e4;
  }
  if(time >= 1e3) {
    times[times.length] = `${(time / 1e3) | 0} second${((time / 1e3) | 0) === 1 ? '' : 's'}`;
    time -= ((time / 1e3) | 0) * 1e3;
  } else if(time > 0) {
    times[times.length] = `${time} millisecond${time === 1 ? '' : 's'}`;
  }
  if(times.length > 1) {
    return times.slice(0, times.length - 1).join(', ') + ` and ${times[times.length - 1]}`;
  } else if(times.length == 1) {
    return times[0];
  } else {
    return '0 seconds';
  }
}
function ShortStringTime(time) {
  const times = [];
  if(time >= 6048e5) {
    times[times.length] = `${(time / 6048e5) | 0}w`;
    time -= ((time / 6048e5) | 0) * 6048e5;
  }
  if(time >= 864e5) {
    times[times.length] = `${(time / 864e5) | 0}d`;
    time -= ((time / 864e5) | 0) * 864e5;
  }
  if(time >= 36e5) {
    times[times.length] = `${(time / 36e5) | 0}h`;
    time -= ((time / 36e5) | 0) * 36e5;
  }
  if(time >= 6e4) {
    times[times.length] = `${(time / 6e4) | 0}min`;
    time -= ((time / 6e4) | 0) * 6e4;
  }
  if(time >= 1e3) {
    times[times.length] = `${(time / 1e3) | 0}s`;
    time -= ((time / 1e3) | 0) * 1e3;
  } else if(time > 0) {
    times[times.length] = `${time}ms`;
  }
  if(times.length > 1) {
    return times.slice(0, times.length - 1).join(', ') + ` & ${times[times.length - 1]}`;
  } else if(times.length == 1) {
    return times[0];
  } else {
    return '0s';
  }
}

function StringScore(n) {
  if(n >= 1e6) {
    return `${(n / 1e6).toFixed(2)}m`;
  } else if(n >= 1e3) {
    return `${(n / 1e3).toFixed(2)}k`;
  } else {
    return n;
  }
}

function ParseScore(n) {
  if(n.match(/[^0-9km]/) != null) {
    return [0, `Invalid score format`];
  }
  const match = n.match(/^(\d+)([k|m]?)$/);
  if(match == null) {
    return [0, `Invalid score format`];
  }
  if(match[2] == "") {
    return [1, +match[1]];
  } else if(match[2] == "k") {
    return [1, (+match[1]) * 1000];
  } else {
    return [1, (+match[1]) * 1000000];
  }
}

function SeekServers(gamemode) {
  return new Promise(async function(resolve) {
    const response = await XHR('GET', `https://api.n.m28.io/endpoint/diepio-${gamemode}/findeach`);
    if(response[0] == 1) {
      try {
        const servers = JSON.parse(response[1]);
        for(const Region in servers.servers) {
          if(DiepServers[servers.servers[Region].id] == null || DiepServers[servers.servers[Region].id].region == null || DiepServers[servers.servers[Region].id].gamemode == null) {
            DiepServers[servers.servers[Region].id] = { gamemode, region: Region.match(/vultr-(.*)/)[1], lastCheckedAt: new Date().getTime() };
          } else {
            DiepServers[servers.servers[Region].id].lastCheckedAt = new Date().getTime();
          }
        }
      } catch(error) {}
    }
  });
}

async function PruneServers() {
  var socket = [];
  for(const ServerID in DiepServers) {
    if(new Date().getTime() - DiepServers[ServerID].lastCheckedAt >= 9e5) {
      socket = await DiepWebSocket(ServerID);
      if(socket[0] == 1) {
        socket[1].close();
        DiepServers[ServerID].lastCheckedAt = new Date().getTime();
      } else {
        delete DiepServers[ServerID];
      }
    }
  }
}

function CleanConfig() {
  Config.whitelist = Config.whitelist.slice(0, HelpingConfig.whitelistLength);
  Config.blacklist = Config.blacklist.slice(0, HelpingConfig.blacklistLength);
  Config.mods = Config.mods.slice(0, HelpingConfig.modsLength);
}

function StartMessageCycle(channelID) {
  if(Cycles[channelID] == null) {
    if(Times[channelID] != null) {
      if(new Date().getTime() - Times[channelID] >= 1e3) {
        Cycles[channelID] = setInterval(HandleMessages, 1e3, channelID);
        HandleMessages(channelID);
      } else {
        setTimeout(function() {
          Cycles[channelID] = setInterval(HandleMessages, 1e3, channelID);
          HandleMessages(channelID);
        }, 1e3 - new Date().getTime() + Times[channelID]);
      }
    } else {
      Cycles[channelID] = setInterval(HandleMessages, 1e3, channelID);
      HandleMessages(channelID);
    }
  }
}
function QueueMessage(content, channelID, important = false, separate = false, startCycle = true) {
  return new Promise(function(resolve) {
    if(Messages[channelID] != null) {
      if(important == false) {
        Messages[channelID][Messages[channelID].length] = [content, resolve, separate];
      } else {
        Messages[channelID].unshift([content, resolve, separate]);
      }
    } else {
      Messages[channelID] = [[content, resolve, separate]];
    }
    if(startCycle == true) {
      StartMessageCycle(channelID);
    }
  });
}

async function HandleMessages(channelID) {
  if(Messages[channelID].length == 0) {
    clearInterval(Cycles[channelID]);
    Cycles[channelID] = null;
    return;
  }
  var message = Messages[channelID][0];
  Messages[channelID] = Messages[channelID].splice(1);
  var length = message[0][0].length + message[0][1].length;
  var resolves = [message[1]];
  var fields = 1;
  var msg = new Discord.MessageEmbed().setColor(0x0069e1).addField(message[0][0], message[0][1]);
  while(Messages[channelID].length != 0 && message[2] == false && Messages[channelID][0][2] == false && length + Messages[channelID][0][0][0].length + Messages[channelID][0][0][1].length <= 6e3 && fields++ < 25) {
    message = Messages[channelID][0];
    Messages[channelID] = Messages[channelID].splice(1);
    msg.addField(message[0][0], message[0][1]);
    length += message[0][0].length + message[0][1].length;
    resolves[resolves.length] = message[1];
  }
  try {
    let a = new Date().getTime();
    const confirmation = await Client.channels.cache.get(channelID).send(msg);
    Times[channelID] = new Date().getTime() - (new Date().getTime() - a) / 2;
    for(let i = 0; i < resolves.length; i++) {
      resolves[i](confirmation);
    }
  } catch(error) {
    Errors[Errors.length] = error.message;
    FileSystem.writeFile('./errors', new Uint8Array(JSON.stringify(Errors).split('').map(r => r.charCodeAt())), function() {});
    for(let i = 0; i < resolves.length; i++) {
      resolves[i](null);
    }
  }
  if(Messages[channelID].length == 0) {
    clearInterval(Cycles[channelID]);
    Cycles[channelID] = null;
  }
}

function FragmentMessage(message, header, channelID, a = false, b = false, c = true, d = false, e = false, f = true) {
  var smartIndex = 0;
  var first = true;
  while(message.length > 1024) {
    smartIndex = message.GetSmartSplitIndex(1024, true);
    QueueMessage([first == true ? (first = false, `**To be continued: ${header.toLowerCase()}**`) : `**Continuation of ${header.toLowerCase()}**`, message.substring(0, smartIndex)], channelID, a, b, c);
    message = message.substring(smartIndex);
  }
  QueueMessage([first == true ? `**${header}**` : `**Continuation of ${header.toLowerCase()}**`, message], channelID, d, e, f);
}

function IDToLink(serverID) {
  var a = [serverID[0].charCodeAt(), serverID[1].charCodeAt(), serverID[2].charCodeAt(), serverID[3].charCodeAt()];
  var b = '';
  var c = '';
  for(let i = 0; i < 4; i++) {
    b = a[i].toString(16).padStart(2, '0');
    c += b[1] + b[0];
  }
  return c;
}

function SimpleRegion(region) {
  switch(region) {
    case 'amsterdam': return 'eu';
    case 'singapore': return 'sg';
    case 'sydney': return 'syd';
    default: return region;
  }
}
function SimpleGamemode(gamemode) {
  switch(gamemode) {
    case 'teams': return '2tdm';
    case '4teams': return '4tdm';
    case 'survival': return 'surv';
    case 'sandbox': return 'sbx';
    default: return gamemode;
  }
}

function ConnectToAnyServer() {
  return new Promise(async function(resolve) {
    var socket = null;
    var count = 0;
    for(const serverID in DiepServers) {
      count++;
      socket = await DiepWebSocket(serverID);
      if(socket[0] == 1) {
        resolve(socket);
        break;
      }
    }
    if(count != 0) {
      resolve([0, 'Couldn\'t connect to any cached server']);
    } else {
      resolve([0, 'No cached servers, retry in a few seconds. If the problem persists, contact the creator of the bot.']);
    }
  });
}

const FindServersCycle = setInterval(function() {
  SeekServers('ffa');
  SeekServers('teams');
  SeekServers('4teams');
  SeekServers('maze');
  SeekServers('dom');
  SeekServers('tag');
  SeekServers('survival');
  SeekServers('sandbox');
}, 500);
const DeleteServersCycle = setInterval(PruneServers, 18e5);

function Sleep(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

async function ScanServers() {
  var scoreboard;
  for(const serverID in DiepServers) {
    if(DiepServers[serverID].gamemode != 'sandbox' && DiepServers[serverID].gamemode != 'survival' && DiepServers[serverID].gamemode != 'tag' && DiepServers[serverID].gamemode != 'dom') {
      scoreboard = await GetScoreboard(serverID);
      if(scoreboard[0] == 1 && DiepServers[serverID] != null) {
        DiepServers[serverID].scoreboard = scoreboard[1];
        DiepServers[serverID].scoreboardLastCheckedAt = new Date().getTime();
      }
    }
  }
  setTimeout(ScanServers, 250);
}

function IsMod(id) {
  let has = false;
  for(let i = 0; i < HelpingConfig.modsLength; i++) {
    if(Config.mods[i] == id) {
      has = true;
      break;
    }
  }
  return has;
}

function ExtractID(id) {
  if(id.match(/[^0-9<@!#>]/) != null) {
    return null;
  }
  let a = id.match(/^(?:(?:<@!?)?|(?:<#)?)(\d{18})>?$/);
  if(a == null) {
    return null;
  }
  return a[1];
}

function ExtractUserID(id) {
  if(id.match(/[^0-9<@!>]/) != null) {
    return null;
  }
  let a = id.match(/^(?:<@!?)?(\d{18})>?$/);
  if(a == null) {
    return null;
  }
  return a[1];
}

function GetFlags(args) {
  var a = [];
  var b = [];
  for(let i = 0; i < args.length; ++i) {
    if(args[i][0] == '-') {
      b[b.length] = args[i];
    } else {
      a[a.length] = args[i];
    }
  }
  return [a, b];
}

function GetFlag(flags, flag) {
  let has = false;
  for(let i = 0; i < flags.length; i++) {
    if(flags[i] == flag) {
      has = true;
      break;
    }
  }
  return has;
}

function GlobalBan(id) {
  Client.guilds.cache.forEach(function(g) {
    if(!g.available) {
      return;
    }
    g.members.ban(id).catch(function(){});
  });
}

function GlobalBans() {
  for(let i = 0; i < HelpingConfig.blacklistLength; ++i) {
    GlobalBan(Config.blacklist[i]);
  }
}

function GlobalUnban(id) {
  Client.guilds.cache.forEach(function(g) {
    if(!g.available) {
      return;
    }
    g.members.unban(id).catch(function(){});
  });
}

function GlobalUnbans() {
  for(let i = 0; i < HelpingConfig.blacklistLength; ++i) {
    GlobalUnban(Config.blacklist[i]);
  }
}

function Ready() {
  console.log('Logged in');
  if(Config.whitelist == null) {
    Config.whitelist = [];
    HelpingConfig.whitelistLength = 0;
  } else {
    HelpingConfig.whitelistLength = Config.whitelist.length;
  }
  if(Config.blacklist == null) {
    Config.blacklist = [];
    HelpingConfig.blacklistLength = 0;
  } else {
    HelpingConfig.blacklistLength = Config.blacklist.length;
  }
  if(Config.mods == null) {
    Config.mods = [];
    HelpingConfig.modsLength = 0;
  } else {
    HelpingConfig.modsLength = Config.mods.length;
  }

  const CommandTree = {
    "get": {
      "help": 0,
      "info": 1,
      "flags": 9,
      "update": 12,
      "build": 13,
      "servers": 14,
      "id": 16,
      "scoreboard": 17,
      "leaders": 18,
      "uptime": 19,
      "link": 20
    },
    "eval": 2,
    "whitelist": 3,
    "blacklist": 7,
    "add": {
      "mods": 5
    },
    "remove": {
      "from": {
        "whitelist": 4,
        "blacklist": 8
      },
      "mods": 6
    },
    "global": {
      "ban": 10,
      "unban": 11
    },
    "leave": 15
  };
  setTimeout(ScanServers, 100);
  const Commands = [function(message) { // 0
    FragmentMessage(`**Casual commands:**\n` +
                    `\`go get help\`: displays this message\n` +
                    `\`go get info\`: shows a message containing some information about the bot\n` +
                    `\`go get flags\`: shows additional options when executing commands\n` +
                    `\`go get update\`: fetches the last date of diep.io being modified\n` +
                    `\`go get build\`: fetches the latest diep.io build\n` +
                    `\`go get servers\`: displays all the servers the bot knows about\n` +
                    `\`go get id\`: converts links to server IDs\n` +
                    `\`go get scoreboard\`: fetches scoreboard of given server (only 1 server per command)\n` +
                    `\`go get leaders\`: shows servers above given threshold\n` +
                    `\`go get uptime\`: fetches uptime of given servers\n` +
                    `\`go get link\`: converts serverID to a link\n` +
                    `**Moderator commands:**\n` +
                    `\`go whitelist\`: whitelists given servers/channels/users\n` +
                    `\`go remove from whitelist\`: removes given servers/channels/users from whitelist\n` +
                    `\`go blacklist\`: blacklists given users\n` +
                    `\`go remove from blacklist\`: removes given users from blacklist\n` +
                    `\`go global ban\`: bans all blacklisted users from all guilds the bot is in\n` +
                    `\`go leave\`: leaves the guild it is executed in\n` +
                    `**Owner commands:**\n` +
                    `\`go eval\`: evaluates given expression and shows the result\n` +
                    `\`go add mods\`: adds moderators\n` +
                    `\`go remove mods\`: removes moderators\n` +
                    `\`go global unban\`: unbans all blacklisted users from all guilds the bot is in\n` +
                    ``, 'Help', message.channel.id, false, false, false);
  }, function(message) { // 1
    FragmentMessage('The bot was revived on 22.12.2020.', 'Info', message.channel.id);
  }, function(message) { // 2
    if(message.author.id != Owner) {
      return;
    }
    try {
      FragmentMessage('' + eval(message.content.substring(message.content.toLowerCase().indexOf('eval') + 4)), 'Eval', message.channel.id, false, false, false);
    } catch(error) {
      FragmentMessage(`Error: ${error.message}`, 'Eval', message.channel.id);
    }
  }, function(message, IDs) { // 3
    if(!IsMod(message.author.id) && message.author.id != Owner) {
      return;
    }
    if(IDs.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Add to whitelist', message.channel.id);
    }
    let j = 0;
    let has = false;
    let id;
    for(let i = 0; i < IDs.length; i++) {
      id = ExtractID(IDs[i]);
      if(id == null) {
        FragmentMessage(`${IDs[i]} is not a valid ID.`, 'Add to whitelist', message.channel.id, false, false, false, false, false, false);
        continue;
      }
      has = false;
      for(j = 0; j < HelpingConfig.whitelistLength; j++) {
        if(Config.whitelist[j] == id) {
          has = true;
          break;
        }
      }
      if(has == false) {
        Config.whitelist[HelpingConfig.whitelistLength++] = id;
        FragmentMessage(`ID ${id} successfully whitelisted.`, 'Add to whitelist', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`ID ${id} is already whitelisted.`, 'Add to whitelist', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, function(message, IDs) { // 4
    if(!IsMod(message.author.id) && message.author.id != Owner) {
      return;
    }
    if(IDs.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Remove from whitelist', message.channel.id);
    }
    let j = 0;
    let has = -1;
    let id;
    for(let i = 0; i < IDs.length; i++) {
      id = ExtractID(IDs[i]);
      if(id == null) {
        FragmentMessage(`${IDs[i]} is not a valid ID.`, 'Remove from whitelist', message.channel.id, false, false, false, false, false, false);
        continue;
      }
      has = -1;
      for(j = 0; j < HelpingConfig.whitelistLength; j++) {
        if(Config.whitelist[j] == id) {
          has = j;
          break;
        }
      }
      if(has != -1) {
        Config.whitelist[has] = Config.whitelist[--HelpingConfig.whitelistLength];
        FragmentMessage(`ID ${id} successfully removed from whitelist.`, 'Remove from whitelist', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`ID ${id} is already not whitelisted.`, 'Remove from whitelist', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, function(message, IDs) { // 5
    if(message.author.id != Owner) {
      return;
    }
    if(IDs.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Add moderators', message.channel.id);
    }
    let j = 0;
    let has = false;
    let id;
    for(let i = 0; i < IDs.length; i++) {
      id = ExtractUserID(IDs[i]);
      if(id == null) {
        FragmentMessage(`${IDs[i]} is not a valid user ID.`, 'Add moderators', message.channel.id, false, false, false, false, false, false);
        continue;
      }
      has = false;
      for(j = 0; j < HelpingConfig.modsLength; j++) {
        if(Config.mods[j] == id) {
          has = true;
          break;
        }
      }
      if(has == false) {
        Config.mods[HelpingConfig.modsLength++] = id;
        FragmentMessage(`User ${id} is now a moderator.`, 'Add moderators', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`User ${id} is already a moderator.`, 'Add moderators', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, function(message, IDs) { // 6
    if(message.author.id != Owner) {
      return;
    }
    if(IDs.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Remove moderators', message.channel.id);
    }
    let j = 0;
    let has = -1;
    let id;
    for(let i = 0; i < IDs.length; i++) {
      id = ExtractUserID(IDs[i]);
      if(IDs[i] == null) {
        FragmentMessage(`${IDs[i]} is not a valid user ID.`, 'Remove moderators', message.channel.id, false, false, false, false, false, false);
        continue;
      }
      has = -1;
      for(j = 0; j < HelpingConfig.modsLength; j++) {
        if(Config.mods[j] == id) {
          has = j;
          break;
        }
      }
      if(has != -1) {
        Config.mods[has] = Config.mods[--HelpingConfig.modsLength];
        FragmentMessage(`User ${id} is not a moderator anymore.`, 'Remove moderators', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`User ${id} is already not a moderator.`, 'Remove moderators', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, function(message, IDs) { // 7
    if(!IsMod(message.author.id) && message.author.id != Owner) {
      return;
    }
    var users = GetFlags(IDs);
    var flags = users[1];
    users = users[0];
    var shouldBan = false;
    if(users.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Add to blacklist', message.channel.id);
    }
    let i = 0;
    for(; i < flags.length; ++i) {
      if(flags[i] == "-b") {
        shouldBan = true;
      } else {
        FragmentMessage(`Invalid flag (${flags[i]}). Try \`go get flags\` to see the list of flags.`, 'Add to blacklist', message.channel.id, false, false, false, false, false, false);
      }
    }
    let j = 0;
    let has = false;
    let id;
    for(i = 0; i < users.length; i++) {
      id = ExtractUserID(users[i]);
      if(id == null) {
        FragmentMessage(`${users[i]} is not a valid user ID.`, 'Add to blacklist', message.channel.id, false, false, false, false, false, false);
        continue;
      }
      has = false;
      for(j = 0; j < HelpingConfig.blacklistLength; j++) {
        if(Config.blacklist[j] == id) {
          has = true;
          break;
        }
      }
      if(has == false) {
        Config.blacklist[HelpingConfig.blacklistLength++] = id;
        FragmentMessage(`User ${id} is now blacklisted.`, 'Add to blacklist', message.channel.id, false, false, false, false, false, false);
        if(shouldBan == true) {
          GlobalBan(id);
        }
      } else {
        FragmentMessage(`User ${id} is already blacklisted.`, 'Add to blacklist', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, function(message, IDs) { // 8
    if(!IsMod(message.author.id) && message.author.id != Owner) {
      return;
    }
    var users = GetFlags(IDs);
    var flags = users[1];
    users = users[0];
    var shouldUnban = false;
    if(users.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Remove from blacklist', message.channel.id);
    }
    let i = 0;
    for(; i < flags.length; ++i) {
      if(flags[i] == "-u") {
        if(message.author.id == Owner) {
          shouldUnban = true;
        } else {
          FragmentMessage(`Invalid flag (${flags[i]}). Only the bot's owner can use that flag.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
        }
      } else {
        FragmentMessage(`Invalid flag (${flags[i]}). Try \`go get flags\` to see the list of flags.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
      }
    }
    let j = 0;
    let has = -1;
    let id;
    for(i = 0; i < users.length; i++) {
      id = ExtractUserID(users[i]);
      if(users[i] == null) {
        FragmentMessage(`${users[i]} is not a valid user ID.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
        continue;
      }
      has = -1;
      for(j = 0; j < HelpingConfig.blacklistLength; j++) {
        if(Config.blacklist[j] == id) {
          has = j;
          break;
        }
      }
      if(has != -1) {
        Config.blacklist[has] = Config.blacklist[--HelpingConfig.blacklistLength];
        FragmentMessage(`User ${id} is not blacklisted anymore.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
        if(shouldUnban == true) {
          GlobalUnban(id);
        }
      } else {
        FragmentMessage(`User ${id} is already not blacklisted.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, function(message) { // 9
    FragmentMessage(`\`go blacklist\`:\n` +
                    `\`-b\` | bans the blacklisted users\n` +
                    `\n` +
                    `\`go remove from blacklist\`:\n` +
                    `\`-u\` | unbans the users removed from blacklist\n` +
                    `\n` +
                    `\`go get servers\`:\n` +
                    `\`-l\` | shows the last time a server was seen at. If the time is bigger than a few minutes, the server has most probably been closed or is going to\n` +
                    `\`-u\` | shows uptime\n` +
                    `\n` +
                    `\`go get uptime\`:\n` +
                    `\`-e\` | shows exact number of ticks\n` +
                    `\n` +
                    `\`go get scoreboard\`:\n` +
                    `\`-e\` | shows exact scores\n` +
                    `\n` +
                    `\`go get leaders\`:\n` +
                    `\`-e\` | shows exact scores\n` +
                    `\`-l\` | shows how old the results are (they are not fetched on request)\n` +
                    `\n` +
                    ``, 'Flags', message.channel.id);
  }, function(message) { // 10
    if(!IsMod(message.author.id) && message.author.id != Owner) {
      return;
    }
    GlobalBans();
    FragmentMessage(`Done.`, 'Global ban', message.channel.id);
  }, function(message) { // 11
    if(message.author.id != Owner) {
      return;
    }
    GlobalUnbans();
    FragmentMessage(`Done.`, 'Global unban', message.channel.id);
  }, async function(message) { // 12
    const res = await XHR('HEAD', 'https://diep.io');
    if(res[0] == 1) {
      FragmentMessage(`Diep.io was last modified on ${res[2].getResponseHeader('last-modified')}`, 'Update', message.channel.id);
    } else {
      FragmentMessage(`Error: ${res[1]}`, 'Update', message.channel.id);
    }
  }, async function(message) { // 13
    const res = await XHR('GET', 'https://diep.io');
    if(res[0] == 1) {
      const hash = res[1].match(/build_(.{40})/)[1];
      FragmentMessage(`Latest build hash: ${hash}\nMain file's link: **<https://static.diep.io/build_${hash}.wasm.js>**`, 'Build', message.channel.id);
    } else {
      FragmentMessage(`Error: ${res[1]}`, 'Build', message.channel.id);
    }
  }, async function(message, args) { // 14
    var gamemodes = [];
    var regions = [];
    var lastChecked = false;
    var uptime = false;
    var i = 0;
    for(; i < args.length; i++) {
      if(args[i].match(/([^\d])/) != null) {
        if(args[i].match(/^ffa$/) != null) {
          gamemodes[gamemodes.length] = 'ffa';
        } else if(args[i].match(/^2teams$|^2tdm$/) != null) {
          gamemodes[gamemodes.length] = 'teams';
        } else if(args[i].match(/^4teams$|^4tdm$/) != null) {
          gamemodes[gamemodes.length] = '4teams';
        } else if(args[i].match(/^teams$|^tdm$/) != null) {
          gamemodes[gamemodes.length] = 'teams';
          gamemodes[gamemodes.length] = '4teams';
        } else if(args[i].match(/^maze$/) != null) {
          gamemodes[gamemodes.length] = 'maze';
        } else if(args[i].match(/^domination$|^dom$/) != null) {
          gamemodes[gamemodes.length] = 'dom';
        } else if(args[i].match(/^survival$|^surv$/) != null) {
          gamemodes[gamemodes.length] = 'survival';
        } else if(args[i].match(/^tag$/) != null) {
          gamemodes[gamemodes.length] = 'tag';
        } else if(args[i].match(/^sandbox$|^sandbx$|^sbx$/) != null) {
          gamemodes[gamemodes.length] = 'sandbox';
        } else if(args[i].match(/^amsterdam$|^eu$|^europe$/) != null) {
          regions[regions.length] = 'amsterdam';
        } else if(args[i].match(/^miami$/) != null) {
          regions[regions.length] = 'miami';
        } else if(args[i].match(/^losangeles$|^la$/) != null) {
          regions[regions.length] = 'la';
        } else if(args[i].match(/^singapore$|^sg$/) != null) {
          regions[regions.length] = 'singapore';
        } else if(args[i].match(/^sydney$|^syd$/) != null) {
          regions[regions.length] = 'sydney';
        } else if(args[i].match(/^us$/) != null) {
          regions[regions.length] = 'miami';
          regions[regions.length] = 'la';
        } else if(args[i] == '-l') {
          lastChecked = true;
        } else if(args[i] == '-u') {
          uptime = true;
        } else if(args[i][0] == '-') {
          FragmentMessage(`Invalid flag (${args[i]}). Try \`go get flags\` to see the list of flags.`, 'Servers', message.channel.id, false, false, false, false, false, false);
        }
      }
    }
    if(gamemodes.length == 0) {
      gamemodes = ['ffa', 'teams', '4teams', 'maze', 'tag', 'dom', 'survival', 'sandbox'];
    }
    if(regions.length == 0) {
      regions = ['amsterdam', 'miami', 'la', 'singapore', 'sydney'];
    }
    var str = '';
    var goodGamemode = false;
    var goodRegion = false;
    var serverCount = 0;
    var counter = 0;
    for(const serverID in DiepServers) {
      goodGamemode = false;
      for(i = 0; i < gamemodes.length; i++) {
        if(gamemodes[i] == DiepServers[serverID].gamemode) {
          goodGamemode = true;
          break;
        }
      }
      goodRegion = false;
      for(i = 0; i < regions.length; i++) {
        if(regions[i] == DiepServers[serverID].region) {
          goodRegion = true;
          break;
        }
      }
      if(goodGamemode == true && goodRegion == true) {
        serverCount++;
        str += `${++counter}. https://diep.io/#${IDToLink(serverID)} | ${SimpleGamemode(DiepServers[serverID].gamemode)} ${SimpleRegion(DiepServers[serverID].region)}`;
        if(lastChecked == true) {
          str += ` | Checked ${ShortStringTime(new Date().getTime() - DiepServers[serverID].lastCheckedAt)} ago`;
        }
        if(uptime == true && DiepServers[serverID].scoreboard != null) {
          str += ` | Uptime ${ShortStringTime(new Date().getTime() - DiepServers[serverID].lastCheckedAt + DiepServers[serverID].scoreboard.uptime * 40)}`;
        }
        str += '\n';
      }
    }
    if(serverCount > 0) {
      FragmentMessage(str, `Servers (${serverCount})`, message.channel.id, false, false, false);
    } else {
      FragmentMessage('There are no servers in specified gamemode and region, the servers are being full (botted), or there is a problem occuring.', `Servers (${serverCount})`, message.channel.id);
    }
  }, function(message) { // 15
    if(!IsMod(message.author.id) && message.author.id != Owner) {
      return;
    }
    message.guild.leave();
  }, function(message, links) { // 16
    if(links.length == 0) {
      return FragmentMessage(`No links were provided.`, 'Link to ID', message.channel.id);
    }
    var parsed;
    for(let i = 1; i <= links.length; ++i) {
      parsed = ParseLink(links[i - 1]);
      if(parsed[0] == 1) {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link's id is **${parsed[1]}**`, 'Link to ID', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link (**${links[i - 1]}**) is invalid.`, 'Link to ID', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
  }, async function(message, link) { // 17
    if(link.length == 0) {
      return FragmentMessage(`No links were provided.`, 'Scoreboard', message.channel.id);
    }
    link = GetFlags(link);
    var flags = link[1];
    link = link[0];
    const parsed = ParseLink(link[0]);
    if(parsed[0] == 0) {
      return FragmentMessage(`The link is invalid.`, 'Scoreboard', message.channel.id);
    }
    var i = 0;
    var exactScore = false;
    for(; i < flags.length; ++i) {
      if(flags[i] == "-e") {
        exactScore = true;
      } else {
        FragmentMessage(`Invalid flag (${flags[i]}). Try \`go get flags\` to see the list of flags.`, 'Scoreboard', message.channel.id, false, false, false, false, false, false);
      }
    }
    const scoreboard = await GetScoreboard(parsed[1]);
    if(scoreboard[0] == 0) {
      return FragmentMessage(`Error: ${scoreboard[1]}`, 'Scoreboard', message.channel.id);
    }
    if(DiepServers[parsed[1]] != null) {
      DiepServers[parsed[1]].scoreboard = scoreboard;
      DiepServers[parsed[1]].scoreboardLastCheckedAt = new Date().getTime();
    } else {
      DiepServers[parsed[1]] = { scoreboard, scoreboardLastCheckedAt: new Date().getTime() };
    }
    if(scoreboard[1].count == 0) {
      return FragmentMessage(`The scoreboard for link **<https://diep.io/#${parsed[1].split('').map(r => r.charCodeAt().toString(16).padStart(2, '0').split('').reverse().join('')).join('')}${parsed[2] != '' ? `00${parsed[2]}` : ''}>** is empty.`, 'Scoreboard', message.channel.id);
    }
    var str = `Scoreboard for link **<https://diep.io/#${parsed[1].split('').map(r => r.charCodeAt().toString(16).padStart(2, '0').split('').reverse().join('')).join('')}${parsed[2] != '' ? `00${parsed[2]}` : ''}>**:\n`;
    for(i = 0; i < scoreboard[1].count; ++i) {
      str += `${COUNTER[i + 1]}: ` +
        `${DISCORD_COLORS[scoreboard[1].entries[i].color]} ` +
        `${exactScore ? scoreboard[1].entries[i].score : StringScore(scoreboard[1].entries[i].score)} ` +
        `${scoreboard[1].entries[i].tank || ''} `;
      if(scoreboard[1].entries[i].name != '') {
        str += `| **${scoreboard[1].entries[i].name.replace('\\', '\\\\').replace('*', '\\*') + scoreboard[1].entries[i].suffix}**`;
      }
      str += '\n';
    }
    FragmentMessage(str, 'Scoreboard', message.channel.id, false, false, false);
  }, function(message, args) { // 18
    var gamemodes = [];
    var regions = [];
    var exactScore = false;
    var lastChecked = false;
    var score = 400000;
    var i = 0;
    for(; i < args.length; i++) {
      if(args[i].match(/^ffa$/) != null) {
        gamemodes[gamemodes.length] = 'ffa';
      } else if(args[i].match(/^2teams$|^2tdm$/) != null) {
        gamemodes[gamemodes.length] = 'teams';
      } else if(args[i].match(/^4teams$|^4tdm$/) != null) {
        gamemodes[gamemodes.length] = '4teams';
      } else if(args[i].match(/^teams$|^tdm$/) != null) {
        gamemodes[gamemodes.length] = 'teams';
        gamemodes[gamemodes.length] = '4teams';
      } else if(args[i].match(/^maze$/) != null) {
        gamemodes[gamemodes.length] = 'maze';
      } else if(args[i].match(/^amsterdam$|^eu$|^europe$/) != null) {
        regions[regions.length] = 'amsterdam';
      } else if(args[i].match(/^miami$/) != null) {
        regions[regions.length] = 'miami';
      } else if(args[i].match(/^losangeles$|^la$/) != null) {
        regions[regions.length] = 'la';
      } else if(args[i].match(/^singapore$|^sg$/) != null) {
        regions[regions.length] = 'singapore';
      } else if(args[i].match(/^sydney$|^syd$/) != null) {
        regions[regions.length] = 'sydney';
      } else if(args[i].match(/^us$/) != null) {
        regions[regions.length] = 'miami';
        regions[regions.length] = 'la';
      } else if(args[i] == '-e') {
        exactScore = true;
      } else if(args[i] == '-l') {
        lastChecked = true;
      } else if(args[i][0] == '-') {
        FragmentMessage(`Invalid flag (${args[i]}). Try \`go get flags\` to see the list of flags.`, 'Leaders', message.channel.id, false, false, false, false, false, false);
      } else {
        const s = ParseScore(args[i]);
        if(s[0] == 1) {
          score = s[1];
        }
      }
    }
    if(gamemodes.length == 0) {
      gamemodes = ['ffa', 'teams', '4teams', 'maze'];
    }
    if(regions.length == 0) {
      regions = ['amsterdam', 'miami', 'la', 'singapore', 'sydney'];
    }
    var str = '';
    var goodGamemode = false;
    var goodRegion = false;
    var counter = 0;
    const scoreboards = [];
    for(const serverID in DiepServers) {
      goodGamemode = false;
      for(i = 0; i < gamemodes.length; i++) {
        if(gamemodes[i] == DiepServers[serverID].gamemode) {
          goodGamemode = true;
          break;
        }
      }
      goodRegion = false;
      for(i = 0; i < regions.length; i++) {
        if(regions[i] == DiepServers[serverID].region) {
          goodRegion = true;
          break;
        }
      }
      if(goodGamemode == true && goodRegion == true && DiepServers[serverID].scoreboard != null && DiepServers[serverID].scoreboard.count > 0 && DiepServers[serverID].scoreboard.entries[0].score >= score) {
        scoreboards[scoreboards.length] = DiepServers[serverID];
        scoreboards[scoreboards.length - 1].serverID = serverID;
      }
    }
    scoreboards.sort(function(a, b) {
      return b.scoreboard.entries[0].score - a.scoreboard.entries[0].score;
    });
    for(i = 0; i < scoreboards.length; ++i) {
      str += `${++counter}. **${exactScore?scoreboards[i].scoreboard.entries[0].score:StringScore(scoreboards[i].scoreboard.entries[0].score)}** ${
      SimpleGamemode(scoreboards[i].gamemode)} ${SimpleRegion(scoreboards[i].region)} **https://diep.io/#${IDToLink(scoreboards[i].serverID)}**\n` +
        `${DISCORD_COLORS[scoreboards[i].scoreboard.entries[0].color]} ` +
        `${scoreboards[i].scoreboard.entries[0].tank || ''} `;
      if(scoreboards[i].scoreboard.entries[0].name != '') {
        str += `| **${scoreboards[i].scoreboard.entries[0].name.replace(/\\/g, '\\\\').replace(/\*/g, '\\*') + scoreboards[i].scoreboard.entries[0].suffix} **`;
      }
      if(lastChecked == true) {
        str += ` | Checked ${ShortStringTime(new Date().getTime() - scoreboards[i].scoreboardLastCheckedAt)} ago`;
      }
      str += '\n';
    }
    if(scoreboards.length > 0) {
      FragmentMessage(str, `Leaders (${scoreboards.length})`, message.channel.id, false, false, false);
    } else if(Unsafe == true) {
      FragmentMessage(`Diep.io has been updated. Each week it automatically shuffles a few things in its code. You need to wait until Shädam fixes the update in order to view leaders.`, `Leaders`, message.channel.id);
    } else {
      FragmentMessage(`There are no leaders in specified gamemodes and regions above ${StringScore(score)}, the servers are being full (botted), or there is a problem occuring.`, `Leaders (${scoreboards.length})`, message.channel.id);
    }
  }, async function(message, links) { // 19
    if(links.length == 0) {
      return FragmentMessage(`No links were provided.`, 'Uptime', message.channel.id);
    }
    links = GetFlags(links);
    var flags = links[1];
    links = links[0];
    var exact = false;
    let i = 0;
    for(; i < flags.length; ++i) {
      if(flags[i] == "-e") {
        exact = true;
      } else {
        FragmentMessage(`Invalid flag (${flags[i]}). Try \`go get flags\` to see the list of flags.`, 'Uptime', message.channel.id, false, false, false, false, false, false);
      }
    }
    var parsed;
    var scoreboard;
    for(i = 1; i <= links.length; ++i) {
      parsed = ParseLink(links[i - 1]);
      if(parsed[0] == 1) {
        if(DiepServers[parsed[1]] != null && DiepServers[parsed[1]].scoreboard != null) {
          FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link's uptime is ${exact?DiepServers[parsed[1]].scoreboard.uptime:ShortStringTime(DiepServers[parsed[1]].scoreboard.uptime * 40 + new Date().getTime() - DiepServers[parsed[1]].lastCheckedAt)}`, 'Uptime', message.channel.id, false, false, false, false, false, false);
        } else {
          scoreboard = await GetScoreboard(parsed[1]);
          if(scoreboard[0] == 0) {
            FragmentMessage(`Error: ${scoreboard[1]}`, 'Uptime', message.channel.id, false, false, false, false, false, false);
          } else {
            if(DiepServers[parsed[1]] == null) {
              DiepServers[parsed[1]] = { scoreboard: scoreboard[1], scoreboardLastCheckedAt: new Date().getTime() };
            } else {
              DiepServers[parsed[1]].scoreboard = scoreboard[1];
              DiepServers[parsed[1]].scoreboardLastCheckedAt = new Date().getTime();
            }
            FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link's uptime is ${exact?DiepServers[parsed[1]].scoreboard.uptime:ShortStringTime(scoreboard[1].uptime * 40)}`, 'Uptime', message.channel.id, false, false, false, false, false, false);
          }
        }
      } else {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link (**${links[i - 1]}**) is invalid.`, 'Uptime', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
  }, function(message, ids) { // 20
    if(ids.length == 0) {
      return FragmentMessage(`No links were provided.`, 'ID to link', message.channel.id);
    }
    var match;
    for(let i = 1; i <= ids.length; ++i) {
      match = ids[i - 1].match(/^([a-z0-9]{4})$/);
      if(match == null) {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} server ID (${ids[i - 1]}) is invalid.`, 'ID to link', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} server ID's link is **https://diep.io/#${match[1].split('').map(r => r.charCodeAt().toString(16).padStart(2, '0').split('').reverse().join('')).join('')}**`, 'ID to link', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
  }];
  Client.on('message', async function(M) {
    const message = M.content.toLowerCase().FullTrim();
    const lowkey_keywords = message.split(' ');
    if((lowkey_keywords[0].match(/^go$/) != null || lowkey_keywords[0].match(/^<@!?790912664830345226>$/) != null) && (M.author.id == Owner || (M.channel.type == "text" &&
      (function() {
        var result = false;
        for(let i = 0; i < HelpingConfig.whitelistLength; i++) {
          if(Config.whitelist[i] == M.channel.id || Config.whitelist[i] == M.guild.id || Config.whitelist[i] == M.author.id) {
            result = true;
          }
        }
        return result;
      })() == true))) {
      if(message.match(/^<@!?790912664830345226>$/) != null) {
        return FragmentMessage(`Need help? Try \`go get help\``, 'Help', M.channel.id);
      }
      const keywords = message.startsWith("go") == true ? message.substring("go".length + 1).split(' ') : message.startsWith(`<@!790912664830345226>`) == true ? message.substring(23).split(' ') : message.substring(22).split(' ');
      if(keywords[0] != '') {
        var branch = CommandTree;
        for(let i = 0; i < keywords.length; i++) {
          branch = branch[keywords[i]];
          if(branch != null) {
            if(typeof branch == "number") {
              return Commands[branch](M, keywords.slice(i + 1));
            } else if(i == keywords.length - 1) {
              return FragmentMessage(`That command is incomplete. For a full list of commands, try \`go get help\``, 'Invalid command', M.channel.id);
            }
          } else {
            return FragmentMessage(`That command doesn't exist. For a full list of commands, try \`go get help\``, 'Invalid command', M.channel.id);
          }
        }
      } else {
        FragmentMessage(`Need help? Try \`go get help\``, 'Help', M.channel.id);
      }
    }
  });
}

(async function() {
  await ReadConfig();
  Client.login(Config.token);
  Client.on('ready', Ready);
})();
