'use strict';

const Discord = require('discord.js');
const Client = new Discord.Client();
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const https = require('https');
const WebSocket = require('ws');
const FileSystem = require('fs');

var Config = {};
var HelpingConfig = {};

const LatestBuild = '1a457f863d9cdcd91d615860196003b466cb8697';
const LatestDate = 'Sun, 27 Jun 2021 06:52:06 GMT';
var Unsafe = false;

const DiepServers = {};

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

const SAMPLES = 32;

const TICK_XOR = 16269140;

const I_JUMP_TABLE = [59,1,34,0,44,21,18,3,122,103,78,10,108,75,62,101,22,99,38,85,57,9,66,8,124,81,50,11,56,15,94,20,76,13,41,61,100,113,102,30,74,5,17,105,64,23,37,33,60,24,12,111,126,4,73,65,40,89,27,69,120,83,45,35,70,31,42,91,32,29,54,16,28,121,46,6,118,51,98,55,115,119,43,49,82,87,86,7,63,36,127,14,80,79,47,68,123,117,39,107,104,25,58,2,90,53,106,67,96,26,84,19,92,93,112,71,95,52,114,77,72,97,110,116,109,48,125,88];
const DECODE_TABLES = [[250,238,102,150,114,178,194,146,66,130,94,54,238,26,130,158,114,126,42,38],[50,246,62,126,22,214,226,142,210,238,206,242,230,194,222,74,174,74,34,202],[94,14,26,174,218,18,166,162,82,126,166,150,62,122,230,238,134,130,30,138],[250,178,126,198,150,10,138,66,170,138,150,10,238,58,254,222,90,214,146,74],[22,238,138,182,78,238,222,102,246,154,134,198,30,38,62,178,82,234,118,18],[178,222,206,126,222,138,26,130,14,214,118,78,190,42,226,94,194,22,146,82],[122,138,134,210,42,166,114,58,62,94,206,174,238,106,154,126,150,126,182,62],[214,182,126,106,186,130,226,154,214,34,198,30,106,242,174,222,182,14,6,102],[190,18,10,66,162,122,186,74,206,106,206,210,50,230,158,86,54,106,134,146],[158,110,62,162,26,114,146,38,242,206,186,114,118,134,254,154,54,138,78,30],[46,38,218,70,50,38,90,158,50,14,58,158,50,170,50,122,174,86,10,190],[226,94,218,226,118,154,50,178,246,102,90,150,58,138,154,166,10,26,26,250],[154,106,130,186,146,254,166,106,230,14,86,18,250,162,206,94,34,2,94,126],[154,186,150,102,70,102,222,134,62,86,58,126,242,246,130,234,218,2,14,70],[226,158,162,22,230,178,2,46,54,178,226,150,126,122,106,114,194,106,110,90],[206,154,194,30,18,126,210,246,22,154,18,94,250,94,74,250,58,6,22,250],[166,34,50,98,38,86,234,30,134,34,150,62,78,142,30,246,198,114,70,142],[46,110,218,162,2,82,186,166,206,82,10,22,46,26,178,194,14,146,110,122],[78,158,174,78,166,110,146,246,66,6,10,2,58,46,182,110,26,74,210,154],[66,118,70,114,170,170,242,98,110,182,142,178,94,70,170,6,62,70,42,30],[102,118,182,22,130,222,198,14,158,170,94,82,18,62,190,186,134,246,242,130],[134,70,30,210,138,46,138,54,94,46,2,246,186,242,66,218,186,190,126,150],[158,146,54,114,6,170,246,130,2,58,38,158,34,234,50,62,202,158,62,50],[194,206,202,14,138,18,190,18,242,86,134,242,130,226,118,102,86,38,30,54],[34,2,190,50,234,166,170,34,18,26,38,98,34,178,34,126,42,2,158,26],[46,82,106,230,74,234,230,202,146,142,58,18,190,174,206,10,178,238,122,150],[94,206,42,134,106,162,14,62,38,82,230,6,142,154,46,38,26,162,238,14],[22,50,166,10,158,170,226,66,102,86,234,174,154,74,62,138,54,250,170,86],[38,46,74,250,234,142,138,66,234,230,114,66,86,142,202,186,74,250,102,218],[98,46,50,250,206,250,74,2,214,62,102,234,118,2,194,226,242,142,62,202],[22,102,126,6,126,42,22,106,66,146,206,206,174,246,198,186,242,142,190,142],[250,2,158,14,250,10,94,238,10,226,190,70,98,150,2,242,138,162,110,214]];
const I_JUMP_TIMES = [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5];

