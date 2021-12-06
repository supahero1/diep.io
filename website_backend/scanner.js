const fs = require("fs");
const net = require("net");
function http_applier(to, what, args) {
  if(args[0] && args[0].headers) {
    args[0].headers = {
      Host: args[0].host,
      Connection: undefined,
      Pragma: undefined,
      "Cache-Control": undefined,
      "User-Agent": undefined,
      Upgrade: undefined,
      Origin: undefined,
      "Sec-WebSocket-Version": undefined,
      "Accept-Encoding": undefined,
      "Accept-Language": undefined,
      "Sec-WebSocket-Key": undefined,
      "Sec-WebSocket-Extensions": undefined,
      ...args[0].headers,
    };
    Object.keys(args[0].headers).forEach(key => !args[0].headers[key] && delete args[0].headers[key]);
  }
  return to.apply(what, args);
}
const http = require("http");
http.get = new Proxy(http.get, {
  apply: http_applier
});
const https = require("https");
https.get = new Proxy(https.get, {
  apply: http_applier
});
const WebSocket = require("ws");

/* Init */

const diep_data = JSON.parse(fs.readFileSync("data.json"));
diep_data.binary_build = diep_data.build.split("").map(r => r.charCodeAt());

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

function seconds(ms) {
  return ms * 1000;
}

function minutes(ms) {
  return ms * 60000;
}

const diep_servers = {};

var api_socket;
let last_server_fetch_at = 0;
const api_fetch_delay = 1000;
const connect_delay = 750;
const development = false;

let scoreboard_blacklist = [];
const blacklist_safety = setInterval(function() { scoreboard_blacklist = [] }, 30000);
let scoreboard_data;
let scoreboard_seeded = false;
let scoreboard_in_progress = false;
let tick_xor = 2;
let tick_xor_seeded = false;
let tick_xor_in_progress = false;

