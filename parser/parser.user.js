// ==UserScript==
// @name         Diep.io Packet Parser
// @version      1.0
// @description  Packet parser parses packets.
// @author       Shädam
// @match        *://diep.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

"use strict";

/*

latest update 25.09.2020

asm.js removed, no ez way to do stuff anymore. i predicted this
happening actually, wondered how it would look like.
i started messing around, simple hook for window.alert reveals
the exact wasm position of the caller. then i read some stuff
about wasm, got to know what code return statement has, stuck
it right before the alert being called, though as soon to be
discovered by me, it was a bad idea, a terrible one, because
then nothing would be rendered at all besides loading screen,
most likely because after the series of if statements and blocks
in middle of which the alert call was, all the drawing functions
were being called (or one which then drew everything). naturally,
my next idea was to make it so that i literally remove all the
code i dont want diep.io to execute, passing all the wasm data
to the instantiating function, without the code i dont like,
including the alert caller. that sadly didn't work after multiple
attempts, throwing an error. then i realised i don't want to
waste more of my time and i stopped working on it. won't fix.

partially this might be due to the fact i am not experienced with
wasm, not yet at least. diep.io#7444 knows more about wasm than i
do, that's for sure, so go ask him for help.

foreign functions can be imported into wasm by inporting them at
the beginning, just as diep.io imports a few functions, such as
a function to invoke its javascript functions which cant be done
in wasm. then one can invoke these functions in other functions
like in idk, message parsing function, by adding code inside
of the functions, shouldn't be too hard with some knowledge.

code which no one cares about like extension check can be disabled
by removing the code, i dont know why it didnt work for me though.
maybe u will have more luck.

best way of dealing with the update would most probably be to
make a wasm editing tool which lets one edit wasm's code in
form of text (like in chrome's developer tools) and then allow
easily swapping the new code back to binary form. then, make a
userscript which overrides the whole document with the modified
document, with code which would, instead of using game's build
file as wasm's input, use the modified binary. this is not a
hard task as i have done it myself. beware certain strings
though, as document.write freaks out when it sees a regexp
or "\n" (at least in chrome).

eventually i had this idea of converting wasm to js and then
trying to do something with it further, but that's a solution
for someone like me who doesn't know wasm very well. i am
certain that working more with wasm would benefit in such an
ease in haxxoring the game's code as asm.js. in the end, there
are amasing chrome tools which provide more than enough help
with wasm.

summarizing, i will not continue working on the game's code,
because of not enough time on daily basis to make learning wasm
effective, which also implies that further working on the wasm
version of diep.io (or florrio) would not give me any enjoyment.
i have other goals set as of now, neither of which include
studying wasm.

--------------------------------------------------------------

(update before)

look zeach, you are no match for me.
even tho u added tons of new calculations and some advanced
encoding stuff, i ez haxxor ur lil game below.
maybe it now requires an extension disabler, maybe now it
looks 10 times uglier than before, but it works.

nothing changed since the last update of the parser -
update fields and scoreboard creation are not fixed yet. but,
at least, the packets are propertly decoded.

to anyone whose' bots broke, instead of using the full parser,
copy everything besides that WebSocket hook, extension disabler
at the end of this parser, and Upcreate(), Update() and Create()
functions. also delete that switch case in Parse() function.
below decodePacket() function, you can deal with the raw, decoded
packet, and do whatever u were doing with it before the updates.

yes, it is ugly, u can try to make it prettier if u really want,
but i see no point. every update will result in such ugly code.
this is pure calculations, nothing to be done about it.

changing the packet haldway through does not work anymore.
one can make it work though, if they really want, though it's
not really necessary to get update fields anyway.
well, 2 ways:
either pass the raw (decoded) packet to a special function
of diep.io's client which will parse it,
or
encode the raw packet again using decodePacket (xor operation
is reversible, thus can both decode and encode with one func)
then change the first byte (op code) to the encoded op code
the packet had before (gotta store that bad boy somewhere),
and then just do WebSocket.onmessage({ data: myPacket })
*/

window.alert = function() {};

var pragmaOnce = 0;
var work = true;

var entities = window.entities = [];
var game = window.game = { fields: [],
                          stats: [{ points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }, { points: 0 }],
                          player: { ID: null } }; // if player's id is not null, it means its alive

const JUMP_TABLE = '0 1 27 6 34 109 42 68 125 15 26 35 117 77 84 79 78 82 50 127 19 63 16 33 69 107 94 56 116 115 49 113 121 25 76 67 89 57 87 65 124 40 88 53 60 85 111 74 80 101 96 105 72 93 51 83 91 114 64 7 120 102 75 110 108 62 2 106 66 123 39 12 28 17 70 20 47 55 43 45 38 81 3 13 21 112 104 46 61 48 71 90 44 100 4 118 37 22 54 29 119 99 11 59 58 52 97 122 9 32 103 126 5 98 10 30 36 31 86 41 92 73 14 23 24 18 95 8 1 1 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0'.split(' ').map(r => +r);
var MAGIC_NUMBER = 930338800;
var TIMES = 0;
var aa = 0;
var $ = 0;
var _ = 760463859;
const DECODE_TABLE = new Array(27);