const O_JUMP_TABLE = [0,27,68,4,93,84,22,71,30,114,36,55,109,90,45,20,18,44,47,58,28,86,38,66,80,94,34,39,50,3,46,42,56,40,48,52,72,95,59,21,88,57,62,29,5,74,19,24,78,60,92,87,99,122,51,6,75,83,23,85,64,10,67,82,121,115,127,31,123,14,43,97,102,125,15,98,96,12,100,76,113,117,37,77,61,70,63,116,120,91,107,8,73,54,13,2,112,69,103,105,111,11,104,79,106,110,124,7,25,16,81,126,17,65,101,26,89,41,49,32,1,118,119,53,9,108,33,35];
const ENCODE_TABLES = [[11,115,62,183,207,6,90,60,18,229,255,65,217,188,49,205,134,51,87,151,90],[203,243,129,14,60,235,40,133,248,231,96,4,205,218,99,215,12,5,88,177,90],[30,51,148,130,153,167,130,87,124,72,29,37,103,148,2,200,132,13,118,46,81],[87,203,65,243,102,138,129,46,203,112,124,41,35,112,27,246,57,85,205,55,136],[47,185,177,228,128,233,153,35,76,71,108,241,122,219,235,86,186,107,196,249,253],[157,106,22,51,137,127,189,247,255,225,169,133,190,40,129,172,209,101,47,104,77],[185,40,158,217,202,137,239,95,151,232,137,193,151,222,239,153,247,50,80,33,248],[54,233,101,249,68,56,37,51,213,180,127,200,252,165,192,231,240,123,10,118,113],[9,79,141,151,28,243,60,31,34,6,245,194,128,183,101,63,250,41,124,64,237],[129,86,20,75,196,193,203,225,98,67,8,104,222,203,115,27,230,92,214,147,255],[238,33,40,0,151,126,47,233,50,116,194,75,5,94,163,61,197,75,190,166,186],[235,84,168,253,239,97,191,37,224,201,49,169,239,226,23,235,50,197,24,33,166],[159,248,77,154,124,160,178,81,149,179,80,183,99,50,106,25,137,229,10,0,24],[157,225,163,166,148,233,250,165,50,192,79,138,0,132,97,57,25,230,173,159,241],[177,249,89,149,195,144,193,140,111,35,132,218,41,24,141,251,48,92,160,255,49],[44,159,244,78,212,0,243,252,213,169,106,235,186,194,194,78,178,59,29,23,27],[58,159,71,198,184,123,164,213,219,105,27,115,77,155,97,255,58,160,184,66,238],[35,52,219,23,164,80,255,249,156,239,176,165,103,252,29,201,26,193,212,173,10],[122,113,173,222,16,18,52,167,148,53,143,102,207,180,131,6,243,106,162,43,9],[130,189,29,48,213,54,150,104,11,237,114,11,60,47,89,213,161,246,222,101,246],[191,42,224,229,53,216,3,248,185,92,143,64,241,115,233,113,40,86,167,179,12],[179,96,144,83,137,33,0,108,111,41,204,140,248,162,84,114,236,38,119,212,242],[41,216,138,155,20,71,67,46,6,235,91,3,26,167,241,98,61,79,106,153,223],[82,156,35,10,168,199,209,84,24,162,203,129,200,33,117,165,94,63,214,22,127],[86,225,19,40,130,124,218,234,82,68,50,230,211,24,70,1,185,32,139,59,215],[208,158,248,120,30,64,62,167,150,215,85,92,88,2,187,136,83,156,150,175,71],[191,84,97,217,109,81,36,117,200,252,26,124,151,205,248,129,27,127,227,208,93],[28,109,95,143,246,91,65,21,252,77,199,132,167,156,151,149,7,95,88,43,218],[124,128,56,8,42,34,48,151,92,79,185,213,147,205,196,222,241,145,188,217,19],[228,18,173,227,192,158,0,29,185,252,240,207,91,209,186,98,112,108,33,242,243],[90,217,74,214,189,184,214,160,8,23,8,154,230,208,248,4,249,196,42,65,189],[238,118,105,185,109,4,168,40,85,20,137,69,240,105,171,133,207,40,238,237,91]];
const O_JUMP_TIMES = [2,12,10,1,14,7,13,10,8,7,5,4,15,11,1,3,10,14,13,8,14,8,10,12,10,4,6,15,13,2,6,13];

