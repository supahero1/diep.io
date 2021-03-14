"use strict";

const fs = require("fs");
const s = fs.readFileSync('eval_diep1.js').toString();
var script = s;

let b = 'abcdefghijklopqrstuxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
let i;
let c = [0, 0, 0];
function nextname() {
  let aa = b[c[0]] + b[c[1]] + b[c[2]];
  if(c[0]++ == b.length - 1) {
    c[0] = 0;
    if(c[1]++ == b.length - 1) {
      c[1] = 0;
      ++c[2];
    }
  }
  return aa;
}
function rektthestring(a, b, c) {
  var B = function(d) {
    var J = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=',
      j = String(d)['replace'](/=+$/, '');
    var M = '';
    for(var O = 0, Q, k, s = 0; k = j.charAt(s++); ~k && (Q = O % (4) ? Q * 64 + k : k, O++ % (4)) ? M += String.fromCharCode(255 & Q >> (-2 * O & 6)) : 0) {
      k = J.indexOf(k);
    }
    return M;
  };
  var z = function(d, J) {
    var M = [],
      O = 0,
      Q, l = '',
      R = '';
    d = B(d);
    for(var N = 0, I = d.length; N < I; N++) {
      R += '%' + ('00' + d.charCodeAt(N).toString(16)).slice(-2);
    }
    try {
      d = decodeURIComponent(R);
    } catch(err) {
      return 'error'; // probably done on purpose, it appears only once in the code and in addition it appears in an if which goes the wrong way (not towards the correct result)
    }
    var W;
    for(W = 0; W < 256; W++) {
      M[W] = W;
    }
    for(W = 0; W < 256; W++) {
      O = (O + M[W] + J.charCodeAt(W % J.length)) % (256), Q = M[W], M[W] = M[O], M[O] = Q;
    }
    W = 0, O = 0;
    for(var b = 0; b < d.length; b++) {
      W = (W + 1) % (256), O = (O + M[W]) % (256), Q = M[W], M[W] = M[O], M[O] = Q, l += String.fromCharCode(d.charCodeAt(b) ^ M[(M[W] + M[O]) % (256)]);
    }
    return l;
  };
  return z(c[a], b).replace(/\\/g, '\\\\');
}
var match;
const mapping = {};
const strings = {};
const funcs = {};

match = script.match(/((?:[-\+\*/]*0x[0-9a-f]+[-\+\*/]*)+)/);
while(match != null) {
  if(/[-\+\*/]/.test(match[1][match[1].length - 1]) == true) {
    if(/[^0-9]/.test(script[match.index + match[1].length]) == true) {
      match[1] = match[1].substring(0, match[1].length - 1);
    } else {
      match[1] += script.substring(match.index + match[1].length).match(/(\d*\.\d+)/)[1];
    }
  }
  let a = new Function('return ' + match[1])();
  script = script.replace(match[1], a);
  console.log(`replaced ${match[1]} with ${a}`);
  match = script.match(/((?:[-\+\*/]*0x[0-9a-f]+[-\+\*/]*)+)/);
}

match = script.match(/([-\+\*/])\((\d+)\)/);
while(match != null) {
  script = script.replace(`${match[1]}(${match[2]})`, match[1] + match[2]);
  console.log(`replaced ${match[1]}(${match[2]}) with ${match[1] + match[2]}`);
  match = script.match(/([-\+\*/])\((\d+)\)/);
}