function viiiiiiiiii(a, b, c, d) {
  var e = 0;
  var f = 0;
  var g = 0;
  var h = 0;
  var i = 0;
  var j = 0;
  e = c >>> 16;
  f = a >>> 16;
  j = Math.imul(e, f);
  g = c & 65535;
  h = a & 65535;
  i = Math.imul(g, h);
  f = (i >>> 16) + Math.imul(f, g);
  e = (f & 65535) + Math.imul(e, h);
  a = (Math.imul(b, c) + j) + Math.imul(a, d) + (f >>> 16) + (e >>> 16);
  b = i & 65535 | e << 16;
  aa = a;
  return b;
}

function viiiiiiiii(a) {
  if(a) {
    return 31 - Math.clz32(a + -1 ^ a);
  }
  return 32;
}

function viiiiiiii(a, b, c, d) {
  var e = 0;
  var f = 0;
  var g = 0;
  var h = 0;
  var i = 0;
  var j = 0;
  var k = 0;
  var l = 0;
  var m = 0;
  var n = 0;
  var o = 0;
  a: {
    b: {
      c: {
        d: {
          e: {
            f: {
              g: {
                h: {
                  i: {
                    j: {
                      g = b;
                      if(g) {
                        e = c;
                        if(!e) {
                          break j;
                        }
                        f = d;
                        if(!f) {
                          break i;
                        }
                        f = Math.clz32(f) - Math.clz32(g) | 0;
                        if(f >>> 0 <= 31) {
                          break h;
                        }
                        break b;
                      }
                      if((d | 0) == 1 & c >>> 0 >= 0 | d >>> 0 > 1) {
                        break b;
                      }
                      b = (a >>> 0) / (c >>> 0) | 0;
                      _ = a - Math.imul(b, c) | 0;
                      $ = 0;
                      aa = 0;
                      return b;
                    }
                    e = d;
                    if(!a) {
                      break g;
                    }
                    if(!e) {
                      break f;
                    }
                    f = e + -1 | 0;
                    if(f & e) {
                      break f;
                    }
                    _ = a;
                    $ = f & g;
                    a = g >>> (viiiiiiiii(e) & 31) | 0;
                    aa = 0;
                    return a;
                  }
                  f = e + -1 | 0;
                  if(!(f & e)) {
                    break e;
                  }
                  j = (Math.clz32(e) + 33 | 0) - Math.clz32(g) | 0;
                  h = 0 - j | 0;
                  break c;
                }
                j = f + 1 | 0;
                h = 63 - f | 0;
                break c;
              }
              _ = 0;
              a = (g >>> 0) / (e >>> 0) | 0;
              $ = g - Math.imul(a, e) | 0;
              aa = 0;
              return a;
            }
            f = Math.clz32(e) - Math.clz32(g) | 0;
            if(f >>> 0 < 31) {
              break d;
            }
            break b;
          }
          _ = a & f;
          $ = 0;
          if((e | 0) == 1) {
            break a;
          }
          c = a;
          a = viiiiiiiii(e);
          d = a & 31;
          if(32 <= (a & 63) >>> 0) {
            f = 0;
            a = b >>> d | 0;
          } else {
            f = b >>> d | 0;
            a = ((1 << d) - 1 & b) << 32 - d | c >>> d;
          }
          aa = f;
          return a;
        }
        j = f + 1 | 0;
        h = 63 - f | 0;
      }
      e = b;
      g = a;
      f = j & 63;
      i = f & 31;
      if(32 <= (f & 63) >>> 0) {
        f = 0;
        l = e >>> i | 0;
      } else {
        f = e >>> i | 0;
        l = ((1 << i) - 1 & e) << 32 - i | g >>> i;
      }
      a = h & 63;
      h = a & 31;
      if(32 <= (a & 63) >>> 0) {
        e = g << h;
        a = 0;
      } else {
        e = (1 << h) - 1 & g >>> 32 - h | b << h;
        a = g << h;
      }
      b = e;
      if(j) {
        g = d + -1 | 0;
        e = c + -1 | 0;
        if((e | 0) != -1) {
          g = g + 1 | 0;
        }
        h = e;
        while(1) {
          e = l;
          f = f << 1 | e >>> 31;
          e = e << 1;
          k = f;
          f = b >>> 31 | e;
          m = k;
          e = k;
          k = f;
          i = g - ((h >>> 0 < f >>> 0) + e | 0) | 0;
          e = i >> 31;
          i = i >> 31;
          f = c & i;
          l = k - f | 0;
          f = m - ((d & e) + (k >>> 0 < f >>> 0) | 0) | 0;
          e = b << 1 | a >>> 31;
          a = n | a << 1;
          b = e | o;
          e = 0;
          m = e;
          k = i & 1;
          n = k;
          j = j + -1 | 0;
          if(j) {
            continue;
          }
          break;
        }
      }
      _ = l;
      $ = f;
      e = b << 1 | a >>> 31;
      a = k | a << 1;
      aa = e | m;
      return a;
    }
    _ = a;
    $ = b;
    a = 0;
    b = 0;
  }
  aa = b;
  return a;
}
function viiiiiii(a, b) {
  viiiiiiii(a, b, 2147483647, 0);
  aa = $;
  return _;
}