const player_count_every = minutes(30);
const player_count_resolution = 25;
let player_count_avg = [];
let temp;
try {
  temp = fs.readFileSync("./players");
} catch(e) {}
let player_counts = temp ? (function() { try { return JSON.parse(temp) } catch(e) { return [] } })() : [];
let player_count_first = player_counts.length == 0 || (Math.max(player_count_every - (new Date().getTime() - player_counts[0][0]), 0) == 0);
function add_player_count(count) {
  if(player_count_first) {
    player_count_first = false;
    player_counts[player_counts.length] = [new Date().getTime(), count];
  } else {
    player_count_avg[player_count_avg.length] = count;
  }
}
function find_date(x) {
  let start = 0;
  let end = player_counts.length - 1;
  while(start <= end) {
    let mid = (start + end) >> 1;
    if(player_counts[mid][0] == x) {
      return mid;
    } else if(player_counts[mid][0] < x) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  return start;
}
setInterval(function() {
  if(player_count_avg.length == 0) {
    player_counts[player_counts.length] = [new Date().getTime(), NaN];
  } else {
    let sum = player_count_avg[0];
    for(let i = 1; i < player_count_avg.length; ++i) {
      sum += player_count_avg[i];
    }
    sum /= player_count_avg.length;
    player_count_avg = [];
    player_counts[player_counts.length] = [new Date().getTime(), sum | 0];
  }
  fs.writeFileSync("./players", JSON.stringify(player_counts));
}, player_count_every);

function auth(req, http=0) {
  const headers = {};
  for(let i = 0; i < req.rawHeaders.length; i += 2) {
    headers[req.rawHeaders[i].toLowerCase()] = req.rawHeaders[i + 1];
  }
  if(!development && !http && (!headers.pragma || headers.pragma != "no-cache")) return 0;
  if(!development && !http && (!headers["cache-control"] || headers["cache-control"] != "no-cache")) return 0;
  if(!development && !http && (!headers.origin || headers.origin != "https://shadam.xyz")) return 0;
  if(!development && http && (!headers.referer || !headers.referer.startsWith("https://shadam.xyz/diep/players"))) return 0;
  if(!headers["accept-encoding"]) return 0;
  if(!headers["accept-language"]) return 0;
  if(!headers["user-agent"] || headers["user-agent"].match(/headless/i) != null || headers["user-agent"].length < 4) return 0;
  return 1;
}

const web_lb_http_server = http.createServer();
const web_lb_ws_server = new WebSocket.Server({
  noServer: true,
  perMessageDeflate: {
    threshold: 16
  }
});
web_lb_ws_server.on("connection", function(ws) {
  ws.on("error", function(){});
  ws.on("close", function(){});
  ws.on("message", function(){ws.close()});
  ws.send(JSON.stringify({ a: "", b: diep_servers }));
});
web_lb_http_server.on("upgrade", function(request, socket, head) {
  if(!auth(request)) {
    socket.write(`HTTP/1.1 401 Unauthorized\r\n\r\n`);
    socket.destroy();
    return;
  }
  web_lb_ws_server.handleUpgrade(request, socket, head, function(ws) {
    web_lb_ws_server.emit("connection", ws, request);
  });
});
web_lb_http_server.listen(8118, "localhost");
function broadcast(data) {
  web_lb_ws_server.clients.forEach(function(client) {
    if(client.readyState == WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function web_players_onreq(req, res) {
  if(development) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://shadam.xyz/diep/players");
  }
  if(req.method == "OPTIONS") {
    res.setHeader("Access-Control-Allow-Headers", "X-start, X-end");
    res.writeHead(200);
    return res.end();
  }
  if(!auth(req, 1)) {
    res.writeHead(401);
    return res.end();
  }
  const headers = {};
  for(let i = 0; i < req.rawHeaders.length; i += 2) {
    headers[req.rawHeaders[i].toLowerCase()] = req.rawHeaders[i + 1];
  }
  if(!headers["x-start"] || !headers["x-end"]) {
    res.writeHead(401);
    return res.end();
  }
  let start = new Date(headers["x-start"]);
  let end = new Date(headers["x-end"]);
  if(start == "Invalid Date" || end == "Invalid Date") {
    res.writeHead(200);
    return res.end(JSON.stringify({}));
  }
  start = start.valueOf();
  end = end.valueOf();
  if(player_counts.length == 0 || end < player_counts[0][0] || start > player_counts[player_counts.length - 1][0]) {
    res.writeHead(200);
    return res.end(JSON.stringify({}));
  }
  if(player_counts.length == 1) {
    res.writeHead(200);
    return res.end(JSON.stringify({ a: player_counts }));
  }
  const start_idx = find_date(start);
  const end_idx = find_date(end) + 1;
  const arr = player_counts.slice(start_idx, end_idx);
  if(arr.length <= player_count_resolution) {
    res.writeHead(200);
    return res.end(JSON.stringify({ a: arr }));
  }
  const chance = 1 - (player_count_resolution / arr.length);
  let mult = 0;
  for(let i = 1; i < arr.length - 1; ++i) {
    mult += chance;
    if(mult >= 1) {
      --mult;
      arr.splice(i, 1);
      --i;
    }
  }
  res.writeHead(200);
  return res.end(JSON.stringify({ a: arr }));
}
const web_players_http_server = http.createServer(web_players_onreq);
web_players_http_server.listen(8200, "localhost");

function DiepParser() {
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
DiepParser.prototype.set = function(a, b) {
  this.buffer = a;
  this.at = b || 0;
};
DiepParser.prototype.seeded = function() {
  return this.scoreboardData.order.length == 6;
};
DiepParser.prototype.getU = function() {
  let number = 0;
  let count = 0;
  do {
    number |= (this.buffer[this.at] & 0x7f) << (7 * count++);
  } while((this.buffer[this.at++] >> 7) == 1);
  return number;
};
DiepParser.prototype.getI = function() {
  const i = this.getU();
  return 0 - (i & 1) ^ i >>> 1;
};
DiepParser.prototype.getF = function() {
  this.u.set([this.buffer[this.at++], this.buffer[this.at++], this.buffer[this.at++], this.buffer[this.at++]]);
  return this.f[0];
};
DiepParser.prototype.getS = function() {
  const len = this.at;
  while(this.buffer[this.at++] != 0);
  try {
    return decodeURIComponent(this.buffer.slice(len, this.at - 1).map(r => `%${r.toString(16).padStart(2, "0")}`).join(""));
  } catch(err) {
    return "";
  }
};
DiepParser.prototype.parseScoreboard = function(ticks) {
  let count;
  const scoreboard = {
    entries: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
    uptime: ticks
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
          scoreboard.entries[j].tank = this.getI();
        }
        break;
      }
      case this.count: {
        this.at += this.scoreboardData.count_offset;
        count = this.getU();
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
  
  
  
  scoreboard.entries = scoreboard.entries.slice(0, count);
  for(let i = 0; i < count; ++i) {
    scoreboard.entries[i].name += scoreboard.entries[i].suffix;
    delete scoreboard.entries[i].suffix;
  }
  return scoreboard;
};
DiepParser.prototype.extractScoreboard = function() {
  if(!this.seeded()) {
    return { uptime: 0, entries: [] };
  }
  if(this.buffer[0] == 0) {
    this.at = 1;
  } else {
    this.at = 0;
  }
  const ticks = this.getU() ^ tick_xor;
  this.getU();
  this.getU();
  this.getU();
  this.getU();
  ++this.at;
  if(this.getU() == 9 && this.getU() == 6) {
    ++this.at;
    return this.parseScoreboard(ticks);
  } else {
    return { uptime: ticks, entries: [] };
  }
};
DiepParser.prototype.memcmp = function(arr) {
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
DiepParser.prototype.forEachPermutation4 = function(elements, func) {
  for(let i = 0; i < 4; ++i) {
    for(let j = 0; j < 4; ++j) {
      if(j == i) continue;
      for(let k = 0; k < 4; ++k) {
        if(k == i || k == j) continue;
        for(let l = 0; l < 4; ++l) {
          if(l == i || l == j || l == k) continue;
          const ret = func(elements[i].concat(elements[j]).concat(elements[k]).concat(elements[l]));
          if(ret > 0) {
            return ret;
          }
        }
      }
    }
  }
  return 0;
};
DiepParser.prototype.seedScoreboard = function() {
  if(this.buffer[0] == 0) {
    this.at = 1;
  } else {
    this.at = 0;
  }
  this.getU();
  this.getU();
  this.getU();
  this.getU();
  this.getU();
  ++this.at;
  if(this.getU() == 9 && this.getU() == 6) {
    ++this.at;
    
    let last_idx = this.at;
    
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
            this.scoreboardData.order[this.scoreboardData.order.length] = this.name;
            if(this.scoreboardData.order.length == 6) return 2;
            this.at += 28;
            last_idx = this.at;
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
            this.scoreboardData.order[this.scoreboardData.order.length] = this.color;
            if(this.scoreboardData.order.length == 6) return 2;
            this.at += 10;
            last_idx = this.at;
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
        let save = this.at;
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
        return -1;
      }
    }
  } else {
    console.log("not a valid seed for scoreboard");
  }
  return 0;
};



/* API socket */

function get_gamemode(gamemode) {
  const time = new Date().getTime();
  if(api_socket.readyState == "open") {
    if(time - last_server_fetch_at >= api_fetch_delay) {
      last_server_fetch_at = time;
      api_socket.write(`GET /endpoint/diepio-${gamemode}/findeach HTTP/1.1\r\nHost: api.n.m28.io\r\nConnection: keep-alive\r\nCache-Control: max-age=0\r\n\r\n`);
    } else {
      setTimeout(get_gamemode, api_fetch_delay + last_server_fetch_at - time, gamemode);
    }
  } else {
    setTimeout(get_gamemode, api_fetch_delay + last_server_fetch_at - time, gamemode);
  }
}

const gamemodes_to_fetch = ["ffa", "sandbox", "tag", "teams", "4teams", "maze", "dom", "survival"];
const gamemode_ffa = gamemodes_to_fetch.findIndex(r => r == "ffa");
const gamemode_teams = gamemodes_to_fetch.findIndex(r => r == "teams");
const gamemode_4teams = gamemodes_to_fetch.findIndex(r => r == "4teams");
const gamemode_maze = gamemodes_to_fetch.findIndex(r => r == "maze");
const gamemode_dom = gamemodes_to_fetch.findIndex(r => r == "dom");
const gamemode_survival = gamemodes_to_fetch.findIndex(r => r == "survival");
const gamemode_tag = gamemodes_to_fetch.findIndex(r => r == "tag");
const gamemode_sandbox = gamemodes_to_fetch.findIndex(r => r == "sandbox");
var gamemodes_idx = 0;
let api_once = true;
let api_errors = 0;

function make_api_connection() {
  api_socket = new net.createConnection(80, "api.n.m28.io");
  api_socket.on("connect", function() {
    api_errors = 0;
    if(api_once) {
      api_once = false;
      gamemodes_idx = (gamemodes_idx + 1) % gamemodes_to_fetch.length;
      get_gamemode(gamemodes_to_fetch[gamemodes_idx]);
    }
  });
  api_socket.on("close", function() {
    console.log("api socket closed");
    if(++api_errors == 10) {
      console.log("quitting, api_errors is 10");
      process.exit();
    }
    setTimeout(make_api_connection, 1000 * api_errors);
  });
  api_socket.on("data", function(x) {
    if(x.byteLength > 1024 * 64) {
      console.log("api too long response");
      return;
    }
    const body = String.fromCharCode(...new Uint8Array(x));
    if(!body.startsWith("HTTP/1.1 200 OK")) {
      console.log("api response not ok");
    } else {
      const response = body.slice(body.indexOf("\r\n\r\n") + 4);
      const servers = JSON.parse(response);
      if(servers.servers != null) {
        on_servers(servers.servers);
      }
      gamemodes_idx = (gamemodes_idx + 1) % gamemodes_to_fetch.length;
      get_gamemode(gamemodes_to_fetch[gamemodes_idx]);
    }
  });
}
make_api_connection();

function get_region(region) {
  return {
    "amsterdam": 0,
    "miami": 1,
    "la": 2,
    "singapore": 3,
    "sydney": 4
  }[region];
}

function on_servers(servers) {
  for(const server in servers) {
    const id = servers[server].id;
    if(diep_servers[id] == null) {
      diep_servers[id] = {
        region: get_region(server.match(/-(.+)/)[1]),
        gamemode: gamemodes_idx,
        api_at: new Date().getTime(),
        conn_at: -1
      };
      if(gamemodes_idx == gamemode_teams || gamemodes_idx == gamemode_4teams || gamemodes_idx == gamemode_tag) {
        diep_servers[id].parties = {};
        diep_servers[id].scoreboard = {
          uptime: 0,
          entries: []
        };
      }
      if(gamemodes_idx != gamemode_sandbox && gamemodes_idx != gamemode_survival && gamemodes_idx != gamemode_dom) {
        diep_servers[id].player_count = -1;
      }
      broadcast({ a: id, b: diep_servers[id] });
    } else {
      diep_servers[id].api_at = new Date().getTime();
      if(diep_servers[id].gamemode != gamemodes_idx) {
        diep_servers[id].gamemode = gamemodes_idx;
        diep_servers[id].conn_at = -1;
        if(gamemodes_idx == gamemode_teams || gamemodes_idx == gamemode_4teams || gamemodes_idx == gamemode_tag) {
          diep_servers[id].parties = {};
          diep_servers[id].scoreboard = {
            uptime: 0,
            entries: []
          };
        } else {
          delete diep_servers[id].parties;
          delete diep_servers[id].scoreboard;
        }
        if(gamemodes_idx != gamemode_sandbox && gamemodes_idx != gamemode_survival && gamemodes_idx != gamemode_dom) {
          diep_servers[id].player_count = -1;
        } else {
          delete diep_servers[id].player_count;
        }
        console.log("changed gamemode of server id " + id);
        broadcast({ a: id });
        broadcast({ a: id, b: diep_servers[id] });
      } else {
        broadcast({ a: id, b: { api_at: diep_servers[id].api_at } });
      }
    }
    if(!scoreboard_seeded && !scoreboard_in_progress && diep_servers[id].gamemode == gamemode_tag && !scoreboard_blacklist.includes(id)) {
      scoreboard_in_progress = true;
      connect(id, 1);
    }
    if(!tick_xor_seeded && !tick_xor_in_progress && diep_servers[id].gamemode == gamemode_sandbox) {
      tick_xor_in_progress = true;
      connect(id, 2);
    }
  }
}

function* server_generator() {
  while(1) {
    if(Object.keys(diep_servers).length == 0) {
      yield "";
      continue;
    }
    for(const id in diep_servers) {
      if(diep_servers[id].gamemode != gamemode_sandbox && diep_servers[id].gamemode != gamemode_survival && diep_servers[id].gamemode != gamemode_dom) {
        yield id;
      }
    }
  }
}
const server_gen = server_generator();

function server_scanner() {
  const id = server_gen.next().value;
  if(id == "") {
    setTimeout(server_scanner, api_fetch_delay);
  } else {
    connect(id);
    setTimeout(server_scanner, connect_delay);
  }
}

function server_purger() {
  let time = new Date().getTime();
  for(const id in diep_servers) {
    if(time - diep_servers[id].api_at >= minutes(25) && (diep_servers[id].conn_at == -1 || time - diep_servers[id].conn_at >= minutes(5))) {
      delete diep_servers[id];
      broadcast({ a: id });
    }
  }
}

setInterval(server_purger, minutes(1));

/* Local socket */

function get_len(buf) {
  return (buf[3] << 24) | (buf[2] << 16) | (buf[1] << 8) | buf[0];
}

const callbacks = {};
var cb_id = 0;
var local_socket = new net.createConnection(8120, "localhost");
var local_socket_cache = [];
local_socket.on("close", function() {
  console.log("local socket closed");
  process.exit();
});
local_socket.on("data", function(x) {
  local_socket_cache = local_socket_cache.concat(...x);
  while(local_socket_cache.length >= 5 && get_len(local_socket_cache.slice(1, 5)) <= local_socket_cache.length - 5) {
    const len = get_len(local_socket_cache.slice(1, 5));
    if(callbacks[local_socket_cache[0]] != null) {
      callbacks[local_socket_cache[0]](local_socket_cache.slice(5, len + 5));
    }
    delete callbacks[local_socket_cache[0]];
    local_socket_cache = local_socket_cache.slice(len + 5);
  }
});
function solve_pow(packet, cb) {
  do {
    cb_id = (cb_id + 1) % 256;
  } while(callbacks[cb_id] != null);
  callbacks[cb_id] = cb;
  const len = new ArrayBuffer(4);
  const view = new DataView(len);
  view.setUint32(0, 2 + packet.length, true);
  local_socket.write(new Uint8Array([...new Uint8Array(len),  0, cb_id, ...packet]));
}
function decompress(packet, cb) {
  do {
    cb_id = (cb_id + 1) % 256;
  } while(callbacks[cb_id] != null);
  callbacks[cb_id] = cb;
  const len = new ArrayBuffer(4);
  const view = new DataView(len);
  view.setUint32(0, 2 + packet.length, true);
  local_socket.write(new Uint8Array([...new Uint8Array(len),  1, cb_id, ...packet]));
}

/* Game socket */

function decode(sock, data) {
  let i = 1;
  const out = Array.from(data.slice(1)).map(function(r) {
    try {
      const o = r ^ diep_data.decode[sock.diep.in][i];
      i = (i + 1) % diep_data.decode[0].length;
      return o;
    } catch(err) {
      console.log("decode called too many times");
      process.exit();
    }
  });
  sock.diep.in++;
  return out;
}

function encode(sock, data) {
  let i = 1;
  const out = new Uint8Array([diep_data.headers[sock.diep.out], ...data.map(function(r) {
    try {
      const o = r ^ diep_data.encode[sock.diep.out][i];
      i = (i + 1) % diep_data.encode[0].length;
      return o;
    } catch(err) {
      console.log("encode called too many times");
      process.exit();
    }
  })]);
  sock.diep.out++;
  return out;
}

function write_vu(number) {
  let vu = [];
  while(number > 0x7f) {
    vu[vu.length] = (number & 0x7f) | 0x80;
    number >>>= 7;
  }
  vu[vu.length] = number;
  return vu;
}

function read_vu(packet, at = 0) {
  let number = 0;
  let count = 0;
  do {
    number |= (packet[at] & 0x7f) << (7 * count++);
  } while((packet[at++] >> 7) == 1);
  return number;
}

function deal_with_eval_packet(str) {
  let a = str.match(/(\w+)=function\(\)/);
  let b = str.match(/function\(\w+,(\w+)\){var (\w+)/);
  if(a != null && b != null) {
    a = a[1];
    const replaced = str
      .replace(/if\(!window\).*(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\((\w{1,2}),(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\);};.*/,`$1($2,$3)};`)
      .replace(/function \w+\(\w+\){.*?}(?=\w)(?!else)(?!continue)(?!break)/,"")
      .replace(/,window.*?\(\)(?=;)/,"")
      .replace(new RegExp(`,${a}=function.*?${a}\\(\\);?}\\(`),`;${b[2]}(${b[1]}+1)}(`);
    let result;
    try {
      (new Function(replaced))()(function(res) {
        result = res;
      });
    } catch(err) {
      console.log("failed to reduce eval packet 1: " + err.message);
      process.exit();
    }
    return result;
  } else {
    console.log("failed to reduce eval packet 2: " + err.message);
    process.exit();
  }
}

function on_tag_scoreboard(packet, info) {
  const parser = new DiepParser();
  parser.set(packet);
  if(parser.seedScoreboard() == -1) {
    scoreboard_blacklist[scoreboard_blacklist.length] = info.server_code;
  }
  if(parser.seeded()) {
    scoreboard_data = parser.scoreboardData;
    scoreboard_seeded = true;
    clearInterval(blacklist_safety);
    if(tick_xor_seeded) {
      setImmediate(server_scanner);
    }
    console.log("got scoreboard seed");
  }
  
  on_scoreboard(packet, info);
}

function on_sbx_scoreboard(packet, info) {
  tick_xor = read_vu(packet) ^ 2;
  tick_xor_seeded = true;
  if(scoreboard_seeded) {
    setImmediate(server_scanner);
  }
  console.log("got tick xor");
}

function on_scoreboard(packet, info) {
  if(scoreboard_seeded && tick_xor_seeded) {
    const parser = new DiepParser();
    parser.set(packet);
    parser.scoreboardData = scoreboard_data;
    diep_servers[info.server_code].scoreboard = parser.extractScoreboard();
    const b = {
      scoreboard: diep_servers[info.server_code].scoreboard
    };
    if((info.meta.gamemode == gamemode_teams || info.meta.gamemode == gamemode_4teams || info.meta.gamemode == gamemode_dom) && info.party_code != null) {
      let ok = false;
      if(!diep_servers[info.server_code].parties) {
        diep_servers[info.server_code].parties = {};
      }
      if(diep_servers[info.server_code].parties[info.party_code] == null) {
        ok = true;
      }
      diep_servers[info.server_code].parties[info.party_code] = 1;
      if(ok) {
        b.parties = diep_servers[info.server_code].parties;
      }
    }
    if(info.player_count != null) {
      if(diep_servers[info.server_code].player_count != info.player_count) {
        b.player_count = info.player_count;
      }
      diep_servers[info.server_code].player_count = info.player_count;
      add_player_count(info.player_count);
    }
    broadcast({ a: info.server_code, b });
  }
}

function sock_ondata(ws, data) {
  if(!ws.diep.evaled_packet && data.length > 1000) {
    ws.diep.evaled_packet = 1;
    ws.send(encode(ws, [data[1], ...write_vu(deal_with_eval_packet(String.fromCharCode(...data.slice(2, data.length - 1))))]));
    if(ws.diep.pow_packet != null) {
      ws.send(encode(ws, ws.diep.pow_packet));
    }
    return;
  }
  
  if(!ws.diep.solved_pow && data.length > 1 && data[0] < 23 && data[data.length - 1] == 0) {
    ws.diep.solved_pow = 1;
    solve_pow(data.slice(0, data.length - 1), function(result) {
      if(ws.diep.evaled_packet) {
        ws.send(encode(ws, [...result, 0]));
      } else {
        ws.diep.pow_packet = [...result, 0];
      }
    });
    return;
  }
  
  if(!ws.diep.party_code && data.length >= 4 && data.length <= 8) {
    ws.diep.party_code = data.map(r => r.toString(16).padStart(2, "0").split("").reverse().join("")).join("").toUpperCase();
  }
  
  if(!ws.diep.player_count && data.length > 0 && data.length < 4) {
    ws.diep.player_count = read_vu(data);
  }
  
  for(let i = 0; i < data.length - 5; ++i) {
    if(data[i] == 1 && data[i + 1] == 0 && data[i + 2] == 1 && data[i + 3] == 9 && data[i + 4] == 6 && data[i + 5] == 1) {
      ws.diep.no_more = true;
      ws.diep.callback(data, ws.diep);
      ws.close();
      break;
    }
  }
}

function connect(id, specifics) {
  const copy = diep_servers[id];
  const ws = new WebSocket(`wss://${id}.s.m28n.net`, {
    origin: "https://diep.io",
    rejectUnauthorized: false,
    headers: {
      Pragma: "no-cache",
      "Cache-Control": "no-cache",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US;q=0.8,en;q=0.7"
    }
  });
  ws.binaryType = "arraybuffer";
  ws.diep = { in: 0, out: 0, evaled_packet: 0, solved_pow: 0, pow_packet: null, server_code: id, player_count: null, party_code: null, no_more: false, callback: specifics == 1 ? on_tag_scoreboard : specifics == 2 ? on_sbx_scoreboard : on_scoreboard, meta: copy };
  ws.onopen = function() {
    console.log("sock open");
    if(diep_servers[id] == null) {
      diep_servers[id] = copy;
      diep_servers[id].scoreboard = {
        uptime: 0,
        entries: []
      };
    }
    diep_servers[id].conn_at = new Date().getTime();
    broadcast({ a: id, b: { conn_at: diep_servers[id].conn_at } });
    ws.send(new Uint8Array([0, ...diep_data.binary_build, 0, 0, 0, 0]));
  };
  ws.onclose = function(e) {
    console.log("sock closed");
    if(specifics == 1) {
      setTimeout(function() {
        scoreboard_in_progress = false;
      }, 50);
    } else if(specifics == 2) {
      setTimeout(function() {
        tick_xor_in_progress = false;
      }, 50);
    }
  };
  ws.onerror = function(e) {
    console.log("sock err:", e);
  };
  ws.onmessage = function({ data }) {
    if(ws.diep.no_more || ws.diep.in > diep_data.decode.length) return;
    
    const x = Buffer.from(data);
    if(x.length == 42 && x[0] == 1 && x[41] == 0) {
      console.log("outdated");
      process.exit();
    }
    let msg = decode(ws, x);
    if(msg.length > 100 && get_len(msg) > 100 && get_len(msg) < 200000) {
      decompress(msg, function(data) {
        sock_ondata(ws, data);
      });
    } else {
      sock_ondata(ws, msg);
    }
    
    if(ws.diep.in >= diep_data.decode.length) {
      ws.diep.no_more = true;
      ws.close();
    }
  };
}