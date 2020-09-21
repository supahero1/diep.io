/*
it has a problem causing it to spam log channels when it restarts, idk why it does that :(
sometimes it sends log twice in the log channel
didnt bother myself to fix bc no reason to

stuff is set to obey my user id, not yours, so change mine to urs lol.
changing Owner is not enough, there are regexpes which include my user id too.

oh also in the config file, `log` is for logging a message when the bot starts up. i stopped using it but its still in the code, u can get rid of it if want.
some commands are not listed in the `bot help` embed. get to know them at the bottom, they are in a switch case.
*/


'use strict';

const Discord = require('discord.js');
const Client = new Discord.Client();
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const WebSocket = require('ws');
const FileSystem = require('fs');
const { Worker } = require('worker_threads');

var Config = {};
var HelpingConfig = {};

const Owner = '694581020111929384';

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
	worker.postMessage([id, prefix, difficulty]);
	workerCallbacks[id] = cb;
}
worker.on('message', function(e) {
	workerCallbacks[e[0]].apply(null, e.slice(1));
  delete workerCallbacks[e[0]];
});

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

function ReadVarUint(packet) {
  var at = 1;
  var number = 0;
  var count = 0;
  do {
    number |= (packet[at] & 0x7f) << (7 * count++);
  } while((packet[at++] >> 7) == 1);
  return number;
}

function DecompressLZ4(packet) {
  const length = (packet[4] << 24) | (packet[3] << 16) | (packet[2] << 8) | packet[1];
  var at = 5;
  var aat = 0;
  var output = new Array(length);
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
    //output = [...output, ...packet.slice(at, at + literalLength)];
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
      //output = [...output, ...output.slice(copyStart, copyStart + copyLength)];
    } else {
      oldLength = output.length;
      for(i = copyStart; i < oldLength; i++) {
        output[aat++] = output[i];
      }
      //output = [...output, ...output.slice(copyStart, output.length)];
      for(let i = 0; i < copyStart + copyLength - oldLength; i++) {
        output[aat++] = output[oldLength + i];
      }
    }
  }
  return output;
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

function DiepWebSocket(serverID) {
  return new Promise(function(resolve) {
    const ws = new WebSocket(`wss://${serverID}.s.m28n.net:443`, {
      'origin': 'https://diep.io',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0',
			"pragma": "no-cache",
      "connection": "Upgrade",
      "upgrade": "websocket",
      "cache-control": "no-cache",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US;q=0.8,en;q=0.7",
      'host': `${serverID}.s.m28n.net`
    });
    ws.binaryType = 'arraybuffer';
    ws.onopen = function() {
      resolve([1, ws]);
    };
    ws.onerror = function(error) {
      resolve([0, error.message]);
    };
  });
}

function DiepHandshake(socket, party = '') {
  return new Promise(function(resolve) {
    var resolved = false;
		var firstRequest = true;
		var build = '';
    socket.onmessage = function(x) {
      var data = new Uint8Array(x.data);
			if(resolved == false) {
				if(data[0] == 11) {
	        const difficulty = ReadVarUint(data);
	        var str = '';
	        for(let i = 2; i < data.length - 1; i++) {
	          str += String.fromCharCode(data[i]);
	        }
	        solve(str, difficulty, function(result) {
	          if(this.readyState == 1) {
	            this.send(new Uint8Array([10, ...result.split('').map(r => r.charCodeAt()), 0]));
	          }
	        }.bind(this));
				} else if(data[0] == 1) {
					if(firstRequest == true) {
						firstRequest = false;
						build = Array.from(data).slice(1);
						this.send(new Uint8Array([0, ...build, 0, ...party.split('').map(r => r.charCodeAt()), 0, 0]));
					} else {
						resolved = true;
						resolve([0, 'Invalid party.', build]);
					}
				} else {
					resolved = true;
					resolve([1, Array.from(data), build]);
				}
			} else {
				this.close();
			}
    };
		socket.onclose = function() {
			resolve([0, 'Socket closed.']);
		};
    setTimeout(function() {
      if(resolved == false) {
        resolved = true;
        resolve([0, 'The server did not finish processing our requests within 1 minute.']);
      }
    }, 6e4);
		socket.send(new Uint8Array([0]));
  });
}

