import puppeteer from "puppeteer-extra";
import stealth_plugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(stealth_plugin());
import anonymize_ua from "puppeteer-extra-plugin-anonymize-ua";
puppeteer.use(anonymize_ua());
import fetch from "node-fetch";
import fs from "fs";

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

function inject() {
  var resolve_func;
  window.resolver = new Promise(function(resolve) {
    resolve_func = resolve;
  });
  
  localStorage.setItem("gamemode", "4teams");
  
  var DECODE_TABLE;
  var DECODE_TABLE_LOCATION;
  var DECODE_TABLE_LENGTH;

  var ENCODE_TABLE;
  var ENCODE_TABLE_LOCATION;
  var ENCODE_TABLE_LENGTH;
  
  var decode_tables = [];
  var wants_decodes = 7;
  var encode_tables = [];
  var wants_encodes = 2;
  var encode_headers = [];

  var temp_size = 0;
  var temp_idx;
  var temp_info;

  var decoding_size;
  var decoding_idx;
  var decoding_info;

  var encoding_size;
  var encoding_idx;
  var encoding_info;
  
  window.Function = new Proxy(window.Function, {
    construct: function(to, args) {
      let a = args[0].match(/(\w+)=function\(\)/);
      let b = args[0].match(/function\(\w+,(\w+)\){var (\w+)/);
      if(a != null && b != null) {
        a = a[1];
        const replaced = args[0]
          .replace(/if\(!window\).*(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\((\w{1,2}),(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\);};.*/,`$1($2,$3)};`)
          .replace(/function \w+\(\w+\){.*?}(?=\w)(?!else)(?!continue)(?!break)/,"")
          .replace(/,window.*?\(\)(?=;)/,"")
          .replace(new RegExp(`,${a}=function.*?${a}\\(\\);?}\\(`),`;${b[2]}(${b[1]}+1)}(`);
        let result;
        try {
          (new to(replaced))()(function(res) {
            result = res;
          });
        } catch(err) {
          return new to(...args);
        }
        return function() {
          return (cb) => cb(result);
        };
      } else {
        return new to(...args);
      }
    }
  });
  
  (function() {
    let decompressed = false;
    let pow = null;
    function sleep(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms);
      });
    }
    let body_build = document.body.innerHTML.match(/build_([0-9a-zA-Z])/);
    let head_build = document.head.innerHTML.match(/build_([0-9a-zA-Z])/);
    const build = body_build ? body_build[1] : head_build[1];
    WebSocket = class extends WebSocket {
      constructor(ip) {
        super(ip);
        if(ip.match(/\.m28n\./) != null) {
          decode_tables = [];
          wants_decodes = 7;
          encode_tables = [];
          wants_encodes = 2;
          encode_headers = [];
          
          this.send = new Proxy(this.send, {
            apply: function(to, what, args) {
              if(!decompressed) {
                decompressed = true;
              }
              if(wants_encodes > 0 && !String.fromCharCode(...new Uint8Array(args[0])).includes(build)) {
                encode_headers[encode_headers.length] = args[0][0];
                
                if(!(--wants_encodes) && !wants_decodes) {
                  resolve_func([decode_tables, encode_tables, encode_headers]);
                }
              }
              if(pow != null) {
                setImmediate(...pow);
              }
              return to.apply(what, args);
            }
          });
        }
      }
    }
    window.m28.pow.solve = new Proxy(window.m28.pow.solve, {
      apply: function(to, what, args) {
        return to.apply(what, [args[0], args[1], function(res) {
          if(decompressed) {
            return to.apply(what, args);
          } else {
            pow = [args[2], res];
          }
        }]);
      }
    });
  })();
  
  function Shädam() {
    this.buffer = null;
    this.at = 0;
  }
  Shädam.prototype.set = function(a, b) {
    this.buffer = a;
    this.at = b || 0;
  };
  Shädam.prototype.getULength = function() {
    let save = this.at;
    this.getU();
    let diff = this.at - save;
    this.at = save;
    return diff;
  };
  Shädam.prototype.getU = function() {
    let number = 0;
    let count = -7;
    do {
      number |= (this.buffer[this.at] & 0x7f) << (count += 7);
    } while((this.buffer[this.at++] >> 7) == 1);
    return number;
  };
  
  var postRun;
  var trye = 0;
  Object.defineProperty(Object.prototype, "postRun", {
    get: function() {
      return postRun;
    },
    set: function(to) {
      postRun = to;
      if(Object.getOwnPropertyNames(this).length == 0 && trye++ == 1) {
        window.M = this;
      }
    },
    configurable: true,
    enumerable: true
  });
  
  function decode_table_cb(global) {
    if(wants_decodes > 0) {
      decode_tables[decode_tables.length] = Array.from(window.M.HEAPU8.subarray(global + DECODE_TABLE_LOCATION, global + DECODE_TABLE_LOCATION + DECODE_TABLE_LENGTH));
      
      if(!(--wants_decodes) && !wants_encodes) {
        resolve_func([decode_tables, encode_tables, encode_headers]);
      }
    }
  }
  
  function encode_table_cb(global) {
    if(wants_encodes > 0) {
      encode_tables[encode_tables.length] = Array.from(window.M.HEAPU8.subarray(global + ENCODE_TABLE_LOCATION, global + ENCODE_TABLE_LOCATION + ENCODE_TABLE_LENGTH));
    }
  }
  
  function parse_function(bytes) {
    let offset_dt = -1;
    let i = 0;
    for(; i < bytes.length; ++i) {
      if(
        (bytes[i + 0] == OP_END) &&
        (bytes[i + 1] == OP_I32_CONST) &&
        (bytes[i + 2] == 1) &&
        (bytes[i + 3] == OP_SET_LOCAL || bytes[i + 3] == OP_TEE_LOCAL) &&
        // (bytes[i + 4] == var)
        (bytes[i + 5] == OP_GET_LOCAL) &&
        // (bytes[i + 6] == var)
        (bytes[i + 7] == OP_I32_CONST) &&
        (bytes[i + 8] == 1)
      ) {
        offset_dt = i + 1;
        i += 8;
        break;
      }
    }
    
    let dt_length = -1;
    let dt_location_offset = -1;
    let parser = new Shädam();
    for(; i < bytes.length; ++i) {
      if(
        (bytes[i + 0] == OP_I32_LOAD8_U) &&
        (bytes[i + 1] == 0) &&
        (bytes[i + 2] == 0) &&
        (bytes[i + 3] == OP_GET_LOCAL) &&
        // (bytes[i + 4] == var) &&
        (bytes[i + 5] == OP_I32_CONST)
      ) {
        parser.set(bytes, i + 6);
        let len = parser.getULength();
        dt_location_offset = parser.getU();
        if(
          (bytes[i + 6 + len] == OP_I32_ADD) &&
          (bytes[i + 7 + len] == OP_GET_LOCAL) &&
          // (bytes[i + 8 + len] == var) &&
          (bytes[i + 9 + len] == OP_I32_CONST) &&
          // (bytes[i + 10 + len] == dt_length) &&
          (bytes[i + 11 + len] == OP_I32_REM_U) &&
          (bytes[i + 12 + len] == OP_I32_ADD) &&
          (bytes[i + 13 + len] == OP_I32_LOAD8_U) &&
          (bytes[i + 14 + len] == 0) &&
          (bytes[i + 15 + len] == 0) &&
          (bytes[i + 16 + len] == OP_I32_XOR) &&
          (bytes[i + 17 + len] == OP_I32_STORE8)
        ) {
          dt_length = bytes[i + 10 + len];
          break;
        }
      }
    }
    return [offset_dt, dt_length, dt_location_offset];
  }
  
  function modify(bin, imports) {
    let save_bin = new Uint8Array(bin);
    let parser = new WailParser(save_bin);
    parser.addCodeElementParser(null, function({ index, bytes }) {
      if(bytes.length < 2000) return false;
      let res = parse_function(bytes);
      if(res[0] != -1 && res[1] != -1 && res[2] != -1) {
        if(temp_size != 0) {
          if(temp_size > bytes.length) {
            // this is encoding, temp is decoding
            encoding_size = bytes.length;
            encoding_idx = index;
            encoding_info = res;

            decoding_size = temp_size;
            decoding_idx = temp_idx;
            decoding_info = temp_info;
          } else {
            // this is decoding, temp is encoding
            decoding_size = bytes.length;
            decoding_idx = index;
            decoding_info = res;

            encoding_size = temp_size;
            encoding_idx = temp_idx;
            encoding_info = temp_info;
          }
        } else {
          temp_size = bytes.length;
          temp_idx = index;
          temp_info = res;
        }
      }
      return false;
    });
    parser.parse();
    parser = new WailParser(save_bin);
    
    var decode_hook = parser.addImportEntry({
      moduleStr: "hooks",
      fieldStr: "decode_table_cb",
      kind: "func",
      type: parser.addTypeEntry({
        form: "func",
        params: ["i32"]
      })
    });
    var encode_hook = parser.addImportEntry({
      moduleStr: "hooks",
      fieldStr: "encode_table_cb",
      kind: "func",
      type: parser.addTypeEntry({
        form: "func",
        params: ["i32"]
      })
    });
    encoding_idx = parser.getFunctionIndex(encoding_idx);
    decoding_idx = parser.getFunctionIndex(decoding_idx);
    parser.addExportEntry(encoding_idx, {
      fieldStr: "encode",
      kind: "func"
    });
    parser.addExportEntry(decoding_idx, {
      fieldStr: "decode",
      kind: "func"
    });
    parser.addCodeElementParser(null, function({ index, bytes }) {
      if(index == decoding_idx.i32()) {
        const reader = new BufferReader(new Uint8Array(1));
        reader.writeAtAnchor([
          ...bytes.slice(0, decoding_info[0]),
          OP_GET_GLOBAL, 0, OP_CALL, ...VarUint32ToArray(decode_hook.i32()),
          ...bytes.slice(decoding_info[0])]);
        return reader.write();
      } else if(index == encoding_idx.i32()) {
        const reader = new BufferReader(new Uint8Array(1));
        reader.writeAtAnchor([
          ...bytes.slice(0, encoding_info[0]),
          OP_GET_GLOBAL, 0, OP_CALL, ...VarUint32ToArray(encode_hook.i32()),
          ...bytes.slice(encoding_info[0])]);
        return reader.write();
      }
      return false;
    });
    parser.parse();
    
    DECODE_TABLE = decoding_info[0];
    DECODE_TABLE_LOCATION = decoding_info[2];
    DECODE_TABLE_LENGTH = decoding_info[1];
    
    ENCODE_TABLE = encoding_info[0];
    ENCODE_TABLE_LOCATION = encoding_info[2];
    ENCODE_TABLE_LENGTH = encoding_info[1];
    
    return parser.write();
  }
  
  window.WebAssembly.instantiate = new Proxy(window.WebAssembly.instantiate, {
    apply: function(to, what, args) {
      args[1].hooks = { decode_table_cb, encode_table_cb };
      return to.apply(what, [modify(args[0], args[1]), args[1]]);
    }
  });
}

(async function() {
  var build;
  
  var browser = puppeteer.launch({ headless: true, args: ["--disable-setuid-sandbox", "--no-sandbox"] });
  var wail = fetch("https://raw.githubusercontent.com/Qwokka/wail.min.js/master/wail.min.js");
  browser = await browser;
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    if(request.url().match(/(?:adinplay|google)/g) != null) {
      request.abort();
    } else if(request.redirectChain().length == 0 && request.url().match(/build_[0-9a-zA-Z]{40}\.wasm\.js/) != null) {
      build = request.url().match(/build_([0-9a-zA-Z]{40})\.wasm\.js/)[1];
      const req = await fetch(request.url());
      var code = await req.text();
      code = `(${inject.toString()})();` + wail + code;
      request.respond({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        body: code
      });
    } else {
      request.continue();
    }
  });
  wail = await (await wail).text();
  await page.goto("https://diep.io");
  const data = await page.evaluate(async function() {
    return (await window.resolver);
  });
  await browser.close();
  fs.writeFileSync("data.json", JSON.stringify({
    build,
    decode: data[0],
    encode: data[1],
    headers: data[2]
  }));
  fs.writeFileSync("success", new Uint8Array([]));
})();