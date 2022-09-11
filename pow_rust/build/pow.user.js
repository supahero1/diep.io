// ==UserScript==
// @name         Sexy PoW
// @namespace    shadamity
// @version      1.0
// @description  Supa fast PoW
// @author       don_shadaman
// @match        https://diep.io/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=diep.io
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

/* NOTE: only use if you ran test.js before */

var window = typeof unsafeWindow == "undefined" ? window : unsafeWindow;

let first = true;

window.WebSocket = class extends WebSocket {
  constructor(ip) {
    super(ip);
    first = true;
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

const p = window.Worker.prototype;

p.postMessage = new Proxy(p.postMessage, {
  apply: function(to, what, args) {
    const [id, action, string, difficulty, debug] = args[0];
    if(action == "solve" && !debug) {
      console.log(`solving PoW str ${string} difficulty ${difficulty}`);
      const date = new Date().getTime();
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://localhost:16384/", /* See test.js */
        data: JSON.stringify({ string, difficulty }),
        headers: {
          "Content-Type": "application/json"
        },
        onload: async function(res) {
          //console.log("locally solved pow:", res.responseText);
          console.log("solved");
          if(!first) {
            const wait = 9000 - (new Date().getTime() - date);
            console.log("delaying for 9 secs, waiting %d ms", wait);
            await sleep(wait);
          } else {
            first = false;
            console.log("first PoW for this socket, not delaying");
          }
          what.onmessage({ data: [id, res.responseText] });
        }
      });
    }
  }
});

window.TextDecoder.prototype.decode = new Proxy(window.TextDecoder.prototype.decode, {
  apply: function(to, what, args) { /* The new eval packet overrider, but don't expect it to work for long tbh */
    let ret = to.apply(what, args);
    if(args[0].length > 50000) {
      //console.log("ORIGINAL", ret);
      if(ret.match(/if\(!window.*?(\w+\[.{8,32}?\]\(.{8,32}?\));\};/g).length != 1) {
        console.error("Unsolvable eval packet");
      } else {
        ret = ret.replace(/if\(!window.*?(\w+\[.{8,32}?\]\(.{8,32}?\));\};/, "$1;};").replace("create_random_int();", "0;");
        //console.log("REPLACED", ret);
      }
    }
    return ret;
  }
});










