const DECODE_OFFSET_TABLE_LENGTH = DECODE_TABLES[0].length;
const ENCODE_OFFSET_TABLE_LENGTH = ENCODE_TABLES[0].length;

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
  this.getU();
  this.getU();
  ++this.at;
  if(this.getU() == 9 && this.getU() == 6) {
    ++this.at;
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
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].suffix = this.getS();
    }
    this.at += 17;
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].tank = TANKS[this.getI()];
    }
    this.at += 4;
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].score = this.getF() | 0;
    }
    this.at += 4;
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].name = this.getS();
    }
    this.at += 8;
    scoreboard.count = this.getU();
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].color = this.getU();
    }
    return scoreboard;
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
  XHR('HEAD', 'https://diep.io', function(status, r, xhr) {
    if(status == 1) {
      if(xhr.getResponseHeader('last-modified') != LatestDate) {
        Unsafe = true;
        return callback(0, `Mismatch in latest modified date: received ${xhr.getResponseHeader('last-modified')}, but have ${LatestDate} as the latest.`);
      }
    } else {
      return callback(0, 'Couldn\'t connect to https://diep.io for some reason.');
    }
    socket.parser = new Shädam();
    socket.onmessage = async function(x) {
      var data = new Uint8Array(x.data);
      if(resolved.bool == false) {
        this.parser.set(data);
        this.parser.decodePacket();
        if(this.parser.buffer[0] == 2) {
          const token = this.parser.buffer[5];
          var at = 6;
          var literalLength = token >> 4;
          if(literalLength == 0xf) {
            do {
              literalLength += this.parser.buffer[at];
            } while(this.parser.buffer[at++] == 0xff);
          }
          if(this.parser.buffer[at] == 0) {
            this.close();
            resolved.bool = true;
          }
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
  });
}

function DiepHandshakeContinuation(resolved, getPacketID, party, callback) {
  switch(this.parser.buffer[0]) {
    case 1: {
      resolved.bool = true;
      return callback(0, `The party is invalid or the server is not a diep.io server.`);
    }
    case 6: {
      if(DiepServers[this.serverID] != null) {
        DiepServers[this.serverID].parties['https://diep.io/#' + IDToLink(this.serverID) + '00' + Array.from(this.parser.buffer).slice(1).map(r => r.toString(16).padStart(2, '0').split('').reverse().join('')).join('').toUpperCase()] = 0;
      }
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
        callback(1, socket.parser.extractScoreboard());
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
  XHR('GET', `https://api.n.m28.io/endpoint/diepio-${gamemode}/findeach`, function(status, r, xhr) {
    if(status == 1) {
      try {
        const servers = JSON.parse(r);
        for(const Region in servers.servers) {
          if(DiepServers[servers.servers[Region].id] == null || DiepServers[servers.servers[Region].id].region == null || DiepServers[servers.servers[Region].id].gamemode == null) {
            DiepServers[servers.servers[Region].id] = { gamemode, region: Region.match(/vultr-(.*)/)[1], lastCheckedAt: new Date().getTime(), parties: {} };
          } else {
            DiepServers[servers.servers[Region].id].lastCheckedAt = new Date().getTime();
          }
        }
      } catch(error) {}
    }
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
  var a = [serverID[0].charCodeAt(), serverID[1].charCodeAt(), serverID[2].charCodeAt(), serverID[3].charCodeAt()];
  var b = '';
  var c = '';
  for(let i = 0; i < 4; i++) {
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
  SeekServers('ffa');
  SeekServers('teams');
  SeekServers('4teams');
  SeekServers('maze');
  SeekServers('dom');
  SeekServers('tag');
  SeekServers('survival');
  SeekServers('sandbox');
}, 500);

function Sleep(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

function* GetNextServer() {
  while(1) {
    for(const serverID in DiepServers) {
      yield serverID;
    }
    if(Object.getOwnPropertyNames(DiepServers).length == 0) {
      yield null;
    }
  }
}

const ScanServersServers = GetNextServer();

function ScanServers() {
  const serverID = ScanServersServers.next().value;
  if(serverID != null) {
    if(DiepServers[serverID].gamemode != 'sandbox' && DiepServers[serverID].gamemode != 'survival' && DiepServers[serverID].gamemode != 'tag' && DiepServers[serverID].gamemode != 'dom') {
      GetScoreboard(serverID, function(status, scoreboard) {
        if(status == 1) {
          DiepServers[serverID].scoreboard = scoreboard;
          DiepServers[serverID].lastConnected = new Date().getTime();
        } else if(new Date().getTime() - DiepServers[serverID].lastCheckedAt >= 9e5) {
          delete DiepServers[serverID];
        }
        ScanServers();
      });
    } else {
      if(DiepServers[serverID].lastCheckedAt >= 9e5) {
        DiepWebSocket(serverID, function(status) {
          if(status == 1) {
            DiepServers[serverID].lastConnected = new Date().getTime();
          } else {
            delete DiepServers[serverID];
          }
          ScanServers();
        });
      } else {
        ScanServers();
      }
    }
  } else {
    setTimeout(ScanServers, 200);
  }
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
        if(uptime == true && DiepServers[serverID].scoreboard != null) {
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
      if(DiepServers[parsed[1]] != null) {
        DiepServers[parsed[1]].scoreboard = scoreboard;
        DiepServers[parsed[1]].lastConnected = new Date().getTime();
      } else {
        DiepServers[parsed[1]] = { scoreboard, lastConnected: new Date().getTime(), parties: {} };
      }
      if(scoreboard.count == 0) {
        return FragmentMessage(`The scoreboard for link **<https://diep.io/#${IDToLink(parsed[1])}${parsed[2] != '' ? `00${parsed[2]}` : ''}>** is empty.`, 'Scoreboard', message.channel.id);
      }
      var str = `Scoreboard for link **<https://diep.io/#${IDToLink(parsed[1])}${parsed[2] != '' ? `00${parsed[2]}` : ''}>**:\n`;
      for(i = 0; i < scoreboard.count; ++i) {
        str += `${COUNTER[i + 1]}: ` +
          `${DISCORD_COLORS[scoreboard.entries[i].color]} ` +
          `${exactScore ? scoreboard.entries[i].score : StringScore(scoreboard.entries[i].score)} ` +
          `${scoreboard.entries[i].tank || ''} `;
        if(scoreboard.entries[i].name != '') {
          str += `| **${scoreboard.entries[i].name.replace(/[*`_|\\]/g, '\\$&') + scoreboard.entries[i].suffix}**`;
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
      if(goodGamemode == true && goodRegion == true && DiepServers[serverID].scoreboard != null && DiepServers[serverID].scoreboard.count > 0) {
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
        str += `| **${scoreboards[i].entry.name.replace(/\\/g, '\\\\').replace(/\*/g, '\\*') + scoreboards[i].entry.suffix} **`;
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
        if(DiepServers[parsed[1]] != null && DiepServers[parsed[1]].scoreboard != null) {
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
            if(DiepServers[parsed[1]] == null) {
              DiepServers[parsed[1]] = {
                parties: {}
              };
            }
            if(DiepServers[parsed[1]].lastConnected == null) {
              DiepServers[parsed[1]].lastConnected = new Date().getTime(0);
            }
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
          if(DiepServers[parsed[1]].gamemode != 'sandbox' && DiepServers[parsed[1]].gamemode != 'survival' && DiepServers[parsed[1]].gamemode != 'tag' && DiepServers[parsed[1]].gamemode != 'dom' && DiepServers[parsed[1]].gamemode != 'ffa' && DiepServers[parsed[1]].gamemode != 'maze') {
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
          FragmentMessage(`${i}${i == 1 ? "st" : i == 2 ? "nd" : i == 3 ? "rd" : "th"} link is not in the memory. Either the link doesn't exist, or you need to try again later.`, 'Parties', message.channel.id, false, false, false, false, false, false);
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
    let counter = 0;
    let i = 0;
    let j;
    for(; i < flags.length; ++i) {
      if(flags[i] == "-i") {
        caseInsensitive = false;
      } else if(flags[i] == "-e") {
        exactScore = true;
      } else {
        FragmentMessage(`Invalid flag (${flags[i]}). Try \`go get flags\` to see the list of flags.`, 'Find', message.channel.id, false, false, false, false, false, false);
      }
    }
    if(name.length > 15) {
      return FragmentMessage(`Name can't exceed 15 characters.`, 'Find', message.channel.id);
    }
    let nameToFind;
    try {
      nameToFind = new RegExp(name, caseInsensitive ? "i" : "");
    } catch(err) {
      return FragmentMessage(`Invalid regexp. If you don't know what this means, don't use symbols, or put \\\\ in front of them.`, 'Find', message.channel.id);
    }
    let str = "";
    for(const serverID in DiepServers) {
      if(DiepServers[serverID] != null && DiepServers[serverID].scoreboard != null && DiepServers[serverID].scoreboard.count != null) {
        for(i = 0; i < DiepServers[serverID].scoreboard.count; ++i) {
          let entry = DiepServers[serverID].scoreboard.entries[i];
          let lb = DiepServers[serverID].scoreboard;
          if(entry.name.match(nameToFind) != null) {
            str += `${++counter}. **${exactScore?entry.score:StringScore(entry.score)}** ${DiepServers[serverID].gamemode?SimpleGamemode(DiepServers[serverID].gamemode):""} ${DiepServers[serverID].region?SimpleRegion(DiepServers[serverID].region):""} **https://diep.io/#${IDToLink(serverID)
            }**\n` + `${DISCORD_COLORS[entry.color]} ` + `${entry.tank || ''} `;
            if(entry.name != '') {
              str += `| **${entry.name.replace(/[*`_|\\]/g, '\\$&') + entry.suffix} **`;
            }
            str += "\n";
          }
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

(async function() {
  ReadConfig(function() {
    Client.login(Config.token);
    Client.on('ready', Ready);
  });
})();