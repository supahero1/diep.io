'use strict';

const Discord = require('discord.js');
const Client = new Discord.Client();
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const https = require('https');
const WebSocket = require('ws');
const FileSystem = require('fs');
const Utils = require('node-os-utils');

var Config = {};
var HelpingConfig = {};

const LatestBuild = '76ead1de30e6e2b80039d578671d1f6962e8810f';
var Unsafe = false;

const DiepServers = {};

function GenDiepServer(id) {
  if(DiepServers[id] == null) {
    DiepServers[id] = {
      lastCheckedAt: new Date().getTime(),
      link: "https://diep.io/#" + IDToLink(id),
      parties: {},
      scoreboard: {
        count: 0,
        entries: [],
        uptime: 0,
        readable_uptime: ShortStringTime(0),
        long_readable_uptime: StringTime(0)
      },
      lastConnected: new Date().getTime()
    };
  }
}

const Messages = {};
const Cycles = {};
const Times = {};

const Worker = function(port, mode) {
  this.port = port;
  this.mode = mode;
  this.jobID = 0;
  this.callbacks = {};
  this.errorCount = 0;
  this.packet = [];
  this.at = 0;
  this.waiting = [];
};
Worker.prototype.readVU = function() {
  var number = 0;
  var count = 0;
  do {
    number |= (this.packet[this.at] & 0x7f) << (7 * count++);
  } while((this.packet[this.at++] >> 7) == 1);
  return number;
};
Worker.prototype.writeVU = function(num) {
  while(num > 0x7f) {
    this.packet[this.at++] = (num & 0x7f) | 0x80;
    num >>>= 7;
  }
  this.packet[this.at++] = num;
};
Worker.prototype.reset = function() {
  this.packet = [];
  this.at = 0;
};
Worker.prototype.connect = function() {
  this.connection = new WebSocket('ws://127.0.0.1:' + this.port);
  this.connection.binaryType = 'arraybuffer';
  this.connection.ref = this;
  this.connection.onopen = function() {
    this.ref.errorCount = 0;
    for(let i = 0; i < this.ref.waiting.length; ++i) {
      this.ref.work(...this.ref.waiting[i]);
    }
    this.ref.waiting = [];
  };
  this.connection.onclose = function() {
    switch(this.ref.errorCount++) {
      case 0: {
        this.ref.connect();
        break;
      }
      case 1: {
        setTimeout(this.ref.connect.bind(this.ref), 500);
        break;
      }
      case 2: {
        setTimeout(this.ref.connect.bind(this.ref), 500);
        break;
      }
      case 3: {
        console.log("worker connection failed, exit");
        Shutdown();
        process.exit();
      }
    }
  };
  this.connection.onmessage = function(msg) {
    const data = new Uint8Array(msg.data);
    this.ref.reset();
    this.ref.packet = data;
    const id = this.ref.readVU();
    if(this.ref.callbacks[id] != null) {
      this.ref.callbacks[id](this.ref.packet.subarray(this.ref.at));
      delete this.ref.callbacks[id];
    }
  };
  this.connection.onerror = function() {};
};
Worker.prototype.work = async function(a, b, c) {
  if(this.connection == null || this.connection.readyState != 1) {
    this.waiting[this.waiting.length] = [a, b, c];
    return;
  }
  if(this.mode == 0) {
    this.solvePOW(a, b, c);
  } else {
    this.decompress(a, b);
  }
};
Worker.prototype.solvePOW = function(prefix, difficulty, callback) {
  const id = this.jobID;
  this.jobID = (this.jobID + 1) % 999999999;
  this.callbacks[id] = callback;
  this.reset();
  this.writeVU(id);
  this.writeVU(difficulty);
  this.packet = [...this.packet, ...prefix.split('').map(r => r.charCodeAt())];
  this.connection.send(new Uint8Array(this.packet));
};
Worker.prototype.decompress = function(packet, callback) {
  const id = this.jobID;
  this.jobID = (this.jobID + 1) % 999999999;
  this.callbacks[id] = callback;
  this.reset();
  this.writeVU(id);
  this.packet = [...this.packet, ...packet];
  this.connection.send(new Uint8Array(this.packet));
};

var POWWorker = new Worker('8081', 0);
POWWorker.connect();
var DecompressionWorker = new Worker('8082', 1);
DecompressionWorker.connect();

var GlobalScoreboardData = null;
var TICK_XOR = 0;
const SAMPLES = 10;

const I_JUMP_TABLE = [124,1,26,110,2,33,32,127,20,125,118,112,7,41,36,97,114,60,4,104,0,65,5,61,16,85,40,95,56,27,82,122,28,84,12,90,3,94,18,93,6,109,64,69,39,44,42,81,48,30,88,113,24,102,98,31,10,17,51,63,22,21,68,78,92,89,62,103,66,47,106,50,9,67,53,101,120,73,11,126,37,58,29,71,57,19,46,117,43,100,55,111,15,35,54,45,14,74,86,80,25,99,96,87,77,108,72,59,70,13,34,91,79,76,52,119,23,75,8,49,116,105,115,123,38,121,83,107];
const DECODE_TABLES = [[194,238,218,122,150,130,98,134,134,206,142,182,2,38,214,246,86,74,186],[134,110,174,250,214,22,254,158,34,138,114,26,42,154,210,154,186,242,106],[210,82,242,70,154,150,110,66,138,98,118,166,142,98,98,178,18,82,198],[98,50,234,218,58,42,186,210,50,86,54,114,194,126,226,90,242,170,2],[214,94,90,10,82,6,198,54,170,186,234,38,30,78,118,250,118,214,226],[246,246,234,122,98,170,246,214,250,102,6,62,6,214,238,158,158,254,122],[10,250,222,230,142,22,22,214,102,170,138,214,54,30,30,94,58,150,206],[190,202,210,126,154,46,2,2,146,90,150,6,106,250,222,130,238,122,66],[186,234,58,98,6,14,174,30,246,70,142,86,230,122,174,50,246,94,38],[226,210,14,98,14,182,154,110,242,38,122,254,158,190,138,230,66,94,114]];
const I_JUMP_TIMES = [2,6,8,6,4,10,8,14,12,2];