const arrname = script.match(/ (.*?)=/)[1];
console.log(`name of the array of strings is ${arrname}`);
var array = script.match(/\[(.*?)\];/)[1];
array = array.replace(/['|"]/g, '').split(',');
var count = +script.match(new RegExp(`}\\(${arrname},(\\d+)\\)\\);`))[1];
console.log(`need to rotate ${count} times`);
while(count--) {
  array.push(array.shift());
}
console.log('rotated the array of strings');
script = script.replace(new RegExp(`.*?}\\(${arrname},\\d+\\)\\);`), '');
console.log('removed some dead code');
const base = script.match(/ (.*?)=/)[1];
funcs[base] = function(a, b, c) {
  //console.log('v', b, c);
  return rektthestring(b, c, array);
};
// remove the base

fs.writeFileSync('deobfus.js', script);

match = script.match(/([a-zA-Z0-9]+)=function\([a-zA-Z0-9,]*?\){return ([a-zA-Z0-9]+)\(.*?((?:[-+] ?)+)['"](.+?)['"],.*?\);}/);
while(match != null) {
  const modi = new Function(`return 0${match[3]}${match[4]}`)();
  funcs[match[1]] = new Function(`return arguments[0]['${match[2]}'](arguments[0], arguments[1] + ${modi}, arguments[2])`);
  script = script.replace(match[0], match[1] + '=function(){}');
  console.log(`saved ${match[1]} (modifies ${match[2]} by ${modi})`);
  match = script.match(/([a-zA-Z0-9]+)=function\([a-zA-Z0-9,]*?\){return ([a-zA-Z0-9]+)\(.*?((?:[-+] ?)+)['"](.+?)['"],.*?\);}/);
}

match = script.match(/([a-zA-Z0-9]{2})\((-?)['"](.*?)['"],['"](.{4})['"]\)/);
while(match != null) {
  script = script.substring(0, match.index) + `'${funcs[match[1]](funcs, match[2] == '-' ? -parseInt(match[3]) : parseInt(match[3]), match[4])}'` + script.substring(match.index + match[0].length);
  console.log(`replaced ${match[0]} with '${funcs[match[1]](funcs, match[2] == '-' ? -parseInt(match[3]) : parseInt(match[3]), match[4])}'`);
  match = script.match(/([a-zA-Z0-9]{2})\((-?)['"](.*?)['"],['"](.{4})['"]\)/);
}

script = script.replace(/.*?window/, 'var window');
console.log('removed some dead code');

match = script.match(/(?:.{2}=function\(\){})+/);
while(match != null) {
  script = script.replace(match[0], '');
  console.log(`replaced ${match[0]} with ''`);
  match = script.match(/(?:.{2}=function\(\){})+/);
}

script = script.replace(/(let|var|const) ,+/g, '$1 ');
script = script.replace(/(?:let|var|const) ;/g, '');

function StringRevolution() {
  script = script.replace(/\[\(('.{1,5}')\)/g, '[$1');

  match = script.match(/('[a-zA-Z]{1,6}'\+(?:'[a-zA-Z]{1,6}'\+)*'[a-zA-Z]{1,6}')/);
  while(match != null) {
    script = script.substring(0, match.index) + `'${match[1].split('+').map(r => r.substring(1, r.length - 1)).join('')}'` + script.substring(match.index + match[0].length);
    console.log(`replaced ${match[0]} with '${match[1].split('+').map(r => r.substring(1, r.length - 1)).join('')}'`);
    match = script.match(/('[a-zA-Z]{1,6}'\+(?:'[a-zA-Z]{1,6}'\+)*'[a-zA-Z]{1,6}')/);
  }

  match = script.match(/('\d{1,6}'\+(?:'\d{1,6}'\+)*'\d{1,6}')/);
  while(match != null) {
    script = script.substring(0, match.index) + `'${match[1].split('+').map(r => r.substring(1, r.length - 1)).join('')}'` + script.substring(match.index + match[0].length);
    console.log(`replaced ${match[0]} with '${match[1].split('+').map(r => r.substring(1, r.length - 1)).join('')}'`);
    match = script.match(/('\d{1,6}'\+(?:'\d{1,6}'\+)*'\d{1,6}')/);
  }

  match = script.match(/(:|\[)('.{1,6}'\+(?:'.{1,6}'\+)*'.{1,6}')(,|}|])/);
  while(match != null) {
    let a = match[2].split("'+'").join('');
    script = script.substring(0, match.index) + `${match[1]}'${a.substring(1, a.length - 1).replace(/'/g, '\\\'')}'${match[3]}` + script.substring(match.index + match[0].length);
    console.log(`replaced ${match[0]} with ${match[1]}'${a.substring(1, a.length - 1).replace(/'/g, '\\\'')}'${match[3]}`);
    match = script.match(/(:|\[)('.{1,6}'\+(?:'.{1,6}'\+)*'.{1,6}')(,|}|])/);
  }

  match = script.match(/:('[^\d]{1,6}'\+(?:'[^\d]{1,6}'\+)*'[^\d]{1,6}')(,|}|])/);
  while(match != null) {
    let a = match[1].split("'+'").join('');
    script = script.substring(0, match.index) + `:'${a.substring(1, a.length - 1).replace(/'/g, '\\\'')}'${match[2]}` + script.substring(match.index + match[0].length);
    console.log(`replaced ${match[0]} with :'${a.substring(1, a.length - 1).replace(/'/g, '\\\'')}'${match[2]}`);
    match = script.match(/:('[^\d]{1,6}'\+(?:'[^\d]{1,6}'\+)*'[^\d]{1,6}')(,|}|])/);
  }
}
StringRevolution();

script = script.replace(/.*?return function/, 'var FunctionToString=function(){}.constructor.prototype.toString;return function').replace('random_int', 'Math.random()*2147483647');
console.log('removed some dead code');

function Deobfuscate() {
  match = script.match(/(.)\['([a-zA-Z0-9]*?)'\]/);
  while(match != null) {
    if(/[:({,]/.test(match[1]) == true) {
      script = script.replace(`${match[1]}['${match[2]}']`, `${match[1]}'${match[2]}'`);
      console.log(`replaced ${match[1]}['${match[2]}'] with ${match[1]}'${match[2]}'`);
    } else {
      script = script.replace(`${match[1]}['${match[2]}']`, `${match[1]}.${match[2]}`);
      console.log(`replaced ['${match[2]}'] with .${match[2]}`);
    }
    match = script.match(/(.)\['([a-zA-Z0-9]*?)'\]/);
  }

  match = script.match(/('[a-zA-Z0-9]+')\(/);
  while(match != null) {
    script = script.replace(/('[a-zA-Z0-9]+')\(/, '[$1](');
    console.log(`replaced ${match[1]}( with [${match[1]}](`);
    match = script.match(/('[a-zA-Z0-9]+')\(/);
  }

  match = script.match(/'([a-zA-Z]{5})':'(.*?)'(,'[a-zA-Z]{5}':|})/);
  while(match != null) {
    strings[match[1]] = match[2];
    script = script.replace(match[0], match[3]);
    console.log(`replaced ${match[0]} with ''`);
    match = script.match(/'([a-zA-Z]{5})':'(.*?)'(,'[a-zA-Z]{5}':|})/);
  }

  script = script.replace(/,{2,}/g, ',').replace(/{,/g, '{').replace(/,(]|}|\))/, '$1');

  for(const string in strings) {
    match = script.match(new RegExp(`\\w+\\.${string}`));
    if(match != null) {
      script = script.replace(match[0], `'${strings[string]}'`);
      console.log(`replaced ${match[0]} with '${strings[string]}'`)
      match = script.match(new RegExp(`\\w+\\.${string}`));
    }
  }

  match = script.match(/('[a-zA-Z0-9]*?'\+(?:'[a-zA-Z0-9]*?'\+)*'[a-zA-Z0-9]*?')/);
  while(match != null) {
    let a = match[1].split("'+'").join('');
    script = script.substring(0, match.index) + `'${a.substring(1, a.length - 1).replace(/'/g, '\\\'')}'` + script.substring(match.index + match[0].length);
    console.log(`replaced ${match[0]} with '${a.substring(1, a.length - 1).replace(/'/g, '\\\'')}'`);
    match = script.match(/('[a-zA-Z0-9]*?'\+(?:'[a-zA-Z0-9]*?'\+)*'[a-zA-Z0-9]*?')/);
  }

  match = script.match(/'([a-zA-Z]*?)':function\(\w\){return \w\(\);}/);
  while(match != null) {
    mapping[match[1]] = function(a) {
      return `${a}()`;
    };
    script = script.replace(match[0], '');
    console.log(`replaced ${match[0]} with ''`);
    match = script.match(/'([a-zA-Z]*?)':function\(\w\){return \w\(\);}/);
  }

  match = script.match(/'([a-zA-Z]*?)':function\(\w,\w\){return \w\(\w\);}/);
  while(match != null) {
    mapping[match[1]] = function(a, b) {
      return `${a}(${b})`;
    };
    script = script.replace(match[0], '');
    console.log(`replaced ${match[0]} with ''`);
    match = script.match(/'([a-zA-Z]*?)':function\(\w,\w\){return \w\(\w\);}/);
  }

  match = script.match(/'([a-zA-Z]*?)':function\(\w,\w\){return \w([+-\/*&^%|><]|={2,3}|<<|>>|>>>|!=|!==|<=|>=)\w;}/);
  while(match != null) {
    mapping[match[1]] = new Function(`return \`\${arguments[0]}${match[2]}\${arguments[1]}\``);
    script = script.replace(match[0], '');
    console.log(`replaced ${match[0]} with ''`);
    match = script.match(/'([a-zA-Z]*?)':function\(\w,\w\){return \w([+-\/*&^%|><]|={2,3}|<<|>>|>>>|!=|!==|<=|>=)\w;}/);
  }

  script = script.replace(/,{2,}/g, ',').replace(/{,/g, '{').replace(/,(]|}|\))/, '$1');

  for(const map in mapping) {
    for(let i = 0; i < 10; ++i) {
      match = script.match(new RegExp(`\\w+\\.${map}\\(([^(,]*?)\\)`));
      if(match != null) {
        script = script.replace(match[0], mapping[map](match[1]));
        console.log(`replaced ${match[0]} with ${mapping[map](match[1])}`)
        match = script.match(new RegExp(`\\w+\\.${map}\\(([^(,]*?)\\)`));
      }
      match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?)\\)`));
      if(match != null) {
        script = script.replace(match[0], mapping[map](...match[1].split(',')));
        console.log(`replaced ${match[0]} with ${mapping[map](...match[1].split(','))}`)
        match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?)\\)`));
      }
      match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?,[^(]*?)\\)`));
      if(match != null) {
        script = script.replace(match[0], mapping[map](...match[1].split(',')));
        console.log(`replaced ${match[0]} with ${mapping[map](...match[1].split(','))}`)
        match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?,[^(]*?)\\)`));
      }
      match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?\\(\\),[^(]*?)\\)`));
      if(match != null) {
        script = script.replace(match[0], mapping[map](...match[1].split(',')));
        console.log(`replaced ${match[0]} with ${mapping[map](...match[1].split(','))}`)
        match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?\\(\\),[^(]*?)\\)`));
      }
      match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?,[^(]*?\\(\\))\\)`));
      if(match != null) {
        script = script.replace(match[0], mapping[map](...match[1].split(',')));
        console.log(`replaced ${match[0]} with ${mapping[map](...match[1].split(','))}`)
        match = script.match(new RegExp(`\\w+\\.${map}\\(([^(]*?,[^(]*?\\(\\))\\)`));
      }
    }
  }

  StringRevolution();
}
Deobfuscate();
Deobfuscate();

fs.writeFileSync('deobfus.js', script);
