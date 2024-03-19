// ==UserScript==
// @name         s fov
// @author       shaddy
// @match        https://diep.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=diep.io
// @grant        none
// @run-at       document-start
// ==/UserScript==

const win = typeof unsafeWindow != "undefined" ? unsafeWindow : window;

function log(...data) {
    console.log("%cFOV %c", "color: #B050FF", "color: #fff", ...data);
}

log("Loading...");

let Module;
let ent_ptr;
let fov_cands = [];
let fov_off;
let leader_x_off = 64;
let leader_y_off = 664;
let camera_x_off = 384;
let camera_y_off = 248;
let tank_x_off_off = 112;
let tank_y_off_off = 116;

const timeout = setTimeout(log, 5000, "Couldn't get module object after 5 secs, please refresh to try again");

win.Object.defineProperty(win.Object.prototype, "HEAPF32", {
    get: function() {
        return undefined;
    },
    set: function(to) {
        if(!to) return;
        delete win.Object.prototype.HEAPF32;
        Module = this;
        Module.HEAPF32 = to;
        clearTimeout(timeout);
        launch();
    },
    configurable: true,
    enumerable: true
});

WebAssembly.instantiateStreaming = (r, i) => r.arrayBuffer().then(b => WebAssembly.instantiate(b, i));
WebAssembly.instantiate = new Proxy(WebAssembly.instantiate, {
	apply(to, what, [bin, imports]) {
		const u8 = new Uint8Array(bin);
		let count = 0, seek = [252, 169, 241, 210, 77, 98, 80, 63, 100], seek_len = seek.length, fovs = [];
		for(let i = 0; i < u8.length; ++i) {
			let tru = 1;
			for(let j = 0; j < seek_len; ++j) {
				if(u8[i + j] != seek[j]) {
					tru = 0;
					break;
				}
			}
			if(tru && (++count == 1 || count == 3)) {
				u8.set([0, 0, 0, 0, 0, 0, 144, 64], i);
				fovs.push(i);
				if(count == 3) break;
			}
		}

		for(let i = 0; i < u8.length; ++i) {
			let j = i;
			let count = 0;
			let num = 0;
			let found = 0;
			const vu = () => { while(u8[j++] & 0x80); return 1; };
			const save_vu = () => { do { num |= (u8[j] & 0x7f) << (7 * count++); } while(u8[j++] >> 7); return 1; };
			u8[j++] == 11 &&
			u8[j++] == 32 && vu() &&
			u8[j++] == 65 && save_vu() &&
			u8[j++] == 32 && vu() &&
			u8[j++] == 16 && vu() &&
			u8[j++] == 47 && u8[j++] == 1 && (ent_ptr = num, found = 1);
			if(found) break;
		}
		for(let i of fovs) {
			let j = i;
			let count = 0;
			let num = 0;
			const save_vu = () => { do { num |= (u8[j] & 0x7f) << (7 * count++); } while(u8[j++] >> 7); return 1; };
			for(let k = 2; k < 100; ++k) {
				j = i - k;
				if(u8[j] == 42 && u8[j + 1] == 2) {
					j += 2;
					save_vu();
					fov_cands.push(num);
					log(`fov_off candidate: ${num}`);
					break;
				}
			}
		}
		log(`ent_ptr: ${ent_ptr}, fov_off candidates: ${fov_cands}`);
		return to.apply(what, [bin, imports]);
	}
});


