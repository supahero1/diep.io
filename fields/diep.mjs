import { spawn } from "node:child_process";
import axios from "axios";
import WebSocket from "ws";
// import { solve_pow } from "./pow_solver.js";
import * as WAIL from "./wail.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const encoder = new TextEncoder();
const encode = encoder.encode.bind(encoder);

// const python = spawn("python3", ["diep.py"]);

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
	const readystate_signature = "1==.*?readyState";
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
		"onerror=function\\(\\)\\{\\}": function(ws_idx) {
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
		[readystate_signature]: function(ws_idx) {
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
				dyn_signatures[signature].code = code;
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


	const WASM = {
		SKIP_I: "a",
		SKIP_F: "b",
		SKIP_V: "c",
		SAVE_I: "d",
		SAVE_F: "e",
		SAVE_V: "f",
		READ_I: "g",
		READ_F: "h",
		READ_V: "i",
		LOG: "j"
	};
	const wasm_signatures = {
		ptr_entity_head: { cross_function: true, signature: [
			WAIL.OP_END,
			WAIL.OP_GET_LOCAL, WASM.SKIP_I,
			WAIL.OP_I32_CONST, WASM.SAVE_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_I,
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_I32_LOAD16_U, 1
		] },
		ptr_socket: { cross_function: true, signature: [
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SAVE_V,
			WAIL.OP_I32_LOAD, 2, 0,
			WAIL.OP_ELSE
		] },
		offset_entity_head: { cross_function: true, signature: [
			WAIL.OP_END,
			WAIL.OP_GET_LOCAL, 0,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_STORE, 2, WASM.SAVE_V,
			WAIL.OP_GET_LOCAL, 0,
			WAIL.OP_GET_LOCAL, 1,
			WAIL.OP_I32_ADD
		] },
		func_tick_start: { cross_function: false, signature: [
			WAIL.OP_END,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_LOAD, 2, 0,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_XOR,
			WAIL.OP_TEE_LOCAL, WASM.SAVE_V,
			WAIL.OP_I32_STORE, 2, 0
		] },
		func_tick_end: { cross_function: false, signature: [
			WAIL.OP_GET_GLOBAL, WASM.SKIP_V,
			WAIL.OP_I32_EQZ,
			WAIL.OP_IF, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_ADD,
			WAIL.OP_SET_GLOBAL, WASM.SKIP_V,
			WAIL.OP_RETURN,
			WAIL.OP_END,
			WAIL.OP_END,

			WAIL.OP_GET_GLOBAL, WASM.SKIP_V,
			WAIL.OP_I32_EQZ,
			WAIL.OP_IF, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_UNREACHABLE,
			WAIL.OP_END,
			WAIL.OP_RETURN,
			WAIL.OP_END
		] },
		func_send: { cross_function: false, signature: [
			WAIL.OP_I32_CONST, WASM.READ_V, dyn_signatures[send_signature].code,
			WAIL.OP_I32_CONST
		] },
		func_presend: { cross_function: false, signature: [
			WAIL.OP_BLOCK, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_BLOCK, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_I32_CONST, WASM.READ_V, dyn_signatures[readystate_signature].code
		] },
		func_entity_creation: { cross_function: false, signature: [
			WAIL.OP_F32_CONST, WASM.READ_F, 0.015625,
			WAIL.OP_F32_MUL,
			WAIL.OP_F32_STORE, 2, 0,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST
		] },
		func_entity_deletion: { cross_function: false, signature: [
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SAVE_V,
			WAIL.OP_I32_ADD,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_ADD,
			WAIL.OP_I32_LOAD8_U, 0, WASM.SKIP_V,
			WAIL.OP_I32_EQZ,
			WAIL.OP_TEE_LOCAL
		] },
		func_latency: { cross_function: false, signature: [
			WAIL.OP_I32_SUB,
			WAIL.OP_I32_CONST, 3,
			WAIL.OP_I32_SHR_S,
			WAIL.OP_F64_CONVERT_U_I32,
			WAIL.OP_TEE_LOCAL, WASM.SAVE_V,
			WAIL.OP_F64_DIV,
			WAIL.OP_F64_CONST
		] },
		field_hp: { cross_function: true, signature: [
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_DROP,
			WAIL.OP_BLOCK, WAIL.VALUE_TYPE_F32,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_LOAD8_U, 0, WASM.SKIP_V,
			WAIL.OP_IF, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_BR
		] },
		field_max_hp: { cross_function: true, signature: [
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_ADD,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_BLOCK, WAIL.VALUE_TYPE_F32,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_LOAD8_U, 0, WASM.SKIP_V,
			WAIL.OP_IF, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_BR
		] },
		field_fov: { cross_function: true, signature: [
			WAIL.OP_I32_LOAD, 2, 0,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_EQZ,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_BR_IF, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V
		] },
		field_level: { cross_function: true, signature: [
			WAIL.OP_I32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, 15,
			WAIL.OP_I32_REM_S
		] },
		field_size: { cross_function: true, signature: [
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_F64_PROMOTE_F32,
			WAIL.OP_F64_CONST, 205, 59, 127, 102, 158, 160, 246, 63 /* 1.4142 */
		] },
		field_sides: { cross_function: true, signature: [
			WAIL.OP_I32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, 1,
			WAIL.OP_I32_NE,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, 3,
			WAIL.OP_I32_LT_S
		] },
		field_color: { cross_function: true, signature: [
			WAIL.OP_IF, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_I32_CONST, 0,
			WAIL.OP_I32_LT_S
		] },
		field_player_id: { cross_function: true, signature: [
			WAIL.OP_I32_LOAD16_U, 1, WASM.SAVE_V,
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_LOAD16_U
		] },
		field_owner_id: { cross_function: true, signature: [
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_STORE16, 1, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_STORE16, 1, WASM.SAVE_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_STORE16, 1, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_STORE, 2, WASM.SKIP_V,
			WAIL.OP_END,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_CALL, WASM.SKIP_V,
			WAIL.OP_DROP
		] },
		field_camera: { cross_function: true, signature: [
			WAIL.OP_GET_GLOBAL, WASM.SKIP_V,
			WAIL.OP_I32_EQZ,
			WAIL.OP_IF, WAIL.VALUE_TYPE_BLOCK,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,

			WAIL.OP_F32_STORE, 2, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_STORE, 2, WASM.SKIP_V,
			WAIL.OP_END
		] },
		field_leader_x: { cross_function: true, signature: [
			WAIL.OP_F64_LT,
			WAIL.OP_SELECT,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_F64_PROMOTE_F32,
			WAIL.OP_F64_MUL,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, 0,
			WAIL.OP_SET_LOCAL
		] },
		field_leader_y: { cross_function: true, signature: [
			WAIL.OP_F64_LT,
			WAIL.OP_SELECT,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_F64_PROMOTE_F32,
			WAIL.OP_F64_MUL,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_I32_CONST, WASM.SKIP_V,
			WAIL.OP_I32_LOAD
		] },
		field_arena_size: { cross_function: true, signature: [
			WAIL.OP_I32_LOAD, 2, 0,
			WAIL.OP_TEE_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SAVE_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,

			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SKIP_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SKIP_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, WASM.SKIP_V,
			WAIL.OP_SET_LOCAL, WASM.SKIP_V,
			WAIL.OP_GET_LOCAL, WASM.SKIP_V,
			WAIL.OP_F32_LOAD, 2, 0
		] },
	};
	for(const signature in wasm_signatures) {
		const sig = wasm_signatures[signature].signature;
		sig.indexes = [];
		sig.results = [];
		sig.start_offsets = [];
		sig.end_offsets = [];
	}
	class Reader {
		buffer;
		at;

		constructor() {}
		set(buffer, at = 0) {
			this.buffer = buffer;
			this.at = at;
		}
		u8() {
			return this.buffer[this.at++];
		}
		f() {
			const arr = new Uint8Array(this.buffer.subarray(this.at, this.at + 4));
			if(arr.length != 4) return Number.MIN_SAFE_INTEGER;
			this.at += 4;
			return new Float32Array(arr.buffer)[0];
		}
		vi() { // zeach
			let number = 0;
			let count = 0;
			do {
				number |= (this.buffer[this.at] & 0x7f) << (7 * count++);
			} while(this.buffer[this.at++] >> 7);
			return number;
		}
		skip_u8() {
			++this.at;
		}
		skip_f() {
			this.at += 4;
		}
		skip_vi() {
			while(this.buffer[this.at++] >> 7);
		}
		bytes(num) {
			return this.buffer.subarray(this.at, this.at + num);
		}
	}
	const reader = new Reader();
	function check_signature(index, bytes, name, { cross_function, signature }) {
		const len = Math.max(0, bytes.length - signature.length);
		for(let i = 0; i < len; ++i) {
			reader.set(bytes, i);
			let results = [];
			let j = 0;
			loop: for(; j < signature.length; ++j) {
				switch(signature[j]) {
					case WASM.SKIP_I:
						reader.skip_u8();
						break;
					case WASM.SKIP_F:
						reader.skip_f();
						break;
					case WASM.SKIP_V:
						reader.skip_vi();
						break;
					case WASM.SAVE_I:
						results[results.length] = reader.u8();
						break;
					case WASM.SAVE_F:
						results[results.length] = reader.f();
						break;
					case WASM.SAVE_V:
						results[results.length] = reader.vi();
						break;
					case WASM.READ_I:
						if(reader.u8() != signature[++j]) break loop;
						break;
					case WASM.READ_F:
						if(reader.f() != signature[++j]) break loop;
						break;
					case WASM.READ_V:
						if(reader.vi() != signature[++j]) break loop;
						break;
					case WASM.LOG:
						log(LOG.VERBOSE, name + "[" + Array.from(reader.bytes(12)).join(", ") + "]");
						break;
					default:
						if(reader.u8() != signature[j]) break loop;
						break;
				}
			}
			if(j == signature.length) {
				if(signature.indexes.length)
				{
					if(!cross_function) {
						throw new Error("Multiple cross-function matches for wasm signature " + name + " (" + [...signature.indexes, index].join(", ") + ")");
					}
					if(!(function(a, b) {
							if(a.length != b.length) return false;
							for(let i = 0; i < a.length; ++i) {
								if(a[i] != b[i]) return false;
							}
							return true;
						})(signature.results, results)) {
						throw new Error("Multiple cross-result matches for wasm signature " + name + " (" + [...signature.indexes, index].join(", ") + ")");
					}
				}
				signature.indexes.push(index);
				signature.results = results;
				signature.start_offsets.push(i);
				signature.end_offsets.push(reader.at);
			}
		}
	}

	const wail = new WAIL.WailParser(wasm_bin);
	wail.addCodeElementParser(null, function({ index, bytes }) {
		for(const signature in wasm_signatures) {
			check_signature(index, bytes, signature, wasm_signatures[signature]);
		}
		return bytes;
	});
	wail.parse();
	for(const signature in wasm_signatures) {
		const sig = wasm_signatures[signature].signature;
		if(!sig.indexes.length) {
			throw new Error("No matches for wasm signature " + signature);
		}
		log(LOG.VERBOSE, signature +
			"(idx=[" + sig.indexes.join(", ") +
			"], res=[" + sig.results.join(", ") +
			"], soff=[" + sig.start_offsets.join(", ") +
			"], eoff=[" + sig.end_offsets.join(", ") +
			"])");
	}

	const constants = {
		ptr_entity_head: wasm_signatures.ptr_entity_head.signature.results[0] + wasm_signatures.offset_entity_head.signature.results[0] - 4,
		ptr_socket: wasm_signatures.ptr_socket.signature.results[0],

		func_tick_start: wasm_signatures.func_tick_start.signature.indexes[0],
		func_tick_end: wasm_signatures.func_tick_end.signature.indexes[0],
		func_send: wasm_signatures.func_send.signature.indexes[0],
		func_presend: wasm_signatures.func_presend.signature.indexes[0],
		func_entity_creation: wasm_signatures.func_entity_creation.signature.indexes[0],
		func_entity_deletion: wasm_signatures.func_entity_deletion.signature.indexes[0],
		func_latency: wasm_signatures.func_latency.signature.indexes[0],

		offset_tick_start: wasm_signatures.func_tick_start.signature.end_offsets[0],
		offset_tick_end: wasm_signatures.func_tick_end.signature.start_offsets[0],
		offset_entity_deletion: wasm_signatures.func_entity_deletion.signature.start_offsets[0],
		offset_latency: wasm_signatures.func_latency.signature.end_offsets[0] - 1,

		variable_tick_start: wasm_signatures.func_tick_start.signature.results[0],
		variable_entity_deletion: wasm_signatures.func_entity_deletion.signature.results[0],
		variable_latency: wasm_signatures.func_latency.signature.results[0],

		field_hp: wasm_signatures.field_hp.signature.results[0],
		field_max_hp: wasm_signatures.field_max_hp.signature.results[0],
		field_fov: wasm_signatures.field_fov.signature.results[0],
		field_level: wasm_signatures.field_level.signature.results[0],
		field_size: wasm_signatures.field_size.signature.results[0],
		field_sides: wasm_signatures.field_sides.signature.results[0],
		field_color: wasm_signatures.field_color.signature.results[0],
		field_player_id: wasm_signatures.field_player_id.signature.results[0],
		field_owner_id: wasm_signatures.field_owner_id.signature.results[0],
		field_camera_x: wasm_signatures.field_camera.signature.results[0],
		field_camera_y: wasm_signatures.field_camera.signature.results[1],
		field_leader_x: wasm_signatures.field_leader_x.signature.results[0],
		field_leader_y: wasm_signatures.field_leader_y.signature.results[0],
		field_arena_min_x: wasm_signatures.field_arena_size.signature.results[0],
		field_arena_max_x: wasm_signatures.field_arena_size.signature.results[1],
		field_arena_min_y: wasm_signatures.field_arena_size.signature.results[2],
		field_arena_max_y: wasm_signatures.field_arena_size.signature.results[3],
		field_x: 144,
		field_y: 148,
		field_score: 8,

		type_player: 23065,
		type_shape: 6681,
		type_projectile: 6169,
		type_gui: 1025,
		type_arena: 33024
	};
	for(const constant in constants) {
		if(!constant.startsWith("func_")) continue;
		output_map[constant] = constant;
	}

	function patch_wasm(bytecode) {
		const wail = new WAIL.WailParser(bytecode);
		const func_type = wail.addTypeEntry({
			form: "func",
			params: ["i32"]
		});
		const functions = {};
		for(const constant in constants) {
			if(!constant.startsWith("func_")) continue;
			functions[constant] = {
				index: wail.getFunctionIndex(constants[constant]),
				hook: wail.addImportEntry({
					moduleStr: "a",
					fieldStr: constant,
					kind: "func",
					type: func_type
				})
			};
			wail.addExportEntry(functions[constant].index, {
				fieldStr: constant,
				kind: "func"
			});
		}
		wail.addCodeElementParser(null, function({ index, bytes }) {
			if(index == functions.func_tick_end.index.i32()) {
				bytes = new Uint8Array([
					...bytes.slice(0, constants.offset_tick_end),
					WAIL.OP_I32_CONST, 0,
					WAIL.OP_CALL, ...WAIL.VarUint32ToArray(functions.func_tick_end.hook.i32()),
					...bytes.slice(constants.offset_tick_end)
				]);
			}
			if(index == functions.func_entity_deletion.index.i32()) {
				bytes = new Uint8Array([
					...bytes.slice(0, constants.offset_entity_deletion),
					WAIL.OP_GET_LOCAL, ...WAIL.VarUint32ToArray(constants.variable_entity_deletion),
					WAIL.OP_CALL, ...WAIL.VarUint32ToArray(functions.func_entity_deletion.hook.i32()),
					...bytes.slice(constants.offset_entity_deletion)
				]);
			}
			if(index == functions.func_latency.index.i32()) {
				bytes = new Uint8Array([
					...bytes.slice(0, constants.offset_latency),
					WAIL.OP_I32_CONST, 0,
					WAIL.OP_GET_LOCAL, ...WAIL.VarUint32ToArray(constants.variable_latency),
					WAIL.OP_F64_STORE, 3, 0,
					WAIL.OP_TEE_LOCAL, ...WAIL.VarUint32ToArray(constants.variable_latency),
					WAIL.OP_GET_LOCAL, ...WAIL.VarUint32ToArray(constants.variable_latency),
					WAIL.OP_F64_CONST, 0, 0, 0, 0, 0, 0, 64, 64, /* 32 */
					WAIL.OP_F64_MUL,
					WAIL.OP_I32_TRUNC_U_F64,
					WAIL.OP_CALL, ...WAIL.VarUint32ToArray(functions.func_latency.hook.i32()),
					WAIL.OP_I32_CONST, 0,
					WAIL.OP_F64_LOAD, 3, 0,
					WAIL.OP_SET_LOCAL, ...WAIL.VarUint32ToArray(constants.variable_latency),
					...bytes.slice(constants.offset_latency)
				]);
			}
			if(index == functions.func_tick_start.index.i32()) {
				bytes = new Uint8Array([
					...bytes.slice(0, constants.offset_tick_start),
					WAIL.OP_GET_LOCAL, ...WAIL.VarUint32ToArray(constants.variable_tick_start),
					WAIL.OP_CALL, ...WAIL.VarUint32ToArray(functions.func_tick_start.hook.i32()),
					...bytes.slice(constants.offset_tick_start)
				]);
			}
			if(index == functions.func_entity_creation.index.i32()) {
				bytes =  new Uint8Array([
					WAIL.OP_GET_LOCAL, 0,
					WAIL.OP_CALL, ...WAIL.VarUint32ToArray(functions.func_entity_creation.hook.i32()),
					...bytes
				]);
			}
			if(index == functions.func_send.index.i32()) {
				bytes =  new Uint8Array([
					WAIL.OP_GET_LOCAL, 0,
					WAIL.OP_CALL, ...WAIL.VarUint32ToArray(functions.func_send.hook.i32()),
					...bytes
				]);
			}
			return bytes;
		});
		wail.parse();
		return wail.write();
	}

	class BotHelper {
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

		data = new Uint8Array(524288);
		view = new DataView(this.data.buffer);
		at;

		tick = 0;
		once = false;
		entity_count = 0;
		creations = [];
		deletions = [];
		arena_ptr = 0;
		arena = null;
		gui_ptr = 0;
		gui = null;
		latency = 0;
		active = 0;
		ws;

		constructor() {
			//this.connect();
			this.bullets = 0;
			this.mx = innerWidth * 0.5;
			this.my = innerHeight * 0.5;
			this.flip = 0;
			const that = this;
			setTimeout(function() {
				input.key_down = new Proxy(input.key_down, {
					apply: function(to, what, args) {
						if(args[0] == 69) {
							that.bullets = 0;
						}
						return to.apply(what, args);
					}
				});
				input.mouse = new Proxy(input.mouse, {
					apply: function(to, what, args) {
						[that.mx, that.my] = args;
						if(that.flip > 0) {
							args[0] = innerWidth - args[0];
							args[1] = innerHeight - args[1];
						}
						return to.apply(what, args);
					}
				});
			}, 1000);
		}
		imports(obj) {
			for(const constant in constants) {
				if(!constant.startsWith("func_")) continue;
				obj.a[constant] = this[constant].bind(this);
			}
		}
		exports(obj) {
			for(const old_name in output_map) {
				this.Module[output_map[old_name]] = obj[old_name];
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
		}
		func_tick_start(tick) {
			if(this.tick >= tick) return;
			this.tick = tick;
			this.once = true;
			this.creations = [];
			this.deletions = [];
			setTimeout(this.test.bind(this), 1);
		}y
		set_flip(flip) {
			this.flip = Math.max(0, this.flip + flip);
			input.mouse(this.mx, this.my);
			const socket_ptr = this.HEAPU32[constants.ptr_socket >> 2];
			this.Module["func_send"](socket_ptr);
		}
		test() {
			this.player_id = this.parse_entity(this.gui_ptr).player_id;
			this.set_flip(-1);
			for(const ptr of this.creations) {
				const entity = this.parse_entity(ptr);
				if(entity.type == constants.type_projectile && entity.owner_id == this.player_id) {
					++this.bullets;
					if(this.bullets == 5) {
						this.set_flip(5);
						this.bullets = 0;
					}
				}
			}
		}
		func_tick_end(_) {
			return;
			if(!this.once) return;
			this.once = false;
			this.player_id = this.parse_entity(this.gui_ptr).player_id;
			this.set_flip(-1);
			for(const ptr of this.creations) {
				const entity = this.parse_entity(ptr);
				if(entity.type == constants.type_projectile && entity.owner_id == this.player_id) {
					++this.bullets;
					if(this.bullets == 5) {
						this.set_flip(5);
						this.bullets = 0;
					}
				}
			}
			// if(this.active && this.arena_ptr && this.gui_ptr) {
			// 	this.serialize();
			// 	this.ws.send(this.data.subarray(0, this.at));
			// }
		}
		func_send(_){}
		func_presend(_){}
		func_entity_creation(ptr) {
			if(this.HEAPU32[(ptr + 104) >> 2]) {
				this.arena_ptr = ptr;
			} else if(this.HEAPU32[(ptr + 112) >> 2]) {
				this.gui_ptr = ptr;
			} else {
				this.creations[this.creations.length] = ptr;
				++this.entity_count;
			}
		}
		func_entity_deletion(id) {
			if(this.arena && this.arena.id == id) {
				this.arena_ptr = 0;
				this.arena = null;
			} else if(this.gui && this.gui.id == id) {
				this.gui_ptr = 0;
				this.gui = null;
			} else {
				this.deletions[this.deletions.length] = id;
				--this.entity_count;
			}
		}
		func_latency(latency) {
			this.latency = latency / 32;
		}
		connect() {
			this.ws = new WebSocket("ws://localhost:9348");
			this.ws.onopen = function() {
				this.active = 1;
			}.bind(this);
			this.ws.onclose = function() {
				this.active = 0;
				setTimeout(this.connect.bind(this), 2000);
			}.bind(this);
			this.ws.onmessage = function({ data }) {
				data = new Uint8Array(data);
				if(data[0] != 255) {
					this.diep_send(data);
				} else {
					this.server_data(data.slice(1));
				}
			}.bind(this);
		}
		diep_send(bytes) {
			const ptr = this.Module["_malloc"](bytes.length);
			for(let i = 0; i < bytes.length; ++i) {
				this.HEAPU8[ptr + i] = bytes[i];
			}
			const socket_ptr = this.HEAPU32[constants.ptr_socket >> 2];
			this.Module["func_presend"](socket_ptr, ptr, bytes.length);
			this.Module["func_send"](socket_ptr);
		}
		server_data(data) {
			console.log("server data", data);
		}
		parse_entity(ptr) {
			const u16 = this.HEAPU16;
			const u32 = this.HEAPU32;
			const f32 = this.HEAPF32;

			const id = u16[(ptr + 54) >> 1];
			const groups = u32.subarray((ptr + 72) >> 2, (ptr + 136) >> 2);

			let type = 0;
			for(let i = 0; i < 16; ++i) {
				if(groups[i]) {
					type |= 1 << i;
				}
			}
			const entity = { id, type };

			const relations_ptr = groups[0];
			const physics_ptr = groups[3];
			const health_ptr = groups[4];
			const arena_ptr = groups[8];
			const gui_ptr = groups[10];
			const pos_ptr = groups[11];
			const style_ptr = groups[12];
			const score_ptr = groups[14];

			if(relations_ptr) {
				entity.owner_id = u16[(relations_ptr + constants.field_owner_id) >> 1];
			}

			if(physics_ptr) {
				entity.size = f32[(physics_ptr + constants.field_size) >> 2];
				entity.sides = u32[(physics_ptr + constants.field_sides) >> 2];
			}

			if(health_ptr) {
				entity.hp = f32[(health_ptr + constants.field_hp) >> 2];
				entity.max_hp = f32[(health_ptr + constants.field_max_hp) >> 2];
			}

			if(arena_ptr) {
				entity.arena_min_x = f32[(arena_ptr + constants.field_arena_min_x) >> 2];
				entity.arena_max_x = f32[(arena_ptr + constants.field_arena_max_x) >> 2];
				entity.arena_min_y = f32[(arena_ptr + constants.field_arena_min_y) >> 2];
				entity.arena_max_y = f32[(arena_ptr + constants.field_arena_max_y) >> 2];
				entity.leader_x = f32[(arena_ptr + constants.field_leader_x) >> 2];
				entity.leader_y = f32[(arena_ptr + constants.field_leader_y) >> 2];
			}

			if(gui_ptr) {
				entity.player_id = u16[(gui_ptr + constants.field_player_id) >> 1];
				entity.fov = f32[(gui_ptr + constants.field_fov) >> 2];
				entity.level = u32[(gui_ptr + constants.field_level) >> 2];
				entity.camera_x = f32[(gui_ptr + constants.field_camera_x) >> 2];
				entity.camera_y = f32[(gui_ptr + constants.field_camera_y) >> 2];
			}

			if(pos_ptr) {
				entity.x = f32[(pos_ptr + constants.field_x) >> 2];
				entity.y = f32[(pos_ptr + constants.field_y) >> 2];
			}

			if(style_ptr) {
				entity.color = u32[(style_ptr + constants.field_color) >> 2];
			}

			if(score_ptr) {
				entity.score = f32[(score_ptr + constants.field_score) >> 2];
			}

			return entity;
		}
		shape_score(sides) {
			switch(sides) {
				case 3: return 25;
				case 4: return 10;
				case 5: return 130;
			}
		}
		serialize() {
			this.at = 0;

			if(this.arena_ptr) {
				this.arena = this.parse_entity(this.arena_ptr);
			}
			if(this.gui_ptr) {
				this.gui = this.parse_entity(this.gui_ptr);
			}

			this.view.setUint32(this.at, this.tick, true);
			this.at += 4;

			this.serialize_info({
				...this.arena,
				...this.gui
			});

			this.view.setUint16(this.at, this.deletions.length, true);
			this.at += 2;
			for(const entity_id of this.deletions) {
				console.log("del ent " + entity_id);
				this.view.setUint16(this.at, entity_id, true);
				this.at += 2;
			}

			this.view.setUint16(this.at, this.creations.length, true);
			this.at += 2;
			for(const ptr of this.creations) {
				const entity = this.parse_entity(ptr);
				switch(entity.type) {
					case constants.type_player:
						this.serialize_player(entity);
						break;
					case constants.type_projectile:
						this.serialize_projectile(entity);
						break;
					case constants.type_shape:
						this.serialize_shape(entity);
						break;
					default: break;
				}
			}

			this.view.setUint16(this.at, this.entity_count - this.creations.length, true);
			this.at += 2;
			let ptr = this.HEAPU32[constants.ptr_entity_head >> 2];
			while(ptr && ptr != this.creations[0]) {
				const entity = this.parse_entity(ptr);
				console.log("updating", entity.type);
				switch(entity.type) {
					case constants.type_player:
						this.serialize_player(entity);
						break;
					case constants.type_projectile:
						this.serialize_projectile(entity);
						break;
					case constants.type_shape:
						this.serialize_shape(entity);
						break;
					default: break;
				}
				ptr = this.HEAPU32[(ptr + 12) >> 2];
			}
		}
		serialize_info({
			arena_min_x,
			arena_max_x,
			arena_min_y,
			arena_max_y,
			leader_x,
			leader_y,

			player_id,
			fov,
			level,
			camera_x,
			camera_y
		}) {
			this.view.setFloat32(this.at, arena_min_x, true);
			this.at += 4;
			this.view.setFloat32(this.at, arena_max_x, true);
			this.at += 4;
			this.view.setFloat32(this.at, arena_min_y, true);
			this.at += 4;
			this.view.setFloat32(this.at, arena_max_y, true);
			this.at += 4;
			this.view.setFloat32(this.at, leader_x, true);
			this.at += 4;
			this.view.setFloat32(this.at, leader_y, true);
			this.at += 4;

			this.view.setUint16(this.at, player_id, true);
			this.at += 2;
			this.view.setUint8(this.at++, level, true);
			++this.at;
			this.view.setFloat32(this.at, this.latency, true);
			this.at += 4;
			this.view.setFloat32(this.at, camera_x, true);
			this.at += 4;
			this.view.setFloat32(this.at, camera_y, true);
			this.at += 4;
		}
		serialize_entity(
			id,
			owner_id,
			type,
			color,
			sides,

			x,
			y,
			size,
			hp,
			max_hp,
			score
		) {
			this.view.setUint16(this.at, id, true);
			this.at += 2;
			this.view.setUint16(this.at, owner_id, true);
			this.at += 2;
			this.view.setUint8(this.at++, type, true);
			this.view.setUint8(this.at++, color, true);
			this.view.setUint8(this.at++, sides, true);
			++this.at;

			this.view.setFloat32(this.at, x, true);
			this.at += 4;
			this.view.setFloat32(this.at, y, true);
			this.at += 4;
			this.view.setFloat32(this.at, size, true);
			this.at += 4;
			this.view.setFloat32(this.at, hp, true);
			this.at += 4;
			this.view.setFloat32(this.at, max_hp, true);
			this.at += 4;
			this.view.setFloat32(this.at, score, true);
			this.at += 4;
		}
		serialize_player({
			id,
			size,
			hp,
			max_hp,
			x,
			y,
			color,
			score
		 }) {
			this.serialize_entity(
				id,
				0,
				0,
				color,
				0,

				x,
				y,
				size,
				hp,
				max_hp,
				score
			);
		}
		serialize_projectile({
			id,
			owner_id,
			size,
			hp,
			max_hp,
			x,
			y,
			color
		 }) {
			this.serialize_entity(
				id,
				owner_id,
				1,
				color,
				0,

				x,
				y,
				size,
				hp,
				max_hp,
				0
			);
		}
		serialize_shape({
			id,
			size,
			sides,
			hp,
			max_hp,
			x,
			y
		 }) {
			this.serialize_entity(
				id,
				0,
				2,
				0,
				sides,

				x,
				y,
				size,
				hp,
				max_hp,
				this.shape_score(sides)
			);
		}
	}

	let userscript = `
// ==UserScript==
// @name         shaddy daddy's client
// @match        https://diep.io/*
// @run-at       document-start
// ==/UserScript==
"use strict";
`;
	userscript += "const constants = " + JSON.stringify(constants) + ";\n";
	userscript += "const output_map = " + JSON.stringify(output_map) + ";\n";
	userscript += readFileSync("./wail.js", { encoding: "utf8" }) + "\n";
	userscript += patch_wasm.toString().replaceAll("WAIL.", "") + "\n";
	userscript += BotHelper.toString() + "\n";
	userscript += readFileSync("./client_generic.user.js", { encoding: "utf8" });
	writeFileSync("./client.user.js", userscript.slice(1), { encoding: "utf8" });


	wasm_bin = patch_wasm(wasm_bin);
	const wasm_module = new WebAssembly.Module(wasm_bin);
return;

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
			imports.func_send_hook = function(ptr) {
				this.socket_ptr = ptr;
			}.bind(this);
			imports.func_entity_creation_hook = function(ptr) {
				log(LOG.VERBOSE, "entity creation", this.parse_entity(ptr));
			}.bind(this);
			imports.func_entity_deletion_hook = function(ptr) {
				log(LOG.VERBOSE, "entity deletion", this.parse_entity(ptr));
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
		parse_entity(ptr) {
			return parse_entity(ptr, this.arraybuffer);
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
