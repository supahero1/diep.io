import { spawn } from "child_process";
import axios from "axios";
import WebSocket from "ws";
import { solve_pow } from "./pow_solver.js";
import * as WAIL from "./wail.mjs";

const encoder = new TextEncoder();
const encode = encoder.encode.bind(encoder);

const python = spawn("python3", ["diep.py"]);

const lobby_id = "257981ee-fa5f-4a9d-9e83-43bdde70291b";
const region_id = "lnd-fra";
const party_code = "307990f18b";

const LOG = {
	VERBOSE: 0,
	INFO: 1,
	WARNING: 2,
	ERROR: 3
};
LOG.LEVEL = LOG.VERBOSE;
const log = (level, ...args) => level >= LOG.LEVEL && console.log(...args);

(async function() {
	const html = await axios.get("https://diep.io/");
	const js_name = html.data.match(/(index\.[a-fA-F0-9]{8}\.js)/)[1];
	const js = await axios.get("https://diep.io/" + js_name);
	const wasm_name = js.data.match(/([a-fA-F0-9]{20}\.wasm)/)[1];
	const wasm = await axios.get("https://diep.io/" + wasm_name, { responseType: "arraybuffer" });
	let wasm_bin = new Uint8Array(wasm.data);

	const output_regex = "\\.([a-zA-Z0-9_$]+?)=[a-zA-Z0-9_$]+?\\.asm\\.([a-zA-Z0-9_$]+?)\\)";
	const output_matches = js.data.match(new RegExp(output_regex, "g"));
	const output_map = {};
	for(const match of output_matches) {
		const [_, new_name, old_name] = match.match(new RegExp(output_regex));
		output_map[old_name] = new_name;
	}
	const memory_name = js.data.match(/\.asm\.([a-zA-Z0-9_$]+?)\.buffer/)[1];
	output_map[memory_name] = "memory";
	output_map["send_packet"] = "send_packet";

	const dyn_str = js.data.substring(1024).match(/var [a-zA-Z0-9_$]+?=\{(\d.*?\})\};f/)[1] + ",";
	const dyn_regex = "(\\d+):function\\(.*?\\)\\{(.*?)\\},";
	const dyn_matches = dyn_str.match(new RegExp(dyn_regex, "g"));
	const dyn_map = {};
	const dyn_regexp = new RegExp(dyn_regex);
	let dyn_dup_check = "";
	for(const match of dyn_matches) {
		const [_, code, body] = match.match(dyn_regexp);
		dyn_map[code] = body;
		dyn_dup_check += body + "\n";
	}

	function get_free_arr_member(array) {
		let i = 0;
		for(; i < array.length; ++i) {
			if(!array[i]) break;
		}
		array[i] = { width: 300, height: 150 };
		return i;
	}

	const send_signature = "send.*?subarray";
	const dyn_signatures = {
		"URLSearchParams": function() {
			return this.write_str(this.party_link);
		},
		"location\\.search\\)$": function() {
			return this.write_str("?p=" + this.party_link);
		},
		"top\\.location!=": function() {
			return false;
		},
		"document\\.referrer": function() {
			return this.write_str("");
		},
		"localStorage\\[.*?\\];": function(in_name, out_len) {
			const name = this.read_str(in_name);
			const str = this.localStorage[name] || "";
			log(LOG.VERBOSE, `GET localStorage["${name}"] = "${str}"`);
			this.HEAPU32[out_len >> 2] = str.length;
			return this.write_str(str);
		},
		"localStorage\\[.*?\\]=String": function(in_name, in_str) {
			const name = this.read_str(in_name);
			const str = this.read_str(in_str);
			log(LOG.VERBOSE, `SET localStorage["${name}"] = "${str}"`);
			this.localStorage[name] = str;
		},
		"&&\"standard\"==": function() {
			return false;
		},
		"isUsingTouchDevice\\(\\)": function() {
			return false;
		},
		"return.*?\\.value\\)": function() {
			log(LOG.VERBOSE, `GET input.value`);
			return this.write_str("");
		},
		"top\\.location=\"": function() {
			return 0;
		},
		"new WebSocket": function(url) {
			url = this.read_str(url);
			const that = this;
			let i = 0;
			for(; i < this.sockets.length; ++i) {
				if(!this.sockets[i]) break;
			}
			log(LOG.VERBOSE, `new WebSocket[${i}]("${url}")`);
			const ws = this.sockets[i] = new WebSocket(url, {
				perMessageDeflate: false,
				origin: "https://diep.io",
				host: this.host_url
			});
			ws.binaryType = "arraybuffer";
			ws.events = [];
			ws.onmessage = function({ data }) {
				data = new Uint8Array(data);
				log(LOG.VERBOSE, `WebSocket[${i}].onmessage(${data.length})`);
				const ptr = that.malloc(data.length);
				that.HEAPU8.set(data, ptr);
				++that.packets;
				this.events.push([1, ptr, data.length]);
				that.check_ws();
			};
			ws.onopen = function() {
				log(LOG.VERBOSE, `WebSocket[${i}].onopen()`);
				this.events.push([2, 0, 0]);
				that.check_ws();
				setImmediate(that.draw.bind(that));
			};
			ws.onerror = function() {
				log(LOG.VERBOSE, `WebSocket[${i}].onerror()`);
				this.events.push([3, 0, 0]);
				that.check_ws();
			};
			ws.onclose = function() {
				log(LOG.VERBOSE, `WebSocket[${i}].onclose()`);
				this.events.push([4, 0, 0]);
				that.check_ws();
			};
			return i;
		},
		"=function\\(\\)\\{\\}": function(ws_idx) {
			log(LOG.VERBOSE, `WebSocket[${ws_idx}].close()`);
			const ws = this.sockets[ws_idx];
			ws.onmessage = ws.onopen = ws.onerror = ws.onclose = function(){};
			for(const event of ws.events) {
				this.free(event[1]);
			}
			ws.events = null;
			try {
				ws.close();
			} catch(err) {}
			this.sockets[ws_idx] = null;
		},
		"1==.*?readyState": function(ws_idx) {
			const ws = this.sockets[ws_idx];
			return ws.readyState == 1;
		},
		[send_signature]: function(ws_idx, ptr, len) {
			const ws = this.sockets[ws_idx];
			log(LOG.VERBOSE, `WebSocket[${ws_idx}].send(${len})`);
			if(ws.readyState != 1) return 0;
			try {
				ws.send(this.HEAPU8.subarray(ptr, ptr + len));
			} catch(err) {
				return 0;
			}
			return 1;
		},
		"0==.*?\\.events\\.length": function(ws_idx, ptr_ptr, len_ptr) {
			const ws = this.sockets[ws_idx];
			if(!ws.events.length) return 0;
			const event = ws.events.shift();
			this.HEAPU32[ptr_ptr >> 2] = event[1];
			this.HEAP32[len_ptr >> 2] = event[2];
			return event[0];
		},
		"powSolver&&": function(difficulty, str_ptr) {
			log(LOG.VERBOSE, `ProofOfWork(diff=${difficulty})`);
			const solution = this.solve_pow(difficulty, str_ptr);
			log(LOG.VERBOSE, `ProofOfWork(diff=${difficulty}) = '${solution}'`);
			const ptr = this.write_str(solution);
			this.Module["_game_pow_solve_result"](ptr);
			this.Module["_try_spawn"]();
		},
		"new Function": function(idx, str) {
			str = this.read_str(str);
			if(str.match(/if\(!window.*?(\w+\[.{8,32}?\]\(.{8,32}?\));\};/g).length != 1) {
				throw new Error("Unsolvable eval packet");
			}
			str = str.replace(/if\(!window.*?(\w+\[.{8,32}?\]\(.{8,32}?\));\};/, "$1;};").replace("create_random_int();", "0;");
			new Function(str)()(function(value) {
				this.Module["_game_js_challenge_response"](idx, value);
			}.bind(this));
		},
		"isFontLoaded": function() {
			return true;
		},
		"^return [a-zA-Z_$]{1,2}%[a-zA-Z_$]{1,2}$": function(a, b) {
			return a % b;
		},
		"createElement\\(\"canvas\"": function() {
			return get_free_arr_member.call(this, this.canvases);
		},
		"contexts\\[[a-zA-Z0-9_$]+?\\]=null": function(ctx_idx) {
			this.canvases[ctx_idx] = null;
		},
		"[a-zA-Z0-9_$]+?\\.width=[a-zA-Z0-9_$]+?,[a-zA-Z0-9_$]+?\\.height=": function(ctx_idx, width, height) {
			this.canvases[ctx_idx] = { width, height };
		},
		"contexts.*?=[a-zA-Z0-9_$]+?\\.width,": function(ctx_idx, width_ptr, height_ptr) {
			this.HEAP32[width_ptr >> 2] = this.canvases[ctx_idx].width;
			this.HEAP32[height_ptr >> 2] = this.canvases[ctx_idx].height;
		},
		"measureText": function() {
			return 100;
		},
		"!!CanvasRenderingContext2D.*?createPattern": function() {
			return false;
		},
		"getElementById.*?getContext": function() {
			return get_free_arr_member.call(this, this.canvases);
		},
		"img\\[data-path='": function() {
			return get_free_arr_member.call(this, this.images);
		},
		"complete.*?\\]=[a-zA-Z0-9_$]+?\\.width,": function(img_idx, status_ptr, width_ptr, height_ptr) {
			this.HEAP32[status_ptr >> 2] = 1;
			this.HEAP32[width_ptr >> 2] = this.images[img_idx].width;
			this.HEAP32[height_ptr >> 2] = this.images[img_idx].height;
		},
		"__renderAds&&": function(str) {
			str = this.read_str(str);
			this.Module["__renderAds"](str);
		},
		"fillText": function(){}
	};
	const dyn_table = {};
	let send_code = 0;
	for(const signature in dyn_signatures) {
		const regex = new RegExp(signature);
		const matches = dyn_dup_check.match(new RegExp(signature, "gm"));
		if(!matches || matches.length == 0) {
			log(LOG.ERROR, `couldn't match dyn signature '${signature}'`);
			process.exit();
		} else if(matches.length > 1) {
			log(LOG.ERROR, `multiple matches for dyn signature '${signature}'`);
			process.exit();
		}
		for(const code in dyn_map) {
			if(dyn_map[code].match(regex))
			{
				dyn_table[code] = dyn_signatures[signature];
				if(signature == send_signature) {
					send_code = code;
				}
				delete dyn_map[code];
				break;
			}
		}
	}

	const emc_str = "," + js.data.match(/(?:var|let) [a-zA-Z_$]+?,[a-zA-Z_$]+?=\{\},[a-zA-Z_$]+?=\{\},[a-zA-Z_$]+?=\{(.+?)\},[a-zA-Z_$]+?=\(function\(\)\{/)[1] + ",a:a";
	const emc_regex = /,([a-zA-Z_$]):(?:function\([a-z,]*?\)\{(.*?)\}|([a-zA-Z_$]{1,2}))(?=,[a-zA-Z_$]:(?:function|[a-zA-Z_$]{1,2}))/g;
	const emc_matches = Array.from(emc_str.matchAll(emc_regex));
	const emc_map = {};
	let emc_dup_check = "";
	for(const [_, name, body, func_name] of emc_matches) {
		emc_map[name] = body ?? func_name;
		emc_dup_check += emc_map[name] + "\n";
	}

	const game_dyn_func_name = emc_map["a"];
	const decref_from_signature = "([a-zA-Z_$]{1,2})\\([a-zA-Z_$]{1,2}\\),[a-zA-Z_$]{1,2}\\},toWireType.*?destructorFunction:null";
	const decref_fn_name = emc_dup_check.match(decref_from_signature)[1];
	const emc_signatures = {
		"=!1,": "exit",
		"\"OOM\"": "oom",
		"printChar": "print",
		"\\(\"\"\\)$": "abort",
		"emval::as": "emval_as",
		"tm_gmtoff:": "get_date",
		"copyWithin": "copy_within",
		"throw\"unwind\"": "unwind",
		"Assertion failed": "assert",
		"Math\\.random\\(": "random",
		"refcount\\+=1": "emval_incref",
		"\\(\\[\\]\\)": "emval_new_array",
		"^return\\(.*?==": "emval_equals",
		"\\(\\(function\\(\\)\\{": "draw",
		",null,": "emval_call_void_method",
		"\\(\\{\\}\\)": "emval_new_object",
		"isVoid:!0": "embind_register_void",
		"=\\[\\];return ": "emval_call_method",
		"4294967295": "embind_register_integer",
		"_emval_take_value": "emval_take_value",
		[`^${decref_fn_name}$`]: "emval_decref",
		[`^${game_dyn_func_name}$`]: "dyn_call",
		"new_ called": "emval_get_method_caller",
		"Unknown boolean": "embind_register_bool",
		"has UTF-16": "embind_register_std_string",
		"pop\\(\\).*?pop\\(\\)": "emval_run_dtors",
		"C\\+\\+ string": "embind_register_std_wstring",
		[decref_from_signature]: "embind_register_emval",
		[`^return ${game_dyn_func_name}\\(`]: "dyn_call",
		"return e\\},toWireType": "embind_register_float",
		"forEach.*?charCodeAt": "load_user_info_to_memory",
		"^return 0===[a-zA-Z_$]{1,2}\\?": "emval_get_global",
		"ignoreDuplicateRegistrations": "embind_register_memory_view",
		"[a-zA-Z_$]{1,2}\\[[a-zA-Z_$]{1,2}\\]=[a-zA-Z_$]{1,2}$": "emval_set_property",
		"^return [a-zA-Z_$]{1,2}\\([a-zA-Z_$]{1,2}\\([a-zA-Z_$]{1,2}\\)\\)": "emval_new_cstring",
		"^return .*?[a-zA-Z_$]{1,2}\\([a-zA-Z_$]{1,2}\\[[a-zA-Z_$]{1,2}\\]\\)$": "emval_get_property",
		"forEach\\(\\(function\\([a-zA-Z_$]{1,2}\\)\\{[a-zA-Z_$]{1,2}\\+=[a-zA-Z_$]{1,2}\\.length\\+1": "load_user_info_metrics_to_memory",
	};
	const emc_table = {};
	for(const signature in emc_signatures) {
		const regex = new RegExp(signature);
		const matches = emc_dup_check.match(new RegExp(signature, "gm"));
		if(!matches || matches.length == 0) {
			log(LOG.ERROR, `couldn't match emc signature '${signature}'`);
			process.exit();
		} else if(matches.length > 1) {
			log(LOG.ERROR, `multiple matches for emc signature '${signature}'`);
			process.exit();
		}
		for(const code in emc_map) {
			if(emc_map[code].match(regex))
			{
				emc_table[code] = emc_signatures[signature];
				delete emc_map[code];
				break;
			}
		}
	}
	for(const code in emc_map) {
		emc_table[code] = "dummy";
	}


	let wail = new WAIL.WailParser(wasm_bin);
	const send_search = new Uint8Array([
		WAIL.OP_I32_CONST,
		...WAIL.VarUint32ToArray(send_code),
		WAIL.OP_I32_CONST
	]);
	const entity_head_search_len = 20;
	const creation_func_search_len = 5;
	const deletion_func_search_len = 8;
	const max_len = Math.max(
		send_search.length,
		entity_head_search_len,
		creation_func_search_len,
		deletion_func_search_len
	);
	let send_func_code;
	let entity_head_ptr;
	let creation_func_code;
	let deletion_func_code;
	wail.addCodeElementParser(null, function({ index, bytes }) {
		const len = bytes.length - max_len;
		for(let i = 0; i < len; ++i) {
			let j = 0;
			for(; j < send_search.length; ++j) {
				if(bytes[i + j] != send_search[j]) break;
			}
			if(j == send_search.length) {
				if(typeof send_func_code !== "undefined") {
					throw new Error("Multiple matches");
				}
				send_func_code = index;
			}
			const subsection = bytes.subarray(i, i + max_len);
			let reader = new WAIL.BufferReader(subsection);
			let match;
			if(
				reader.readUint8() == WAIL.OP_END &&
				reader.readUint8() == WAIL.OP_GET_LOCAL && (reader.readUint8(), true) &&
				reader.readUint8() == WAIL.OP_I32_CONST && (match = reader.readVarUint32(), true) &&
				reader.readUint8() == WAIL.OP_GET_LOCAL && (reader.readUint8(), true) &&
				reader.readUint8() == WAIL.OP_CALL && (reader.readVarUint32(), true) &&
				reader.readUint8() == WAIL.OP_I32_LOAD16_U && reader.readUint8() == 1 && reader.readUint8() == 56
			) {
				if(typeof entity_head_ptr !== "undefined") {
					throw new Error("Multiple matches");
				}
				entity_head_ptr = match + 720;
			}
			reader = new WAIL.BufferReader(subsection);
			if(
				reader.readUint8() == WAIL.OP_F32_CONST && new Float32Array(reader.readBytes(4).buffer)[0] == 0.015625 &&
				reader.readUint8() == WAIL.OP_F32_MUL &&
				reader.readUint8() == WAIL.OP_F32_STORE && reader.readUint8() == 2 && reader.readUint8() == 0 &&
				reader.readUint8() == WAIL.OP_GET_LOCAL && (reader.readVarUint32(), true) &&
				reader.readUint8() == WAIL.OP_I32_CONST && reader.readVarUint32() == 80
			) {
				if(typeof creation_func_code !== "undefined") {
					throw new Error("Multiple matches");
				}
				creation_func_code = index;
			}
			reader = new WAIL.BufferReader(subsection);
			if(
				reader.readUint8() == WAIL.OP_I32_CONST && reader.readVarUint32() == 65535 &&
				reader.readUint8() == WAIL.OP_I32_AND &&
				reader.readUint8() == WAIL.OP_I32_EQ
			) {
				if(typeof deletion_func_code !== "undefined") {
					throw new Error("Multiple matches");
				}
				deletion_func_code = index;
			}
		}
		return bytes;
	});
	wail.parse();
	if(typeof send_func_code === "undefined") {
		throw new Error("No matches");
	}
	if(typeof entity_head_ptr === "undefined") {
		throw new Error("No matches");
	}
	if(typeof creation_func_code === "undefined") {
		throw new Error("No matches");
	}
	if(typeof deletion_func_code === "undefined") {
		throw new Error("No matches");
	}
	log(LOG.VERBOSE, `entity_head_ptr = ${entity_head_ptr}\ncreation_func_code = ${creation_func_code}\ndeletion_func_code = ${deletion_func_code}`);

return;
	wail = new WAIL.WailParser(wasm_bin);
	const send_func = wail.getFunctionIndex(send_func_code);
	const cb_func = wail.addImportEntry({
		moduleStr: "a",
		fieldStr: "send_hook",
		kind: "func",
		type: wail.addTypeEntry({
			form: "func",
			params: ["i32"]
		})
	});
	wail.addExportEntry(send_func, {
		fieldStr: "send_packet",
		kind: "func"
	});
	wail.addCodeElementParser(null, function({ index, bytes }) {
		if(index == send_func.i32()) {
			return new Uint8Array([
				WAIL.OP_GET_LOCAL, 0,
				WAIL.OP_CALL, ...WAIL.VarUint32ToArray(cb_func.i32()),
				...bytes
			]);
		}
		return bytes;
	});
	wail.parse();
	wasm_bin = wail.write();
	const wasm_module = new WebAssembly.Module(wasm_bin);


	class Bot {
		lobby_id;
		region_id;
		host_url;
		party_link;
		player_token;
		game_user = "game_user.eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9.CIbVsrbeMRCG9c--pDEaEgoQyk9PqSMYTACnDauUa5a1pCIWUhQKEgoQp7NMSEWKTc2ciGrLqSXX6SIWChQKEgoQwSkW9KoaTCOfgPhO0HLEjA.tqY9j8bKSPG2FlzDIAgb0v_4nQXHmSqRzHMUcd47KpBEdeVZXVGqaL_vUJOQZDeQ0QXc97Rh-fMqQ79HWIq3Bg";
		user_info = ["USER=web_user", "LOGNAME=web_user", "PATH=/", "PWD=/", "HOME=/home/web_user", "LANG=en.UTF-8", "_=./this.program"];

		localStorage;
		ws;
		canvases = [];
		images = [];
		sockets = [];

		/* emval */
		handle_array = [{},
			{ value: undefined }, { value: null },
			{ value: true }, { value: false }
		];
		free_list = [];
		symbols = {};
		newers = {};
		global = {
			window: {
				scale: num => num,
				unscale: num => num,
				ui: {
					findLobbyWithRegion: function() {
						setImmediate(this.connect_lobby.bind(this));
					}.bind(this),
					joinLobby: function() {
						setImmediate(this.connect_lobby.bind(this));
					}.bind(this),
					edgeInsets: { top: 0, left: 0, right: 0, bottom: 0 }
				},
				gameWrapper: {}
			}
		};
		method_callers = [];

		/* embind */
		registered_types = {};
		awaiting_deps = {};
		type_deps = {};

		dyn_table;
		dyn_fn_idx;
		socket_ptr;
		Module = {};

		arraybuffer;
		HEAPU8;
		HEAPU16;
		HEAPU32;
		HEAP8;
		HEAP16;
		HEAP32;
		HEAPF32;
		HEAPF64;

		constructor(lobby_id, region_id, party_code, player_token) {
			this.lobby_id = lobby_id;
			this.region_id = region_id;
			this.host_url = `${this.lobby_id}-default.lobby.${this.region_id}.rivet.run`;
			this.party_link = lobby_id.replaceAll("-", "") + party_code;
			this.player_token = player_token;

			this.localStorage = {
				name: "da baby",
				gamemode: "sandbox",
				region: this.region_id,
				uiScale: "1",
				"rivet:token": this.game_user
			};

			this.free_idx = [];
			this.values = [
				{},
				{ value: void 0 },
				{ value: null },
				{ value: true },
				{ value: false }
			];

			this.dyn_table = {};
			for(const code in dyn_table) {
				this.dyn_table[code] = dyn_table[code].bind(this);
			}

			const imports = {};
			for(const name in emc_table) {
				imports[name] = this[emc_table[name]].bind(this);
			}
			imports.send_hook = function(ptr) {
				if(typeof this.socket_ptr === "undefined") {
					this.socket_ptr = ptr;
				}
			}.bind(this);

			const instance = new WebAssembly.Instance(wasm_module, { a: imports });
			for(const old_name in output_map) {
				this.Module[output_map[old_name]] = instance.exports[old_name];
			}

			this.arraybuffer = this.Module["memory"].buffer;
			this.HEAPU8 = new Uint8Array(this.arraybuffer);
			this.HEAPU16 = new Uint16Array(this.arraybuffer);
			this.HEAPU32 = new Uint32Array(this.arraybuffer);
			this.HEAP8 = new Int8Array(this.arraybuffer);
			this.HEAP16 = new Int16Array(this.arraybuffer);
			this.HEAP32 = new Int32Array(this.arraybuffer);
			this.HEAPF32 = new Float32Array(this.arraybuffer);
			this.HEAPF64 = new Float64Array(this.arraybuffer);

			this.Module["___wasm_call_ctors"]();
			try {
				this.Module["_main"](0, 0);
			} catch(err) {}
			console.assert(typeof this.dyn_fn_idx !== "undefined");
		}
		malloc(size) {
			return this.Module["_malloc"](size);
		}
		free(ptr) {
			return this.Module["_free"](ptr);
		}
		check_ws() {
			return this.Module["_cp5_check_ws"]();
		}
		strlen_explicit(ptr, heap) {
			let cur_ptr = ptr;
			while(heap[cur_ptr]) ++cur_ptr;
			return cur_ptr - ptr;
		}
		strlen(ptr) {
			return this.strlen_explicit(ptr, this.HEAPU8);
		}
		read_str(ptr) {
			let str = "";
			while(1) {
				const char = this.HEAPU8[ptr++];
				if(!char) break;
				str += String.fromCharCode(char);
			}
			return str;
		}
		write_str(str, ptr = 0) {
			if(ptr == 0) {
				ptr = this.malloc(str.length + 1);
			}
			let cur_ptr = ptr;
			for(let i = 0; i < str.length; ++i) {
				this.HEAPU8[cur_ptr++] = str.charCodeAt(i);
			}
			this.HEAPU8[cur_ptr] = 0;
			return ptr;
		}
		dyn_call(code, args_ptr, data_ptr) {
			const fn = this.dyn_table[code];
			if(typeof fn !== "function") {
				log(LOG.VERBOSE, "Unknown dyn code", code, ...arguments);
				return 0;
			}
			data_ptr >>= 2;
			const args = [];
			while(1) {
				const type = this.HEAPU8[args_ptr++];
				if(!type) break;
				if(type < 105) {
					if(data_ptr & 1) ++data_ptr;
					args.push(this.HEAPF64[data_ptr++ >> 1]);
				} else {
					args.push(this.HEAP32[data_ptr]);
				}
				++data_ptr;
			}
			return fn(...args);
		}
		load_user_info_metrics_to_memory(len_ptr, size_ptr) {
			const len = this.user_info.length;
			this.HEAP32[len_ptr >> 2] = len;
			let size = 0;
			for(const info of this.user_info) {
				size += info.length + 1;
			}
			this.HEAP32[size_ptr >> 2] = size;
			return 0;
		}
		load_user_info_to_memory(ptr_ptr, str_ptr) {
			let dest_ptr = str_ptr;
			for(let i = 0; i < this.user_info.length; ++i) {
				this.HEAP32[(ptr_ptr + i * 4) >> 2] = dest_ptr;
				this.write_str(this.user_info[i], dest_ptr);
			}
			return 0;
		}
		get_date() {
			log(LOG.ERROR, ">>>> get_date()", ...arguments);
			return 0;
		}
		print(stream, data_ptr, num_strings, out_ptr) {
			let bytes_wrote = 0;
			for(let i = 0; i < num_strings; ++i) {
				const str_ptr = this.HEAP32[data_ptr >> 2];
				data_ptr += 4;
				const str_len = this.HEAP32[data_ptr >> 2];
				data_ptr += 4;
				const str = this.read_str(str_ptr);
				log(LOG.WARNING, "wasm says:", str);
				bytes_wrote += str_len;
			}
			this.HEAP32[out_ptr >> 2] = bytes_wrote;
			return 0;
		}
		connect_lobby() {
			this.draw();
			const lobby_id_ptr = this.write_str(this.lobby_id);
			const region_id_ptr = this.write_str(this.region_id);
			const player_token_ptr = this.write_str(this.player_token);
			const game_user_ptr = this.write_str(this.game_user);
			const host_ptr = this.write_str(this.host_url);
			this.Module["_connect_lobby"](
				lobby_id_ptr,
				region_id_ptr,
				player_token_ptr,
				game_user_ptr,
				host_ptr,
				true
			);
		}
		draw(dyn_fn_idx = this.dyn_fn_idx) {
			if(typeof this.dyn_fn_idx === "undefined") {
				this.dyn_fn_idx = dyn_fn_idx;
			}

			//this.Module["_set_mouse_pos"](Math.floor(Math.random() * 100), Math.floor(Math.random * 100));
			try {
				this.Module["dynCall_v"](this.dyn_fn_idx);
			} catch(err) {}
		}
		send(bytes) {
			bytes = new Uint8Array(bytes);
			const ptr = this.malloc(bytes.length);
			const end_ptr = (this.socket_ptr + 76) >> 2;
			const base_ptr = this.HEAPU32[end_ptr];
			this.HEAPU32[(base_ptr + 0) >> 2] = ptr;
			this.HEAPU32[(base_ptr + 4) >> 2] = bytes.length;
			this.HEAPU32[(base_ptr + 8) >> 2] = 0x80808080;
			this.HEAPU32[end_ptr] += 12;
			this.Module["send_packet"](this.socket_ptr);
		}
		solve_pow(difficulty, str_ptr) {
			const arraybuffer = encode(this.read_str(str_ptr)).buffer;
			return solve_pow(difficulty, arraybuffer);
		}
		abort() {
			log(LOG.ERROR, "aborted");
			process.exit();
		}
		assert() {
			log(LOG.ERROR, "assertion failed");
			console.trace();
			process.exit();
		}
		exit() {
			log(LOG.ERROR, "process exited");
			process.exit();
		}
		oom() {
			log(LOG.ERROR, "out of memory");
			process.exit();
		}
		random() {
			return Math.random();
		}
		time_now() {
			return performance.now();
		}
		copy_within(target, start, len) {
			this.HEAPU8.copyWithin(target, start, start + len);
		}
		dummy() {
			return this.packets;
		}
		unwind() {
			throw "unwind";
		}

		/* emval */

		emval_count_handles() {
			let count = 0;
			for(let i = 5; i < this.handle_array.length; ++i) {
				if(this.handle_array[i] !== undefined) {
					++count;
				}
			}
			return count;
		}
		emval_get_first() {
			for(let i = 5; i < this.handle_array.length; ++i) {
				if(this.handle_array[i] !== undefined) {
					return this.handle_array[i];
				}
			}
			return null;
		}
		emval_register_symbol(address) {
			this.symbols[address] = this.read_str(address);
		}
		emval_get_string_or_symbol(address) {
			const symbol = this.symbols[address];
			if(symbol === undefined) {
				return this.read_str(address);
			} else {
				return symbol;
			}
		}
		emval_require_handle(handle) {
			if(!handle) {
				throw new Error("Cannot use deleted val. handle = " + handle);
			}
			return this.handle_array[handle].value;
		}
		emval_register(value) {
			switch(value) {
				case undefined: return 1;
				case null: return 2;
				case true: return 3;
				case false: return 4;
				default: {
					const handle =
						this.free_list.length ?
						this.free_list.pop() :
						this.handle_array.length;
					this.handle_array[handle] = {
						refcount: 1,
						value
					};
					return handle;
				}
			}
		}
		emval_incref(handle) {
			if(handle > 4) ++this.handle_array[handle].refcount;
		}
		emval_decref(handle) {
			if(handle <= 4) return;
			if(--this.handle_array[handle].refcount) return;
			this.handle_array[handle] = undefined;
			this.free_list.push(handle);
		}
		emval_run_dtors(handle) {
			const dtors = this.emval_require_handle(handle);
			this.embind_run_dtors(dtors);
			this.emval_decref(handle);
		}
		emval_new_array() {
			return this.emval_register([]);
		}
		emval_new_object() {
			return this.emval_register({});
		}
		emval_new_cstring(address) {
			return this.emval_register(this.emval_get_string_or_symbol(address));
		}
		emval_take_value(type, argv) {
			type = this.embind_require_registered_type(type, "_emval_take_value");
			const value = type.readValueFromPointer(argv);
			return this.emval_register(value);
		}
		emval_craft_allocator(arg_count) {
			let args_list = new Array(arg_count + 1);
			const that = this;
			return function(ctor, arg_types, args) {
				args_list[0] = ctor;
				for(let i = 0; i < arg_count; ++i) {
					const arg_type = that.embind_require_registered_type(that.HEAP32[(arg_types >> 2) + i], "parameter " + i);
					args_list[i + 1] = arg_type.readValueFromPointer(args);
					args += arg_type.argPackAdvance;
				}
				const obj = new (ctor.bind.apply(ctor, args_list));
				return that.emval_register(obj);
			};
		}
		emval_new(handle, arg_count, arg_types, args) {
			handle = this.emval_require_handle(handle);
			let newer = this.newers[arg_count];
			if(!newer) {
				newer = this.emval_craft_allocator(arg_count);
				this.newers[arg_count] = newer;
			}
			return newer(handle, arg_types, args);
		}
		emval_get_global(name) {
			if(!name) {
				return this.emval_register(this.global);
			} else {
				name = this.emval_get_string_or_symbol(name);
				log(LOG.VERBOSE, `GET global[${name}]`);
				return this.emval_register(this.global[name]);
			}
		}
		emval_get_module_property(name) {
			name = this.emval_get_string_or_symbol(name);
			log(LOG.VERBOSE, `GET global[${name}]`);
			return this.emval_register(this.global[name]);
		}
		emval_get_property(handle, key) {
			handle = this.emval_require_handle(handle);
			key = this.emval_require_handle(key);
			log(LOG.VERBOSE, `GET handle[${key}]`);
			return this.emval_register(handle[key]);
		}
		emval_set_property(handle, key, value) {
			handle = this.emval_require_handle(handle);
			key = this.emval_require_handle(key);
			value = this.emval_require_handle(value);
			log(LOG.VERBOSE, `SET handle[${key}]`);
			handle[key] = value;
		}
		emval_as(handle, return_type, dtorsRef) {
			handle = this.emval_require_handle(handle);
			return_type = this.embind_require_registered_type(return_type, "emval::as");
			const dtors = [];
			const rd = this.emval_register(dtors);
			this.HEAP32[dtorsRef >> 2] = rd;
			return return_type.toWireType(dtors, handle);
		}
		emval_equals(first, second) {
			first = this.emval_require_handle(first);
			second = this.emval_require_handle(second);
			return first == second;
		}
		emval_strictly_equals(first, second) {
			first = this.emval_require_handle(first);
			second = this.emval_require_handle(second);
			return first === second;
		}
		emval_greater_than(first, second) {
			first = this.emval_require_handle(first);
			second = this.emval_require_handle(second);
			return first > second;
		}
		emval_less_than(first, second) {
			first = this.emval_require_handle(first);
			second = this.emval_require_handle(second);
			return first < second;
		}
		emval_not(object) {
			object = this.emval_require_handle(object);
			return !object;
		}
		emval_lookup_types(arg_count, arg_types) {
			const a = new Array(arg_count);
			for(let i = 0; i < arg_count; ++i) {
				a[i] = this.embind_require_registered_type(this.HEAP32[(arg_types >> 2) + i], "parameter " + i);
			}
			return a;
		}
		emval_call(handle, arg_count, arg_types, argv) {
			handle = this.emval_require_handle(handle);
			const types = this.emval_lookup_types(arg_count, arg_types);
			const args = new Array(arg_count);
			for(let i = 0; i < arg_count; ++i) {
				const type = types[i];
				args[i] = type.readValueFromPointer(argv);
				argv += type.argPackAdvance;
			}
			const return_value = handle.apply(undefined, args);
			return this.emval_register(return_value);
		}
		emval_allocate_dtors(dtorsRef) {
			const dtors = [];
			this.HEAP32[dtorsRef >> 2] = this.emval_register(dtors);
			return dtors;
		}
		emval_add_method_caller(caller) {
			const id = this.method_callers.length;
			this.method_callers.push(caller);
			return id;
		}
		emval_get_method_caller(arg_count, arg_types) {
			const types = this.emval_lookup_types(arg_count, arg_types);
			const return_type = types[0];
			const arg_n = new Array(arg_count - 1);
			const invoker_function = function(handle, name, dtors, args) {
				let offset = 0;
				for(let i = 0; i < arg_count - 1; ++i) {
					arg_n[i] = types[i + 1].readValueFromPointer(args + offset);
					offset += types[i + 1].argPackAdvance;
				}
				const return_value = handle[name].apply(handle, arg_n);
				for(let i = 0; i < arg_count - 1; ++i) {
					if(types[i + 1].deleteObject) {
						types[i + 1].deleteObject(arg_n[i]);
					}
				}
				if(!return_type.isVoid) {
					return return_type.toWireType(dtors, return_value);
				}
			};
			return this.emval_add_method_caller(invoker_function);
		}
		emval_call_method(caller, handle, method_name, dtorsRef, args) {
			caller = this.method_callers[caller];
			handle = this.emval_require_handle(handle);
			method_name = this.emval_get_string_or_symbol(method_name);
			log(LOG.VERBOSE, `CALL handle[${method_name}]`);
			return caller(handle, method_name, this.emval_allocate_dtors(dtorsRef), args);
		}
		emval_call_void_method(caller, handle, method_name, args) {
			caller = this.method_callers[caller];
			handle = this.emval_require_handle(handle);
			method_name = this.emval_get_string_or_symbol(method_name);
			log(LOG.VERBOSE, `CALL handle[${method_name}]`);
			return caller(handle, method_name, null, args);
		}
		emval_typeof(handle) {
			handle = this.emval_require_handle(handle);
			return this.emval_register(typeof handle);
		}
		emval_typeof(object, ctor) {
			object = this.emval_require_handle(object);
			ctor = this.emval_require_handle(ctor);
			return object instanceof ctor;
		}
		emval_is_number(handle) {
			handle = this.emval_require_handle(handle);
			return typeof handle === "number";
		}
		emval_is_string(handle) {
			handle = this.emval_require_handle(handle);
			return typeof handle === "string";
		}
		emval_in(item, object) {
			item = this.emval_require_handle(item);
			object = this.emval_require_handle(object);
			return item in object;
		}
		emval_delete(object, property) {
			object = this.emval_require_handle(object);
			property = this.emval_require_handle(property);
			return delete object[property];
		}
		emval_throw(object) {
			object = this.emval_require_handle(object);
			throw object;
		}

		/* embind */

		embind_ensure_overload_table(proto, method_name, human_name) {
			if(proto[method_name].overloadTable !== undefined) return;
			const prev_func = proto[method_name];
			proto[method_name] = function() {
				if(!proto[method_name].overloadTable.hasOwnProperty(arguments.length)) {
					throw new Error("Function '" + human_name + "' called with an invalid number of arguments (" +
						arguments.length + ") - expects one of (" + proto[method_name].overloadTable + ")!");
				}
				return proto[method_name].overloadTable[arguments.length].apply(this, arguments);
			};
			proto[method_name].overloadTable = [];
			proto[method_name].overloadTable[prev_func.arg_count] = prev_func;
		}
		embind_expose_public_symbol(name, value, num_args) {
			if(this.Module.hasOwnProperty(name)) {
				if(num_args === undefined || (this.Module[name].overloadTable !== undefined && this.Module[name].overloadTable[num_args] !== undefined)) {
					throw new Error("Cannot register public name '" + name + "' twice");
				}
				this.embind_ensure_overload_table(this.Module, name, name);
				if(this.Module.hasOwnProperty(num_args)) {
					throw new Error("Cannot register multiple overloads of a function with the same number of arguments (" + num_args + ")!");
				}
				this.Module[name].overloadTable[num_args] = value;
			} else {
				this.Module[name] = value;
				if(num-args !== undefined) {
					this.Module[name].numArguments = num_args;
				}
			}
		}
		embind_replace_public_symbol(name, value, num_args) {
			if(!this.Module.hasOwnProperty(name)) {
				throw new Error("Replacing nonexistant public symbol");
			}
			if(this.Module[name].overloadTable !== undefined && num_args !== undefined) {
				this.Module[name].overloadTable[num_args] = value;
			} else {
				this.Module[name] = value;
				this.Module[name].arg_count = num_args;
			}
		}
		embind_create_named_function(name, body) {
			return new Function(
				"body",
				"return function"+name+"() {\n" +
				"	\"use strict\";\n" +
				"	return body.apply(this, arguments);\n" +
				"};\n"
			)(body);
		}
		embind_repr(v) {
			if(v === null) {
				return "null";
			}
			const t = typeof v;
			if(t === "object" || t === "array" || t === "function") {
				return v.toString();
			} else {
				return "" + v;
			}
		}
		embind_register_type_sanitize(raw_type, registered_instance, options = {}) {
			if(!("argPackAdvance" in registered_instance)) {
				throw new Error("registerType registeredInstance requires argPackAdvance");
			}
			if(!raw_type) {
				throw new Error("type '" + registered_instance.name + "' must have a positive integer typeid pointer");
			}
			if(this.registered_types.hasOwnProperty(raw_type)) {
				if(options.ignoreDuplicateRegistrations) {
					return;
				} else {
					throw new Error("Cannot register type '" + registered_instance.name + "' twice");
				}
			}
		}
		embind_register_type(raw_type, registered_instance, options = {}) {
			this.embind_register_type_sanitize(raw_type, registered_instance, options);
			this.registered_types[raw_type] = registered_instance;
			delete this.type_deps[raw_type];
			if(this.awaiting_deps.hasOwnProperty(raw_type)) {
				const callbacks = this.awaiting_deps[raw_type];
				delete this.awaiting_deps[raw_type];
				for(const callback of callbacks) {
					callback();
				}
			}
		}
		embind_when_dependent_types_are_resolved(my_types, dependent_types, get_type_converters) {
			for(const type of my_types) {
				this.type_deps[type] = dependent_types;
			}
			const that = this;
			function on_complete(type_converters) {
				const my_type_converters = get_type_converters(type_converters);
				if(my_type_converters.length !== my_types.length) {
					throw new Error("Mismatched type converter count");
				}
				for(let i = 0; i < my_types.length; ++i) {
					that.embind_register_type(my_types[i], my_type_converters[i]);
				}
			}
			const type_converters = new Array(dependent_types.length);
			const unregistered_types = [];
			let registered = 0;
			dependent_types.forEach(function(dt, i) {
				if(that.registered_types.hasOwnProperty(dt)) {
					type_converters[i] = that.registered_types[dt];
				} else {
					unregistered_types.push(dt);
					if(!that.awaiting_deps.hasOwnProperty(dt)) {
						that.awaiting_deps[dt] = [];
					}
					that.awaiting_deps[dt].push(function() {
						type_converters[i] = that.registered_types[dt];
						if(++registered == unregistered_types.length) {
							on_complete(type_converters);
						}
					});
				}
			});
			if(!unregistered_types.length) {
				on_complete(type_converters);
			}
		}
		embind_heap32vector2array(count, first_element) {
			return this.HEAP32.subarray(first_element, first_element + count);
		}
		embind_require_registered_type(raw_type, human_name) {
			const impl = this.registered_types[raw_type];
			if(!impl) {
				throw new Error(human_name + " has unknown type " + raw_type);
			}
			return impl;
		}
		embind_get_shift_from_size(size) {
			return Math.log2(size);
		}
		embind_register_void(raw_type, name) {
			name = this.read_str(name);
			this.embind_register_type(raw_type, {
				isVoid: true,
				name,
				argPackAdvance: 0,
				fromWireType: function() {
					return undefined;
				},
				toWireType: function(dtors, o) {
					return undefined;
				}
			});
		}
		embind_register_bool(raw_type, name, size, true_value, false_value) {
			const shift = this.embind_get_shift_from_size(size);
			const heap = [this.HEAP8, this.HEAP16, undefined, this.HEAP32][size];
			name = this.read_str(name);
			this.embind_register_type(raw_type, {
				name,
				fromWireType: function(wt) {
					return !!wt;
				},
				toWireType: function(dtors, o) {
					return o ? true_value : false_value;
				},
				argPackAdvance: 8,
				readValueFromPointer: function(ptr) {
					return this.fromWireType(heap[ptr >> shift]);
				},
				destructorFunction: null
			});
		}
		embind_register_integer(primitive_type, name, size, min_range, max_range) {
			const shift = this.embind_get_shift_from_size(size);
			name = this.read_str(name);
			if(max_range == -1) {
				max_range = 4294967295;
			}
			let fromWireType = function(value) {
				return value;
			};
			if(min_range == 0) {
				const bitshift = 32 - 8 * size;
				fromWireType = function(value) {
					return (value << bitshift) >>> bitshift;
				};
			}
			const is_unsigned_type = name.indexOf("unsigned") != -1;
			const heap = [
				[this.HEAP8, this.HEAPU8],
				[this.HEAP16, this.HEAPU16],
				[this.HEAP32, this.HEAPU32]
			][shift][+is_unsigned_type];
			const that = this;
			this.embind_register_type(primitive_type, {
				name,
				fromWireType,
				toWireType: function(dtors, value) {
					if(typeof value != "number" && typeof value != "boolean") {
						throw new Error("Cannot convert '" + that.embind_repr(value) + "' to " + name);
					}
					if(value < min_range || value > max_range) {
						throw new Error("Passing a number '" + embind_repr(value) +
							"' from JS side to C/C++ side to an argument of type '" + name +
							"', which is outside the valid range [" + min_range + ", " + max_range + "]");
					}
					return is_unsigned_type ? (value >>> 0) : (value | 0);
				},
				argPackAdvance: 8,
				readValueFromPointer: function(ptr) {
					return heap[ptr >> shift];
				},
				destructorFunction: null
			});
		}
		embind_register_float(raw_type, name, size) {
			const shift = this.embind_get_shift_from_size(size);
			const heap = [
				undefined, undefined,
				this.HEAPF32, this.HEAPF64
			][shift];
			name = this.read_str(name);
			const that = this;
			this.embind_register_type(raw_type, {
				name,
				fromWireType: function(value) {
					return value;
				},
				toWireType: function(dtors, value) {
					if(typeof value != "number" && typeof value != "boolean") {
						throw new Error("Cannot convert '" + that.embind_repr(value) + "' to " + name);
					}
					return value;
				},
				argPackAdvance: 8,
				readValueFromPointer: function(ptr) {
					return heap[ptr >> shift];
				},
				destructorFunction: null
			});
		}
		embind_register_std_string(raw_type, name) {
			return this.embind_register_std_wstring(raw_type, 1, name);
		}
		embind_register_std_wstring(raw_type, char_size, name) {
			const shift = this.embind_get_shift_from_size(char_size);
			const heap = [this.HEAPU8, this.HEAPU16, this.HEAPU32][shift];
			name = this.read_str(name);
			const that = this;
			this.embind_register_type(raw_type, {
				name,
				fromWireType: function(value) {
					const len = that.HEAPU32[value >> 2];
					const null_byte_ptr = (value + 4 + len * char_size) >> shift;
					heap[null_byte_ptr] = 0;
					const start_ptr = (value + 4) >> shift;
					let str = "";
					for(let i = start_ptr; i < null_byte_ptr; ++i) {
						str += String.fromCharCode(heap[i]);
					}
					that.free(value);
					return str;
				},
				toWireType: function(dtors, value) {
					if(value instanceof ArrayBuffer) {
						value = new Uint8Array(value);
					}
					const is_str = typeof value === "string";
					if(!(
						is_str ||
						value instanceof Uint8Array ||
						value instanceof Uint8ClampedArray ||
						value instanceof Int8Array
					)) {
						throw new Error("Cannot pass non-string to std::string");
					}
					const len = is_str ? value.length : that.strlen_explicit(0, value);
					const ptr = that.malloc(4 + len + char_size);
					that.HEAPU32[ptr >> 2] = len;
					if(is_str) {
						for(let i = 0; i < len; ++i) {
							heap[(ptr + 4 + i * char_size) >> shift] = value.charCodeAt(i);
						}
					} else {
						for(let i = 0; i < len; ++i) {
							heap[(ptr + 4 + i * char_size) >> shift] = value[i];
						}
					}
					if(dtors) {
						dtors.push(that.free.bind(that), ptr);
					}
					return ptr;
				},
				argPackAdvance: 8,
				readValueFromPointer: function(ptr) {
					return this.fromWireType(that.HEAPU32[ptr >> 2]);
				},
				destructorFunction: function(ptr) { that.free(ptr); }
			});
		}
		embind_register_emval(raw_type, name) {
			name = this.read_str(name);
			const that = this;
			this.embind_register_type(raw_type, {
				name,
				fromWireType: function(handle) {
					const return_value = that.emval_require_handle(handle);
					that.emval_decref(handle);
					return return_value;
				},
				toWireType: function(dtors, value) {
					return that.emval_register(value);
				},
				argPackAdvance: 8,
				readValueFromPointer: function(ptr) {
					return this.fromWireType(that.HEAPU32[ptr >> 2]);
				},
				destructorFunction: null
			});
		}
		embind_register_memory_view(raw_type, data_type_index, name) {
			const type = [
				Int8Array,
				Uint8Array,
				Int16Array,
				Uint16Array,
				Int32Array,
				Uint32Array,
				Float32Array,
				Float64Array
			][data_type_index];
			const that = this;
			function decode_memory_view(handle) {
				handle >>= 2;
				const heap = that.HEAPU32;
				const size = heap[handle];
				const data = heap[handle + 1];
				return new type(that.arraybuffer, data, size);
			}
			name = this.read_str(name);
			this.embind_register_type(raw_type, {
				name,
				fromWireType: decode_memory_view,
				argPackAdvance: 8,
				readValueFromPointer: decode_memory_view
			}, { ignoreDuplicateRegistrations: true });
		}
		embind_run_dtors(dtors) {
			while(dtors.length) {
				const ptr = dtors.pop();
				const del = dtors.pop();
				del(ptr);
			}
		}
		embind_new(ctor, args_list) {
			if(!(ctor instanceof Function)) {
				throw new Error("new_ called with constructor type " + typeof(ctor) + " which is not a function");
			}
			const dummy = this.embind_create_named_function(ctor.name || "unknownFunctionName", function(){});
			dummy.prototype = ctor.prototype;
			const obj = new dummy;
			const return_value = ctor.apply(obj, args_list);
			return return_value instanceof Object ? r : obj;
		}
		embind_craft_invoker_function(human_name, arg_types, class_type, cpp_invoker_func, cpp_target_func) {
			const arg_count = arg_types.length;
			if(arg_count < 2) {
				throw new Error("argTypes array size mismatch! Must at least get return value and 'this' types!");
			}
			const is_class_method_func = arg_types[1] !== null && class_type !== null;
			let needs_dtor_stack = false;
			for(let i = 1; i < arg_count; ++i) {
				if(arg_types[i] !== null && arg_types[i].destructorFunction === undefined) {
					needs_dtor_stack = true;
					break;
				}
			}
			const returns = arg_types[0].name !== "void";
			const expected_arg_count = arg_count - 2;
			const args_wired = new Array(expected_arg_count);
			const invoker_func_args = [];
			const dtors = [];
			const that = this;
			return function() {
				if(arguments.length != expected_arg_count) {
					throw new Error("function " + human_name + " called with " + arguments.length + " arguments, expected " + expected_arg_count + " args!");
				}
				dtors.length = 0;
				let this_wired;
				invoker_func_args.length = is_class_method_func ? 2 : 1;
				invoker_func_args[0] = cpp_target_func;
				if(is_class_method_func) {
					this_wired = arg_types[1].toWireType(dtors, this);
					invoker_func_args[1] = this_wired;
				} else {
					args_wired[i] = arg_types[i + 2].toWireType(dtors, arguments[i]);
					invoker_func_args.push(args_wired[i]);
				}
				const return_value = cpp_invoker_func.apply(null, invoker_func_args);
				if(needs_dtor_stack) {
					that.embind_run_dtors(dtors);
				} else {
					for(let i = is_class_method_func ? 1 : 2; i < arg_count; ++i) {
						const param = i == 1 ? this_wired : args_wired[i - 2];
						if(arg_types[i].destructorFunction !== null) {
							arg_types[i].destructorFunction(param);
						}
					}
				}
				if(returns) {
					return arg_types[0].fromWireType(return_value);
				}
			};
		}
		embind_require_function(signature, raw_function) {
			signature = this.read_str(signature);
			function make_dyn_caller(dyn_call) {
				const arg_cache = [raw_function];
				return function() {
					arg_cache.length = arguments.length + 1;
					for(let i = 0; i < arguments.length; ++i) {
						arg_cache[i + 1] = arguments[i];
					}
					return dyn_call.apply(null, arg_cache);
				};
			}
			const dyn_call = this.Module["dynCall_" + signature];
			const function_pointer = make_dyn_caller(dyn_call);
			if(typeof function_pointer !== "function") {
				throw new Error("unknown function pointer with signature " + signature + ": " + raw_function);
			}
			return function_pointer;
		}
		embind_register_function(name, arg_count, raw_arg_types_addr, signature, raw_invoker, fn) {
			const arg_types = this.embind_heap32vector2array(arg_count, raw_arg_types_addr);
			name = this.read_str(name);
			raw_invoker = this.embind_require_function(signature, raw_invoker);
			this.embind_expose_public_symbol(name, function() {
				throw new Error("Cannot call " + name + " due to unbound types", arg_types);
			}, arg_count - 1);
			this.embind_when_dependent_types_are_resolved([], arg_types, function(arg_types) {
				const invoker_args_array = [arg_types[0], null].concat(arg_types.slice(1));
				this.embind_replace_public_symbol(name, this.embind_craft_invoker_function(name, invoker_args_array, null, raw_invoker, fn), arg_count - 1);
				return [];
			}.bind(this));
		}
	}

	python.stdout.on("data", function(data) {
		data = data.toString("ascii");
		if(!data.startsWith(">.<\n"))
		{
			return;
		}
		data = data.substring(4).split(">.<\n");
		for(let token of data)
		{
			token = token.trim();
			if(!token.startsWith("player")) continue;
			new Bot(lobby_id, region_id, party_code, token);
		}
	});

	python.stdin.write(lobby_id + "\n");
})();