function launch() {
	log("Got module object", Module);
	window.Module = Module;

	const ARENA_COMPONENT = 8;
	const GUI_COMPONENT = 10;
	const POS_COMPONENT = 11;

	let fov = 0.5;
	let cached_gui_ptr = 0;

	const seed_fov = function() {
		if(!fov_off) {
			for(const off of fov_cands) {
				const num = Module.HEAPF32[(cached_gui_ptr + off) >> 2];
				if(num > 0 && num < 1) {
					if(fov_off) {
						console.error("fov_off already set before");
						break;
					}
					fov_off = off;
					log(`fov_off: ${off}`);
				}
			}
		}
	};

	const fov_replacer = function() {
		let ptr = Module.HEAPU32[(ent_ptr + 1044) >> 2];
		while(ptr) {
			const next_ptr = Module.HEAPU32[(ptr + 8) >> 2];

			const groups = Module.HEAPU32.subarray((ptr + 72) >> 2, (ptr + 136) >> 2);
			const gui_ptr = groups[GUI_COMPONENT];

			if(gui_ptr) {
				cached_gui_ptr = gui_ptr;
				seed_fov();
				Module.HEAPF32[(gui_ptr + fov_off) >> 2] = fov;
				break;
			}

			ptr = next_ptr;
		}
	};

	const replace_fov = function() {
		seed_fov();
		if(Module.HEAPF32[(cached_gui_ptr + fov_off) >> 2] != fov) {
			fov_replacer();
		}
	};

	setInterval(replace_fov, 10);

	const can_change_fov = () => {
		const has_user_list = !!document.querySelector("d-base.diep-native").shadowRoot.querySelector("d-users");
		return !has_user_list;
	};

	const set_fov = delta => {
		if(!can_change_fov()) return;
		fov += delta * 0.02 * Math.log10(fov / 0.55 + 1);
	};

	document.addEventListener("wheel", evt => {
		set_fov(-Math.sign(evt.deltaY));
	});

	document.addEventListener("keydown", evt => {
		if(evt.code == "Minus" || evt.code == "NumpadSubtract" || evt.code == "NumpadDivide") {
			set_fov(-4);
		} else if(evt.code == "Equal" || evt.code == "NumpadAdd" || evt.code == "NumpadMultiply") {
			set_fov(4);
		}
	});

	const canvas = document.getElementById("canvas");
	const ctx = canvas.getContext("2d");

	function draw() {
		let leader_x, leader_y;
		let camera_x, camera_y;
		let tank_x_off = 0, tank_y_off = 0;
		let screen_x, screen_y;

		function circle(radius, color) {
			ctx.beginPath();
			ctx.arc(screen_x, screen_y, radius * fov, 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.fill();
		}

		let ptr = Module.HEAPU32[(ent_ptr + 1044) >> 2];
		while(ptr) {
			const next_ptr = Module.HEAPU32[(ptr + 8) >> 2];

			const groups = Module.HEAPU32.subarray((ptr + 72) >> 2, (ptr + 136) >> 2);
			const arena_ptr = groups[ARENA_COMPONENT];
			const gui_ptr = groups[GUI_COMPONENT];
			const pos_ptr = groups[POS_COMPONENT];

			if(arena_ptr) {
				leader_x = Module.HEAPF32[(arena_ptr + leader_x_off) >> 2];
				leader_y = Module.HEAPF32[(arena_ptr + leader_y_off) >> 2];

				if(camera_x) break;
			}

			if(gui_ptr) {
				camera_x = Module.HEAPF32[(gui_ptr + camera_x_off) >> 2];
				camera_y = Module.HEAPF32[(gui_ptr + camera_y_off) >> 2];

				if(leader_x) break;
			}

			if(groups[14]) {
				tank_x_off ||= Module.HEAPF32[(pos_ptr + tank_x_off_off) >> 2];
				tank_y_off ||= Module.HEAPF32[(pos_ptr + tank_y_off_off) >> 2];
			}

			ptr = next_ptr;
		}

		if(leader_x && leader_y && camera_x && camera_y) {
			if(!win.lol) {
				win.lol = 4;
			}
			screen_x = win.innerWidth * 0.5 + (leader_x - camera_x + tank_x_off * win.lol) * fov;
			screen_y = win.innerHeight * 0.5 + (leader_y - camera_y + tank_y_off * win.lol) * fov;

			circle(450, "#4000f010");
			circle(300, "#80008020");
			circle(150, "#f0000040");
		}

		requestAnimationFrame(draw);
	}
	setTimeout(draw, 1000);
}
