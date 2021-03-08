'use strict';

const Discord = require('discord.js');
const Client = new Discord.Client();
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const https = require('https');
const WebSocket = require('ws');
const FileSystem = require('fs');

var Config = {};
var HelpingConfig = {};

const LatestBuild = 'd2f03427541ea42547fbfb6aee10223a4b1edf29';
const LatestDate = 'Sun, 07 Mar 2021 06:49:03 GMT';
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
const DECODE_OFFSET_TABLE_LENGTH = 0;
const ENCODE_OFFSET_TABLE_LENGTH = 0;

const TICK_XOR = 0;

const I_JUMP_TABLE = [];
const DECODE_TABLES = [];
const I_JUMP_TIMES = [];

const O_JUMP_TABLE = [];
const ENCODE_TABLES = [];
const O_JUMP_TIMES = [];

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
      scoreboard.entries[i].tank = TANKS[this.getI()];
    }
    this.getF();
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].score = this.getF() | 0;
    }
    this.getF();
    this.getU();
    this.getF();
    this.getF();
    this.getF();
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].color = this.getU();
    }
    this.getF();
    this.getU();
    this.getU();
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].name = this.getS();
    }
    this.getF();
    scoreboard.count = this.getU();
    for(i = 0; i < 10; ++i) {
      scoreboard.entries[i].suffix = this.getS();
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
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
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
  if(Config.mods == null) {
    Config.mods = [];
    HelpingConfig.modsLength = 0;
  } else {
    HelpingConfig.modsLength = Config.mods.length;
  }
  if(Config.owner == null) {
    Config.owner = '';
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
    "add": {
      "mods": 5
    },
    "remove": {
      "from": {
        "whitelist": 4
      },
      "mods": 6
    },
    "leave": 11
  };
  //setTimeout(ScanServers, 100);
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
                    `**Moderator commands:**\n` +
                    `\`go whitelist\`: whitelists given servers/channels/users\n` +
                    `\`go remove from whitelist\`: removes given servers/channels/users from whitelist\n` +
                    `\`go leave\`: leaves the guild it is executed in\n` +
                    `**Owner commands:**\n` +
                    `\`go eval\`: evaluates given expression and shows the result\n` +
                    `\`go add mods\`: adds moderators\n` +
                    `\`go remove mods\`: removes moderators\n` +
                    ``, 'Help', message.channel.id, false, false, false);
  }, function(message) { // 1
    FragmentMessage('The bot was revived on 22.12.2020.', 'Info', message.channel.id);
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
    return FragmentMessage(`This command is disabled.`, 'Scoreboard', message.channel.id);
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
          str += `| **${scoreboard.entries[i].name.replace('\\', '\\\\').replace('*', '\\*') + scoreboard.entries[i].suffix}**`;
        }
        str += '\n';
      }
      FragmentMessage(str, 'Scoreboard', message.channel.id, false, false, false);
    });
  }, function(message, args) { // 14
    return FragmentMessage(`This command is disabled.`, 'Leaders', message.channel.id);
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
        str += ` | Checked ${ShortStringTime(new Date().getTime() - scoreboards[i].lastConnected)} ago`;
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
  }, async function(message, links) { // 15
    return FragmentMessage(`This command is disabled.`, 'Uptime', message.channel.id);
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
  }, function(message, links) {
    return FragmentMessage(`This command is disabled.`, 'Parties', message.channel.id);
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