function GET_NEXT_MAGIC_NUMBER() {
  var a = viiiiiii(viiiiiiiiii(MAGIC_NUMBER, 0, 48271, 0), aa);
  TIMES = (a & 15) + 1;
  for(let i = 0; i < 27; i++) {
    a = viiiiiii(viiiiiiiiii(a, aa, 48271, 0), aa);
    DECODE_TABLE[i] = a;
  }
  MAGIC_NUMBER = a;
}

function RESOLVE_JUMP(id) {
  GET_NEXT_MAGIC_NUMBER();
  var b = id;
  while(TIMES--) {
    b = JUMP_TABLE[b];
  }
  return b;
}

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
    MAGIC_NUMBER = 930338800;
    TIMES = 0;
    aa = 0;
    $ = 0;
    _ = 760463859;
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
    this.canParse = false;
    Object.defineProperty(this, 'onmessage', {
      set: function(onmessage) {
        if(pragmaOnce == 0) {
          pragmaOnce = 1;
          console.clear();
          printf("Yo sup nipper, welcome to the packet parser. You might want to take a look at `window.game` from time to time to view what's poppin (it will be logged in the console after you successfully connect to a game), and also at `entities` which is an array of raw entities, not every spot might be taken. Read the comments throughout the code, they are useful, I promise.");
        }
        delete this.onmessage;
        this.onmessage = function({ data }) {
          var g = new Uint8Array([...new Uint8Array(data)]);
          if(g[0] != 0 || g.length > 1) {
            this.canParse = true;
          }
          sprintf("new packet\n" + Array.from(g).map(r => r.toString(16).padStart(2, '0')).join(' '));
          if(this.canParse == true) {
            Parser.set(g); // don't bother dataview, it's too slow to set up. best to use dataview when sending messages, because you can have one global instance of dataview and you won't waste time setting it up.
            Parser.parse();
          }
          return onmessage.call(this, { data });
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
Shädam.prototype.decodePacket = function() {
  if(this.buffer.length < 2) {
    return;
  }
  while(1) {
    this.buffer[this.at] ^= DECODE_TABLE[this.at % 27];
    if(++this.at != this.buffer.length) {
      continue;
    }
    break;
  }
  this.at = 1;
};
Shädam.prototype.parse = function() {
  if(work == false) {
    return;
  }
  sprintf(this.buffer[this.at]);
  const op = RESOLVE_JUMP(this.buffer[this.at++]);
  sprintf("correct op is " + op);
  this.decodePacket();
  sprintf("DECODED:\n" + Array.from(this.buffer).map(r => r.toString(16).padStart(2, '0')).join(' '));
  switch(op) {
    case 0: {
      this.Upcreate();
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
      //sprintf("YO WE DIED WTF");
    }
  }
  const upcreated = this.getU();
  if(upcreated != 0) {
    sum[0] += "\n";
  }
  return;
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
      /*case 0: {
        entities[a].y = this.getI();
        break;
      }
      case 1: {
        entities[a].x = this.getI();
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
      }*/
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

  /*if(fields.length == 2 && fields[0] == 8 && fields[1] == 15) { // scoreboard
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
  }*/

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
    //sprintf("1 10\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 100, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
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
    this.at += 12; // useless stuff i guess. no time to waste to check whether it actually does something by setting the bytes to something else
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
    /*console.log("the following should be 2 (if not, scream): " + this.getU());*/this.getU();
    entities[a] = {};
    return;
  }

  if(fields.length == 3 && fields[0] == 1 && fields[1] == 3 && fields[2] == 11) { // base's center, idk whats the use of this lol, center of orbit of base drones?
    //sprintf("1 3 11\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 30, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
    const e = { x: this.getI(), y: this.getI() };
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

  sprintf("unknown creation field ", fields.join(' '), "\n" + b + "\n", Array.from(this.buffer.subarray(Math.max(this.at, 0), Math.min(this.at + 400, this.buffer.length))).map(r => r.toString(16).padStart(2, '0')).join(' '));
  throw new Error();
};

function injection(s) {
  console.log('Running for real now...');
  delete window.input;
  Object.defineProperty(window, 'input', {
    set: function(a) {
      delete window.input;
      window.input = a;
    },
    configurable: true,
    enumerable: true
  });
  return s.replace(/if\(b\&255\)/g, 'if(false)');
}
document.open();
document.write(`
<!DOCTYPE html>
<html>
<head>
<base href="//static.diep.io/">
<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAACxMAAAsTAQCanBgAAAJ5UExURUxpcVhVVFRSUYyMjFRUVFhYWFhVVFhYWFRaXFVSUVdUU2dnZ1hYWFVRT21tbVdUU19fX1VXWGhoaFFgZFpaWlhVVGRkZFhYWF9fX2lpaWxsbGBfX1BiZ15cXFdXV1dVVWBgYFpaWlBlbGRjY2dnZ1VVVVdXV1hYWF1cXF1cW1JeY2VlZV1dXV1dXVpWVWJiYltbW15eXlNYWmhoaKWnqF1cW1VXWFVXV2JiYVRYWl5cXFZUVIaHh1ZWVlhWVlpXVltXVldWVVpYWFhYV1dXV1dWVlZXV2hnZ1hWVWdnZ1VXV2FgYIGBgWJhYVFiaFNfYl9eXVdWVl9dXGVkZF9dXVtYV19dXFRbXVpXVldWVmFhYWdnZ2lqaltYV1FiZ19fXlhXV15eXltbW1pXV2FhYWNjY1hXVlJeYV5eXldVVVxYV2VlZVxbW1dXV1pXVlpaWlhVU2BgYFpaWlVXWFdXV1VTUlVVVW1tbWhoaFtbW15bWlhYWHFzc2NjY1VVVT+03z+14Zqamj+14Jubm5mZmT+24T+z3kiDl0t4h5eXl21tbWtra0GlyT+04E9pc4qKikGjxj+w2UCt1T+y3EKdvkiEmXh4eGFhYUWUsJGRkUGpz0Gny2hoaHd3d0t7jJCQkECq0USauUSWtEiClkObu0SXtUCt1ECu1k5tej+v2IWFhUGmykp9j0SWs05sd09ock9qdUCpz1ZeYEeGm0t6i2ZlZUSXtEKevk5ve01ve2lpaUeIn01ue0WOqZaWlm5ublBlbEGnzVBkaoODg3NxcUaNplpYV09nb1RdYEh8jk1xfm9tbUOYtlFgZYmJiU1yf5iYmIKCgoaGhqP2+3cAAAB/dFJOUwCdqgECAmXv7KqkEtpCHkL+3yH3c0AdlYAGDR33L9UfF1X+Dhu9078nJvYOc/53D/c/4REBHuDfCOY3sQG7xXCDxErUpc3dGqIF4RkCM/34RMp7JENYTPKFyAwGCJ/+KM0tP70aMMH4VauXFi2wkEqXBvTjuPKnDgr4e0ECBaVZu9wrAAABa0lEQVQ4y2NgGDJAQR+/vIq6qqI2PgU6ut0GthnlIKaNlLS8qbEPqryY2tyW/v2VJfkVNTkOdoJGZq5ZITHICkQE5jc3t5zrKsrNK+5rn7Fw7e4d4bHBCHkhuWmNQNDccvjY2aOTmlobWhsmblsfmQhXIDF9ZjNIxYUjh6Y0NdWDQcPBnWkpUHk+nq5OkILmiyfONNTDQEPPgQgTiAJucfY5q4BK9m092VaPAA17zTWhRkgaurDvutTSv2lKA5KCpgVKbHBXRCfVsXefPj6pF0lBfVsHI5JPC6vLSk9NRpavb2jnZEUOjNqC82gKpjKxoIRn1YaVKArq53ExoygI85+A7Mje5X16qDHi7ry5CdmGpRxWaHEaFIdkRNOyFR6eaAqyk/dshKlomLjGzRcjWaQmrNve1trU1NTQtLrDywlLwonPTN+yqGfW7CWL/QIDsCatqFBrSy0ZYQ5He29cqc9CQ5SXX1aZYWgBACuktLIZoXRVAAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC" sizes="32x32">
<link rel="icon" type="image/png" href="data:image/png;base64,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" sizes="96x96">
<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAEjUExURUxpcV1NRkqCloA9JV9TT0x8jFxTUGlAM1ZOSlNkakiIn1VgZFBteGBUT2gzHlJob2BRS1VdX103KEaRrFpNSVRfY0aTr2U2I2FEOU9uekx4h0WVslBrdk9xfU91gldXV2RLQUx9j35TQ1tKQkuAklpbW2BLQ1BxfU17i2tENmRRSkiJoFJnb1xWVEaQrFpWVVJSUl1dXVhYWFxcXFhYWFdWVmNjY1FRUV5eXlVVVWNjY3R0dFFRUV9fX3x8fHt5eVB0gV1dXWdmZm9vb2JiYlpaWj+03z+14T+24T+14D+04D+y3ECr0kCt1ESauUCx2kCu10GozT+z3kGq0D614EKixUCnzE2HnJCQkJiXloSEhJycnIyMjIKCgpeXl2V6gZubm7e4KPAAAABGdFJOUwAd5wEX3BwDL4/ud7UTBqMPZw37J3T9CAq0yP61ustCEOYBH+FKGMTZBBLznDz+YAsDDRcekrkMBTKY5x6K9v78eLLXvlFXocKGAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAlklEQVQY02NgIAIYmaPyDW3NXA0YNNWUFZghApbWEXZO+joaKnLcvCC+hVVMdEKsQ6h3UIAYvwBQwNglKi4yPszDzc3LXVgQpMTE0dk+PMQNCDx9JPnAptiY6nmABNz8pYQg5upqu4P4Xr6y4hABLfVgkIiHtCjMLaqKgW6e3n4yLDABJXkeJi5WTjYk90qIcDCyMxAFAEylGRnf5AqTAAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC" sizes="16x16">
<link rel="mask-icon" href="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMjYwLjAwMDAwMHB0IiBoZWlnaHQ9IjI2MC4wMDAwMDBwdCIgdmlld0JveD0iMCAwIDI2MC4wMDAwMDAgMjYwLjAwMDAwMCIKIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgo8bWV0YWRhdGE+CkNyZWF0ZWQgYnkgcG90cmFjZSAxLjExLCB3cml0dGVuIGJ5IFBldGVyIFNlbGluZ2VyIDIwMDEtMjAxMwo8L21ldGFkYXRhPgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCwyNjAuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNNDMzIDIwOTggYy0yNCAtMjggLTI4MyAtNTMyIC0yODMgLTU1MiAwIC0yNSA1NSAtNTggMjcwIC0xNjYgMTEzCi01NyAyMzcgLTExOSAyNzUgLTEzOSBsNzAgLTM2IDcgLTc1IGMyNCAtMjg0IDIxMiAtNTE5IDQ5OCAtNjI1IDY1IC0yNSA5MwotMjkgMjE2IC0zMyAxNjYgLTUgMjQ1IDEyIDM3OCA4MCAxMTYgNjAgMjQ4IDE5MiAzMDUgMzA1IDYzIDEyNiA4MSAyMDUgODEKMzU0IDAgMTM2IC0xNSAyMDcgLTY2IDMxOCAtNjggMTQ3IC0xOTEgMjczIC0zMzcgMzQ1IC0xMTkgNTkgLTE5NCA3NiAtMzM3IDc2Ci0xNDMgMCAtMjA0IC0xNSAtMzM2IC04MCBsLTEwMSAtNTEgLTI5NSAxNTEgYy0xNjIgODIgLTMwMiAxNTAgLTMxMCAxNTAgLTggMAotMjQgLTEwIC0zNSAtMjJ6Ii8+CjwvZz4KPC9zdmc+Cg==" color="#5bbad5">
<title>diep.io</title>
<meta name="description" content="Survive and shoot at others while trying to keep your own tank alive!">
<style>
body {
background-color: #000000;
}
html, body, #canvas {
border: 0;
margin: 0;
padding: 0;
overflow: hidden;
}
#loading {
color: #FFFFFF;
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
font-size: 48pt;
font-family: sans-serif;
font-weight: bold;
cursor: default;
}
#canvas {
position: absolute;
top: 0;
left: 0;
right: 0;
bottom: 0;
width: 100%;
height: 100%;
cursor: default;
mix-blend-mode: screen;
}
#textInputContainer {
display: none;
position: absolute;
}
#textInput {
background-color: transparent;
font-family: 'Ubuntu';
padding: 0;
border: 0;
outline: none;
}
#a {
position: absolute;
bottom: 0px;
left: 50%;
pointer-events: none;
}
.aa {
background-color: transparent;
margin: 24px auto;
border-radius: 5px;
overflow: hidden;
}
.aa-tall {
width: 300px;
height: 250px;
}
.aa-wide {
width: 728px;
height: 90px;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjvWyNL4U.woff2) format('woff2');
unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjtGyNL4U.woff2) format('woff2');
unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjvGyNL4U.woff2) format('woff2');
unicode-range: U+1F00-1FFF;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjs2yNL4U.woff2) format('woff2');
unicode-range: U+0370-03FF;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjvmyNL4U.woff2) format('woff2');
unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjsGyN.woff2) format('woff2');
unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
</style>
</head>
<body>
<span id="loading">Loading...</span>
<canvas id="canvas"></canvas>
<div id="a">
<div style="position: relative; left: -50%; pointer-events: auto;">
<div id="a1" class="aa"><div id="ac1"></div></div>
<div id="a2" class="aa" style="display:none"><div id="ac2"></div></div>
<div id="a3" class="aa" style="display:none"><div id="ac3"></div></div>
</div>
</div>
<div id="empty-container"></div>
<div style="position: absolute; width: 640px; height: 360px; top: 50%; left: 50%; margin-left: -320px; margin-top: -180px; display: none;">
<div id="player" style="width: 100%; height: 100%;"></div>
</div>
<div style="font-family:'Ubuntu'">&nbsp;</div>
<div id="textInputContainer"><input id="textInput" /></div>
<script>
m28n=function(n){var e="https://api.n.m28.io",r="http:"!=n.location.protocol;function t(n,r,t){"function"==typeof r?(t=r,r={}):r=r||{};var o=r.version;i(e+"/endpoint/"+n+"/findEach/"+(o?"?version="+o:""),t)}function o(n,e,o){"function"==typeof e&&(o=e,e={}),(e=e||{}).points=5,e.timeout=5e3,t("latency",null,function(t,i){if(t)return o(t);var s,u={},f=[];for(var a in i.servers)!function(t){if(-1!=n.indexOf(t)){var o=i.servers[t],s=r?o.id+".s.m28n.net":o.ipv4||"["+o.ipv6+"]",a=new WebSocket((r?"wss:":"ws:")+"//"+s);f.push(a),a.binaryType="arraybuffer",a.onopen=function(){var n=new Uint8Array(1);n[0]=0,a.send(n.buffer)},a.onmessage=function(n){if(0==new Uint8Array(n.data)[0]){if(u[t]=(u[t]||0)+1,u[t]>=e.points)return l();a.send(n.data)}},a.onerror=function(n){console.warn(n)},a.onclose=function(){var n=f.indexOf(a);-1!=n&&(f.splice(n,1),0==f.length&&l())}}}(a);if(0==f.length)return o("No latency servers in selected regions");var l=function(){l=function(){},clearTimeout(s);for(var n=0;n<f.length;++n)try{var e=f[n];e.onopen=null,e.onmessage=null,e.onerror=null,e.onclose=null,e.close()}catch(n){}var r=[];for(var t in u)r.push({region:t,points:u[t]});r.sort(function(n,e){return e.points-n.points});var i=r.map(function(n){return n.region});if(0==i.length)return o("Latency testing failed, no servers replied to probes in time");o(null,i)};s=setTimeout(l,e.timeout)})}function i(n,e){s(n,"GET",null,e)}function s(n,e,r,t){var o=new XMLHttpRequest;o.open(e,n,!0),o.onerror=function(n){t&&t(n),t=null},o.onreadystatechange=function(){if(4==o.readyState){var n;try{n=JSON.parse(o.responseText)}catch(n){return t&&t('Failed to parse body. Error: "'+(n.message||n).toString()+'". Content: '+o.responseText),void(t=null)}o.status>=200&&o.status<=299&&!n.error?t&&t(null,n):t&&t(n.error||"Non 2xx status code"),t=null}},o.send(r)}return{findServers:t,findRegionPreference:o,findServerPreference:function(n,e,r){"function"==typeof e&&(r=e,e={}),t(n,e,function(n,t){if(n)return r(n);if(!t)return r("Unknown error");if(!t.servers)return r("Invalid response");var i=[];for(var s in t.servers)i.push(s);if(0!=i.length){if(1==i.length)for(var s in t.servers)return void r(null,[t.servers[s]]);o(i,e,function(n,e){if(n)return r(n);var o=e.map(function(n){return t.servers[n]});r(null,o)})}else r("Couldn't find any servers in any region")})},findServerByID:function(n,r){if("string"!=typeof n)throw new Error("ID must be a string");/^[0-9a-zA-Z]+$/.test(n)?i(e+"/server/"+n,r):setTimeout(function(){r("Invalid server ID")},0)},setBaseURL:function(n){e=n}}}(window);
window.ads=false;
var worker = new Worker(window.URL.createObjectURL(new Blob([\`window = self;
!function(){function r(r,n){for(var t=0;t<~~(n/4);++t)if("0"!=r[t])return!1;for(t=4*~~(n/4);t<n;++t){if(!(e(r[~~(t/4)])&1<<(3&t)))return!1}return!0}function e(r){switch(r.toLowerCase()){case"0":return 0;case"1":return 1;case"2":return 2;case"3":return 3;case"4":return 4;case"5":return 5;case"6":return 6;case"7":return 7;case"8":return 8;case"9":return 9;case"a":return 10;case"b":return 11;case"c":return 12;case"d":return 13;case"e":return 14;case"f":return 15;default:return 0}}function n(r){for(var e="",n="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",t=0;t<r;++t)e+=n[~~(Math.random()*n.length)];return e}onmessage=function(e){var t=e.data,a=t[0],u=t[1],c=function(r){return function(){postMessage([r].concat(Array.prototype.slice.apply(arguments)))}}(a);"solve"==u&&c(function(e,t){for(;;){var a=n(16);if(r(sha1(e+a+e),t))return a}}(t[2],t[3]))}}();
!function(){"use strict";function t(t){t?(f[0]=f[16]=f[1]=f[2]=f[3]=f[4]=f[5]=f[6]=f[7]=f[8]=f[9]=f[10]=f[11]=f[12]=f[13]=f[14]=f[15]=0,this.blocks=f):this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],this.h0=1732584193,this.h1=4023233417,this.h2=2562383102,this.h3=271733878,this.h4=3285377520,this.block=this.start=this.bytes=this.hBytes=0,this.finalized=this.hashed=!1,this.first=!0}var h="object"==typeof window?window:{},s=!h.JS_SHA1_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node;s&&(h=global);var i=!h.JS_SHA1_NO_COMMON_JS&&"object"==typeof module&&module.exports,e="function"==typeof define&&define.amd,r="0123456789abcdef".split(""),o=[-2147483648,8388608,32768,128],n=[24,16,8,0],a=["hex","array","digest","arrayBuffer"],f=[],u=function(h){return function(s){return new t(!0).update(s)[h]()}},c=function(){var h=u("hex");s&&(h=p(h)),h.create=function(){return new t},h.update=function(t){return h.create().update(t)};for(var i=0;i<a.length;++i){var e=a[i];h[e]=u(e)}return h},p=function(t){var h=eval("require('crypto')"),s=eval("require('buffer').Buffer"),i=function(i){if("string"==typeof i)return h.createHash("sha1").update(i,"utf8").digest("hex");if(i.constructor===ArrayBuffer)i=new Uint8Array(i);else if(void 0===i.length)return t(i);return h.createHash("sha1").update(new s(i)).digest("hex")};return i};t.prototype.update=function(t){if(!this.finalized){var s="string"!=typeof t;s&&t.constructor===h.ArrayBuffer&&(t=new Uint8Array(t));for(var i,e,r=0,o=t.length||0,a=this.blocks;r<o;){if(this.hashed&&(this.hashed=!1,a[0]=this.block,a[16]=a[1]=a[2]=a[3]=a[4]=a[5]=a[6]=a[7]=a[8]=a[9]=a[10]=a[11]=a[12]=a[13]=a[14]=a[15]=0),s)for(e=this.start;r<o&&e<64;++r)a[e>>2]|=t[r]<<n[3&e++];else for(e=this.start;r<o&&e<64;++r)(i=t.charCodeAt(r))<128?a[e>>2]|=i<<n[3&e++]:i<2048?(a[e>>2]|=(192|i>>6)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]):i<55296||i>=57344?(a[e>>2]|=(224|i>>12)<<n[3&e++],a[e>>2]|=(128|i>>6&63)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]):(i=65536+((1023&i)<<10|1023&t.charCodeAt(++r)),a[e>>2]|=(240|i>>18)<<n[3&e++],a[e>>2]|=(128|i>>12&63)<<n[3&e++],a[e>>2]|=(128|i>>6&63)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]);this.lastByteIndex=e,this.bytes+=e-this.start,e>=64?(this.block=a[16],this.start=e-64,this.hash(),this.hashed=!0):this.start=e}return this.bytes>4294967295&&(this.hBytes+=this.bytes/4294967296<<0,this.bytes=this.bytes%4294967296),this}},t.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var t=this.blocks,h=this.lastByteIndex;t[16]=this.block,t[h>>2]|=o[3&h],this.block=t[16],h>=56&&(this.hashed||this.hash(),t[0]=this.block,t[16]=t[1]=t[2]=t[3]=t[4]=t[5]=t[6]=t[7]=t[8]=t[9]=t[10]=t[11]=t[12]=t[13]=t[14]=t[15]=0),t[14]=this.hBytes<<3|this.bytes>>>29,t[15]=this.bytes<<3,this.hash()}},t.prototype.hash=function(){var t,h,s=this.h0,i=this.h1,e=this.h2,r=this.h3,o=this.h4,n=this.blocks;for(t=16;t<80;++t)h=n[t-3]^n[t-8]^n[t-14]^n[t-16],n[t]=h<<1|h>>>31;for(t=0;t<20;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i&e|~i&r)+o+1518500249+n[t]<<0)<<5|o>>>27)+(s&(i=i<<30|i>>>2)|~s&e)+r+1518500249+n[t+1]<<0)<<5|r>>>27)+(o&(s=s<<30|s>>>2)|~o&i)+e+1518500249+n[t+2]<<0)<<5|e>>>27)+(r&(o=o<<30|o>>>2)|~r&s)+i+1518500249+n[t+3]<<0)<<5|i>>>27)+(e&(r=r<<30|r>>>2)|~e&o)+s+1518500249+n[t+4]<<0,e=e<<30|e>>>2;for(;t<40;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i^e^r)+o+1859775393+n[t]<<0)<<5|o>>>27)+(s^(i=i<<30|i>>>2)^e)+r+1859775393+n[t+1]<<0)<<5|r>>>27)+(o^(s=s<<30|s>>>2)^i)+e+1859775393+n[t+2]<<0)<<5|e>>>27)+(r^(o=o<<30|o>>>2)^s)+i+1859775393+n[t+3]<<0)<<5|i>>>27)+(e^(r=r<<30|r>>>2)^o)+s+1859775393+n[t+4]<<0,e=e<<30|e>>>2;for(;t<60;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i&e|i&r|e&r)+o-1894007588+n[t]<<0)<<5|o>>>27)+(s&(i=i<<30|i>>>2)|s&e|i&e)+r-1894007588+n[t+1]<<0)<<5|r>>>27)+(o&(s=s<<30|s>>>2)|o&i|s&i)+e-1894007588+n[t+2]<<0)<<5|e>>>27)+(r&(o=o<<30|o>>>2)|r&s|o&s)+i-1894007588+n[t+3]<<0)<<5|i>>>27)+(e&(r=r<<30|r>>>2)|e&o|r&o)+s-1894007588+n[t+4]<<0,e=e<<30|e>>>2;for(;t<80;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i^e^r)+o-899497514+n[t]<<0)<<5|o>>>27)+(s^(i=i<<30|i>>>2)^e)+r-899497514+n[t+1]<<0)<<5|r>>>27)+(o^(s=s<<30|s>>>2)^i)+e-899497514+n[t+2]<<0)<<5|e>>>27)+(r^(o=o<<30|o>>>2)^s)+i-899497514+n[t+3]<<0)<<5|i>>>27)+(e^(r=r<<30|r>>>2)^o)+s-899497514+n[t+4]<<0,e=e<<30|e>>>2;this.h0=this.h0+s<<0,this.h1=this.h1+i<<0,this.h2=this.h2+e<<0,this.h3=this.h3+r<<0,this.h4=this.h4+o<<0},t.prototype.hex=function(){this.finalize();var t=this.h0,h=this.h1,s=this.h2,i=this.h3,e=this.h4;return r[t>>28&15]+r[t>>24&15]+r[t>>20&15]+r[t>>16&15]+r[t>>12&15]+r[t>>8&15]+r[t>>4&15]+r[15&t]+r[h>>28&15]+r[h>>24&15]+r[h>>20&15]+r[h>>16&15]+r[h>>12&15]+r[h>>8&15]+r[h>>4&15]+r[15&h]+r[s>>28&15]+r[s>>24&15]+r[s>>20&15]+r[s>>16&15]+r[s>>12&15]+r[s>>8&15]+r[s>>4&15]+r[15&s]+r[i>>28&15]+r[i>>24&15]+r[i>>20&15]+r[i>>16&15]+r[i>>12&15]+r[i>>8&15]+r[i>>4&15]+r[15&i]+r[e>>28&15]+r[e>>24&15]+r[e>>20&15]+r[e>>16&15]+r[e>>12&15]+r[e>>8&15]+r[e>>4&15]+r[15&e]},t.prototype.toString=t.prototype.hex,t.prototype.digest=function(){this.finalize();var t=this.h0,h=this.h1,s=this.h2,i=this.h3,e=this.h4;return[t>>24&255,t>>16&255,t>>8&255,255&t,h>>24&255,h>>16&255,h>>8&255,255&h,s>>24&255,s>>16&255,s>>8&255,255&s,i>>24&255,i>>16&255,i>>8&255,255&i,e>>24&255,e>>16&255,e>>8&255,255&e]},t.prototype.array=t.prototype.digest,t.prototype.arrayBuffer=function(){this.finalize();var t=new ArrayBuffer(20),h=new DataView(t);return h.setUint32(0,this.h0),h.setUint32(4,this.h1),h.setUint32(8,this.h2),h.setUint32(12,this.h3),h.setUint32(16,this.h4),t};var y=c();i?module.exports=y:(h.sha1=y,e&&define(function(){return y}))}();\`],{type:"text/javascript"}))),
nextJobID=0,workerCallbacks = {};
function solve(t,r,e){worker.postMessage([nextJobID,"solve",t,r]),workerCallbacks[nextJobID++]=e}
worker.onmessage=function(t){workerCallbacks[t.data[0]].apply(null,t.data.slice(1))},window.m28=window.m28||{},window.m28.pow={solve};
!function(){var n=window.localStorage.no_retina?1:window.devicePixelRatio,t=document.getElementById("canvas"),i=!1;function o(n){n.preventDefault&&n.preventDefault()}function d(){window.input&&window.input.flushInputHooks&&window.input.flushInputHooks()}function u(){t.width=window.innerWidth*n,t.height=window.innerHeight*n}t.addEventListener("wheel",function(n){n.preventDefault();if(!window.input)return;window.input.wheel(Math.sign(n.deltaY))}),t.addEventListener("mousemove",function(e){window.input&&window.input.mouse(e.clientX*n,e.clientY*n)}),t.addEventListener("mousedown",function(n){d(),window.input&&(o(n),n.which||void 0===n.button||(n.which=1&n.button?1:2&n.button?3:4&n.button?2:0),n.which>=1&&n.which<=3&&window.input.keyDown(n.which))}),t.addEventListener("mouseup",function(n){d(),window.input&&(o(n),n.which||void 0===n.button||(n.which=1&n.button?1:2&n.button?3:4&n.button?2:0),n.which>=1&&n.which<=3&&window.input.keyUp(n.which))}),document.addEventListener("keydown",function(n){d(),window.input&&(n.keyCode>=112&&n.keyCode<=130&&113!=n.keyCode||(window.input.keyDown(n.keyCode),9==n.keyCode&&o(n),i||n.ctrlKey||n.metaKey||o(n)))}),document.addEventListener("keyup",function(n){d(),window.input&&(n.keyCode>=112&&n.keyCode<=130&&113!=n.keyCode||(window.input.keyUp(n.keyCode),9==n.keyCode&&o(n),i||n.ctrlKey||n.metaKey||o(n)))}),t.addEventListener("click",function(n){n.stopPropagation(),d()}),t.addEventListener("dragstart",function(n){o(n)}),document.addEventListener("blur",function(){window.input&&window.input.blur()}),t.addEventListener("contextmenu",function(n){window.input&&window.input.prevent_right_click&&!window.input.prevent_right_click()||o(n)}),window.setLoadingStatus=function(n){document.getElementById("loading").innerText=n},window.setTyping=function(n){i=n},window.unscale=function(e){return e/n},window.onerror=function(n,t,i,o,d){window.onerror=null,console.log("Uncaught error: "+n)},window.onbeforeunload=function(n){window.input&&window.input.should_prevent_unload&&window.input.should_prevent_unload()&&(n.preventDefault(),n.returnValue="")},window.addEventListener("gamepadconnected",function(n){console.log("Gamepad connected: "+n.id)}),window.onresize=u,u()}();
fetch('https://diep.io').then(async (a) => {
a = await a.text();
fetch('https://static.diep.io/build_' + a.match(/build_(.*)" \\+ \\(window\\.WebAssembly/)[1] + '.js').then(async (s) => {
s = await s.text();
window.eval((${injection.toString()})(s));
}).catch(err => {console.error(err);return;});
}).catch(err => {console.error(err);return;});
</script>
</body>
</html>
`);
document.close();
