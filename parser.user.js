// ==UserScript==
// @name         Diep.io Packet Parser
// @version      1.0
// @description  Quickly written to parse update packets
// @author       Shädam
// @match        *://diep.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

/*
There are 2 ways of making a parser. Either spend your time getting to know that creation fields have things in common and instead of making a switch case for every entity type,
you can make if statements for every 'type of information' that a creation might include. This is how diep.io's client does things. Second way is to make the switch statement for
every entity and just write full creation parse for each of them. Not ideal, but you at least don't need to dive very deep into the topic and spend enormous time on it. This parser
uses the second technique.
Want to learn more? Go to https://static.diep.io/build_6f59094d60f98fafc14371671d3ff31ef4d75d9e.js
To find the function which parses entity update, search for "function hh(a,b)" (case sensitive, there might be a function called Hh) (huge function).
To find the function which parses entity creation, search for "function ih(a,b)" (huge function).
To find the function which parses packets overally, search for "function jh(a,b)".
Working with WASM version of the code might improve readability and thus better understanding of what processes diep.io's client actually takes to parse packets, thus allowing for
first technique to be used. Reverse engineering the asm.js code of no-WASM version might also do it, but it would take significantly more time.
This parser might get outdated with a future diep.io update. Additionally, there is no guarance it parses everything possible, and its output to be correct all the time.
*/

"use strict";

window.alert = function() {}; // chrome

var pragmaOnce = 0;
var work = true;

var entities = window.entities = [];
var game = window.game = { fields: [],
                          stats: [{ points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }],
                          player: { ID: null } }; // if player's id is not null, it means its alive

function printf(...stuff) {
  var str = '';
  for(let i = 0; i < stuff.length; ++i) {
    str += stuff[i] + " ";
  }
  console.log("%c" + str, "background-color:black;color:white;font-size:15px;");
}

function sprintf(...stuff) {
  var str = '';
  for(let i = 0; i < stuff.length; ++i) {
    str += stuff[i] + " ";
  }
  console.log("%c" + str, "background-color:black;color:white;font-size:10px;");
}

const Parser = new Shädam();

WebSocket = class extends WebSocket {
  constructor(ip) {
    super(ip);
    this.serverID = ip.match(/:\/\/([a-z0-9]{4})\.s\.m28n\.net/);
    if(this.serverID == null) {
      return;
    }
    this.serverID = this.serverID[1];
    this.link = "diep.io/#" + this.serverID.split('').map(r => r.charCodeAt().toString(16).padStart(2, '0').split('').reverse().join('')).join('');
    printf(`connected to server id ${this.serverID}, link ${this.link}`);
    if(Object.getOwnPropertyDescriptor(this, 'onmessage')?.set != null) {
      if(pragmaOnce == 0) {
        pragmaOnce = 1;
        printf("websocket already has a hook set up by some other script, quitting packet parsing");
      }
      return;
    }
    Object.defineProperty(this, 'onmessage', {
      set: function(onmessage) {
        if(pragmaOnce == 0) {
          pragmaOnce = 1;
          console.clear();
          printf("Yo sup nipper, welcome to the packet parser. You might want to take a look at `window.game` from time to time to view what's poppin (it will be logged in the console after you successfully connect to a game), and also at `entities` which is an array of raw entities, not every spot might be taken. Read the comments throughout the code, they are useful, I promise.");
        }
        delete this.onmessage;
        this.onmessage = function({ data }) {
          Parser.set(new Uint8Array(data)); // don't bother dataview, it's too slow to set up. best to use dataview when sending messages, because you can have one global instance of dataview and you won't waste time setting it up.
          Parser.parse();
          return onmessage.call(this, { data: Parser.buffer });
        };
      },
      enumerable: true,
      configurable: true
    });
  }
}

