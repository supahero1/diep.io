// ==UserScript==
// @name         Eval Packet Overrider
// @version      1.9
// @description  Overrides eval packet to disable debugger and increase game's speed
// @author       don_shädaman
// @match        https://diep.io
// @match        https://florr.io
// @grant        none
// @namespace    https://greasyfork.org/users/719520
// ==/UserScript==
 
window.Function = new Proxy(window.Function, {
  construct: function(to, args) {
    if(args[0].startsWith("return") || args[0] < 10000) return new to(...args); // DiepStyle compability
    let a = args[0].match(/(\w+)=function\(\)/)[1];
    let b = args[0].match(/function\(\w+,(\w+)\){var (\w+)/);
    return new to(args[0]
                  .replace(/if\(!window\).*(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\((\w{1,2}),(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\);};.*/,`$1($2,$3)};`)
                  .replace(/function \w+\(\w+\){.*?}(?=\w)(?!else)(?!continue)(?!break)/,"")
                  .replace(/,window.*?\(\)(?=;)/,"")
                  .replace(new RegExp(`,${a}=function.*?${a}\\(\\);?}\\(`),`;${b[2]}(${b[1]}+1)}(`), ...args.slice(1));
  }
});