function ParseLink(link) {
  link = link.toLowerCase().trim();
  const firstMatch = link.match(/diep\.io\/\#(.*)/);
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

function GetUptime(link) {
  return new Promise(async function(resolve) {
    const parsedLink = ParseLink(link);
    if(parsedLink[0] == 1) {
      const socket = await DiepWebSocket(parsedLink[1], parsedLink[2]);
      if(socket[0] == 1) {
        const handshake = await DiepHandshake(socket[1], parsedLink[2]);
        if(handshake[0] == 1) {
          if(handshake[1].length != 1 && (handshake[1][0] == 0 || handshake[1][0] == 2)) {
            if(handshake[1][0] == 2) {
              socket[1].close();
              resolve([1, ReadVarUint(DecompressLZ4(handshake[1]))]);
            } else {
              socket[1].close();
              resolve([1, ReadVarUint(handshake[1])]);
            }
          } else {
            socket[1].onmessage = function(x) {
              const data = Array.from(new Uint8Array(x.data));
              if(data.length != 1 && (data[0] == 0 || data[0] == 2)) {
                if(data[0] == 2) {
                  this.onmessage = function() {};
                  this.close();
                  resolve([1, ReadVarUint(DecompressLZ4(data))]);
                } else {
                  this.onmessage = function() {};
                  this.close();
                  resolve([1, ReadVarUint(data)]);
                }
              }
            };
          }
        } else {
          resolve(handshake);
        }
      } else {
        resolve(socket);
      }
    } else {
      resolve(parsedLink);
    }
  });
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

function SeekServers(gamemode) {
  return new Promise(async function(resolve) {
    const response = await XHR('GET', `https://api.n.m28.io/endpoint/diepio-${gamemode}/findeach`);
    if(response[0] == 1) {
      try {
        const servers = JSON.parse(response[1]);
        for(const Region in servers.servers) {
          if(DiepServers[servers.servers[Region].id] != null) {
            DiepServers[servers.servers[Region].id].lastCheckedAt = new Date().getTime();
          } else {
            DiepServers[servers.servers[Region].id] = { gamemode, region: Region.match(/vultr-(.*)/)[1], lastCheckedAt: new Date().getTime() };
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
  Config.allowed = Config.allowed.slice(0, HelpingConfig.allowedLength);
  Config.statuses = Config.statuses.slice(0, HelpingConfig.statusesLength);
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
}, 500);
const DeleteServersCycle = setInterval(PruneServers, 18e5);

function ServerStatus(serverID, party, time = 1e3) {
  return new Promise(async function(resolve) {
    const socket = await DiepWebSocket(serverID);
    if(socket[0] == 1) {
      const handshake = await DiepHandshake(socket[1], party);
      if(handshake[0] == 1) {
        var messagesCount = 0;
        var firstMessage = 0;
        var gotUptime = false;
        if((handshake[1][0] == 0 || handshake[1][0] == 2) && handshake[1].length != 1) {
          messagesCount++;
          firstMessage = new Date().getTime();
          if(gotUptime == false) {
            gotUptime = true;
            if(DiepServers[serverID] == null) {
              DiepServers[serverID] = {};
            }
            if(handshake[1][0] == 2) {
              DiepServers[serverID].uptime = ReadVarUint(DecompressLZ4(handshake[1]));
            } else {
              DiepServers[serverID].uptime = ReadVarUint(handshake[1]);
            }
          }
        }
        socket[1].onmessage = function(x) {
          const data = new Uint8Array(x.data);
          if((data[0] == 0 || data[0] == 2) && data.length != 1) {
            if(firstMessage == 0) {
              firstMessage = new Date().getTime();
            }
            if(gotUptime == false) {
              gotUptime = true;
              if(DiepServers[serverID] == null) {
                DiepServers[serverID] = {};
              }
              if(data[0] == 2) {
                DiepServers[serverID].uptime = ReadVarUint(DecompressLZ4(data));
              } else {
                DiepServers[serverID].uptime = ReadVarUint(data);
              }
            }
            messagesCount++;
          }
        };
        setTimeout(function() {
          socket[1].close();
          if(messagesCount != 0) {
            resolve([1, (new Date().getTime() - firstMessage) / messagesCount]);
          } else {
            resolve([0, 'Didn\'t receive any message within ${StringTime(time)}.']);
          }
        }, time);
      } else {
        resolve(handshake);
      }
    } else {
      resolve(socket);
    }
  });
}
var ContinueServerStatusCycle = true;
var LastServerStatusAt = 0;
var ServerStatusLength = null;
async function ServersStatus() {
  var status = null;
  const servers = [];
  for(const serverID in DiepServers) {
    servers[servers.length] = serverID;
  }
  for(let i = 0; i < servers.length; i++) {
    status = await ServerStatus(servers[i], '');
    if(DiepServers[servers[i]] != null) {
      if(status[0] == 1) {
        DiepServers[servers[i]].status = status[1];
      } else {
        DiepServers[servers[i]].status = null;
      }
    }
  }
  if(ContinueServerStatusCycle == true) {
    setTimeout(ServersStatus, 0);
  }
  ServerStatusLength = new Date().getTime() - LastServerStatusAt;
  LastServerStatusAt = new Date().getTime();
  var logs = [];
  var i = 0;
  var j = 0;
  var has = false;
  var deleted = {};
  var message = {};
  for(; i < HelpingConfig.statusesLength; i++) {
    try {
      if(deleted[Config.statuses[i][1]] == null) {
        message = await Client.channels.cache.get(Config.statuses[i][0]).messages.fetch(Config.statuses[i][1], false);
        if(message != null) {
          message.delete();
          deleted[Config.statuses[i][1]] = true;
        }
      }
    } catch(error) {
      Errors[Errors.length] = error.message;
      FileSystem.writeFile('./errors', new Uint8Array(JSON.stringify(Errors).split('').map(r => r.charCodeAt())), function() {});
    }
    has = false;
    for(j = 0; j < logs.length; j++) {
      if(logs[j] == Config.statuses[i][0]) {
        has = true;
        break;
      }
    }
    if(has == false) {
      logs[logs.length] = Config.statuses[i][0];
    }
  }
  HelpingConfig.statusesLength = 0;
  var str = '';
  var i = 0;
  var goodGamemode = false;
  var goodRegion = false;
  var serverCount = 0;
  for(const serverID in DiepServers) {
    serverCount++;
    str += `https://diep.io/#${IDToLink(serverID)} | ${SimpleGamemode(DiepServers[serverID].gamemode)} ${SimpleRegion(DiepServers[serverID].region)}`;
    if(DiepServers[serverID].status != null) {
      str += ` | ${Math.min(4000 / DiepServers[serverID].status, 100).toFixed(2)}%`;
    } else {
      str += ` | Status not yet recorded`;
    }
    if(DiepServers[serverID].uptime != null) {
      str += ` | ${ShortStringTime(DiepServers[serverID].uptime * 40, 3)}`;
    } else {
      str += ` | Uptime not yet recorded`;
    }
    str += ` | Checked ${ShortStringTime(new Date().getTime() - DiepServers[serverID].lastCheckedAt)} ago`;
    str += '\n';
  }
  var smartIndex = 0;
  var first = true;
	var lastMessageID = 0;
	const res = await XHR('HEAD', 'https://diep.io');
	if(res[0] == 1) {
		QueueMessage(['**Update**', `Diep.io was last modified on ${res[2].getResponseHeader('last-modified')}`], logs[i], false, false, false);
	}
  for(i = 0; i < logs.length; i++) {
    if(serverCount > 0) {
      smartIndex = 0;
      first = true;
      while(str.length > 1024) {
        smartIndex = str.GetSmartSplitIndex(1024, true);
        QueueMessage([first == true ? (first = false, `**To be continued: servers (${serverCount})**`) : `**Continuation of servers (${serverCount})**`, str.substring(0, smartIndex)], logs[i], false, false, false).then(function(msg) {
					if(lastMessageID != msg.id) {
						lastMessageID = msg.id;
						Config.statuses[HelpingConfig.statusesLength++] = [msg.channel.id, msg.id];
					}
        });
        str = str.substring(smartIndex);
      }
      QueueMessage([first == true ? `**Servers (${serverCount})**` : `**Continuation of servers (${serverCount})**`, str], logs[i]).then(function(msg) {
				if(lastMessageID != msg.id) {
					lastMessageID = msg.id;
					Config.statuses[HelpingConfig.statusesLength++] = [msg.channel.id, msg.id];
				}
				WriteConfig();
      });
    } else {
      QueueMessage([`**Servers (${serverCount})**`, 'There are no servers cached. If you believe this is an error, contact the creator of this bot.'], logs[i]);
			WriteConfig();
    }
  }
	if(logs.length == 0) {
		WriteConfig();
	}
}

function Ready() {
  console.log('Logged in');
  if(Config.allowed == null) {
    Config.allowed = [];
    HelpingConfig.allowedLength = 0;
  } else {
    HelpingConfig.allowedLength = Config.allowed.length;
  }
  if(Config.prefix == null) {
    Config.prefix = 'bot';
  }
  if(Config.statuses == null) {
    Config.statuses = [];
    HelpingConfig.statusesLength = 0;
  } else {
    HelpingConfig.statusesLength = Config.statuses.length;
  }
  LastServerStatusAt = new Date().getTime();
  ServersStatus();
  
  const Commands = [function(message) {
    QueueMessage(['**Help**', `\`${Config.prefix} help\`: displays this message\n` +
                 `\`${Config.prefix} uptime [link(s)]\`: fetches current uptime of given arena(s)\n` +
                 `\`${Config.prefix} servers [gamemode(s)] [region(s)]\`: shows cached list of servers in given region and gamemode\n` +
                 `\`${Config.prefix} players\`: fetches current player count (might vary by a few players, depending on which server the bot will connect to)\n` +
                 `\`${Config.prefix} status [link(s)]\`: checks the speed of given server(s)\n` +
                 `\`${Config.prefix} flags\`: shows optional arguments that can be added to commands to provide more functionality\n` +
                 `\`${Config.prefix} info\`: shows a message containing some information about the bot\n` +
                 `\`${Config.prefix} cycle\`: shows time left until next server status refresh\n` +
							   `\`${Config.prefix} update\`: shows the date of diep.io being modified last time (not necessarily client)`], message.channel.id);
  }, async function(message, links) {
    var result = [];
    var cache = false;
    var parsedLink = [];
    for(let i = 0; i < links.length; i++) {
      if(links[i] == 'cache' || links[i] == '-c') {
        cache = true;
        links.splice(i, 1);
        break;
      }
    }
    for(let i = 1; i <= links.length; i++) {
      if(cache == false) {
        result = await GetUptime(links[i - 1]);
      } else {
        parsedLink = ParseLink(links[i - 1]);
        if(parsedLink[0] == 1) {
          if(DiepServers[parsedLink[1]] != null) {
            result = DiepServers[parsedLink[1]].uptime;
          } else {
            result = await GetUptime(links[i - 1]);
          }
        } else {
          QueueMessage(['**Uptime**', `Error: ${parsedLink[1]}`], message.channel.id, false, false, false);
        }
      }
      if(result[0] == 1) {
        QueueMessage(['**Uptime**', `Uptime of ${i}${i == 1 ? 'st' : i == 2 ? 'nd' : i == 3 ? 'rd' : 'th'}: ${StringTime(result[1] * 40)}`], message.channel.id);
      } else {
        QueueMessage(['**Uptime**', `Error: ${result[1]}`], message.channel.id);
      }
    }
    StartMessageCycle(message.channel.id);
  }, function(message, channelIDs) {
    if(message.author.id != Owner) {
      return;
    }
    let j = 0;
    let has = false;
    for(let i = 0; i < channelIDs.length; i++) {
      has = false;
      for(j = 0; j < HelpingConfig.allowedLength; j++) {
        if(Config.allowed[j] == channelIDs[i]) {
          has = true;
          break;
        }
      }
      if(has == false) {
        Config.allowed[HelpingConfig.allowedLength++] = channelIDs[i];
        QueueMessage(['**Enable**', `Channel ID ${channelIDs[i]} successfully enabled.`], message.channel.id, false, false, false);
      } else {
        QueueMessage(['**Enable**', `Error: Channel ID ${channelIDs[i]} is already enabled.`], message.channel.id, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, function(message, channelIDs) {
    if(message.author.id != Owner) {
      return;
    }
    let j = 0;
    let has = -1;
    for(let i = 0; i < channelIDs.length; i++) {
      has = -1;
      for(j = 0; j < HelpingConfig.allowedLength; j++) {
        if(Config.allowed[j] == channelIDs[i]) {
          has = j;
          break;
        }
      }
      if(has != -1) {
        Config.allowed[has] = Config.allowed[--HelpingConfig.allowedLength];
        QueueMessage(['**Disable**', `Channel ID ${channelIDs[i]} successfully disabled.`], message.channel.id, false, false, false);
      } else {
        QueueMessage(['**Disable**', `Error: Channel ID ${channelIDs[i]} is already disabled.`], message.channel.id, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
    WriteConfig();
  }, async function(message, args) {
    var gamemodes = [];
    var regions = [];
    var status = false;
    var uptime = false;
    var lastChecked = false;
    for(let i = 0; i < args.length; i++) {
      if(args[i].match(/([^\d])/) != null) {
        if(args[i].match(/^ffa$/) != null) {
          gamemodes[gamemodes.length] = 'ffa';
        } else if(args[i].match(/^teams$|^2teams$|^2tdm$/) != null) {
          gamemodes[gamemodes.length] = 'teams';
        } else if(args[i].match(/^4teams$|^4tdm$/) != null) {
          gamemodes[gamemodes.length] = '4teams';
        } else if(args[i].match(/^maze$/) != null) {
          gamemodes[gamemodes.length] = 'maze';
        } else if(args[i].match(/^domination$|^dom$/) != null) {
					gamemodes[gamemodes.length] = 'dom';
				} else if(args[i].match(/^survival$|^surv$/) != null) {
					gamemodes[gamemodes.length] = 'survival';
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
        } else if(args[i] == 'status' || args[i] == '-s') {
          status = true;
        } else if(args[i] == 'uptime' || args[i] == '-u') {
          uptime = true;
        } else if(args[i] == 'last' || args[i] == '-l') {
          lastChecked = true;
        }
      }
    }
    if(gamemodes.length == 0) {
      gamemodes = ['ffa', 'teams', '4teams', 'maze', 'tag', 'dom', 'survival'];
    }
    if(regions.length == 0) {
      regions = ['amsterdam', 'miami', 'la', 'singapore', 'sydney'];
    }
    var str = '';
    var i = 0;
    var goodGamemode = false;
    var goodRegion = false;
    var serverCount = 0;
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
        str += `https://diep.io/#${IDToLink(serverID)} | ${SimpleGamemode(DiepServers[serverID].gamemode)} ${SimpleRegion(DiepServers[serverID].region)}`;
        if(status == true) {
          if(DiepServers[serverID].status != null) {
            str += ` | ${Math.min(4000 / DiepServers[serverID].status, 100).toFixed(2)}%`;
          } else {
            str += ` | Status not yet recorded`;
          }
        }
        if(uptime == true) {
          if(DiepServers[serverID].uptime != null) {
            str += ` | ${ShortStringTime(DiepServers[serverID].uptime * 40)}`;
          } else {
            str += ` | Uptime not yet recorded`;
          }
        }
        if(lastChecked == true) {
          str += ` | Checked ${ShortStringTime(new Date().getTime() - DiepServers[serverID].lastCheckedAt)} ago`
        }
        str += '\n';
      }
    }
    if(serverCount > 0) {
			FragmentMessage(str, `Servers (${serverCount})`, message.channel.id, false, false, false);
    } else {
      QueueMessage([`**Servers (${serverCount})**`, 'There are no servers in specified gamemode and region, the servers are being full (botted), or there is a problem occuring.'], message.channel.id);
    }
  }, async function(message) {
    const socket = await ConnectToAnyServer();
    if(socket[0] == 1) {
      const handshake = await DiepHandshake(socket[1]);
      if(handshake[0] == 1) {
        socket[1].onmessage = function(x) {
          const data = new Uint8Array(x.data);
          if(data[0] == 0xa) {
            QueueMessage(['**Player count**', (ReadVarUint(data)).toString()], message.channel.id);
            this.close();
          }
        };
      } else {
        QueueMessage(['**Player count**', `Error: ${handshake[1]}`], message.channel.id);
      }
    } else {
      QueueMessage(['**Player count**', `Error: ${socket[1]}`], message.channel.id);
    }
  }, async function(message, links) {
    var parsedLink = null;
    var status = null;
    var extended = false;
    var cached = false;
    for(let i = 0; i < links.length;) {
      if((links[i] == 'extended' || links[i] == '-e') && extended == false) {
        extended = true;
        links.splice(i, 1);
        if(cached == true) {
          break;
        }
      } else if((links[i] == 'cache' || links[i] == '-c') && cached == false) {
        cached = true;
        links.splice(i, 1);
        if(extended == true) {
          break;
        }
      } else {
        i++;
      }
    }
    for(let i = 1; i <= links.length; i++) {
      parsedLink = ParseLink(links[i - 1]);
      if(parsedLink[0] == 1) {
        status = await ServerStatus(parsedLink[1], parsedLink[2], extended == false ? 1e3 : 4e3);
        if(status[0] == 1) {
          QueueMessage(['**Status**', `Average ${i}${i == 1 ? 'st' : i == 2 ? 'nd' : i == 3 ? 'rd' : 'th'} server speed: ${Math.min((4000 / status[1]).toFixed(2), 100)}%`], message.channel.id);
        } else {
          QueueMessage(['**Status**', `Error: ${status[1]}`], message.channel.id, false, false, false);
        }
      } else {
        QueueMessage(['**Status**', `Error: ${parsedLink[1]}`], message.channel.id, false, false, false);
      }
    }
    StartMessageCycle(message.channel.id);
  }, async function(message, channelID) {
    if(message.author.id != Owner) {
      return;
    }
    var has = false;
    var i = 0;
    for(; i < HelpingConfig.statusesLength; i++) {
      if(Config.statuses[i][0] == channelID[0]) {
        has = true;
        break;
      }
    }
    if(has == false) {
      const message = await QueueMessage(['**Server status**', `This message will be deleted and a new one with server status will be created after current cycle ends. Do \`${Config.prefix} cycle\` to get more information.`], channelID[0]);
      if(message != null) {
        Config.statuses[HelpingConfig.statusesLength++] = [channelID[0], message.id];
      }
    } else {
      var deleted = false;
      var messages = [];
      var i = 0;
      for(; i < HelpingConfig.statusesLength; i++) {
        if(Config.statuses[i][0] == channelID[0]) {
          deleted = true;
          messages[messages.length] = Config.statuses[i][1];
          Config.statuses[i] = Config.statuses[--HelpingConfig.statusesLength];
          break;
        }
      }
      var message = null;
      try {
        for(i = 0; i < messages.length; i++) {
          message = await Client.channels.cache.get(channelID[0]).messages.fetch(messages[i], false);
          if(message != null) {
            message.delete();
          }
        }
      } catch(err) {}
      if(deleted == true) {
        QueueMessage(['**Log**', `Log ${channelID[0]} deleted successfully.`], message.channel.id);
      } else {
        QueueMessage(['**Log**', `Error: Log ${channelID[0]} does not exist.`], message.channel.id);
      }
    }
    WriteConfig();
  }, function(message) {
    QueueMessage(['**Flags**', `\`uptime\`: \`cache\` \`-c\` | gets the uptime almost instantly, but it will be a little bit off the real value. If cached value does not exist, it will proceed to get it\n` +
                               `\`servers\`: \`status\` \`-s\` | attaches cached status of servers to the list | \`uptime\` \`-u\` | attaches cached uptime of servers to the list | \`last\` \`-l\` | attaches amount of time that has passed since the last time a server was seen at\n` +
                               `\`status\`: \`extended\` \`-e\` | measures latency of the server for 4 seconds instead of 1 | \`cache\` \`-c\` | gets status almost instantly, but it might be off the real value. If cached value does not exist, it will proceed to get it\n`], message.channel.id);
  }, function(message) {
    var str = '';
    if(ServerStatusLength != null) {
      str += `\nLast cycle of updating server status took ${StringTime(ServerStatusLength)}. Approximated time until next update of server status: ${StringTime(ServerStatusLength - new Date().getTime() + LastServerStatusAt)}.`;
    } else {
      str += `\nThe first cycle of updating server status has not yet finished. Please wait until it does. Time since the beginning of updating server status cycle: ${StringTime(new Date().getTime() - LastServerStatusAt)}.`;
    }
    QueueMessage(['**Cycle**', str], message.channel.id);
  }, function(message) {
    QueueMessage(['**Info**', 'The creator of the bot: Shädam.\nIf you see any errors repeating too frequently, or any other concern regarding the bot, please message the creator.\nThis bot does not collect any user data. It is only a bridge between Discord and diep.io.\nThe bot was revived on 21.07.2020. Language: JavaScript. Libraries: discord.js, xmlhttprequest, ws. Environment: node.js.'], message.channel.id);
  }, function(message) {
		if(message.author.id != Owner) {
      return;
    }
    message.guild.leave();
  }, function(message) {
    if(message.author.id != Owner) {
      return;
    }
    var logs = 0;
    var i = 0;
    for(; i < HelpingConfig.statusesLength;) {
      if(Client.channels.cache.get(Config.statuses[i][0]) == null) {
        logs++;
        Config.statuses[i] = Config.statuses[--HelpingConfig.statusesLength];
      } else {
        i++;
      }
    }
    var ccount = 0;
    for(i = 0; i < HelpingConfig.allowedLength;) {
      if(Client.channels.cache.get(Config.allowed[i]) == null && Client.guilds.cache.get(Config.allowed[i]) == null && Client.users.cache.get(Config.allowed[i]) == null) {
        ccount++;
        Config.allowed[i] = Config.allowed[--HelpingConfig.allowedLength];
      } else {
        i++;
      }
    }
    QueueMessage(['**Clear**', `Cleared ${ccount} allowed IDs and ${logs} log messages.`], message.channel.id);
    WriteConfig();
  }, async function(message, ids) {
    if(message.author.id != Owner) {
      return;
    }
    if(ids.length < 1) {
      return QueueMessage(['**Delete**', 'You need to provide a channel ID and a list of messages which are to be deleted from the channel, or no messages to delete all of them.'], message.channel.id);
    }
		if(ids.length == 1) {
			for(let i = 0; i < HelpingConfig.statusesLength; i++) {
				if(Config.statuses[i][0] == ids[0]) {
					ids[ids.length] = [Config.statuses[i][1], i];
				}
			}
		}
    for(let i = 1; i < ids.length; i++) {
			const response = await XHR('DELETE', `https://discord.com/api/v6/channels/${ids[0]}/messages/${ids[i] instanceof Array ? ids[i][0] : ids[i]}`, null, [['authorization', Config.token]]);
			if(response[0] == 1) {
				if(ids[i] instanceof Array) Config.statuses[ids[i][1]] = Config.statuses[--HelpingConfig.statusesLength];
	      QueueMessage(['**Delete**', `Successfully deleted message ID ${ids[i]}.`], message.channel.id, false, false, false);
			} else {
				QueueMessage(['**Delete**', `Couldn't delete message ID ${ids[i]}.`], message.channel.id, false, false, false);
			}
    }
		if(ids.length == 1) {
			QueueMessage(['**Delete**', 'No messages to delete.'], message.channel.id, false, false, false);
		}
		WriteConfig();
    StartMessageCycle(message.channel.id);
  }, async function(message) {
		const res = await XHR('HEAD', 'https://diep.io');
		if(res[0] == 1) {
			QueueMessage(['**Update**', `Diep.io was last modified on ${res[2].getResponseHeader('last-modified')}`], message.channel.id);
		} else {
			QueueMessage(['**Update**', `Error: ${res[1]}`], message.channel.id);
		}
	}, function(message) {
		if(message.author.id != Owner) {
			return;
		}
		var smartIndex = 0;
		try {
      FragmentMessage('' + eval(message.content.substring(message.content.toLowerCase().indexOf('eval') + 4)), 'Eval', message.channel.id, false, false, false);
		} catch(error) {
			FragmentMessage(`Error: ${error.message}`, 'Eval', message.channel.id);
		}
	}];
  Client.on('message', async function(M) {
    const message = M.content.toLowerCase().FullTrim();
    if((message.match(new RegExp(`^${Config.prefix}$`)) != null || message.match(new RegExp(`^${Config.prefix} `)) != null || message.match(/^\<\@\!696703931341864981>$/) != null ||
		message.match(/^\<\@\!696703931341864981> /) != null || message.match(/^<@696703931341864981>$/) != null || message.match(/^<@696703931341864981> /) != null) && (
      (function() {
        var result = false;
        for(let i = 0; i < HelpingConfig.allowedLength; i++) {
          if(Config.allowed[i] == M.channel.id || Config.allowed[i] == M.guild.id || Config.allowed[i] == M.author.id) {
            result = true;
          }
        }
        return result;
      })() == true || M.author.id == Owner)) {
      const keywords = message.startsWith(Config.prefix) == true ? message.substring(Config.prefix.length + 1).split(' ') : message.startsWith(`<@!696703931341864981>`) == true ? message.substring(23).split(' ') : message.substring(22).split(' ');
      if(keywords[0] != '') {
				const commands = ['help', 'uptime', 'enable', 'disable', 'servers', 'players', 'status', 'log', 'flags', 'cycle', 'info', 'leave', 'clear', 'delete', 'update', 'eval'];
				for(let i = 0; i < commands.length; i++) {
					if(keywords[0] == commands[i]) {
						Commands[i](M, keywords.slice(1));
						break;
					}
				}
      } else {
        QueueMessage(['**Help**', `Need help? Try \`${Config.prefix} help\``], M.channel.id);
      }
    }
  });
}

(async function() {
  await ReadConfig();
  Client.login(Config.token);
  Client.on('ready', Ready);
})();