function Shädam() {
  this.buffer = null;
  this.b = new ArrayBuffer(4);
  this.u = new Uint8Array(this.b);
  this.f = new Float32Array(this.b);
  this.at = 0;
}
Shädam.prototype.set = function(a, b) {
  this.buffer = a;
  this.at = b || 0;
};
Shädam.prototype.getU = function() {
  const one = this.buffer[this.at];
  if(one >> 7 == 1) {
    const two = this.buffer[this.at + 1];
    if(two >> 7 == 1) {
      const three = this.buffer[this.at + 2];
      if(three >> 7 == 1) {
        const four = this.buffer[this.at + 3];
        if(four >> 7 == 1) {
          this.at += 5;
          return (this.buffer[this.at - 1] * 268435456) | ((four & 127) << 21) | ((three & 127) << 14) | ((two & 127) << 7) | (one & 127);
        } else {
          this.at += 4;
          return four << 21 | ((three & 127) << 14) | ((two & 127) << 7) | (one & 127);
        }
      } else {
        this.at += 3;
        return three << 14 | ((two & 127) << 7) | (one & 127);
      }
    } else {
      this.at += 2;
      return two << 7 | (one & 127);
    }
  } else {
    this.at++;
    return one;
  }
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
      for(let i = 0; i < copyStart + copyLength - oldLength; i++) {
        output[output.length] = output[oldLength + i];
      }
    }
  }
  if(output.length == finalLength) { // should always happen
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
Shädam.prototype.setU = function(number, at) {
  while(1) {
    if(number > 0x7f) {
      this.buffer[at++] = (number & 0x7f) | 0x80;
      number >>= 7;
    } else {
      this.buffer[at++] = number;
      break;
    }
  }
};
Shädam.prototype.setI = function(number, at) {
  number <<= 1;
  if (number < 0) {
    number = ~number;
  }
  this.writeVU(number, at);
};
Shädam.prototype.setF = function(number, at) {
  this.f[0] = number;
  this.buffer[at++] = this.u[0];
  this.buffer[at++] = this.u[1];
  this.buffer[at++] = this.u[2];
  this.buffer[at++] = this.u[3];
};
Shädam.prototype.parse = function() {
  if(work == false) {
    return;
  }
  switch(this.buffer[this.at]) {
    case 0: {
      if(this.buffer.length != 1) {
        ++this.at;
        this.Upcreate();
      }
      break;
    }
    case 1: {
      printf("client outdated");
      break;
    }
    case 2: {
      this.dLZ4();
      if(this.at != 1) {
        printf("got wrongly compressed packet");
        work = false;
      }
      this.Upcreate();
      break;
    }
    case 7: {
      printf("server ready");
      break;
    }
    case 9: {
      printf("invalid party");
      break;
    }
    case 10: {
      ++this.at;
      printf("got player count: " + this.getU());
      break;
    }
  }
};
Shädam.prototype.Upcreate = function() {
  var sum = [''];
  const packetID = this.getU();
  sum[0] += "packet id " + packetID;
  const deleted = this.getU();
  if(deleted != 0) {
    sum[0] += "\n";
  }
  var a;
  for(var i = 0; i < deleted; ++i) {
    this.getU();
    a = this.getU();
    entities[a] = null;
    sum[0] += "deleted entity " + a + " | ";
    if(a == game.player.ID) {
      game.player.ID = null;
      sprintf("YO WE DIED WTF");
    }
  }
  const upcreated = this.getU();
  if(upcreated != 0) {
    sum[0] += "\n";
  }
  for(i = 0; i < upcreated; ++i) {
    this.getU();
    a = this.getU();
    if(this.getU()) {
      --this.at;
      this.Create(a, sum);
    } else {
      this.Update(a, sum);
    }
  }
  //sprintf(sum[0]);
};
Shädam.prototype.Update = function(a, b) { // I started programming from creations which are below this function. If you start reading from here, you might find the code or the comments weird.
  b[0] += "update " + a + "  ";
  var c = true;
  if(entities[a] == null) {
    entities[a] = {};
  }
  var stack = [];
  this.getFi(function(i) {
    if(c == false) {
      return;
    }
    stack[stack.length] = (i - 1);
    switch(i - 1) {
      case 0: {
        entities[a].x = this.getI();
        break;
      }
      case 1: {
        entities[a].y = this.getI();
        break;
      }
      case 2: {
        entities[a].angle = this.getI();
        break;
      }
      case 3: {
        entities[a].radius = this.getF();
        break;
      }
      case 4: { // ?
        sprintf("4 ", this.getU());
        break;
      }
      case 5: { // idk what this is, always 12 on death, always 13 on spawn
        if(this.getI() == 13) { // i guess one can use it like this
          // hellu
        } else {
          // byeee
        }
        break;
      }
      case 6: { // ?
        this.getU();
        break;
      }
      case 7: { // scoreboard color update
        --this.at;
        this.getFi(function(place) {
          game.scoreboard.entries[place - 1].color = this.getU();
        }.bind(this));
        break;
      }
      case 8: { // killer's name
        game.player.killer = this.getS();
        break;
      }
      case 9: {
        game.neededPlayers = this.getI();
        break;
      }
      case 10: {
        entities[a].sides = this.getU();
        break;
      }
      case 13: { // scoreboard tank update
        --this.at;
        this.getFi(function(place) {
          game.scoreboard.entries[place - 1].tankID = this.getU();
        }.bind(this));
        break;
      }
      case 14: {
        game.player.willRespawnAtLevel = this.getI();
        break;
      }
      case 15: { // ?
        this.getF();
        break;
      }
      case 17: { // ? 0.01 for mothership, 1 for everything else
        console.log(this.getF());
        break;
      }
      case 18: {
        game.leaderX = this.getF();
        break;
      }
      case 19: {
        entities[a].maxHp = this.getF();
        break;
      }
      case 20: { // ?
        this.getU();
        break;
      }
      case 24: { // scoreboard name update
        --this.at;
        this.getFi(function(place) {
          game.scoreboard.entries[place - 1].name = this.getS();
        }.bind(this));
        break;
      }
      case 25: {
        game.player.score = this.getF();
        break;
      }
      case 28: {
        entities[a].nameColor = this.getU(); // might be wrong
        break;
      }
      case 29: {
        //this.setF(10, this.at);
        game.player.movementSpeedFactorForMovementPrediction = this.getF();
        break;
      }
      case 30: {
        game.leaderY = this.getF();
        break;
      }
      case 31: {
        game.maxArenaX = this.getF(); // or maxArenaY, but doesn't matter
        break;
      }
      case 33: {
        game.player.level = this.getI();
        break;
      }
      case 35: { // FOV factor
        // modify by commenting out below line, and adding "this.setF(this.getF() * howMuchFovUWant, this.at - 4);", where howMuchFovUWant must be a number below 1.
        game.player.fov = this.getF();
        break;
      }
      case 36: { // stat maxPoints update
        --this.at;
        this.getFi(function(stat) {
          game.stats[stat - 1].maxPoints = this.getI();
        }.bind(this));
        break;
      }
      case 37: {
        game.minArenaX = this.getF(); // or minArenaY, but doesn't matter
        break;
      }
      case 38: { // scoreboard score update
        --this.at;
        this.getFi(function(place) {
          game.scoreboard.entries[place - 1].score = this.getI();
        }.bind(this));
        break;
      }
      case 39: { // stat update
        --this.at;
        this.getFi(function(stat) {
          game.stats[stat - 1].points = this.getI();
        }.bind(this));
        break;
      }
      case 41: {
        game.player.tankID = this.getI();
        break;
      }
      case 43: { // remove this update to make your time alive go constantly up on your deathscreen, or fake this value (remember not to change the length of the vu)
        game.player.deathTimestamp = this.getU();
        break;
      }
      case 44: {
        entities[a].height = this.getF();
        break;
      }
      case 45: {
        game.player.availStatPoints = this.getI();
        break;
      }
      case 46: { // cannon reset? idek
        this.getU();
        break;
      }
      case 47: { // so useless lol, idk what it does, tried finding out
        this.getF();
        break;
      }
      case 50: {
        entities[a].hp = this.getF();
        break;
      }
      case 51: { // player y (prob on minimap)
        game.player.y = this.getF();
        break;
      }
      case 52: {
        entities[a].opacity = this.getF();
        break;
      }
      case 53: {
        this.setF(this.getF() * 40, this.at - 4);
        break;
      }
      case 54: { // stats' names update
        --this.at;
        this.getFi(function(stat) {
          game.stats[stat - 1].name = this.getS();
        }.bind(this));
        break;
      }
      case 55: { // player x (prob on minimap)
        game.player.x = this.getF();
        break;
      }
      case 59: {
        entities[a].timestamp = this.getU();
        break;
      }
      case 60: { // ?
        this.getU();
        break;
      }
      case 61: {
        game.maxArenaY = this.getF(); // or maxArenaX, but doesn't matter
        break;
      }
      case 63: { // ?
        this.getI();
        break;
      }
      case 64: {
        game.scoreboard.entriesCount = this.getU();
        break;
      }
      case 65: { // weird counter of packets passed, but its always a few packets off
        this.getF();
        break;
      }
      case 66: {
        game.minArenaY = this.getF(); // or minArenaX, but doesn't matter
        break;
      }
      case 67: {
        entities[a].score = this.getF();
        break;
      }
      default: {
        sprintf("unknown update field " + (i - 1), "\n" + stack.join(" | ") + "\n" + b + "\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), this.at + 30)).map(r => r.toString(16).padStart(2, '0')).join(' '));
        c = false;
        break;
      }
    }
  }.bind(this));
  b[0] += stack.join(" ") + " | ";
  if(c == false) {
    throw new Error();
  }
};
Shädam.prototype.Create = function(a, b) {
  const fields = this.getFi(function() {});
  b[0] += "create " + a + "  " + fields.join(" ") + " | ";

  if(fields.length == 2 && fields[0] == 8 && fields[1] == 15) { // scoreboard
    this.getU();
    game.scoreboard = { entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}] };
    for(var i = 0; i < 10; ++i) {
      switch(this.getU()) { // numbers from color table + 1
        case 0: {
          game.scoreboard.entries[i].color = "";
          break;
        }
        case 3: {
          game.scoreboard.entries[i].color = "blue";
          break;
        }
        case 4: {
          game.scoreboard.entries[i].color = "red";
          break;
        }
        case 5: {
          game.scoreboard.entries[i].color = "purple";
          break;
        }
        case 6: {
          game.scoreboard.entries[i].color = "green";
          break;
        }
        case 13: {
          game.scoreboard.entries[i].color = "";
          break;
        }
      }
    }
    this.getU();
    this.getU();
    for(i = 0; i < 10; ++i) {
      game.scoreboard.entries[i].tankID = this.getI(); // if -1, means no tank
    }
    game.leaderX = this.getF();
    for(i = 0; i < 10; ++i) {
      game.scoreboard.entries[i].name = this.getS();
    }
    this.getF();
    for(i = 0; i < 10; ++i) {
      game.scoreboard.entries[i].postfix = this.getS();
    }
    game.leaderY = this.getF();
    game.maxArenaY = this.getF();
    this.getU();
    game.minArenaX = this.getF();
    for(i = 0; i < 10; ++i) {
      game.scoreboard.entries[i].score = this.getF();
    }
    this.getF();
    game.maxArenaX = this.getF();
    game.scoreboard.entriesCount = this.getU();
    this.getF();
    game.minArenaY = this.getF();
    entities[a] = game.scoreboard;
    console.log(game);
    return;
  }

  if(fields.length == 4 && fields[0] == 1 && fields[1] == 4 && fields[2] == 11 && fields[3] == 12) { // either wall (in maze or barrel) or base (tdm/dom)
    //sprintf("wall\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 100, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
    const field = { x: this.getI(), y: this.getI(), angle: this.getI(), width: this.getF(), color: this.getU(), sides: this.getU() };
    this.getF();
    this.getU();
    this.getU();// skipping useless or unknown stuff, scroll down to player creation to find out how to discover stuff for urself
    this.getU();
    this.getU();
    this.getU();
    field.height = this.getF(); // not used if sides != 2 (rectangle)
    if(this.getU() != 0) { // trivial parent id
      field.parentID = this.getU();
    }
    field.opacity = this.getF();
    if(this.getU() != 0) {
      this.getU();
    }
    field.timestamp = this.getU();
    this.getF();
    this.getU();
    entities[a] = field;
    if(field.parentID == 0) {
      game.fields[game.fields.length] = field;
    } // else it's a barrel so don't add it (yes barrelz sometime do be wallz)
    return;
  }

  if(fields.length == 3 && fields[0] == 4 && fields[1] == 11 && fields[2] == 12) { // base of dominators
    const field = { x: this.getI(), y: this.getI(), angle: this.getI(), width: this.getF(), color: this.getU(), sides: this.getU() };
    field.height = field.width;
    this.getF();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getF(); // 0.1
    field.timestamp = this.getU();
    this.getF();
    this.getU();
    entities[a] = field;
    game.fields[game.fields.length] = field;
    return;
  }

  if(fields.length == 1 && fields[0] == 15) { // ?
    this.at += 10;
    entities[a] = {};
    return;
  }

  if(fields.length == 1 && fields[0] == 10) { // idfk don't ask me
    this.at += 61;
    this.getU();
    ++this.at;
    entities[a] = {};
    return;
  }

  if(fields.length == 6 && fields[0] == 1 && fields[1] == 4 && fields[2] == 5 && fields[3] == 9 && fields[4] == 11 && fields[5] == 12) {
    //sprintf("shape\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 100, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
    const shape = { x: this.getI(), y: this.getI(), angle: this.getI(), radius: this.getF(), color: this.getU(), sides: this.getU() };
    // either do a switch case for name of the shape to deduce what it is, or use the number of sides + color, which would certainly be faster
    this.getU();
    this.getF();
    shape.width = this.getF();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getF();
    shape.name = this.getS();
    this.getU(); // trivial parent id
    shape.parentID = this.getU();
    shape.height = this.getF();
    shape.opacity = this.getF();
    this.getU();
    shape.timestamp = this.getU();
    this.getF();
    this.getU();
    entities[a] = shape;
    //console.log(shape);
    // not adding to any array called "shapes" because it would take too long to remove from the array when the shape gets deleted.
    // mapping its id to its array position would be better but that's up to you to implement
    return;
  }

  if(fields.length == 5 && fields[0] == 1 && fields[1] == 4 && fields[2] == 5 && fields[3] == 11 && fields[4] == 12) { // bullet / drone / trap
    //sprintf("bullet\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 100, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
    const ent = { x: this.getI(), y: this.getI(), angle: this.getI(), radius: this.getF(), color: this.getU(), sides: this.getU() }; // 1 = circle
    this.getU();
    this.getF();
    ent.penetration = this.getF();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getF();
    this.getU(); // trivial parent id
    ent.parentID = this.getU();
    this.getF();
    ent.opacity = this.getF();
    this.getU();
    ent.timestamp = this.getU();
    this.getF();
    this.getU();
    entities[a] = ent;
    //console.log(ent);
    return;
  }

  if(fields.length == 7 && fields[0] == 1 && fields[1] == 4 && fields[2] == 5 && fields[3] == 9 && fields[4] == 11 && fields[5] == 12 && fields[6] == 14) { // player
    //sprintf("player\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 100, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
    const player = { x: this.getI(), y: this.getI(), angle: this.getI(), radius: this.getF(), color: this.getU(), sides: this.getU() };
    this.getU();
    this.getF();
    this.getF();
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.getU(); // some id idc about
    this.getU();
    this.getF();
    player.name = this.getS();
    this.getU();
    this.getU(); // another id idc about
    this.getF();
    player.opacity = this.getF();
    this.getU();
    player.timestamp = this.getU();
    this.getF();
    this.getU();
    player.score = this.getF();
    entities[a] = player;
    //console.log(player);
    return;
  }

  if(fields.length == 5 && fields[0] == 1 && fields[1] == 3 && fields[2] == 4 && fields[3] == 11 && fields[4] == 12) { // barrel
    //sprintf("barrel\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 100, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
    const barrel = { x: this.getI(), y: this.getI(), angle: this.getI(), width: this.getF(), color: this.getU(), sides: this.getU() };
    this.getF();
    this.getU();
    // this.setF(0 or 1, this.at); // look text 17 lines below
    barrel.verticalMovement = this.getF(); // 0 is horizontal, 1 is vertical (0 makes the barrel go inside ur tank, 1 it goes to the side)
    this.getU();
    this.getU();
    this.getU();
    this.getU();
    barrel.height = this.getF();
    this.getU();
    this.getU();
    this.getU();
    barrel.opacity = this.getF();
    this.getF();
    this.getU();
    barrel.parentID = this.getU();
    barrel.timestamp = this.getU();
    // this.setF(1, this.at); // changes barrels to machine gun's (trapezoidal). if 0, it does not apply angle to the sides of the rectangle
    // want to figure out more than what this parser originally provides? use the built in functions this.setU, this.setI and this.setF to modify data.
    // Do not use floats in place of varuints or vice versa! ALWAYS put the same length of varuints if you want to replace them.
    // Incorrect changing length of the packet will most probably result in game crash.
    // Always put the functions before the value you want to overwrite. As second argument to the function, always provide "this.at".
    this.getF();
    this.getU();
    entities[a] = barrel;
    //console.log(barrel);
    return;
  }

  if(fields.length == 2 && fields[0] == 1 && fields[1] == 10) { // ui, this contains basic stuff like fov and probably level u will spawn at. discover them on your own, not hard. not needed so im not including.
    //sprintf(Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 200, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
    this.getU(); // trivial player ID
    game.player.ID = this.getU(); // player ID (we will be created later in the packet, this only informs the client who we gonna be)
    this.getU();
    this.getU();
    this.getF();
    const timestamp = this.getU();
    this.getF();
    this.getF();
    if(this.getU() != 0) {
      this.getU();
    }
    this.getU();
    this.getF();
    for(var i = 0; i < 8; ++i) {
      game.stats[i].maxPoints = this.getI();
      game.stats[i].points = 0;
    }
    this.at += 13; // useless stuff i guess. no time to waste to check whether it actually does something by setting the bytes to something else
    this.getF();
    if(this.getU() != 0) {
      this.getU();
    }
    this.getF();
    for(i = 0; i < 8; ++i) {
      game.stats[i].name = this.getS();
    }
    this.getF();
    this.getU();
    this.getU();
    //console.log("the following should be 2 (if not, scream): " + this.getU());
    entities[a] = {};
    return;
  }

  if(fields.length == 3 && fields[0] == 1 && fields[1] == 3 && fields[2] == 11) { // base's center, idk whats the use of this lol, center of orbit of base drones?
    const e = { x: this.getI(), y: this.getI(), angle: this.getI() };
    this.at += 6;
    this.getU();
    e.color = this.getU();
    this.getU();
    this.getU();
    this.getU();
    this.at += 5;
    entities[a] = e;
    return;
  }

  //sprintf("unknown creation field ", fields.join(' '), "\n" + b + "\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 400, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
  //throw new Error();
};