const O_JUMP_TABLE = [0,71,8,111,10,112,16,92,123,12,14,29,18,11,98,21,30,26,54,50,3,39,58,9,44,20,32,22,127,69,97,80,35,45,41,83,51,2,94,4,53,82,46,59,48,62,52,66,78,40,125,60,96,42,31,47,68,86,116,100,65,77,110,72,109,113,90,38,49,102,63,37,75,24,117,1,93,6,84,74,88,64,33,56,43,106,104,121,79,122,101,81,5,67,91,28,19,36,25,103,119,124,114,108,87,126,99,105,85,23,57,34,15,70,115,120,17,73,13,95,61,118,7,76,107,27,55,89];
const ENCODE_TABLES = [[190,146,226,84,34,54,84,184,100,198,252,238,208,250,86,96,130,36,100],[202,248,26,74,42,178,218,170,182,128,158,134,164,174,22,104,240,120,218],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104],[202,128,158,182,42,248,174,22,240,26,164,218,178,134,120,170,218,74,104]];
const O_JUMP_TIMES = [11,4,7,0,11,12,15,8,3,4];

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
  
  this.name = 0;
  this.tank = 1;
  this.count = 2;
  this.score = 3;
  this.color = 4;
  this.suffix = 5;
  
  this.scoreboardData = {
    name_offset: -1,
    tank_offset: -1,
    count_offset: -1,
    score_offset: -1,
    color_offset: -1,
    suffix_offset: -1,
    order: []
  };
}
Shädam.prototype.set = function(a, b) {
  this.buffer = a;
  this.at = b || 0;
};
Shädam.prototype.reset = function() {
  this.outcoming = -1;
  this.incoming = -1;
};
Shädam.prototype.isSeeded = function() {
  if(this.scoreboardData.order.length == 6) {
    return 1;
  }
  return 0;
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
    this.buffer[i] = this.buffer[i] ^ DECODE_TABLES[this.incoming][i % DECODE_TABLES[0].length];
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
    this.buffer[i] = this.buffer[i] ^ ENCODE_TABLES[this.outcoming][i % ENCODE_TABLES[0].length];
  }
  return 0;
};
Shädam.prototype.parseScoreboard = function(ticks) {
  const scoreboard = {
    count: 0,
    entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
    uptime: ticks,
    readable_uptime: ShortStringTime(ticks * 40),
    long_readable_uptime: StringTime(ticks * 40)
  };
  
  
  
  for(let i = 0; i < 6; ++i) {
    switch(this.scoreboardData.order[i]) {
      case this.name: {
        this.at += this.scoreboardData.name_offset;
        for(let j = 0; j < 10; ++j) {
          scoreboard.entries[j].name = this.getS();
        }
        break;
      }
      case this.tank: {
        this.at += this.scoreboardData.tank_offset;
        for(let j = 0; j < 10; ++j) {
          scoreboard.entries[j].tank = TANKS[this.getI()];
        }
        break;
      }
      case this.count: {
        this.at += this.scoreboardData.count_offset;
        scoreboard.count = this.getU();
        break;
      }
      case this.score: {
        this.at += this.scoreboardData.score_offset;
        for(let j = 0; j < 10; ++j) {
          scoreboard.entries[j].score = this.getF() | 0;
        }
        break;
      }
      case this.color: {
        this.at += this.scoreboardData.color_offset;
        for(let j = 0; j < 10; ++j) {
          scoreboard.entries[j].color = this.getU();
          scoreboard.entries[j].discord_color = DISCORD_COLORS[scoreboard.entries[j].color];
          scoreboard.entries[j].readable_color = COLORS[scoreboard.entries[j].color];
        }
        break;
      }
      case this.suffix: {
        this.at += this.scoreboardData.suffix_offset;
        for(let j = 0; j < 10; ++j) {
          scoreboard.entries[j].suffix = this.getS();
        }
        break;
      }
    }
  }
  
  
  
  scoreboard.entries = scoreboard.entries.slice(0, scoreboard.count);
  for(let i = 0; i < scoreboard.count; ++i) {
    scoreboard.entries[i].name += scoreboard.entries[i].suffix;
    delete scoreboard.entries[i].suffix;
  }
  return scoreboard;
};
Shädam.prototype.memcmp = function(arr) {
  if(this.at + arr.length > this.buffer.length) {
    return 0;
  }
  for(let i = 0; i < arr.length; ++i) {
    if(this.buffer[this.at + i] != arr[i]) {
      return 0;
    }
  }
  return 1;
};
Shädam.prototype.forEachPermutation4 = function(elements, func) {
  for(let i = 0; i < 4; ++i) {
    for(let j = 0; j < 4; ++j) {
      if(j == i) continue;
      for(let k = 0; k < 4; ++k) {
        if(k == i || k == j) continue;
        for(let l = 0; l < 4; ++l) {
          if(l == i || l == j || l == k) continue;
          let ret = func(elements[i].concat(elements[j]).concat(elements[k]).concat(elements[l]));
          if(ret > 0) {
            return ret;
          }
        }
      }
    }
  }
  return 0;
};
Shädam.prototype.seedScoreboard = function() {
  this.at = 1;
  const ticks = this.getU() ^ TICK_XOR;
  this.getU();
  this.getU();
  this.getU();
  this.getU();
  ++this.at;
  if(this.getU() == 9 && this.getU() == 6) {
    ++this.at;
    
    let save = this.at;
    let last_idx = this.at;
    while(1) {
      if(this.memcmp([1, 1, 1, 14, 1])) {
        this.buffer = this.buffer.slice(0, this.at);
        this.at = save;
        break;
      }
      if(++this.at > this.buffer.length) {
        console.log("no ending section");
        return;
        //process.exit();
      }
    }
    
    while(1) {
      if(this.scoreboardData.tank_offset == -1 && this.memcmp([1, 1, 1, 1, 0, 0, 0, 0, 0, 0])) {
        this.scoreboardData.tank_offset = this.at - last_idx;
        this.scoreboardData.order[this.scoreboardData.order.length] = this.tank;
        if(this.scoreboardData.order.length == 6) break;
        this.at += 10;
        last_idx = this.at;
        continue;
      }
      if(this.scoreboardData.suffix_offset == -1 && this.memcmp([32, 112, 108, 97, 121, 101, 114, 115, 0, 32, 112, 108, 97, 121, 101, 114, 115, 0, 32, 112, 108, 97, 121, 101, 114, 115, 0, 32, 112, 108, 97, 121, 101, 114, 115, 0, 0, 0, 0, 0, 0, 0])) {
        this.scoreboardData.suffix_offset = this.at - last_idx;
        this.scoreboardData.order[this.scoreboardData.order.length] = this.suffix;
        if(this.scoreboardData.order.length == 6) break;
        this.at += 42;
        last_idx = this.at;
        continue;
      }
      if(this.scoreboardData.name_offset == -1) {
        let ret = this.forEachPermutation4([[66, 76, 85, 69, 0], [80, 85, 82, 80, 76, 69, 0], [82, 69, 68, 0], [71, 82, 69, 69, 78, 0]], function(elements) {
          if(this.memcmp(elements)) {
            this.scoreboardData.name_offset = this.at - last_idx;
            this.at += 28;
            last_idx = this.at;
            this.scoreboardData.order[this.scoreboardData.order.length] = this.name;
            if(this.scoreboardData.order.length == 6) return 2;
            return 1;
          }
          return 0;
        }.bind(this));
        if(ret == 1) {
          continue;
        } else if(ret == 2) {
          break;
        }
      }
      if(this.scoreboardData.color_offset == -1) {
        let ret = this.forEachPermutation4([[3], [4], [5], [6]], function(elements) {
          if(this.memcmp(elements.concat([0, 0, 0, 0, 0, 0]))) {
            this.scoreboardData.color_offset = this.at - last_idx;
            this.at += 10;
            last_idx = this.at;
            this.scoreboardData.order[this.scoreboardData.order.length] = this.color;
            if(this.scoreboardData.order.length == 6) return 2;
            return 1;
          }
          return 0;
        }.bind(this));
        if(ret == 1) {
          continue;
        } else if(ret == 2) {
          break;
        }
      }
      if(this.scoreboardData.score_offset == -1) {
        save = this.at;
        let scores = [this.getF(), this.getF(), this.getF(), this.getF()];
        let is_ok = scores.map(r => r >= 0 && r <= 1000 && (r | 0) == r);
        is_ok[0] = is_ok[0] && scores[0] > 0;
        if(is_ok[0] && is_ok[1] && is_ok[2] && is_ok[3] && scores[1] <= scores[0] && scores[2] <= scores[1] && scores[3] <= scores[2] && this.memcmp([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])) {
          this.scoreboardData.score_offset = save - last_idx;
          this.scoreboardData.order[this.scoreboardData.order.length] = this.score;
          if(this.scoreboardData.order.length == 6) break;
          this.at += 24;
          last_idx = this.at;
          continue;
        } else {
          this.at = save;
        }
      }
      if(this.scoreboardData.count_offset == -1 && this.buffer[this.at] == 4) {
        this.scoreboardData.count_offset = this.at - last_idx;
        this.scoreboardData.order[this.scoreboardData.order.length] = this.count;
        if(this.scoreboardData.order.length == 6) break;
        ++this.at;
        last_idx = this.at;
        continue;
      }
      if(++this.at > this.buffer.length) {
        console.log("couldn't find everything");
        return;
        //process.exit();
      }
    }
  } else {
    console.log("not a valid seed for scoreboard");
    //process.exit();
  }
};
Shädam.prototype.extractScoreboard = function() {
  if(this.scoreboardData.order.length != 6) {
    return { uptime: 0, count: 0 };
  }
  this.at = 1;
  const ticks = this.getU() ^ TICK_XOR; // encoded tick
  this.getU(); // encoded delete count
  this.getU(); // update count
  this.getU();
  this.getU();
  ++this.at;
  if(this.getU() == 9 && this.getU() == 6) {
    ++this.at;
    return this.parseScoreboard(ticks);
  } else {
    return { uptime: ticks, count: 0 };
  }
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
    .replace(/if\(!window\).*(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\((\w{1,2}),(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\);};.*/,`$1($2,$3)};`)
    .replace(/function \w+\(\w+\){.*?}(?=\w)(?!else)(?!continue)(?!break)/,"")
    .replace(/,window.*?\(\)(?=;)/,"")
    .replace(new RegExp(`,${a}=function.*?${a}\\(\\);?}\\(`),`;${b[2]}(${b[1]}+1)}(`);
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

function ReadConfig(callback) {
  FileSystem.readFile('./config', function(error, data) {
    if(error == null) {
      var newData = '';
      for(let i = 0; i < data.length; i++) {
        newData += String.fromCharCode(data[i]);
      }
      Config = JSON.parse(newData);
      callback();
    }
  });
}

function WriteConfig(callback) {
  CleanConfig();
  var string = JSON.stringify(Config);
  var file = new Uint8Array(string.length);
  for(let i = 0; i < string.length; i++) {
    file[i] = string.charCodeAt(i);
  }
  FileSystem.writeFile('./config', file, callback);
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

function XHR(method, url, callback, data = null, headers = []) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.onerror = function(error) {
    callback(0, error);
  };
  xhr.onload = function() {
    callback(1, this.responseText, this);
  };
  for(let i = 0; i < headers.length; i++) {
    xhr.setRequestHeader(headers[i][0], headers[i][1]);
  }
  xhr.send(data);
}

const _https_get = https.get;
https.get = function(...args) {
  if(args[0] && args[0].headers) {
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

function DiepWebSocket(serverID, callback) {
  let resolved = false;
  const ws = new WebSocket(`wss://${serverID}.s.m28n.net`, {
    "origin": "https://diep.io",
    rejectUnauthorized: false,
    headers: {
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US;q=0.8,en;q=0.7'
    }
  });
  ws.serverID = serverID;
  ws.binaryType = 'arraybuffer';
  ws.onopen = function() {
    if(resolved == false) {
      resolved = true;
      callback(1, ws);
    } else {
      this.close();
    }
  };
  ws.onclose = function() {
    if(resolved == false) {
      resolved = true;
      callback(0, "Close event has been dispatched prematurely.");
    }
  }
  ws.onerror = function(error) {
    if(resolved == false) {
      resolved = true;
      callback(0, error.message);
    }
  };
}

function DiepHandshake(socket, getPacketID, party = '', callback) {
  var resolved = { bool: false };
  socket.parser = new Shädam();
  if(GlobalScoreboardData != null) {
    socket.parser.scoreboardData = GlobalScoreboardData;
  }
  socket.onmessage = async function(x) {
    var data = new Uint8Array(x.data);
    if(data[0] == 1 && data.length == 42) {
      Unsafe = true;
      resolved.bool = true;
      this.close();
      callback(0, 'This server is not compatible with the current build. Either diep.io updated, or this server is not a valid diep.io server.');
      return;
    }
    if(resolved.bool == false) {
      this.parser.set(data);
      this.parser.decodePacket();
      if(this.parser.buffer[0] == 2) {
        DecompressionWorker.work(this.parser.buffer, function(buffer) {
          this.parser.buffer = buffer;
          DiepHandshakeContinuation.call(socket, resolved, getPacketID, party, callback);
        }.bind(this));
      } else {
        DiepHandshakeContinuation.call(socket, resolved, getPacketID, party, callback);
      }
    } else {
      this.close();
    }
  };
  socket.onclose = function() {
    if(resolved.bool == false) {
      resolved.bool = true;
      callback(0, 'Socket closed prematurely.');
    }
  };
  setTimeout(function() {
    if(resolved.bool == false) {
      resolved.bool = true;
      if(socket.readyState == 1) {
        socket.close();
      }
      callback(0, 'The server did not finish processing our requests within 1 minute.');
    }
  }, 6e4);
  socket.send(new Uint8Array([0, ...LatestBuild.split('').map(r => r.charCodeAt()), 0, 0, ...party.split('').map(r => r.charCodeAt()), 0, 0]));
}

function DiepHandshakeContinuation(resolved, getPacketID, party, callback) {
  switch(this.parser.buffer[0]) {
    case 1: {
      resolved.bool = true;
      return callback(0, `The party is invalid or the server is not a diep.io server.`);
    }
    case 6: {
      GenDiepServer(this.serverID);
      DiepServers[this.serverID].parties[DiepServers[this.serverID].link + '00' + Array.from(this.parser.buffer).slice(1).map(r => r.toString(16).padStart(2, '0').split('').reverse().join('')).join('').toUpperCase()] = 0;
      break;
    }
    case 11: {
      const difficulty = ReadVarUint(this.parser.buffer, 1);
      var str = '';
      for(let i = 1 + difficulty[1]; i < this.parser.buffer.length - 1; i++) {
        str += String.fromCharCode(this.parser.buffer[i]);
      }
      POWWorker.work(str, difficulty[0], function(result) {
        if(this.readyState == 1) {
          this.parser.set(result);
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
      resolved.bool = true;
      this.close();
      return callback(1, this);
    }
    default: {
      break;
    }
  }
}

function GetScoreboard(id, callback) {
  DiepWebSocket(id, function(status, socket) {
    if(status == 0) {
      return callback(0, socket);
    }
    DiepHandshake(socket, 0, '', function(status, socket) {
      if(status == 0) {
        callback(0, socket);
      } else {
        if(DiepServers[id].gamemode == "tag" && socket.parser.buffer[0] == 0 && GlobalScoreboardData == null) {
          socket.parser.seedScoreboard();
          if(socket.parser.scoreboardData.order.length == 6) {
            GlobalScoreboardData = socket.parser.scoreboardData;
            console.log("seeded scoreboard using: " + socket.parser.buffer.hex() + " " + JSON.stringify(GlobalScoreboardData));
            ScanServers();
          }
        } else if(DiepServers[id].gamemode == "sandbox" && TICK_XOR == 0) {
          socket.parser.at = 1;
          TICK_XOR = socket.parser.getU() ^ 2;
          console.log("got tick xor " + TICK_XOR);
        }
        /*if(DiepServers[id].gamemode == "ffa" || DiepServers[id].gamemode == "teams" || DiepServers[id].gamemode == "4teams" || DiepServers[id].gamemode == "maze") {
          let scoreboard = socket.parser.extractScoreboard();
          if(scoreboard.entries != null && scoreboard.entries.map(r => r.score > 15000000).indexOf(true) != -1) {
            console.log("faulty packet: ", socket.parser.buffer.hex().subarray(0, 300));
            GlobalScoreboardData = null;
            ScanTagServers();
          }
          callback(1, scoreboard);
        } else {*/
          callback(1, socket.parser.extractScoreboard());
        //}
      }
    });
  });
}

function ParseLink(link) {
  link = link.toLowerCase().trim();
  const firstMatch = link.match(/diep\.?io\/\#?(.*)/);
  if(firstMatch == null) {
    return [0, `Invalid format of link [${link}].`];
  }
  let serverID = firstMatch[1].match(/^([0-9a-f]{6})/);
  if(serverID == null) {
    return [0, `Invalid format of link [${link}].`];
  }
  serverID = serverID[1].match(/[0-9a-z]{2}/g).map(r => String.fromCharCode(parseInt(r.split('').reverse().join(''), 16))).join('');
  if(serverID.match(/[^a-z0-9]/) != null) {
    return [0, `Invalid link [${link}].`];
  }
  if(firstMatch[1].substring(6, 8) != '00' || firstMatch[1].length <= 8) {
    return [1, serverID, ''];
  } else {
    const party = firstMatch[1].substring(8).match(/^([0-9a-f]{4,14})/);
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
  XHR('GET', `https://api.n.m28.io/endpoint/diepio-${gamemode}/findeach`, function(status, r, xhr) {
    if(status == 1) {
      try {
        const servers = JSON.parse(r);
        if(servers.servers == null) {
          return;
        }
        for(const Region in servers.servers) {
          const serverID = servers.servers[Region].id;
          GenDiepServer(serverID);
          DiepServers[serverID].gamemode = gamemode;
          DiepServers[serverID].short_gamemode = SimpleGamemode(gamemode);
          DiepServers[serverID].region = Region.match(/vultr-(.*)/)[1];
          DiepServers[serverID].short_region = SimpleRegion(DiepServers[serverID].region);
          DiepServers[serverID].lastCheckedAt = new Date().getTime();
        }
      } catch(error) {}
    } else {console.log("status not 1 for gamemode " + gamemode)}
  });
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
  var a = serverID.split('').map(r => r.charCodeAt());
  var b = '';
  var c = '';
  for(let i = 0; i < serverID.length; i++) {
    b = a[i].toString(16).padStart(2, '0');
    c += b[1] + b[0];
  }
  return c.toUpperCase();
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

const FindServersCycle = setInterval(function() {
  SeekServers('sandbox');
  SeekServers('tag');
  SeekServers('teams');
  SeekServers('4teams');
  SeekServers('ffa');
  SeekServers('maze');
  SeekServers('dom');
  SeekServers('survival');
}, 500);

function Sleep(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

function* GetNextServer() {
  while(1) {
    const servers = Object.keys(DiepServers);
    for(const serverID of servers) {
      yield serverID;
    }
    if(servers.length == 0) {
      yield null;
    }
  }
}

function* GetNextSpecificServer(which) {
  while(1) {
    const servers = Object.keys(DiepServers);
    for(const serverID of servers) {
      if(DiepServers[serverID].gamemode == which) {
        yield serverID;
      }
    }
    if(servers.length == 0) {
      yield null;
    }
  }
}

const ScanServersServers = GetNextServer();
const ScanTagServersServers = GetNextSpecificServer("tag");
const ScanSandboxServersServers = GetNextSpecificServer("sandbox");

function ScanServer(serverID, func, cont, override) {
  if(serverID != null && DiepServers[serverID] != null) {
    if(override || (DiepServers[serverID].gamemode != 'sandbox' && DiepServers[serverID].gamemode != 'survival' && DiepServers[serverID].gamemode != 'dom')) {
      GetScoreboard(serverID, function(status, scoreboard) {
        GenDiepServer(serverID);
        if(status == 1) {
          DiepServers[serverID].scoreboard = scoreboard;
          DiepServers[serverID].lastConnected = new Date().getTime();
        } else if(new Date().getTime() - DiepServers[serverID].lastCheckedAt >= 1000 * 60 * 10) {
          delete DiepServers[serverID];
        }
        if(cont()) {
          setTimeout(func, 1);
        }
      });
    } else {
      if(new Date().getTime() - DiepServers[serverID].lastCheckedAt >= 1000 * 60 * 10) {
        DiepWebSocket(serverID, function(status) {
          GenDiepServer(serverID);
          if(status == 1) {
            DiepServers[serverID].lastConnected = new Date().getTime();
          } else {
            delete DiepServers[serverID];
          }
          if(cont()) {
            setTimeout(func, 1);
          }
        });
      } else if(cont()) {
        setTimeout(func, 1);
      }
    }
  } else if(cont()) {
    setTimeout(func, 200);
  }
}

function ScanServers() {
  ScanServer(ScanServersServers.next().value, ScanServers, function() { return 1; });
}

function ScanTagServers() {
  ScanServer(ScanTagServersServers.next().value, ScanTagServers, function() { return GlobalScoreboardData == null; });
}

function ScanSandboxServers() {
  ScanServer(ScanSandboxServersServers.next().value, ScanSandboxServers, function() { return TICK_XOR == 0; }, 1);
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

function Shutdown() {
  Client.destroy();
}

function RandomString() {
  var s = '';
  const set = 'abcdefghiljkmnoqprstuvwxyzABCDEFGHIJKLMNOQPRSTUVWXYZ0123456789-=+[{]};:\'",<.>/?|';
  for(let i = 0; i < 256; ++i) {
    s += set[(Math.random() * set.length) | 0];
  }
  return s;
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
  if(Config.owner == null) {
    Config.owner = '849585911036641332';
  }
  if(Config.hash == null) {
    Config.hash = RandomString();
    WriteConfig(function() {});
  }

  const CommandTree = {
    "get": {
      "help": 0,
      "info": 1,
      "flags": 7,
      "update": 8,
      "build": 9,
      "servers": 10,
      "id": 12,
      "scoreboard": 13,
      "lb": 13,
      "leaders": 14,
      "uptime": 15,
      "link": 16,
      "parties": 17
    },
    "eval": 2,
    "whitelist": 3,
    "blacklist": 18,
    "add": {
      "mods": 5
    },
    "remove": {
      "from": {
        "whitelist": 4,
        "blacklist": 19
      },
      "mods": 6
    },
    "leave": 11,
    "find": 20
  };
  setTimeout(ScanTagServers, 100);
  setTimeout(ScanSandboxServers, 100);
  const Commands = [function(message) { // 0
    FragmentMessage(`**Casual commands:**\n` +
                    `\`go get help\`: displays this message\n` +
                    `\`go get info\`: shows a message containing some information about the bot\n` +
                    `\`go get flags\`: shows additional options when executing commands\n` +
                    `\`go get update\`: fetches the last date of diep.io being modified\n` +
                    `\`go get build\`: fetches the latest diep.io build\n` +
                    `\`go get servers\`: displays all the servers the bot knows about\n` +
                    `\`go get id\`: converts links to server IDs\n` +
                    `\`go get scoreboard\` or \`go get lb\`: fetches scoreboard of given server (only 1 server per command)\n` +
                    `\`go get leaders\`: shows servers above given threshold\n` +
                    `\`go get uptime\`: fetches uptime of given servers\n` +
                    `\`go get link\`: converts serverID to a link\n` +
                    `\`go get parties\`: shows links to different colors in teams servers\n` +
                    `\`go find\`: searches through every scoreboard to find the searched name\n` +
                    `**Moderator commands:**\n` +
                    `\`go whitelist\`: whitelists given servers/channels/users\n` +
                    `\`go remove from whitelist\`: removes given servers/channels/users from whitelist\n` +
                    `\`go blacklist\`: blacklists given servers/channels/users\n` +
                    `\`go remove from blacklist\`: removes given servers/channels/users from blacklist\n` +
                    `\`go leave\`: leaves the guild it is executed in\n` +
                    `**Owner commands:**\n` +
                    `\`go eval\`: evaluates given expression and shows the result\n` +
                    `\`go add mods\`: adds moderators\n` +
                    `\`go remove mods\`: removes moderators\n` +
                    ``, 'Help', message.channel.id, false, false, false);
  }, function(message) { // 1
    FragmentMessage('The bot was revived on 22.12.2020. PS: and then again on 1.06.2021 lool', 'Info', message.channel.id);
  }, function(message) { // 2
    if(message.author.id != Config.owner) {
      return;
    }
    try {
      FragmentMessage('' + eval(message.content.substring(message.content.toLowerCase().indexOf('eval') + 4)), 'Eval', message.channel.id, false, false, false);
    } catch(error) {
      FragmentMessage(`Error: ${error.message}`, 'Eval', message.channel.id);
    }
  }, function(message, IDs) { // 3
    if(!IsMod(message.author.id) && message.author.id != Config.owner) {
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
    WriteConfig(function() {});
  }, function(message, IDs) { // 4
    if(!IsMod(message.author.id) && message.author.id != Config.owner) {
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
    WriteConfig(function() {});
  }, function(message, IDs) { // 5
    if(message.author.id != Config.owner) {
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
    WriteConfig(function() {});
  }, function(message, IDs) { // 6
    if(message.author.id != Config.owner) {
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
    WriteConfig(function() {});
  }, function(message) { // 7
    FragmentMessage(`\`go get servers\`:\n` +
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
                    `\`go find\`:\n` +
                    `\`-i\` | turn on case sensitivity\n` +
                    `\`-e\` | show exact scores\n` +
                    `\`-r\` | search using a regexp\n` +
                    `\n` +
                    ``, 'Flags', message.channel.id);
  }, async function(message) { // 8
    XHR('HEAD', 'https://diep.io', function(status, r, xhr) {
      if(status == 1) {
        FragmentMessage(`Diep.io was last modified on ${xhr.getResponseHeader('last-modified')}`, 'Update', message.channel.id);
      } else {
        FragmentMessage(`Error: ${r}`, 'Update', message.channel.id);
      }
    });
  }, async function(message) { // 9
    XHR('GET', 'https://diep.io', function(status, r, xhr) {
      if(status == 1) {
        const hash = r.match(/build_(.{40})/)[1];
        FragmentMessage(`Latest build hash: ${hash}\nMain file's link: **<https://static.diep.io/build_${hash}.wasm.js>**`, 'Build', message.channel.id);
      } else {
        FragmentMessage(`Error: ${r}`, 'Build', message.channel.id);
      }
    });
  }, async function(message, args) { // 10
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
        if(uptime == true && DiepServers[serverID].uptime != 0) {
          str += ` | Uptime ${ShortStringTime(new Date().getTime() - DiepServers[serverID].lastConnected + DiepServers[serverID].scoreboard.uptime * 40)}`;
        }
        str += '\n';
      }
    }
    if(serverCount > 0) {
      FragmentMessage(str, `Servers (${serverCount})`, message.channel.id, false, false, false);
    } else {
      FragmentMessage('There are no servers in specified gamemode and region, the servers are being full (botted), or there is a problem occuring.', `Servers (${serverCount})`, message.channel.id);
    }
  }, function(message) { // 11
    if(!IsMod(message.author.id) && message.author.id != Config.owner) {
      return;
    }
    message.guild.leave();
  }, function(message, links) { // 12
    if(links.length == 0) {
      return FragmentMessage(`No links were provided.`, 'Link to ID', message.channel.id);
    }
    var parsed;
    for(let i = 1; i <= links.length; ++i) {
      parsed = ParseLink(links[i - 1]);
      if(parsed[0] == 1) {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link's id is **${parsed[1]}**`, 'Link to ID', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link is invalid.`, 'Link to ID', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
  }, async function(message, link) { // 13
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
    GetScoreboard(parsed[1], function(status, scoreboard) {
      if(status == 0) {
        return FragmentMessage(`Error: ${scoreboard}`, 'Scoreboard', message.channel.id);
      }
      GenDiepServer(parsed[1]);
      DiepServers[parsed[1]].scoreboard = scoreboard;
      DiepServers[parsed[1]].lastConnected = new Date().getTime();
      if(scoreboard.count == 0) {
        return FragmentMessage(`The scoreboard for link **<${DiepServers[parsed[1]].link}${parsed[2] != '' ? `00${parsed[2]}` : ''}>** is empty.`, 'Scoreboard', message.channel.id);
      }
      var str = `Scoreboard for link **<${DiepServers[parsed[1]].link}${parsed[2] != '' ? `00${parsed[2]}` : ''}>**:\n`;
      for(i = 0; i < scoreboard.count; ++i) {
        str += `${COUNTER[i + 1]}: ` +
          `${DISCORD_COLORS[scoreboard.entries[i].color]} ` +
          `${exactScore ? scoreboard.entries[i].score : StringScore(scoreboard.entries[i].score)} ` +
          `${scoreboard.entries[i].tank || ''} `;
        if(scoreboard.entries[i].name != '') {
          str += `| **${scoreboard.entries[i].name.replace(/[*`_|\\]/g, '\\$&')}**`;
        }
        str += '\n';
      }
      FragmentMessage(str, 'Scoreboard', message.channel.id, false, false, false);
    });
  }, function(message, args) { // 14
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
      } else if(args[i].match(/^tag$/) != null) {
        gamemodes[gamemodes.length] = 'tag';
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
      gamemodes = ['ffa', 'teams', '4teams', 'maze', 'tag'];
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
      if(goodGamemode == true && goodRegion == true) {
        for(let i = 0; i < DiepServers[serverID].scoreboard.count; ++i) {
          if(DiepServers[serverID].scoreboard.entries[i].score >= score) {
            scoreboards[scoreboards.length] = { ...DiepServers[serverID], serverID, entry: DiepServers[serverID].scoreboard.entries[i] };
          }
        }
      }
    }
    scoreboards.sort(function(a, b) {
      return b.entry.score - a.entry.score;
    });
    for(i = 0; i < scoreboards.length; ++i) {
      str += `${++counter}. **${exactScore?scoreboards[i].entry.score:StringScore(scoreboards[i].entry.score)}** ${
      SimpleGamemode(scoreboards[i].gamemode)} ${SimpleRegion(scoreboards[i].region)} **https://diep.io/#${IDToLink(scoreboards[i].serverID)}**\n` +
        `${DISCORD_COLORS[scoreboards[i].entry.color]} ` +
        `${scoreboards[i].entry.tank || ''} `;
      if(scoreboards[i].entry.name != '') {
        str += `| **${scoreboards[i].entry.name.replace(/\\/g, '\\\\').replace(/\*/g, '\\*')} **`;
      }
      if(lastChecked == true) {
        str += ` | Checked ${ShortStringTime(new Date().getTime() - scoreboards[i].lastConnected)} ago`;
      }
      str += '\n';
    }
    if(scoreboards.length > 0) {
      FragmentMessage(str, `Leaders (${scoreboards.length})`, message.channel.id, false, false, false);
    } else if(Unsafe == true) {
      FragmentMessage(`Diep.io has been updated. Each week it automatically shuffles a few things in its code. You need to wait until Shädam fixes the update in order to view leaders.`, `Leaders`, message.channel.id);
    } else {
      FragmentMessage(`There are no leaders in specified gamemodes and regions above ${StringScore(score)}, the servers are being full (botted), or there is a problem occuring.`, `Leaders`, message.channel.id);
    }
  }, async function(message, links) { // 15
    if(links.length == 0) {
      return FragmentMessage(`No links were provided.`, 'Uptime', message.channel.id);
    }
    links = GetFlags(links);
    var flags = links[1];
    links = links[0];
    var exact = false;
    let i = 0;
    let j;
    for(; i < flags.length; ++i) {
      if(flags[i] == "-e") {
        exact = true;
      } else {
        FragmentMessage(`Invalid flag (${flags[i]}). Try \`go get flags\` to see the list of flags.`, 'Uptime', message.channel.id, false, false, false, false, false, false);
      }
    }
    var parsed;
    var scoreboard;
    var usingAsync = false;
    var completed = new Array(links.length);
    for(i = 0; i < completed.length; ++i) {
      completed[i] = 0;
    }
    for(i = 1; i <= links.length; ++i) {
      parsed = ParseLink(links[i - 1]);
      if(parsed[0] == 1) {
        if(DiepServers[parsed[1]] != null && DiepServers[parsed[1]].scoreboard.uptime != 0) {
          completed[i - 1] = 1;
          FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link's uptime is ${exact?DiepServers[parsed[1]].scoreboard.uptime:ShortStringTime(DiepServers[parsed[1]].scoreboard.uptime * 40 + new Date().getTime() - DiepServers[parsed[1]].lastConnected)}`, 'Uptime', message.channel.id, false, false, false, false, false, false);
        } else {
          usingAsync = true;
          const which = i;
          GetScoreboard(parsed[1], function(status, scoreboard) {
            completed[which - 1] = 1;
            if(status == 0) {
              FragmentMessage(`Error: ${scoreboard}`, 'Uptime', message.channel.id, false, false, false, false, false, false);
              label: {
                for(j = 0; j < completed.length; ++j) {
                  if(completed[j] == 0) {
                    break label;
                  }
                }
                StartMessageCycle(message.channel.id);
              }
            }
            GenDiepServer(parsed[1]);
            DiepServers[parsed[1]].lastConnected = new Date().getTime();
            DiepServers[parsed[1]].scoreboard = scoreboard;
            FragmentMessage(`${which}${which == 1 ? "st" : which == 2 ? "nd" : which == 3 ? "rd" : "th"} link's uptime is ${exact?scoreboard.uptime:ShortStringTime(scoreboard.uptime * 40)}`, 'Uptime', message.channel.id, false, false, false, false, false, false);
            label: {
              for(j = 0; j < completed.length; ++j) {
                if(completed[j] == 0) {
                  break label;
                }
              }
              StartMessageCycle(message.channel.id);
            }
          });
        }
      } else {
        completed[i - 1] = 1;
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link is invalid.`, 'Uptime', message.channel.id, false, false, false, false, false, false);
      }
    }
    if(usingAsync == false) {
      StartMessageCycle(message.channel.id);
    }
  }, function(message, ids) { // 16
    if(ids.length == 0) {
      return FragmentMessage(`No links were provided.`, 'ID to link', message.channel.id);
    }
    var match;
    for(let i = 1; i <= ids.length; ++i) {
      match = ids[i - 1].match(/^([a-z0-9]{4})$/);
      if(match == null) {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} server ID is invalid.`, 'ID to link', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} server ID's link is **https://diep.io/#${IDToLink(match[1])}**`, 'ID to link', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
  }, function(message, links) { // 17
    if(links.length == 0) {
      return FragmentMessage(`No links were provided.`, 'Parties', message.channel.id);
    }
    let parties = [];
    let i;
    let j;
    let parsed;
    for(i = 1; i <= links.length; ++i) {
      parsed = ParseLink(links[i - 1]);
      if(parsed[0] == 1) {
        if(DiepServers[parsed[1]] != null) {
          if(DiepServers[parsed[1]].gamemode == 'teams' || DiepServers[parsed[1]].gamemode == '4teams') {
            parties = [];
            for(j in DiepServers[parsed[1]].parties) {
              parties[parties.length] = `**<${j}>**\n`;
            }
            if(parties.length == 0) {
              FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link does not have any parties discovered. Try again later.`, 'Parties', message.channel.id, false, false, false, false, false, false);
            } else {
              FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link's parties are:\n${parties.join('')}`, 'Parties', message.channel.id, false, false, false, false, false, false);
            }
          } else {
            FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link is not a team gamemode (teams or 4teams, no support for domination).`, 'Parties', message.channel.id, false, false, false, false, false, false);
          }
        } else {
          FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link is not known to me. Either the link doesn't exist, or you need to try again later.`, 'Parties', message.channel.id, false, false, false, false, false, false);
        }
      } else {
        FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link is invalid`, 'Parties', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
  }, function(message, IDs) { // 18
    if(!IsMod(message.author.id) && message.author.id != Config.owner) {
      return;
    }
    if(IDs.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Add to blacklist', message.channel.id);
    }
    let j = 0;
    let has = false;
    let id;
    for(let i = 0; i < IDs.length; i++) {
      id = ExtractID(IDs[i]);
      if(id == null) {
        FragmentMessage(`${IDs[i]} is not a valid ID.`, 'Add to blacklist', message.channel.id, false, false, false, false, false, false);
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
        FragmentMessage(`ID ${id} successfully blacklisted.`, 'Add to blacklist', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`ID ${id} is already blacklisted.`, 'Add to blacklist', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig(function() {});
  }, function(message, IDs) { // 19
    if(!IsMod(message.author.id) && message.author.id != Config.owner) {
      return;
    }
    if(IDs.length == 0) {
      return FragmentMessage(`No IDs specified.`, 'Remove from blacklist', message.channel.id);
    }
    let j = 0;
    let has = -1;
    let id;
    for(let i = 0; i < IDs.length; i++) {
      id = ExtractID(IDs[i]);
      if(id == null) {
        FragmentMessage(`${IDs[i]} is not a valid ID.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
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
        Config.blacklist[has] = Config.blacklist[--HelpingConfig.whitelistLength];
        FragmentMessage(`ID ${id} successfully removed from blacklist.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
      } else {
        FragmentMessage(`ID ${id} is already not blacklisted.`, 'Remove from blacklist', message.channel.id, false, false, false, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig(function() {});
  }, function(message, name) { // 20
    if(name.length == 0) {
      return FragmentMessage(`No name was specified.`, 'Find', message.channel.id);
    }
    name = GetFlags(name);
    var flags = name[1];
    name = name[0].join(" ");
    let exactScore = false;
    let caseInsensitive = true;
    let isRegexp = false;
    let counter = 0;
    let i = 0;
    let j;
    for(; i < flags.length; ++i) {
      if(flags[i] == "-i") {
        caseInsensitive = false;
      } else if(flags[i] == "-e") {
        exactScore = true;
      } else if(flags[i] == "-r") {
        isRegexp = true;
      } else {
        FragmentMessage(`Invalid flag (${flags[i]}). Try \`go get flags\` to see the list of flags.`, 'Find', message.channel.id, false, false, false, false, false, false);
      }
    }
    if(isRegexp == true && name.length > 20) {
      return FragmentMessage(`Name can't exceed 20 characters.`, 'Find', message.channel.id);
    }
    let nameToFind;
    if(isRegexp == true) {
      try {
        nameToFind = new RegExp(name, caseInsensitive ? "i" : "");
      } catch(err) {
        return FragmentMessage(`Invalid regexp. If you don't know what this means, don't use symbols, or put \\\\ in front of them.`, 'Find', message.channel.id);
      }
    } else {
      if(caseInsensitive) {
        nameToFind = name.toLowerCase();
      } else {
        nameToFind = name;
      }
    }
    let str = "";
    for(const serverID in DiepServers) {
      for(i = 0; i < DiepServers[serverID].scoreboard.count; ++i) {
        let entry = DiepServers[serverID].scoreboard.entries[i];
        let lb = DiepServers[serverID].scoreboard;
        let is_good = false;
        if(isRegexp == true) {
          is_good = entry.name.match(nameToFind) != null;
        } else {
          is_good = entry.name.includes(nameToFind);
        }
        if(is_good == true) {
          str += `${++counter}. **${exactScore?entry.score:StringScore(entry.score)}** ${DiepServers[serverID].gamemode?SimpleGamemode(DiepServers[serverID].gamemode):""} ${DiepServers[serverID].region?SimpleRegion(DiepServers[serverID].region):""} **https://diep.io/#${IDToLink(serverID)
          }**\n` + `${DISCORD_COLORS[entry.color]} ` + `${entry.tank || ''} `;
          if(entry.name != '') {
            str += `| **${entry.name.replace(/[*`_|\\]/g, '\\$&')} **`;
          }
          str += "\n";
        }
      }
    }
    if(str.length != 0) {
      FragmentMessage(str, `Find (${counter})`, message.channel.id, false, false, false);
    } else {
      FragmentMessage(`I wasn't able to find anyone with the specified name.`, `Find`, message.channel.id);
    }
  }];
  Client.on('message', async function(M) {
    if(M.channel.type == 'dm' && M.content.replace(/\\/g, '') == Config.hash) {
      Config.owner = M.author.id;
      Config.hash = RandomString();
      WriteConfig(function() {});
      M.channel.send('New hash: ' + Config.hash);
    }
    const message = M.content.toLowerCase().FullTrim();
    const lowkey_keywords = message.split(' ');
    if((lowkey_keywords[0].match(/^go$/) != null || (lowkey_keywords[0].match(/^bby$/) != null && lowkey_keywords[1].match(/^plz$/) != null) || lowkey_keywords[0].match(/^<@!?790912664830345226>$/) != null) && (M.author.id == Config.owner || (M.channel.type == "text" &&
      (function() {
        var result = false;
        for(let i = 0; i < HelpingConfig.whitelistLength; i++) {
          if(Config.whitelist[i] == M.channel.id || Config.whitelist[i] == M.guild.id || Config.whitelist[i] == M.author.id) {
            result = true;
          }
        }
        for(let i = 0; i < HelpingConfig.blacklistLength; i++) {
          if(Config.blacklist[i] == M.channel.id || Config.blacklist[i] == M.guild.id || Config.blacklist[i] == M.author.id) {
            result = false;
          }
        }
        if(IsMod(M.author.id)) {
          result = true;
        }
        return result;
      })() == true))) {
      if(message.match(/^<@!?790912664830345226>$/) != null) {
        return FragmentMessage(`Need help? Try \`go get help\``, 'Help', M.channel.id);
      }
      const keywords = message.startsWith("go") == true ? message.substring(3).split(' ') : message.startsWith(`<@!790912664830345226>`) == true ? message.substring(23).split(' ') : message.startsWith(`bby plz`) == true ? message.substring(8).split(' ') : message.substring(22).split(' ');
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

ReadConfig(function() {
  console.log("read config");
  Client.login(Config.token);
  Client.on('ready', Ready);
});

setTimeout(function() {
  if(GlobalScoreboardData == null) { // not perfect, ../website_backend/scanner.js is
    console.log("no global data after 1 minute, restarting");
    process.exit();
  }
}, 60000);

let crit_count = 0;

const CHECK_CPU_USAGE_INTERVAL    = 1000*10;
const HIGH_CPU_USAGE_LIMIT        = 90;

let autoRestart = setInterval(function() { // from time to time it was becoming stuck because of flawed PoW solver, now it shouldn't be an issue
  Utils.cpu.usage().then(function(result) {
    if(result > HIGH_CPU_USAGE_LIMIT) {
      ++crit_count;
    } else {
      crit_count = Math.max(crit_count - 1, 0);
    }
    if(crit_count == 5) {
      console.log("restart due to high cpu usage");
      process.exit();
    }
  });
}, CHECK_CPU_USAGE_INTERVAL);
