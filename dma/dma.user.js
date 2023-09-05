// ==UserScript==
// @name         shaddy daddy's dma
// @match        https://diep.io/*
// @run-at       document-start
// ==/UserScript==

const win = typeof unsafeWindow != "undefined" ? unsafeWindow : window;

function log(...data) {
    console.log("%cDMA %c", "color: #B050FF", "color: #fff", ...data);
}

log("Loading...");

let Module;

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

function launch() {
    log("Got module object", Module);

    const scan = function(array, value, deviation) {
        const min = value - deviation;
        const max = value + deviation;
        const len = array.length;
        this.found = [];
        for(let i = 0; i < len; ++i) {
            if(array[i] >= min && array[i] <= max) {
                this.found.push([i, array[i]]);
            }
        }
    };
    scan.prototype.show = function() {
        if(!this.found.length) {
            return log("Nothing found.");
        }
        let str = `Found ${this.found.length} addresses:`;
        for(const find of this.found) {
            str += `\nptr=${find[0]} val=${find[1]}`;
        }
        log(str);
    };

	const search = function(array, mask) {
		const len = mask.length;
		const end = array.length - len;
		this.found = [];
		for(let i = 0; i < end; ++i) {
			let j = 0;
			for(; j < len; ++j) {
				if(array[i + j] != mask[j]) {
					break;
				}
			}
			if(j == len) {
				this.found.push(i);
			}
		}
	};
	search.prototype.show = function() {
		if(!this.found.length) {
            return log("Nothing found.");
        }
        let str = `Found ${this.found.length} addresses:`;
        for(const find of this.found) {
            str += `\nptr=${find}`;
        }
        log(str);
	};

    const scanner = function(array) {
        this.arr = array;
        this.len = array.length;
        this.found = new Array(this.len);
        for(let i = 0; i < this.len; ++i) {
            this.found[i] = [i, this.arr[i]];
        }
    };
    scanner.prototype.up = function() {
        const new_found = [];
        for(let i = 0; i < this.found.length; ++i) {
            const find = this.found[i];
            const idx = find[0];
            const new_val = this.arr[idx];
            if(new_val > find[1]) {
                new_found[new_found.length] = [idx, new_val];
            }
        }
        this.found = new_found;
        return this;
    };
    scanner.prototype.down = function() {
        const new_found = [];
        for(let i = 0; i < this.found.length; ++i) {
            const find = this.found[i];
            const idx = find[0];
            const new_val = this.arr[idx];
            if(new_val < find[1]) {
                new_found[new_found.length] = [idx, new_val];
            }
        }
        this.found = new_found;
        return this;
    };
    scanner.prototype.same = function() {
        const new_found = [];
        for(let i = 0; i < this.found.length; ++i) {
            const find = this.found[i];
            const idx = find[0];
            const new_val = this.arr[idx];
            if(new_val == find[1]) {
                new_found[new_found.length] = [idx, new_val];
            }
        }
        this.found = new_found;
        return this;
    };
    scanner.prototype.value = function(val) {
        const new_found = [];
        for(let i = 0; i < this.found.length; ++i) {
            const find = this.found[i];
            const idx = find[0];
            const new_val = this.arr[idx];
            if(new_val == val) {
                new_found[new_found.length] = [idx, new_val];
            }
        }
        this.found = new_found;
        return this;
    };
    scanner.prototype.show = function() {
        if(!this.found.length) {
            return log("Nothing found.");
        }
        let str = `Found ${this.found.length} addresses:`;
        for(const find of this.found) {
            str += `\nptr=${find[0]} val=${find[1]} cur_val=${this.arr[find[0]]}`;
        }
        log(str);
    };

	const COMPONENT = {
		RELATIONS: 0,
		BARREL: 2,
		PHYSICS: 3,
		HEALTH: 4,
		LOBBY: 7,
		ARENA: 8,
		NAME: 9,
		GUI: 10,
		POS: 11,
		STYLE: 12,
		SCORE: 14,
		TEAM: 15
	};

	const ENTITY_TYPE = {
		PLAYER: 23065,
		SHAPE: 6681,
		PROJECTILE: 6169,
		GUI: 1025
	};

	const FIELD_OFFSET = {
		HP: 8,
		MAX_HP: 40,
		PLAYER_ID: 2,
		OWNER_ID: 2,
		X: 132,
		Y: 136,
		COLOR: 68,
		SCORE: 0,
		SIZE: 12,
		SIDES: 84,
		FOV: 340,
		LEVEL: 348
	};

	const entities = function() {
		let ptr = Module.HEAPU32[127240 >> 2];
		this.entities = [];
		while(ptr) {
			const next_ptr = Module.HEAPU32[(ptr + 12) >> 2];
			const entity_id = Module.HEAPU16[(ptr + 54) >> 1];

			const groups = Module.HEAPU32.subarray((ptr + 72) >> 2, (ptr + 136) >> 2);
			const offsets = [8, 0, 8, 12, 8, 0, 8, 8, 20, 8, 28, 8, 12, 0, 8, 8];
			const pointers = groups.map((r, i) => r + offsets[i]);

			const relations_ptr = pointers[COMPONENT.RELATIONS];
			const physics_ptr = pointers[COMPONENT.PHYSICS];
			const health_ptr = pointers[COMPONENT.HEALTH];
			const gui_ptr = pointers[COMPONENT.GUI];
			const position_ptr = pointers[COMPONENT.POSITION];
			const style_ptr = pointers[COMPONENT.STYLE];
			const score_ptr = pointers[COMPONENT.SCORE];

			let type = 0;
			for(let i = 0; i < 16; ++i) {
				if(groups[i]) {
					type |= 1 << i;
				}
			}
			const entity = { entity_id, type };

			if(groups[COMPONENT.RELATIONS]) {
				entity.owner_id = Module.HEAPU16[(relations_ptr + FIELD_OFFSET.OWNER_ID) >> 1];
			}

			if(groups[COMPONENT.PHYSICS]) {
				entity.size = Module.HEAPF32[(physics_ptr + FIELD_OFFSET.SIZE) >> 2];
				entity.sides = Module.HEAPU32[(physics_ptr + FIELD_OFFSET.SIDES) >> 2];
			}

			if(groups[COMPONENT.HEALTH]) {
				entity.hp = Module.HEAPF32[(health_ptr + FIELD_OFFSET.HP) >> 2];
				entity.max_hp = Module.HEAPF32[(health_ptr + FIELD_OFFSET.MAX_HP) >> 2];
			}

			if(groups[COMPONENT.GUI]) {
				entity.player_id = Module.HEAPU16[(gui_ptr + FIELD_OFFSET.PLAYER_ID) >> 1];
				entity.fov = Module.HEAPF32[(gui_ptr + FIELD_OFFSET.FOV) >> 2];
				entity.level = Module.HEAPU32[(gui_ptr + FIELD_OFFSET.LEVEL) >> 2];
			}

			if(groups[COMPONENT.POSITION]) {
				entity.x = Module.HEAPF32[(position_ptr + FIELD_OFFSET.X) >> 2];
				entity.y = Module.HEAPF32[(position_ptr + FIELD_OFFSET.Y) >> 2];
			}

			if(groups[COMPONENT.STYLE]) {
				entity.color = Module.HEAPU32[(style_ptr + FIELD_OFFSET.COLOR) >> 2];
			}

			if(groups[COMPONENT.SCORE]) {
				entity.score = Module.HEAPF32[(score_ptr + FIELD_OFFSET.SCORE) >> 2];
			}

			switch(entity.type) {
				case ENTITY_TYPE.PLAYER:
				case ENTITY_TYPE.SHAPE:
				case ENTITY_TYPE.PROJECTILE:
				case ENTITY_TYPE.GUI:
					log(entity);
				default: break;
			}

			this.entities.push(entity);
			ptr = next_ptr;
		}
	};
	entities.prototype.show = function() {
		if(!this.entities.length) {
			return log("Nothing found.");
		}
		let str = `Found ${this.entities.length} entities:`;
		for(const { entity_id, entity_hash, pointers } of this.entities) {
			str += `\nid=${entity_id} hash=${entity_hash}`;
		}
		log(str);
	};

    win.DMA = {
        Module,
        HEAPI8: Module.HEAP8,
        HEAP8: Module.HEAP8,
        HEAPI16: Module.HEAP16,
        HEAP16: Module.HEAP16,
        HEAPI32: Module.HEAP32,
        HEAP32: Module.HEAP32,
        HEAPU8: Module.HEAPU8,
        HEAPU16: Module.HEAPU16,
        HEAPU32: Module.HEAPU32,
        HEAPF32: Module.HEAPF32,
        HEAPF64: Module.HEAPF64,
        scanI8: (value, deviation = 0) => new scan(Module.HEAP8, value, deviation),
        scanI16: (value, deviation = 0) => new scan(Module.HEAP16, value, deviation),
        scanI32: (value, deviation = 0) => new scan(Module.HEAP32, value, deviation),
        scanF32: (value, deviation = 0) => new scan(Module.HEAPF32, value, deviation),
		searchI8: (mask) => new search(Module.HEAP8, mask),
		searchI16: (mask) => new search(Module.HEAP16, mask),
		searchI32: (mask) => new search(Module.HEAP32, mask),
		searchF32: (mask) => new search(Module.HEAPF32, mask),
		entities,
        scanner
    };
}
