var bufferView;
var base64ReverseLookup = new Uint8Array(123 /*'z'+1*/ );
for(var i = 25; i >= 0; --i) {
  base64ReverseLookup[48 + i] = 52 + i; // '0-9'
  base64ReverseLookup[65 + i] = i; // 'A-Z'
  base64ReverseLookup[97 + i] = 26 + i; // 'a-z'
}
base64ReverseLookup[43] = 62; // '+'
base64ReverseLookup[47] = 63; // '/'
/** @noinline Inlining this function would mean expanding the base64 string 4x times in the source code, which Closure seems to be happy to do. */
function base64DecodeToExistingUint8Array(uint8Array, offset, b64) {
  var b1, b2, i = 0,
    j = offset,
    bLength = b64.length,
    end = offset + (bLength * 3 >> 2) - (b64[bLength - 2] == '=') - (b64[bLength - 1] == '=');
  for(; i < bLength; i += 4) {
    b1 = base64ReverseLookup[b64.charCodeAt(i + 1)];
    b2 = base64ReverseLookup[b64.charCodeAt(i + 2)];
    uint8Array[j++] = base64ReverseLookup[b64.charCodeAt(i)] << 2 | b1 >> 4;
    if(j < end) uint8Array[j++] = b1 << 4 | b2 >> 2;
    if(j < end) uint8Array[j++] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i + 3)];
  }
}

function initActiveSegments(imports) {       //1048696
  base64DecodeToExistingUint8Array(bufferView, 1048576, "Y2FsbGVkIGBSZXN1bHQ6OnVud3JhcCgpYCBvbiBhbiBgRXJyYCB2YWx1ZQADAAAAFAAAAAQAAAAEAAAAc3JjL2xpYi5ycwAAPAAQAAoAAAAlAAAABQAAADwAEAAKAAAAOwAAAEUAAAA8ABAACgAAAEoAAAAcAAAAMDEyMzQ1Njc4OWFiY2RlZjwAEAAKAAAAfQAAAAwAAAA8ABAACgAAAIMAAAAWAAAAWywgIiJdAACoABAAAQAAAKkAEAADAAAArAAQAAIAAAAwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWgAABQAAAAAAAAABAAAABgAAAAcAAAAIAAAABQAAAAQAAAAEAAAACQAAAAoAAAALAAAADAAAAAAAAAABAAAABgAAAAcAAAAIAAAADgAAAAQAAAAEAAAADwAAABAAAAARAAAAY2FsbGVkIGBPcHRpb246OnVud3JhcCgpYCBvbiBhIGBOb25lYCB2YWx1ZW1lbW9yeSBhbGxvY2F0aW9uIG9mICBieXRlcyBmYWlsZWQKAACTARAAFQAAAKgBEAAOAAAAbGlicmFyeS9zdGQvc3JjL2FsbG9jLnJzyAEQABgAAABEAQAACQAAAGxpYnJhcnkvc3RkL3NyYy9wYW5pY2tpbmcucnPwARAAHAAAAEYCAAAfAAAA8AEQABwAAABHAgAAHgAAABIAAAAMAAAABAAAABMAAAAOAAAACAAAAAQAAAAUAAAAFQAAABAAAAAEAAAAFgAAABcAAAAOAAAACAAAAAQAAAAYAAAAGQAAABoAAAAEAAAABAAAABsAAAAcAAAAHQAAABoAAAAEAAAABAAAAB4AAAAaAAAAAAAAAAEAAAAfAAAAbGlicmFyeS9hbGxvYy9zcmMvcmF3X3ZlYy5yc2NhcGFjaXR5IG92ZXJmbG93AAAAyAIQABEAAACsAhAAHAAAAAUCAAAFAAAAYSBmb3JtYXR0aW5nIHRyYWl0IGltcGxlbWVudGF0aW9uIHJldHVybmVkIGFuIGVycm9ybGlicmFyeS9hbGxvYy9zcmMvZm10LnJzACcDEAAYAAAAYgIAABwAAAAaAAAABAAAAAQAAAAgAAAAYnl0ZXNlcnJvcgAAGgAAAAQAAAAEAAAAIQAAAEZyb21VdGY4RXJyb3IAAAApLi4AjQMQAAIAAABpbmRleCBvdXQgb2YgYm91bmRzOiB0aGUgbGVuIGlzICBidXQgdGhlIGluZGV4IGlzIAAAmAMQACAAAAC4AxAAEgAAAGNhbGxlZCBgT3B0aW9uOjp1bndyYXAoKWAgb24gYSBgTm9uZWAgdmFsdWUAJwAAAAAAAAABAAAAKAAAAGA6IACMAxAAAAAAABkEEAACAAAAJwAAAAwAAAAEAAAAKQAAACoAAAArAAAAICAgICB7CiwKLCAgeyB9IH0oCigsClsAJwAAAAQAAAAEAAAALAAAAF0weDAwMDEwMjAzMDQwNTA2MDcwODA5MTAxMTEyMTMxNDE1MTYxNzE4MTkyMDIxMjIyMzI0MjUyNjI3MjgyOTMwMzEzMjMzMzQzNTM2MzczODM5NDA0MTQyNDM0NDQ1NDY0NzQ4NDk1MDUxNTI1MzU0NTU1NjU3NTg1OTYwNjE2MjYzNjQ2NTY2Njc2ODY5NzA3MTcyNzM3NDc1NzY3Nzc4Nzk4MDgxODI4Mzg0ODU4Njg3ODg4OTkwOTE5MjkzOTQ5NTk2OTc5ODk5ACcAAAAEAAAABAAAAC0AAAAuAAAALwAAAHJhbmdlIHN0YXJ0IGluZGV4ICBvdXQgb2YgcmFuZ2UgZm9yIHNsaWNlIG9mIGxlbmd0aCBQBRAAEgAAAGIFEAAiAAAAbGlicmFyeS9jb3JlL3NyYy9zbGljZS9pbmRleC5ycwCUBRAAHwAAADQAAAAFAAAAcmFuZ2UgZW5kIGluZGV4IMQFEAAQAAAAYgUQACIAAACUBRAAHwAAAEkAAAAFAAAAc2xpY2UgaW5kZXggc3RhcnRzIGF0ICBidXQgZW5kcyBhdCAA9AUQABYAAAAKBhAADQAAAJQFEAAfAAAAXAAAAAUAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ==");
  base64DecodeToExistingUint8Array(bufferView, 1050362, "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwMDAwMDAwMDAwMDAwMDAwQEBAQE");
  base64DecodeToExistingUint8Array(bufferView, 1050424, "bGlicmFyeS9jb3JlL3NyYy9zdHIvbW9kLnJzWy4uLl1ieXRlIGluZGV4ICBpcyBvdXQgb2YgYm91bmRzIG9mIGAAAABYBxAACwAAAGMHEAAWAAAAGAQQAAEAAAA4BxAAGwAAAGsAAAAJAAAAYmVnaW4gPD0gZW5kICggPD0gKSB3aGVuIHNsaWNpbmcgYAAApAcQAA4AAACyBxAABAAAALYHEAAQAAAAGAQQAAEAAAA4BxAAGwAAAG8AAAAFAAAAOAcQABsAAAB9AAAALQAAACBpcyBub3QgYSBjaGFyIGJvdW5kYXJ5OyBpdCBpcyBpbnNpZGUgIChieXRlcyApIG9mIGBYBxAACwAAAAgIEAAmAAAALggQAAgAAAA2CBAABgAAABgEEAABAAAAOAcQABsAAAB/AAAABQAAAGxpYnJhcnkvY29yZS9zcmMvdW5pY29kZS9wcmludGFibGUucnMAAAB0CBAAJQAAABoAAAA2AAAAAAEDBQUGBgIHBggHCREKHAsZDBoNEA4NDwQQAxISEwkWARcEGAEZAxoHGwEcAh8WIAMrAy0LLgEwAzECMgGnAqkCqgSrCPoC+wX9Av4D/wmteHmLjaIwV1iLjJAc3Q4PS0z7/C4vP1xdX+KEjY6RkqmxurvFxsnK3uTl/wAEERIpMTQ3Ojs9SUpdhI6SqbG0urvGys7P5OUABA0OERIpMTQ6O0VGSUpeZGWEkZudyc7PDREpOjtFSVdbXF5fZGWNkam0urvFyd/k5fANEUVJZGWAhLK8vr/V1/Dxg4WLpKa+v8XHzs/a20iYvc3Gzs9JTk9XWV5fiY6Psba3v8HGx9cRFhdbXPb3/v+AbXHe3w4fbm8cHV99fq6vf7u8FhceH0ZHTk9YWlxefn+1xdTV3PDx9XJzj3R1liYuL6evt7/Hz9ffmkCXmDCPH9LUzv9OT1pbBwgPECcv7u9ubzc9P0JFkJFTZ3XIydDR2Nnn/v8AIF8igt8EgkQIGwQGEYGsDoCrBR8JgRsDGQgBBC8ENAQHAwEHBgcRClAPEgdVBwMEHAoJAwgDBwMCAwMDDAQFAwsGAQ4VBU4HGwdXBwIGFg1QBEMDLQMBBBEGDww6BB0lXyBtBGolgMgFgrADGgaC/QNZBxYJGAkUDBQMagYKBhoGWQcrBUYKLAQMBAEDMQssBBoGCwOArAYKBi8xTQOApAg8Aw8DPAc4CCsFgv8RGAgvES0DIQ8hD4CMBIKXGQsViJQFLwU7BwIOGAmAviJ0DIDWGgwFgP8FgN8M8p0DNwmBXBSAuAiAywUKGDsDCgY4CEYIDAZ0Cx4DWgRZCYCDGBwKFglMBICKBqukDBcEMaEEgdomBwwFBYCmEIH1BwEgKgZMBICNBIC+AxsDDw0ABgEBAwEEAgUHBwIICAkCCgULAg4EEAERAhIFExEUARUCFwIZDRwFHQgkAWoEawKvA7wCzwLRAtQM1QnWAtcC2gHgBeEC5wToAu4g8AT4AvoC+wEMJzs+Tk+Pnp6fe4uTlqKyuoaxBgcJNj0+VvPQ0QQUGDY3Vld/qq6vvTXgEoeJjp4EDQ4REikxNDpFRklKTk9kZVy2txscBwgKCxQXNjk6qKnY2Qk3kJGoBwo7PmZpj5JvX7/u71pi9Pz/mpsuLycoVZ2goaOkp6iturzEBgsMFR06P0VRpqfMzaAHGRoiJT4/5+zv/8XGBCAjJSYoMzg6SEpMUFNVVlhaXF5gY2Vma3N4fX+KpKqvsMDQrq9ub5NeInsFAwQtA2YDAS8ugIIdAzEPHAQkCR4FKwVEBA4qgKoGJAQkBCgINAtOQ4E3CRYKCBg7RTkDYwgJMBYFIQMbBQFAOARLBS8ECgcJB0AgJwQMCTYDOgUaBwQMB1BJNzMNMwcuCAqBJlJOKAgqFhomHBQXCU4EJAlEDRkHCgZICCcJdQs/QSoGOwUKBlEGAQUQAwWAi2IeSAgKgKZeIkULCgYNEzoGCjYsBBeAuTxkUwxICQpGRRtICFMNSYEHRgodA0dJNwMOCAoGOQcKgTYZgLcBDzINg5tmdQuAxIpMYw2EL4/RgkehuYI5ByoEXAYmCkYKKAUTgrBbZUsEOQcRQAULAg6X+AiE1ioJoueBMy0DEQQIgYyJBGsFDQMJBxCSYEcJdDyA9gpzCHAVRoCaFAxXCRmAh4FHA4VCDxWEUB+A4SuA1S0DGgQCgUAfEToFAYTggPcpTAQKBAKDEURMPYDCPAYBBFUFGzQCgQ4sBGQMVgqArjgdDSwECQcCDgaAmoPYBRADDQN0DFkHDAQBDwwEOAgKBigIIk6BVAwVAwUDBwkdAwsFBgoKBggIBwmAyyUKhAZsaWJyYXJ5L2NvcmUvc3JjL3VuaWNvZGUvdW5pY29kZV9kYXRhLnJzAAAAFQ4QACgAAABLAAAAKAAAABUOEAAoAAAAVwAAABYAAAAVDhAAKAAAAFIAAAA+AAAAU29tZU5vbmUnAAAABAAAAAQAAAAwAAAARXJyb3JVdGY4RXJyb3J2YWxpZF91cF90b2Vycm9yX2xlbgAAJwAAAAQAAAAEAAAAMQAAAAADAACDBCAAkQVgAF0ToAASFyAfDCBgH+8soCsqMCAsb6bgLAKoYC0e+2AuAP4gNp7/YDb9AeE2AQohNyQN4TerDmE5LxihOTAc4UfzHiFM8GrhT09vIVCdvKFQAM9hUWXRoVEA2iFSAODhUzDhYVWu4qFW0OjhViAAblfwAf9XAHAABwAtAQEBAgECAQFICzAVEAFlBwIGAgIBBCMBHhtbCzoJCQEYBAEJAQMBBSsDPAgqGAEgNwEBAQQIBAEDBwoCHQE6AQEBAgQIAQkBCgIaAQICOQEEAgQCAgMDAR4CAwELAjkBBAUBAgQBFAIWBgEBOgEBAgEECAEHAwoCHgE7AQEBDAEJASgBAwE3AQEDBQMBBAcCCwIdAToBAgECAQMBBQIHAgsCHAI5AgEBAgQIAQkBCgIdAUgBBAECAwEBCAFRAQIHDAhiAQIJCwZKAhsBAQEBATcOAQUBAgULASQJAWYEAQYBAgICGQIEAxAEDQECAgYBDwEAAwADHQIeAh4CQAIBBwgBAgsJAS0DAQF1AiIBdgMEAgkBBgPbAgIBOgEBBwEBAQECCAYKAgEwHzEEMAcBAQUBKAkMAiAEAgIBAzgBAQIDAQEDOggCApgDAQ0BBwQBBgEDAsZAAAHDIQADjQFgIAAGaQIABAEKIAJQAgABAwEEARkCBQGXAhoSDQEmCBkLLgMwAQIEAgInAUMGAgICAgwBCAEvATMBAQMCAgUCAQEqAggB7gECAQQBAAEAEBAQAAIAAeIBlQUAAwECBQQoAwQBpQIABAACmQsxBHsBNg8pAQICCgMxBAICBwE9AyQFAQg+AQwCNAkKBAIBXwMCAQECBgGgAQMIFQI5AgEBAQEWAQ4HAwXDCAIDAQEXAVEBAgYBAQIBAQIBAusBAgQGAgECGwJVCAIBAQJqAQEBAgYBAWUDAgQBBQAJAQL1AQoCAQEEAZAEAgIEASAKKAYCBAgBCQYCAy4NAQIABwEGAQFSFgIHAQIBAnoGAwEBAgEHAQFIAgMBAQEAAgAFOwcAAT8EUQEAAgAuAhcAAQEDBAUICAIHHgSUAwA3BDIIAQ4BFgUBDwAHARECBwECAQUABwABPQQAB20HAGCA8A==");
}

function asmFunc(env) {
  var buffer = new ArrayBuffer(1114112);
  var HEAP8 = new Int8Array(buffer);
  var HEAP16 = new Int16Array(buffer);
  var HEAP32 = new Int32Array(buffer);
  var HEAP64 = new BigInt64Array(buffer);
  var HEAPU8 = new Uint8Array(buffer);
  var HEAPU16 = new Uint16Array(buffer);
  var HEAPU32 = new Uint32Array(buffer);
  var HEAPU64 = new BigUint64Array(buffer);
  var HEAPF32 = new Float32Array(buffer);
  var HEAPF64 = new Float64Array(buffer);
  var Math_imul = Math.imul;
  var Math_fround = Math.fround;
  var Math_abs = Math.abs;
  var Math_clz32 = Math.clz32;
  var Math_min = Math.min;
  var Math_max = Math.max;
  var Math_floor = Math.floor;
  var Math_ceil = Math.ceil;
  var Math_trunc = Math.trunc;
  var Math_sqrt = Math.sqrt;
  var abort = env.abort;
  var nan = NaN;
  var infinity = Infinity;
  var global$0 = 1048576;
  var __wasm_intrinsics_temp_i64 = 0;
  var __wasm_intrinsics_temp_i64$hi = 0;
  var i64toi32_i32$HIGH_BITS = 0;

  function rotl(num, by) {
    return (num << by) | (num >> (64 - by));
  }

  /**
   * Main function to solve a pow
   * @param {*} $0_1 stack
   * @param {*} $1_1 date
   * @param {*} $2_1 str
   * @param {*} $3_1 len
   * @param {*} $4_1 difficulty
   * @returns 
   */
   function _solve($0_1, $1_1, $2_1, $3_1, $4_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$3 = 0,
      $5_1 = 0,
      i64toi32_i32$4 = 0,
      $6_1 = 0,
      i64toi32_i32$5 = 0,
      $51$hi = 0,
      $51_1 = 0,
      $7_1 = 0,
      $52$hi = 0,
      $52_1 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $53$hi = 0,
      $10_1 = 0,
      $12_1 = 0,
      $54$hi = 0,
      $11_1 = 0,
      $53_1 = 0,
      $56$hi = 0,
      $55$hi = 0,
      $54_1 = 0,
      $56_1 = 0,
      $110 = 0,
      $111 = 0,
      $55_1 = 0,
      $15_1 = 0,
      $14_1 = 0,
      $13_1 = 0,
      $112 = 0,
      $113 = 0,
      $114 = 0,
      $115 = 0,
      $116 = 0,
      $117 = 0,
      $118 = 0,
      $119 = 0,
      $120 = 0,
      $121 = 0,
      $122 = 0,
      $16_1 = 0,
      $17_1 = 0,
      $18_1 = 0,
      $19_1 = 0,
      $20_1 = 0,
      $21_1 = 0,
      $22_1 = 0,
      $23_1 = 0,
      $24_1 = 0,
      $25_1 = 0,
      $26_1 = 0,
      $27_1 = 0,
      $28_1 = 0,
      $29_1 = 0,
      $30_1 = 0,
      $31_1 = 0,
      $32_1 = 0,
      $33_1 = 0,
      $34_1 = 0,
      $35_1 = 0,
      $36_1 = 0,
      $37_1 = 0,
      $38_1 = 0,
      $39_1 = 0,
      $40_1 = 0,
      $41_1 = 0,
      $42_1 = 0,
      $43_1 = 0,
      $44_1 = 0,
      $45_1 = 0,
      $46_1 = 0,
      $47_1 = 0,
      $48_1 = 0,
      $49_1 = 0,
      $50_1 = 0,
      $219 = 0,
      $230 = 0,
      $230$hi = 0,
      $232$hi = 0,
      $273 = 0,
      $297 = 0,
      $299$hi = 0,
      $303$hi = 0,
      $349 = 0,
      $352 = 0,
      $354 = 0,
      $354$hi = 0,
      $358$hi = 0,
      $362 = 0,
      $362$hi = 0,
      $365 = 0,
      $365$hi = 0,
      $366 = 0,
      $366$hi = 0,
      $369 = 0,
      $369$hi = 0,
      $371$hi = 0,
      $372 = 0,
      $372$hi = 0,
      $376 = 0,
      $376$hi = 0,
      $378$hi = 0,
      $379 = 0,
      $379$hi = 0,
      $382 = 0,
      $382$hi = 0,
      $385 = 0,
      $385$hi = 0,
      $386 = 0,
      $386$hi = 0,
      $752 = 0,
      $757 = 0,
      $908$hi = 0,
      $909$hi = 0,
      $911 = 0,
      $945 = 0;
    
    const str = $2_1;
    const len = $3_1;
    const stack = global$0 - 288;
    global$0 = stack;
    rand(stack, $1_1, 0);
    const ptr_len = len * 2 + 16;
    const ptr = __malloc(ptr_len, 1);
    if(ptr) {
      memzero(ptr, ptr_len);
    }
    memcpy(ptr, str, len);
    memcpy(ptr + len + 16, str, len); /* [ string  16 bytes  string ] */
    memzero(stack + 64, 64 + 8 + 40 + 20); /* 132, 64 -> 196 */
    /* sha1 initialisation */
    HEAP32[(stack + 32) >> 2] = 0;
    HEAP32[(stack + 36) >> 2] = 0;
    HEAP32[(stack + 40) >> 2] = 0x67452301;
    HEAP32[(stack + 44) >> 2] = 0xEFCDAB89;
    HEAP32[(stack + 48) >> 2] = 0x98BADCFE;
    HEAP32[(stack + 52) >> 2] = 0x10325476;
    HEAP32[(stack + 56) >> 2] = 0xC3D2E1F0;
    /* end */
    $1_1 = len + 16; /* second string offset */
    const difficulty_without_lower_2_bits = $4_1 & 0xfffc; /* difficulty rounded down to nearest multiple of 4 */
    $16_1 = $2_1 > 160 ? $2_1 : 160; /* always 160? */
    $13_1 = ptr + len; /* pointer to 16 bytes of data */
    var u64_1, u64_51, u64_52, u64_53, u64_54, u64_55, u64_56;
    u64_53 = HEAP64[(stack +  0) >> 3]; /* these are the random bytes we got from date */
    u64_52 = HEAP64[(stack +  8) >> 3];
    u64_55 = HEAP64[(stack + 16) >> 3];
    u64_54 = HEAP64[(stack + 24) >> 3];
    $1_1 =  stack + 224; /* 64 bytes in size */
    $17_1 = stack + 272;
    $18_1 = stack + 264;
    $19_1 = stack + 256;
    $20_1 = stack + 248; /* 280-248 32 bytes of data */
    const difficulty = $4_1 & 0xffff; /* precise difficulty */
    const difficulty_div_4 = difficulty >> 2; /* difficulty / 4 */
    let iter = 1;
    label$12: while(1) {
      for(let i = 0; i < 16; ++i) { /* fill up the 16 bytes with a random string based on rand() */
        u64_1 = u64_53 + u64_54;
        /* 1048776 = 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ */
        HEAP8[$13_1 + i] = HEAPU8[((u64_1 & 0xffffffff) % 62) + 1048776];

        u64_51 = u64_53 ^ u64_55;
        u64_55 = (u64_52 << 17) ^ u64_51;
        u64_56 = u64_52 ^ u64_54;
        u64_54 = rotl(u64_56, 45);
        u64_53 ^= u64_56;
        u64_52 ^= u64_51;
      }
      HEAP64[(stack +  0) >> 3] = u64_53;
      HEAP64[(stack +  8) >> 3] = u64_52;
      HEAP64[(stack + 16) >> 3] = u64_55;
      HEAP64[(stack + 24) >> 3] = u64_54;

      $3_1 = HEAPU8[stack + 128]; /* this is 0 every iteration, is changed below */
      $9_1 = 64 - $3_1;
      if($9_1 <= ptr_len) { /* 64 <= 48 (false) */
        $4_1 = ptr_len;
        $1_1 = ptr;
        if($3_1) {
          memcpy(stack + 64 + $3_1, ptr, $9_1);
          ++HEAP64[(stack + 32) >> 3];
          sha1(stack + 40, stack + 64, 1);
          $4_1 = ptr_len - $9_1;
          $1_1 = ptr + $9_1;
        }
        $3_1 = $4_1 & 63; /* misalignment */
        $9_1 = $1_1 + ($4_1 & -64); /* round down to nearest multiple of 64 */
        if($4_1 <= 63) {
          memcpy(stack + 64, $9_1, $3_1);
        } else {
          $4_1 = $4_1 >> 6;
          HEAP64[(stack + 32) >> 3] += $4_1;
          sha1(stack + 40, $1_1, $4_1);
          memcpy(stack + 64, $9_1, $3_1);
        }
      } else { /* this is always the code path */
        memcpy(stack + 64 + $3_1, ptr, ptr_len); /* stack + 64 = [ string  16 bytes  string ] */
        $3_1 = $3_1 + ptr_len; /* $3_1 = ptr_len */
      }
      HEAP8[stack + 128] = $3_1;
      /* $3_1 = offset to where meaningful gibberish for more hashing gibberish starts */

      u64_51 = HEAP64[(stack + 32) >> 3]; /* iter counter = number of sha1 calls (another "random" number (depends on len)) */
      $1_1 = $3_1 & 0xff;
      $4_1 = stack + 64 + $1_1;
      HEAP8[stack + 64 + ($3_1 & 0xff)] = 128; /* put an idiotic number in the array so that the next iteration is a bit different */
      /* extracts sha1 result */
      memcpy(stack + 200, stack + 40, 20);

      u64_51 = (u64_51 << 9) | (($3_1 & 0xff) << 3);
      u64_51 |= ((u64_51 >> 8) & 0xff000000) | ((u64_51 >> 24) & 0xff0000);
      u64_51 |= (((u64_51 << 40) & 0xff000000000000) | (u64_51 << 56)) | (((u64_51 << 24) & 0xff0000000000) | ((u64_51 << 8) & 0xff00000000));
      u64_51 |= ((u64_51 >> 40) & 0xff00) | (u64_51 >> 56)

      $3_1 = $1_1 ^ 63;
      if($3_1) {
        memzero($4_1 + 1, $3_1);
      }
      if(($1_1 & 56) != (56)) { /* due to above, this is always the first sha1 execution, and stack + 200 is the default sha1 values */
        /* always executed */
        HEAP64[(stack + 120) >> 3] = u64_51;
        sha1(stack + 200, stack + 64, 1);
      } else {
        sha1(stack + 200, stack + 64, 1);
        memzero(stack + 224, 56);
        HEAP64[(stack + 280) >> 3] = u64_51;
        sha1(stack + 200, stack + 224, 1);
      }
      
      $1_1 = HEAP32[(stack + 200) >> 2];
      HEAP32[(stack + 176) >> 2] = ($1_1 << 8) & 0xff0000 | ($1_1 << 24) | (($1_1 >>> 8) & 0xff00 | ($1_1 >>> 24)); /* endian swap */
      HEAP8[stack + 178] ^= 243; /* can't solve difficulties above 16 without this */
      $1_1 = HEAP32[(stack + 204) >> 2];
      HEAP32[(stack + 180) >> 2] = ($1_1 << 8) & 0xff0000 | ($1_1 << 24) | (($1_1 >>> 8) & 0xff00 | ($1_1 >>> 24)); /* endian swap */
      $1_1 = HEAP32[(stack + 208) >> 2];
      HEAP32[(stack + 184) >> 2] = ($1_1 << 8) & 0xff0000 | ($1_1 << 24) | (($1_1 >>> 8) & 0xff00 | ($1_1 >>> 24)); /* endian swap */
      $1_1 = HEAP32[(stack + 212) >> 2];
      HEAP32[(stack + 188) >> 2] = ($1_1 << 8) & 0xff0000 | ($1_1 << 24) | (($1_1 >>> 8) & 0xff00 | ($1_1 >>> 24)); /* endian swap */
      $1_1 = HEAP32[(stack + 216) >> 2];
      HEAP32[(stack + 192) >> 2] = ($1_1 << 8) & 0xff0000 | ($1_1 << 24) | (($1_1 >>> 8) & 0xff00 | ($1_1 >>> 24)); /* endian swap */

      HEAP8[stack + 128] = 0; /* resets the available number of bytes computed earlier */
      /* sha1 initialisation for the next iteration */
      HEAP32[(stack + 32) >> 2] = 0;
      HEAP32[(stack + 36) >> 2] = 0;
      HEAP32[(stack + 40) >> 2] = 0x67452301;
      HEAP32[(stack + 44) >> 2] = 0xEFCDAB89;
      HEAP32[(stack + 48) >> 2] = 0x98BADCFE;
      HEAP32[(stack + 52) >> 2] = 0x10325476;
      HEAP32[(stack + 56) >> 2] = 0xC3D2E1F0;
      $4_1 = 0;
      $3_1 = stack + 136; /* points to 40 byte in size zeroed memory region (+2 cuz above) */
      label$21: while(1) { /* constructs a string from the sha1 output, length 40 */
        $1_1 = HEAPU8[((stack + 176) + $4_1) >> 0];
        /* 1048696 = 0123456789abcdef */
        HEAP8[($3_1 + 0) >> 0] = HEAPU8[(($1_1 >>> 4) + 1048696) >> 0];
        HEAP8[($3_1 + 1) >> 0] = HEAPU8[(($1_1 & 0xf) + 1048696) >> 0];
        $3_1 += 2;
        $4_1 += 1;
        if(($4_1) != (20)) {
          continue label$21
        }
        break label$21;
      };

      $3_1 = difficulty_without_lower_2_bits; /* difficulty rounded down to nearest multiple of 4 */
      label$22: { /* check if hash is ok */
        label$23: {
          label$24: {
            for(let i = 0; i < 40; ++i) {
              if(difficulty_div_4 == i) break label$24; /* if the expected number of zeroes (difficulty / 4), proceed further */
              if(HEAPU8[stack + 136 + i] != '0') break label$23; /* if not a zero before difficulty/4 expires, insta go to next iter */
            }
          }
          label$25: while(1) {
            if(($3_1) == difficulty) {
              /* pass here */
              break label$22;
            }
            $1_1 = $3_1 >>> 2;
            if(($3_1) == ($16_1)) { /* $3_1 < 160 */
              abort();
            }
            var val = HEAPU8[(stack + 136) + $1_1] - 48;
            if(val > 10) {
              val -= 87;
            }
            $4_1 = val ^ 4;
            $1_1 = $3_1 & 3;
            $3_1 = $3_1 + 1;
            if(($4_1 >>> $1_1) & 1) { /* check if a bit is 1, not 0 like usually */
              /* maybe pass */
              continue label$25;
            }
            /* fail */
            break label$25;
          };
        }
        ++iter;
        /* failed */
        continue label$12;
      }
      /* end */
      break label$12;
    };
    const out_ptr = _malloc(16, 1); /* OUTPUT, 16 byte mem region in [ string  16 bytes  string ] */
    memcpy(out_ptr, $13_1, 16); /* the lines below this point onward don't seem to have much of an effect, so they are not annotated */
    $4_1 = stack + 224; /* 64 bytes of space */
    $2_1 = 0;
    $8_1 = ((out_ptr + 3) & -4) - out_ptr; /* reverse misalignment - how many bytes till the next multiple of 4 */
    label$42: {
      label$43: {
        label$44: {
          label$45: {
            label$46: {
              label$47: while(1) {
                label$48: {
                  label$49: {
                    label$50: {
                      $12_1 = HEAPU8[(out_ptr + $2_1) >> 0];
                      $6_1 = ($12_1 << 24) >> 24;
                      if(($6_1) >= (0)) {
                        if(($8_1) == (-1)) {
                          break label$50
                        }
                        if(($8_1 - $2_1) & 3) {
                          break label$50
                        }
                        label$52: {
                          if($2_1 >>> 0 >= 9 >>> 0) {
                            break label$52
                          }
                          label$53: while(1) {
                            $3_1 = out_ptr + $2_1;
                            if((HEAP32[$3_1 >> 2] | (HEAP32[($3_1 + 4) >> 2])) & 0x80808080) {
                              break label$52
                            }
                            $2_1 = $2_1 + 8;
                            if($2_1 >>> 0 < 9 >>> 0) {
                              continue label$53
                            }
                            break label$53;
                          };
                        }
                        if($2_1 >>> 0 >= 16 >>> 0) {
                          break label$49
                        }
                        label$54: while(1) {
                          if((HEAP8[(out_ptr + $2_1) >> 0]) < (0)) {
                            break label$49
                          }
                          $2_1 = $2_1 + 1;
                          if(($2_1) != (16)) {
                            continue label$54
                          }
                          break label$54;
                        };
                        break label$43;
                      }
                      i64toi32_i32$1 = 256;
                      $51_1 = 0;
                      $51$hi = i64toi32_i32$1;
                      i64toi32_i32$1 = 1;
                      $52_1 = 0;
                      $52$hi = i64toi32_i32$1;
                      label$55: {
                        label$56: {
                          label$57: {
                            label$58: {
                              label$59: {
                                label$60: {
                                  label$61: {
                                    switch((HEAPU8[($12_1 + 1050168) >> 0]) - 2) {
                                      case 0:
                                        $3_1 = $2_1 + 1;
                                        if($3_1 >>> 0 < 16 >>> 0) {
                                          break label$56
                                        }
                                        i64toi32_i32$1 = 0;
                                        $51_1 = 0;
                                        $51$hi = i64toi32_i32$1;
                                        break label$45;
                                      case 1:
                                        i64toi32_i32$1 = 0;
                                        $51_1 = 0;
                                        $51$hi = i64toi32_i32$1;
                                        $3_1 = $2_1 + 1;
                                        if($3_1 >>> 0 >= 16 >>> 0) {
                                          break label$45
                                        }
                                        $3_1 = HEAP8[(out_ptr + $3_1) >> 0];
                                        switch($12_1 - 224) {
                                          case 13:
                                            break label$59;
                                          case 0:
                                            break label$60;
                                          default:
                                            break label$58;
                                        };
                                      case 2:
                                        break label$61;
                                      default:
                                        break label$44;
                                    };
                                  }
                                  i64toi32_i32$1 = 0;
                                  $51_1 = 0;
                                  $51$hi = i64toi32_i32$1;
                                  $3_1 = $2_1 + 1;
                                  if($3_1 >>> 0 >= 16 >>> 0) {
                                    break label$45
                                  }
                                  $3_1 = HEAP8[(out_ptr + $3_1) >> 0];
                                  label$64: {
                                    label$65: {
                                      switch($12_1 - 240) {
                                        default:
                                          if((($6_1 + 15) & 0xff) >>> 0 > 2 >>> 0) {
                                            break label$46
                                          }
                                          if(($3_1) > (-1)) {
                                            break label$46
                                          }
                                          if($3_1 >>> 0 >= -64 >>> 0) {
                                            break label$46
                                          }
                                          break label$64;
                                        case 0:
                                          if((($3_1 + 112) & 0xff) >>> 0 >= 48 >>> 0) {
                                            break label$46
                                          }
                                          break label$64;
                                        case 4:
                                          break label$65;
                                      };
                                    }
                                    if(($3_1) > (-113)) {
                                      break label$46
                                    }
                                  }
                                  $3_1 = $2_1 + 2;
                                  if($3_1 >>> 0 >= 16 >>> 0) {
                                    break label$45
                                  }
                                  if((HEAP8[(out_ptr + $3_1) >> 0]) > (-65)) {
                                    break label$48
                                  }
                                  i64toi32_i32$1 = 0;
                                  $52_1 = 0;
                                  $52$hi = i64toi32_i32$1;
                                  $3_1 = $2_1 + 3;
                                  if($3_1 >>> 0 >= 16 >>> 0) {
                                    break label$44
                                  }
                                  if((HEAP8[(out_ptr + $3_1) >> 0]) <= (-65)) {
                                    break label$55
                                  }
                                  i64toi32_i32$1 = 768;
                                  $51_1 = 0;
                                  $51$hi = i64toi32_i32$1;
                                  i64toi32_i32$1 = 1;
                                  $52_1 = 0;
                                  $52$hi = i64toi32_i32$1;
                                  break label$44;
                                }
                                if(($3_1 & -32) != (-96)) {
                                  break label$46
                                }
                                break label$57;
                              }
                              if(($3_1) >= (-96)) {
                                break label$46
                              }
                              break label$57;
                            }
                            if((($6_1 + 31) & 0xff) >>> 0 >= 12 >>> 0) {
                              if(($6_1 & -2) != (-18)) {
                                break label$46
                              }
                              if(($3_1) > (-1)) {
                                break label$46
                              }
                              if($3_1 >>> 0 >= -64 >>> 0) {
                                break label$46
                              }
                              break label$57;
                            }
                            if(($3_1) > (-65)) {
                              break label$46
                            }
                          }
                          i64toi32_i32$1 = 0;
                          $52_1 = 0;
                          $52$hi = i64toi32_i32$1;
                          $3_1 = $2_1 + 2;
                          if($3_1 >>> 0 >= 16 >>> 0) {
                            break label$44
                          }
                          if((HEAP8[(out_ptr + $3_1) >> 0]) > (-65)) {
                            break label$48
                          }
                          break label$55;
                        }
                        if((HEAP8[(out_ptr + $3_1) >> 0]) > (-65)) {
                          break label$44
                        }
                      }
                      $2_1 = $3_1 + 1;
                      break label$49;
                    }
                    $2_1 = $2_1 + 1;
                  }
                  if($2_1 >>> 0 < 16 >>> 0) {
                    continue label$47
                  }
                  break label$43;
                }
                break label$47;
              };
              i64toi32_i32$1 = 512;
              $51_1 = 0;
              $51$hi = i64toi32_i32$1;
              i64toi32_i32$1 = 1;
              $52_1 = 0;
              $52$hi = i64toi32_i32$1;
              break label$44;
            }
            i64toi32_i32$1 = 256;
            $51_1 = 0;
            $51$hi = i64toi32_i32$1;
            break label$44;
          }
          i64toi32_i32$1 = 0;
          $52_1 = 0;
          $52$hi = i64toi32_i32$1;
        }
        i64toi32_i32$1 = $51$hi;
        i64toi32_i32$1 = 0;
        $908$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $51$hi;
        i64toi32_i32$2 = $51_1;
        i64toi32_i32$0 = $908$hi;
        i64toi32_i32$3 = $2_1;
        i64toi32_i32$0 = i64toi32_i32$1 | i64toi32_i32$0;
        $909$hi = i64toi32_i32$0;
        i64toi32_i32$0 = $52$hi;
        i64toi32_i32$0 = $909$hi;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$3;
        i64toi32_i32$2 = $52$hi;
        i64toi32_i32$3 = $52_1;
        i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2;
        $911 = i64toi32_i32$1 | i64toi32_i32$3;
        i64toi32_i32$1 = $4_1;
        HEAP32[(i64toi32_i32$1 + 4) >> 2] = $911;
        HEAP32[(i64toi32_i32$1 + 8) >> 2] = i64toi32_i32$2;
        HEAP32[i64toi32_i32$1 >> 2] = 1; // abort()
        break label$42;
      }
      HEAP32[($4_1 + 4) >> 2] = out_ptr;
      HEAP32[($4_1 + 8) >> 2] = 16;
      HEAP32[$4_1 >> 2] = 0;
    }
    if(HEAP32[(stack + 224) >> 2]) {
      abort();
    }
    HEAP32[($0_1 +  0) >> 2] = iter;
    HEAP32[($0_1 +  4) >> 2] = out_ptr;
    HEAP32[($0_1 +  8) >> 2] = 16;
    HEAP32[($0_1 + 12) >> 2] = 16; // out len
    if(ptr_len) {
      _free(ptr, ptr_len, 1);
    }
    global$0 = stack + 288;
  }

  function $1($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $8_1 = 0,
      $7_1 = 0,
      $9_1 = 0,
      $130 = 0,
      $140 = 0,
      $151 = 0,
      $162 = 0,
      $213 = 0,
      $223 = 0,
      $234 = 0,
      $245 = 0,
      $265 = 0;
    label$1: {
      label$2: {
        $2_1 = ($0_1 + 3) & -4;
        $3_1 = $2_1 - $0_1;
        if($3_1 >>> 0 > $1_1 >>> 0) {
          break label$2
        }
        if($3_1 >>> 0 > 4 >>> 0) {
          break label$2
        }
        $6_1 = $1_1 - $3_1;
        if($6_1 >>> 0 < 4 >>> 0) {
          break label$2
        }
        $7_1 = $6_1 & 3;
        $1_1 = 0;
        label$3: {
          if(!$3_1) {
            break label$3
          }
          $8_1 = $3_1 & 3;
          label$4: {
            if(($2_1 + ($0_1 ^ -1)) >>> 0 < 3 >>> 0) {
              $2_1 = $0_1;
              break label$4;
            }
            $4_1 = $3_1 & -4;
            $2_1 = $0_1;
            label$6: while(1) {
              $1_1 = ((($1_1 + ((HEAP8[$2_1 >> 0]) > (-65))) + ((HEAP8[($2_1 + 1) >> 0]) > (-65))) + ((HEAP8[($2_1 + 2) >> 0]) > (-65))) + ((HEAP8[($2_1 + 3) >> 0]) > (-65));
              $2_1 = $2_1 + 4;
              $4_1 = $4_1 - 4;
              if($4_1) {
                continue label$6
              }
              break label$6;
            };
          }
          if(!$8_1) {
            break label$3
          }
          label$7: while(1) {
            $1_1 = $1_1 + ((HEAP8[$2_1 >> 0]) > (-65));
            $2_1 = $2_1 + 1;
            $8_1 = $8_1 - 1;
            if($8_1) {
              continue label$7
            }
            break label$7;
          };
        }
        $0_1 = $0_1 + $3_1;
        label$8: {
          if(!$7_1) {
            break label$8
          }
          $2_1 = $0_1 + ($6_1 & -4);
          $5_1 = (HEAP8[$2_1 >> 0]) > (-65);
          if(($7_1) == (1)) {
            break label$8
          }
          $5_1 = $5_1 + ((HEAP8[($2_1 + 1) >> 0]) > (-65));
          if(($7_1) == (2)) {
            break label$8
          }
          $5_1 = $5_1 + ((HEAP8[($2_1 + 2) >> 0]) > (-65));
        }
        $3_1 = $6_1 >>> 2;
        $4_1 = $1_1 + $5_1;
        label$9: while(1) {
          $1_1 = $0_1;
          if(!$3_1) {
            break label$1
          }
          $5_1 = $3_1 >>> 0 < 192 >>> 0 ? $3_1 : 192;
          $6_1 = $5_1 & 3;
          $7_1 = $5_1 << 2;
          label$10: {
            $8_1 = $5_1 & 252;
            $0_1 = $8_1 << 2;
            if(!$0_1) {
              $2_1 = 0;
              break label$10;
            }
            $9_1 = $0_1 + $1_1;
            $2_1 = 0;
            $0_1 = $1_1;
            label$12: while(1) {
              $130 = $2_1;
              $2_1 = HEAP32[$0_1 >> 2];
              $140 = $130 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
              $2_1 = HEAP32[($0_1 + 4) >> 2];
              $151 = $140 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
              $2_1 = HEAP32[($0_1 + 8) >> 2];
              $162 = $151 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
              $2_1 = HEAP32[($0_1 + 12) >> 2];
              $2_1 = $162 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
              $0_1 = $0_1 + 16;
              if(($9_1) != ($0_1)) {
                continue label$12
              }
              break label$12;
            };
          }
          $0_1 = $1_1 + $7_1;
          $3_1 = $3_1 - $5_1;
          $4_1 = (Math_imul((($2_1 >>> 8) & 16711935) + ($2_1 & 16711935), 65537) >>> 16) + $4_1;
          if(!$6_1) {
            continue label$9
          }
          break label$9;
        };
        $0_1 = $1_1 + ($8_1 << 2);
        $3_1 = $6_1 + 1073741823;
        $1_1 = $3_1 & 1073741823;
        $2_1 = $1_1 + 1;
        $5_1 = $2_1 & 3;
        label$13: {
          if($1_1 >>> 0 < 3 >>> 0) {
            $2_1 = 0;
            break label$13;
          }
          $1_1 = $2_1 & 2147483644;
          $2_1 = 0;
          label$15: while(1) {
            $213 = $2_1;
            $2_1 = HEAP32[$0_1 >> 2];
            $223 = $213 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
            $2_1 = HEAP32[($0_1 + 4) >> 2];
            $234 = $223 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
            $2_1 = HEAP32[($0_1 + 8) >> 2];
            $245 = $234 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
            $2_1 = HEAP32[($0_1 + 12) >> 2];
            $2_1 = $245 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
            $0_1 = $0_1 + 16;
            $1_1 = $1_1 - 4;
            if($1_1) {
              continue label$15
            }
            break label$15;
          };
        }
        if($5_1) {
          $1_1 = $3_1 - 1073741823;
          label$17: while(1) {
            $265 = $2_1;
            $2_1 = HEAP32[$0_1 >> 2];
            $2_1 = $265 + ((($2_1 ^ -1) >>> 7 | ($2_1 >>> 6)) & 16843009);
            $0_1 = $0_1 + 4;
            $1_1 = $1_1 - 1;
            if($1_1) {
              continue label$17
            }
            break label$17;
          };
        }
        return (Math_imul((($2_1 >>> 8) & 16711935) + ($2_1 & 16711935), 65537) >>> 16) + $4_1;
      }
      if(!$1_1) {
        return 0
      }
      $2_1 = $1_1 & 3;
      label$19: {
        if(($1_1 - 1) >>> 0 < 3 >>> 0) {
          break label$19
        }
        $1_1 = $1_1 & -4;
        label$21: while(1) {
          $4_1 = ((($4_1 + ((HEAP8[$0_1 >> 0]) > (-65))) + ((HEAP8[($0_1 + 1) >> 0]) > (-65))) + ((HEAP8[($0_1 + 2) >> 0]) > (-65))) + ((HEAP8[($0_1 + 3) >> 0]) > (-65));
          $0_1 = $0_1 + 4;
          $1_1 = $1_1 - 4;
          if($1_1) {
            continue label$21
          }
          break label$21;
        };
      }
      if(!$2_1) {
        break label$1
      }
      label$22: while(1) {
        $4_1 = $4_1 + ((HEAP8[$0_1 >> 0]) > (-65));
        $0_1 = $0_1 + 1;
        $2_1 = $2_1 - 1;
        if($2_1) {
          continue label$22
        }
        break label$22;
      };
    }
    return $4_1;
  }

  function $2($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $49_1 = 0,
      $7_1 = 0,
      $8_1 = 0;
    $4_1 = HEAP32[($0_1 + 16) >> 2];
    label$1: {
      label$2: {
        label$3: {
          label$4: {
            label$5: {
              $8_1 = HEAP32[($0_1 + 8) >> 2];
              if(!(($4_1) != (1) ? ($8_1) != (1) : 0)) {
                if(($4_1) != (1)) {
                  break label$3
                }
                $7_1 = $1_1 + $2_1;
                $6_1 = HEAP32[($0_1 + 20) >> 2];
                if($6_1) {
                  break label$5
                }
                $4_1 = $1_1;
                break label$4;
              }
              $3_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], $1_1, $2_1);
              break label$2;
            }
            $4_1 = $1_1;
            label$7: while(1) {
              if(($4_1) == ($7_1)) {
                break label$3
              }
              label$8: {
                $3_1 = $4_1;
                $4_1 = HEAP8[$3_1 >> 0];
                if(($4_1) > (-1)) {
                  $49_1 = $3_1 + 1;
                  break label$8;
                }
                $49_1 = $3_1 + 2;
                if($4_1 >>> 0 < -32 >>> 0) {
                  break label$8
                }
                $49_1 = $3_1 + 3;
                if($4_1 >>> 0 < -16 >>> 0) {
                  break label$8
                }
                if(((($4_1 & 0xff) << 18) & 1835008 | ((HEAPU8[($3_1 + 3) >> 0]) & 63 | (((HEAPU8[($3_1 + 2) >> 0]) & 63) << 6 | (((HEAPU8[($3_1 + 1) >> 0]) & 63) << 12)))) == (1114112)) {
                  break label$3
                }
                $49_1 = $3_1 + 4;
              }
              $4_1 = $49_1;
              $5_1 = $4_1 + ($5_1 - $3_1);
              $6_1 = $6_1 - 1;
              if($6_1) {
                continue label$7
              }
              break label$7;
            };
          }
          if(($4_1) == ($7_1)) {
            break label$3
          }
          label$10: {
            $3_1 = HEAP8[$4_1 >> 0];
            if(($3_1) > (-1)) {
              break label$10
            }
            if($3_1 >>> 0 < -32 >>> 0) {
              break label$10
            }
            if($3_1 >>> 0 < -16 >>> 0) {
              break label$10
            }
            if(((($3_1 & 0xff) << 18) & 1835008 | ((HEAPU8[($4_1 + 3) >> 0]) & 63 | (((HEAPU8[($4_1 + 2) >> 0]) & 63) << 6 | (((HEAPU8[($4_1 + 1) >> 0]) & 63) << 12)))) == (1114112)) {
              break label$3
            }
          }
          label$11: {
            label$12: {
              if(!$5_1) {
                $4_1 = 0;
                break label$12;
              }
              if($2_1 >>> 0 <= $5_1 >>> 0) {
                $3_1 = 0;
                $4_1 = $2_1;
                if(($5_1) == ($4_1)) {
                  break label$12
                }
                break label$11;
              }
              $3_1 = 0;
              $4_1 = $5_1;
              if((HEAP8[($4_1 + $1_1) >> 0]) < (-64)) {
                break label$11
              }
            }
            $5_1 = $4_1;
            $3_1 = $1_1;
          }
          $2_1 = $3_1 ? $5_1 : $2_1;
          $1_1 = $3_1 ? $3_1 : $1_1;
        }
        if(!$8_1) {
          break label$1
        }
        $7_1 = HEAP32[($0_1 + 12) >> 2];
        label$15: {
          if($2_1 >>> 0 >= 16 >>> 0) {
            $4_1 = $1($1_1, $2_1);
            break label$15;
          }
          if(!$2_1) {
            $4_1 = 0;
            break label$15;
          }
          $5_1 = $2_1 & 3;
          label$18: {
            if(($2_1 - 1) >>> 0 < 3 >>> 0) {
              $4_1 = 0;
              $3_1 = $1_1;
              break label$18;
            }
            $6_1 = $2_1 & -4;
            $4_1 = 0;
            $3_1 = $1_1;
            label$20: while(1) {
              $4_1 = ((($4_1 + ((HEAP8[$3_1 >> 0]) > (-65))) + ((HEAP8[($3_1 + 1) >> 0]) > (-65))) + ((HEAP8[($3_1 + 2) >> 0]) > (-65))) + ((HEAP8[($3_1 + 3) >> 0]) > (-65));
              $3_1 = $3_1 + 4;
              $6_1 = $6_1 - 4;
              if($6_1) {
                continue label$20
              }
              break label$20;
            };
          }
          if(!$5_1) {
            break label$15
          }
          label$21: while(1) {
            $4_1 = $4_1 + ((HEAP8[$3_1 >> 0]) > (-65));
            $3_1 = $3_1 + 1;
            $5_1 = $5_1 - 1;
            if($5_1) {
              continue label$21
            }
            break label$21;
          };
        }
        if($4_1 >>> 0 < $7_1 >>> 0) {
          $3_1 = 0;
          $4_1 = $7_1 - $4_1;
          $6_1 = $4_1;
          label$23: {
            label$24: {
              label$25: {
                $5_1 = HEAPU8[($0_1 + 32) >> 0];
                switch(((($5_1) == (3) ? 0 : $5_1) & 3) - 1) {
                  case 1:
                    break label$24;
                  case 0:
                    break label$25;
                  default:
                    break label$23;
                };
              }
              $6_1 = 0;
              $3_1 = $4_1;
              break label$23;
            }
            $3_1 = $4_1 >>> 1;
            $6_1 = ($4_1 + 1) >>> 1;
          }
          $3_1 = $3_1 + 1;
          $4_1 = HEAP32[($0_1 + 28) >> 2];
          $5_1 = HEAP32[($0_1 + 4) >> 2];
          $0_1 = HEAP32[($0_1 + 24) >> 2];
          label$26: {
            label$27: while(1) {
              $3_1 = $3_1 - 1;
              if(!$3_1) {
                break label$26
              }
              if(!(FUNCTION_TABLE[HEAP32[($4_1 + 16) >> 2]]($0_1, $5_1))) {
                continue label$27
              }
              break label$27;
            };
            return 1;
          }
          $3_1 = 1;
          if(($5_1) == (1114112)) {
            break label$2
          }
          if(FUNCTION_TABLE[HEAP32[($4_1 + 12) >> 2]]($0_1, $1_1, $2_1)) {
            break label$2
          }
          $3_1 = 0;
          label$28: while(1) {
            if(($3_1) == ($6_1)) {
              return 0
            }
            $3_1 = $3_1 + 1;
            if(!(FUNCTION_TABLE[HEAP32[($4_1 + 16) >> 2]]($0_1, $5_1))) {
              continue label$28
            }
            break label$28;
          };
          return ($3_1 - 1) >>> 0 < $6_1 >>> 0;
        }
        break label$1;
      }
      return $3_1;
    }
    return FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], $1_1, $2_1);
  }

  function $3($0_1, $1_1, $2_1, $3_1, $4_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    var $5_1 = 0,
      $6_1 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $10_1 = 0,
      $162 = 0;
    $5_1 = HEAP32[$0_1 >> 2];
    $7_1 = $5_1 & 1;
    $10_1 = $7_1 ? 43 : 1114112;
    $7_1 = $4_1 + $7_1;
    label$1: {
      if(!($5_1 & 4)) {
        $1_1 = 0;
        break label$1;
      }
      label$3: {
        if($2_1 >>> 0 >= 16 >>> 0) {
          $8_1 = $1($1_1, $2_1);
          break label$3;
        }
        if(!$2_1) {
          break label$3
        }
        $6_1 = $2_1 & 3;
        label$5: {
          if(($2_1 - 1) >>> 0 < 3 >>> 0) {
            $5_1 = $1_1;
            break label$5;
          }
          $9_1 = $2_1 & -4;
          $5_1 = $1_1;
          label$7: while(1) {
            $8_1 = ((($8_1 + ((HEAP8[$5_1 >> 0]) > (-65))) + ((HEAP8[($5_1 + 1) >> 0]) > (-65))) + ((HEAP8[($5_1 + 2) >> 0]) > (-65))) + ((HEAP8[($5_1 + 3) >> 0]) > (-65));
            $5_1 = $5_1 + 4;
            $9_1 = $9_1 - 4;
            if($9_1) {
              continue label$7
            }
            break label$7;
          };
        }
        if(!$6_1) {
          break label$3
        }
        label$8: while(1) {
          $8_1 = $8_1 + ((HEAP8[$5_1 >> 0]) > (-65));
          $5_1 = $5_1 + 1;
          $6_1 = $6_1 - 1;
          if($6_1) {
            continue label$8
          }
          break label$8;
        };
      }
      $7_1 = $7_1 + $8_1;
    }
    label$9: {
      label$10: {
        if(!(HEAP32[($0_1 + 8) >> 2])) {
          $5_1 = 1;
          if($39($0_1, $10_1, $1_1, $2_1)) {
            break label$10
          }
          break label$9;
        }
        label$12: {
          label$13: {
            label$14: {
              label$15: {
                $6_1 = HEAP32[($0_1 + 12) >> 2];
                if($6_1 >>> 0 > $7_1 >>> 0) {
                  if((HEAPU8[$0_1 >> 0]) & 8) {
                    break label$12
                  }
                  $5_1 = 0;
                  $6_1 = $6_1 - $7_1;
                  $7_1 = $6_1;
                  $8_1 = HEAPU8[($0_1 + 32) >> 0];
                  switch(((($8_1) == (3) ? 1 : $8_1) & 3) - 1) {
                    case 1:
                      break label$14;
                    case 0:
                      break label$15;
                    default:
                      break label$13;
                  };
                }
                $5_1 = 1;
                if($39($0_1, $10_1, $1_1, $2_1)) {
                  break label$10
                }
                break label$9;
              }
              $7_1 = 0;
              $5_1 = $6_1;
              break label$13;
            }
            $5_1 = $6_1 >>> 1;
            $7_1 = ($6_1 + 1) >>> 1;
          }
          $5_1 = $5_1 + 1;
          $8_1 = HEAP32[($0_1 + 28) >> 2];
          $6_1 = HEAP32[($0_1 + 4) >> 2];
          $9_1 = HEAP32[($0_1 + 24) >> 2];
          label$17: {
            label$18: while(1) {
              $5_1 = $5_1 - 1;
              if(!$5_1) {
                break label$17
              }
              if(!(FUNCTION_TABLE[HEAP32[($8_1 + 16) >> 2]]($9_1, $6_1))) {
                continue label$18
              }
              break label$18;
            };
            return 1;
          }
          $5_1 = 1;
          if(($6_1) == (1114112)) {
            break label$10
          }
          if($39($0_1, $10_1, $1_1, $2_1)) {
            break label$10
          }
          if(FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], $3_1, $4_1)) {
            break label$10
          }
          $1_1 = HEAP32[($0_1 + 28) >> 2];
          $2_1 = HEAP32[($0_1 + 24) >> 2];
          $5_1 = 0;
          label$19: {
            label$20: while(1) {
              $0_1 = $7_1;
              $162 = $0_1;
              if(($0_1) == ($5_1)) {
                break label$19
              }
              $5_1 = $5_1 + 1;
              if(!(FUNCTION_TABLE[HEAP32[($1_1 + 16) >> 2]]($2_1, $6_1))) {
                continue label$20
              }
              break label$20;
            };
            $162 = $5_1 - 1;
          }
          $5_1 = $162 >>> 0 < $7_1 >>> 0;
          break label$10;
        }
        $8_1 = HEAP32[($0_1 + 4) >> 2];
        HEAP32[($0_1 + 4) >> 2] = 48;
        $9_1 = HEAPU8[($0_1 + 32) >> 0];
        $5_1 = 1;
        HEAP8[($0_1 + 32) >> 0] = 1;
        if($39($0_1, $10_1, $1_1, $2_1)) {
          break label$10
        }
        $5_1 = 0;
        $1_1 = $6_1 - $7_1;
        $2_1 = $1_1;
        label$21: {
          label$22: {
            label$23: {
              $7_1 = HEAPU8[($0_1 + 32) >> 0];
              switch(((($7_1) == (3) ? 1 : $7_1) & 3) - 1) {
                case 1:
                  break label$22;
                case 0:
                  break label$23;
                default:
                  break label$21;
              };
            }
            $2_1 = 0;
            $5_1 = $1_1;
            break label$21;
          }
          $5_1 = $1_1 >>> 1;
          $2_1 = ($1_1 + 1) >>> 1;
        }
        $5_1 = $5_1 + 1;
        $7_1 = HEAP32[($0_1 + 28) >> 2];
        $1_1 = HEAP32[($0_1 + 4) >> 2];
        $6_1 = HEAP32[($0_1 + 24) >> 2];
        label$24: {
          label$25: while(1) {
            $5_1 = $5_1 - 1;
            if(!$5_1) {
              break label$24
            }
            if(!(FUNCTION_TABLE[HEAP32[($7_1 + 16) >> 2]]($6_1, $1_1))) {
              continue label$25
            }
            break label$25;
          };
          return 1;
        }
        $5_1 = 1;
        if(($1_1) == (1114112)) {
          break label$10
        }
        if(FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], $3_1, $4_1)) {
          break label$10
        }
        $3_1 = HEAP32[($0_1 + 28) >> 2];
        $4_1 = HEAP32[($0_1 + 24) >> 2];
        $6_1 = 0;
        label$26: {
          label$27: while(1) {
            if(($2_1) == ($6_1)) {
              break label$26
            }
            $6_1 = $6_1 + 1;
            if(!(FUNCTION_TABLE[HEAP32[($3_1 + 16) >> 2]]($4_1, $1_1))) {
              continue label$27
            }
            break label$27;
          };
          if(($6_1 - 1) >>> 0 < $2_1 >>> 0) {
            break label$10
          }
        }
        HEAP8[($0_1 + 32) >> 0] = $9_1;
        HEAP32[($0_1 + 4) >> 2] = $8_1;
        return 0;
      }
      return $5_1;
    }
    return FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], $3_1, $4_1);
  }

  function $4($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $8_1 = 0,
      $7_1 = 0,
      $9_1 = 0,
      $10_1 = 0,
      $11_1 = 0;
    label$1: {
      if($2_1) {
        $9_1 = HEAP32[($0_1 + 4) >> 2];
        $10_1 = HEAP32[$0_1 >> 2];
        $7_1 = HEAP32[($0_1 + 8) >> 2];
        label$3: while(1) {
          label$4: {
            if(!(HEAPU8[$7_1 >> 0])) {
              break label$4
            }
            if(!(FUNCTION_TABLE[HEAP32[($9_1 + 12) >> 2]]($10_1, 1049668, 4))) {
              break label$4
            }
            return 1;
          }
          $6_1 = 0;
          $4_1 = $2_1;
          label$5: {
            label$6: {
              label$7: {
                label$8: while(1) {
                  label$9: {
                    $5_1 = $1_1 + $6_1;
                    label$10: {
                      label$11: {
                        label$12: {
                          label$13: {
                            if($4_1 >>> 0 >= 8 >>> 0) {
                              $0_1 = (($5_1 + 3) & -4) - $5_1;
                              if(!$0_1) {
                                $3_1 = $4_1 - 8;
                                $0_1 = 0;
                                break label$12;
                              }
                              $0_1 = $0_1 >>> 0 > $4_1 >>> 0 ? $4_1 : $0_1;
                              $3_1 = 0;
                              label$16: while(1) {
                                if((HEAPU8[($3_1 + $5_1) >> 0]) == (10)) {
                                  break label$10
                                }
                                $3_1 = $3_1 + 1;
                                if(($0_1) != ($3_1)) {
                                  continue label$16
                                }
                                break label$16;
                              };
                              break label$13;
                            }
                            if(!$4_1) {
                              break label$9
                            }
                            $3_1 = 0;
                            if((HEAPU8[$5_1 >> 0]) == (10)) {
                              break label$10
                            }
                            if(($4_1) == (1)) {
                              break label$9
                            }
                            $3_1 = 1;
                            if((HEAPU8[($5_1 + 1) >> 0]) == (10)) {
                              break label$10
                            }
                            if(($4_1) == (2)) {
                              break label$9
                            }
                            $3_1 = 2;
                            if((HEAPU8[($5_1 + 2) >> 0]) == (10)) {
                              break label$10
                            }
                            if(($4_1) == (3)) {
                              break label$9
                            }
                            $3_1 = 3;
                            if((HEAPU8[($5_1 + 3) >> 0]) == (10)) {
                              break label$10
                            }
                            if(($4_1) == (4)) {
                              break label$9
                            }
                            $3_1 = 4;
                            if((HEAPU8[($5_1 + 4) >> 0]) == (10)) {
                              break label$10
                            }
                            if(($4_1) == (5)) {
                              break label$9
                            }
                            $3_1 = 5;
                            if((HEAPU8[($5_1 + 5) >> 0]) == (10)) {
                              break label$10
                            }
                            if(($4_1) == (6)) {
                              break label$9
                            }
                            $3_1 = 6;
                            if((HEAPU8[($5_1 + 6) >> 0]) != (10)) {
                              break label$9
                            }
                            break label$10;
                          }
                          $3_1 = $4_1 - 8;
                          if($3_1 >>> 0 < $0_1 >>> 0) {
                            break label$11
                          }
                        }
                        label$17: while(1) {
                          $8_1 = $0_1 + $5_1;
                          $11_1 = HEAP32[$8_1 >> 2];
                          $8_1 = HEAP32[($8_1 + 4) >> 2];
                          if(!(((($11_1 ^ 168430090) - 16843009) & ($11_1 ^ -1) | ((($8_1 ^ 168430090) - 16843009) & ($8_1 ^ -1))) & 0x80808080)) {
                            $0_1 = $0_1 + 8;
                            if($3_1 >>> 0 >= $0_1 >>> 0) {
                              continue label$17
                            }
                          }
                          break label$17;
                        };
                        if($0_1 >>> 0 <= $4_1 >>> 0) {
                          break label$11
                        }
                        $67($0_1, $4_1);
                        abort();
                      }
                      if(($0_1) == ($4_1)) {
                        break label$9
                      }
                      $4_1 = $0_1 - $4_1;
                      $5_1 = $0_1 + $5_1;
                      $3_1 = 0;
                      label$19: while(1) {
                        if((HEAPU8[($3_1 + $5_1) >> 0]) != (10)) {
                          $3_1 = $3_1 + 1;
                          if($4_1 + $3_1) {
                            continue label$19
                          }
                          break label$9;
                        }
                        break label$19;
                      };
                      $3_1 = $0_1 + $3_1;
                    }
                    label$21: {
                      $0_1 = $3_1 + $6_1;
                      $6_1 = $0_1 + 1;
                      if($6_1 >>> 0 < $0_1 >>> 0) {
                        break label$21
                      }
                      if($2_1 >>> 0 < $6_1 >>> 0) {
                        break label$21
                      }
                      if((HEAPU8[($0_1 + $1_1) >> 0]) != (10)) {
                        break label$21
                      }
                      HEAP8[$7_1 >> 0] = 1;
                      if($2_1 >>> 0 <= $6_1 >>> 0) {
                        break label$7
                      }
                      $0_1 = $6_1;
                      if((HEAP8[($1_1 + $0_1) >> 0]) <= (-65)) {
                        break label$6
                      }
                      break label$5;
                    }
                    $4_1 = $2_1 - $6_1;
                    if($2_1 >>> 0 >= $6_1 >>> 0) {
                      continue label$8
                    }
                  }
                  break label$8;
                };
                HEAP8[$7_1 >> 0] = 0;
                $6_1 = $2_1;
              }
              $0_1 = $2_1;
              if(($6_1) == ($0_1)) {
                break label$5
              }
            }
            $46($1_1, $2_1, 0, $6_1);
            abort();
          }
          if(FUNCTION_TABLE[HEAP32[($9_1 + 12) >> 2]]($10_1, $1_1, $0_1)) {
            return 1
          }
          label$23: {
            if($0_1 >>> 0 >= $2_1 >>> 0) {
              if(($0_1) == ($2_1)) {
                break label$23
              }
              break label$1;
            }
            if((HEAP8[($0_1 + $1_1) >> 0]) <= (-65)) {
              break label$1
            }
          }
          $1_1 = $0_1 + $1_1;
          $2_1 = $2_1 - $0_1;
          if($2_1) {
            continue label$3
          }
          break label$3;
        };
      }
      return 0;
    }
    $46($1_1, $2_1, $0_1, $2_1);
    abort();
  }

  /**
   * Generates 32 bytes of random data from the provided date
   * @param {*} $0_1 ptr
   * @param {*} $1_1 low 32 date bits
   * @param {*} $1$hi high 32 date bits
   */
  function rand($0_1, $1_1, $1$hi) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $1$hi = $1$hi;
    var i64toi32_i32$3 = 0,
      i64toi32_i32$1 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$4 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$5 = 0,
      $2_1 = 0,
      $3_1 = 0,
      $3$hi = 0,
      $4_1 = 0,
      $4$hi = 0,
      $5_1 = 0,
      $5$hi = 0,
      $9_1 = 0,
      $9$hi = 0,
      i64toi32_i32$6 = 0,
      $6_1 = 0,
      $10$hi = 0,
      $11$hi = 0,
      $12$hi = 0,
      $13$hi = 0,
      $7_1 = 0,
      $14$hi = 0,
      $15$hi = 0,
      $16$hi = 0,
      $17$hi = 0,
      $8_1 = 0,
      $120 = 0,
      $121 = 0,
      $122 = 0,
      $123 = 0,
      $124 = 0,
      $125 = 0,
      $6$hi = 0,
      $10_1 = 0,
      $11_1 = 0,
      $12_1 = 0,
      $13_1 = 0,
      $126 = 0,
      $127 = 0,
      $128 = 0,
      $7$hi = 0,
      $14_1 = 0,
      $15_1 = 0,
      $16_1 = 0,
      $17_1 = 0,
      $129 = 0,
      $130 = 0,
      $131 = 0,
      $8$hi = 0,
      $23_1 = 0,
      $23$hi = 0,
      $25$hi = 0,
      $132 = 0,
      $28_1 = 0,
      $28$hi = 0,
      $30$hi = 0,
      $133 = 0,
      $33_1 = 0,
      $33$hi = 0,
      $35$hi = 0,
      $39_1 = 0,
      $39$hi = 0,
      $41$hi = 0,
      $134 = 0,
      $44_1 = 0,
      $44$hi = 0,
      $46$hi = 0,
      $135 = 0,
      $49_1 = 0,
      $49$hi = 0,
      $51$hi = 0,
      $63_1 = 0,
      $63$hi = 0,
      $65$hi = 0,
      $136 = 0,
      $68_1 = 0,
      $68$hi = 0,
      $70$hi = 0,
      $137 = 0,
      $73_1 = 0,
      $73$hi = 0,
      $75$hi = 0,
      $87 = 0,
      $87$hi = 0,
      $89$hi = 0,
      $138 = 0,
      $92 = 0,
      $92$hi = 0,
      $94$hi = 0,
      $139 = 0,
      $97 = 0,
      $97$hi = 0,
      $99$hi = 0,
      $177 = 0,
      $177$hi = 0,
      $179$hi = 0,
      $181$hi = 0,
      $183$hi = 0,
      $185$hi = 0,
      $187 = 0,
      $187$hi = 0,
      $188 = 0,
      $191 = 0,
      $191$hi = 0,
      $193$hi = 0,
      $195$hi = 0,
      $197$hi = 0,
      $199$hi = 0,
      $201 = 0,
      $201$hi = 0,
      $202 = 0,
      $205 = 0,
      $205$hi = 0,
      $207 = 0,
      $207$hi = 0,
      $209 = 0,
      $209$hi = 0,
      $211 = 0,
      $211$hi = 0,
      $213 = 0,
      $213$hi = 0,
      $215 = 0,
      $215$hi = 0,
      $216 = 0,
      $216$hi = 0,
      $217 = 0,
      $217$hi = 0,
      $218 = 0,
      $218$hi = 0,
      $219 = 0,
      $219$hi = 0,
      $220 = 0,
      $224 = 0,
      $229 = 0,
      $234 = 0,
      $239 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    i64toi32_i32$0 = $1$hi;
    i64toi32_i32$2 = $1_1;
    i64toi32_i32$1 = 2027808485;
    i64toi32_i32$3 = -47583148;
    i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$3;
    i64toi32_i32$5 = i64toi32_i32$0 + i64toi32_i32$1;
    if(i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
      i64toi32_i32$5 = i64toi32_i32$5 + 1
    }
    $3_1 = i64toi32_i32$4;
    $3$hi = i64toi32_i32$5;
    $23_1 = i64toi32_i32$4;
    $23$hi = i64toi32_i32$5;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$2 = 0;
    i64toi32_i32$3 = 30;
    i64toi32_i32$1 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$2 = 0;
      $120 = i64toi32_i32$5 >>> i64toi32_i32$1;
    } else {
      i64toi32_i32$2 = i64toi32_i32$5 >>> i64toi32_i32$1;
      $120 = (((1 << i64toi32_i32$1) - 1) & i64toi32_i32$5) << (32 - i64toi32_i32$1) | (i64toi32_i32$0 >>> i64toi32_i32$1);
    }
    $25$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $23$hi;
    i64toi32_i32$5 = $23_1;
    i64toi32_i32$0 = $25$hi;
    i64toi32_i32$3 = $120;
    i64toi32_i32$0 = i64toi32_i32$2 ^ i64toi32_i32$0;
    $132 = i64toi32_i32$5 ^ i64toi32_i32$3;
    i64toi32_i32$5 = -1084733587;
    i64toi32_i32$5 = __wasm_i64_mul($132, i64toi32_i32$0, 484763065, i64toi32_i32$5);
    i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
    $3_1 = i64toi32_i32$5;
    $3$hi = i64toi32_i32$0;
    $28_1 = i64toi32_i32$5;
    $28$hi = i64toi32_i32$0;
    i64toi32_i32$2 = i64toi32_i32$5;
    i64toi32_i32$5 = 0;
    i64toi32_i32$3 = 27;
    i64toi32_i32$1 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$5 = 0;
      $121 = i64toi32_i32$0 >>> i64toi32_i32$1;
    } else {
      i64toi32_i32$5 = i64toi32_i32$0 >>> i64toi32_i32$1;
      $121 = (((1 << i64toi32_i32$1) - 1) & i64toi32_i32$0) << (32 - i64toi32_i32$1) | (i64toi32_i32$2 >>> i64toi32_i32$1);
    }
    $30$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $28$hi;
    i64toi32_i32$0 = $28_1;
    i64toi32_i32$2 = $30$hi;
    i64toi32_i32$3 = $121;
    i64toi32_i32$2 = i64toi32_i32$5 ^ i64toi32_i32$2;
    $133 = i64toi32_i32$0 ^ i64toi32_i32$3;
    i64toi32_i32$0 = -1798288965;
    i64toi32_i32$0 = __wasm_i64_mul($133, i64toi32_i32$2, 321982955, i64toi32_i32$0);
    i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
    $9_1 = i64toi32_i32$0;
    $9$hi = i64toi32_i32$2;
    $33_1 = i64toi32_i32$0;
    $33$hi = i64toi32_i32$2;
    i64toi32_i32$5 = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = 31;
    i64toi32_i32$1 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$0 = 0;
      $122 = i64toi32_i32$2 >>> i64toi32_i32$1;
    } else {
      i64toi32_i32$0 = i64toi32_i32$2 >>> i64toi32_i32$1;
      $122 = (((1 << i64toi32_i32$1) - 1) & i64toi32_i32$2) << (32 - i64toi32_i32$1) | (i64toi32_i32$5 >>> i64toi32_i32$1);
    }
    $35$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $33$hi;
    i64toi32_i32$2 = $33_1;
    i64toi32_i32$5 = $35$hi;
    i64toi32_i32$3 = $122;
    i64toi32_i32$5 = i64toi32_i32$0 ^ i64toi32_i32$5;
    $3_1 = i64toi32_i32$2 ^ i64toi32_i32$3;
    $3$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $1$hi;
    i64toi32_i32$0 = $1_1;
    i64toi32_i32$2 = 626627283;
    i64toi32_i32$3 = -2111796287;
    i64toi32_i32$1 = i64toi32_i32$0 - i64toi32_i32$3;
    i64toi32_i32$6 = i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0;
    i64toi32_i32$4 = i64toi32_i32$6 + i64toi32_i32$2;
    i64toi32_i32$4 = i64toi32_i32$5 - i64toi32_i32$4;
    $4_1 = i64toi32_i32$1;
    $4$hi = i64toi32_i32$4;
    $39_1 = i64toi32_i32$1;
    $39$hi = i64toi32_i32$4;
    i64toi32_i32$5 = i64toi32_i32$1;
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = 30;
    i64toi32_i32$2 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$0 = 0;
      $123 = i64toi32_i32$4 >>> i64toi32_i32$2;
    } else {
      i64toi32_i32$0 = i64toi32_i32$4 >>> i64toi32_i32$2;
      $123 = (((1 << i64toi32_i32$2) - 1) & i64toi32_i32$4) << (32 - i64toi32_i32$2) | (i64toi32_i32$5 >>> i64toi32_i32$2);
    }
    $41$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $39$hi;
    i64toi32_i32$4 = $39_1;
    i64toi32_i32$5 = $41$hi;
    i64toi32_i32$3 = $123;
    i64toi32_i32$5 = i64toi32_i32$0 ^ i64toi32_i32$5;
    $134 = i64toi32_i32$4 ^ i64toi32_i32$3;
    i64toi32_i32$4 = -1084733587;
    i64toi32_i32$4 = __wasm_i64_mul($134, i64toi32_i32$5, 484763065, i64toi32_i32$4);
    i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
    $4_1 = i64toi32_i32$4;
    $4$hi = i64toi32_i32$5;
    $44_1 = i64toi32_i32$4;
    $44$hi = i64toi32_i32$5;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$4 = 0;
    i64toi32_i32$3 = 27;
    i64toi32_i32$2 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$4 = 0;
      $124 = i64toi32_i32$5 >>> i64toi32_i32$2;
    } else {
      i64toi32_i32$4 = i64toi32_i32$5 >>> i64toi32_i32$2;
      $124 = (((1 << i64toi32_i32$2) - 1) & i64toi32_i32$5) << (32 - i64toi32_i32$2) | (i64toi32_i32$0 >>> i64toi32_i32$2);
    }
    $46$hi = i64toi32_i32$4;
    i64toi32_i32$4 = $44$hi;
    i64toi32_i32$5 = $44_1;
    i64toi32_i32$0 = $46$hi;
    i64toi32_i32$3 = $124;
    i64toi32_i32$0 = i64toi32_i32$4 ^ i64toi32_i32$0;
    $135 = i64toi32_i32$5 ^ i64toi32_i32$3;
    i64toi32_i32$5 = -1798288965;
    i64toi32_i32$5 = __wasm_i64_mul($135, i64toi32_i32$0, 321982955, i64toi32_i32$5);
    i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
    $4_1 = i64toi32_i32$5;
    $4$hi = i64toi32_i32$0;
    $49_1 = i64toi32_i32$5;
    $49$hi = i64toi32_i32$0;
    i64toi32_i32$4 = i64toi32_i32$5;
    i64toi32_i32$5 = 0;
    i64toi32_i32$3 = 31;
    i64toi32_i32$2 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$5 = 0;
      $125 = i64toi32_i32$0 >>> i64toi32_i32$2;
    } else {
      i64toi32_i32$5 = i64toi32_i32$0 >>> i64toi32_i32$2;
      $125 = (((1 << i64toi32_i32$2) - 1) & i64toi32_i32$0) << (32 - i64toi32_i32$2) | (i64toi32_i32$4 >>> i64toi32_i32$2);
    }
    $51$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $49$hi;
    i64toi32_i32$0 = $49_1;
    i64toi32_i32$4 = $51$hi;
    i64toi32_i32$3 = $125;
    i64toi32_i32$4 = i64toi32_i32$5 ^ i64toi32_i32$4;
    $6_1 = i64toi32_i32$0 ^ i64toi32_i32$3;
    $6$hi = i64toi32_i32$4;
    i64toi32_i32$5 = $6_1;
    i64toi32_i32$0 = 0xff;
    i64toi32_i32$3 = 0;
    i64toi32_i32$0 = i64toi32_i32$4 & i64toi32_i32$0;
    $10_1 = i64toi32_i32$5 & i64toi32_i32$3;
    $10$hi = i64toi32_i32$0;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$4 = i64toi32_i32$5;
    i64toi32_i32$5 = 0;
    i64toi32_i32$3 = -16777216;
    i64toi32_i32$5 = i64toi32_i32$0 & i64toi32_i32$5;
    $11_1 = i64toi32_i32$4 & i64toi32_i32$3;
    $11$hi = i64toi32_i32$5;
    i64toi32_i32$5 = i64toi32_i32$0;
    i64toi32_i32$5 = i64toi32_i32$0;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$4 = 0;
    i64toi32_i32$3 = 0xff0000;
    i64toi32_i32$4 = i64toi32_i32$5 & i64toi32_i32$4;
    $12_1 = i64toi32_i32$0 & i64toi32_i32$3;
    $12$hi = i64toi32_i32$4;
    i64toi32_i32$4 = i64toi32_i32$5;
    i64toi32_i32$5 = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = 0xff00;
    i64toi32_i32$0 = i64toi32_i32$4 & i64toi32_i32$0;
    $13_1 = i64toi32_i32$5 & i64toi32_i32$3;
    $13$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $1$hi;
    i64toi32_i32$4 = $1_1;
    i64toi32_i32$5 = 1013904242;
    i64toi32_i32$3 = -23791574;
    i64toi32_i32$2 = i64toi32_i32$4 + i64toi32_i32$3;
    i64toi32_i32$1 = i64toi32_i32$0 + i64toi32_i32$5;
    if(i64toi32_i32$2 >>> 0 < i64toi32_i32$3 >>> 0) {
      i64toi32_i32$1 = i64toi32_i32$1 + 1
    }
    $5_1 = i64toi32_i32$2;
    $5$hi = i64toi32_i32$1;
    $63_1 = i64toi32_i32$2;
    $63$hi = i64toi32_i32$1;
    i64toi32_i32$0 = i64toi32_i32$2;
    i64toi32_i32$4 = 0;
    i64toi32_i32$3 = 30;
    i64toi32_i32$5 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$4 = 0;
      $126 = i64toi32_i32$1 >>> i64toi32_i32$5;
    } else {
      i64toi32_i32$4 = i64toi32_i32$1 >>> i64toi32_i32$5;
      $126 = (((1 << i64toi32_i32$5) - 1) & i64toi32_i32$1) << (32 - i64toi32_i32$5) | (i64toi32_i32$0 >>> i64toi32_i32$5);
    }
    $65$hi = i64toi32_i32$4;
    i64toi32_i32$4 = $63$hi;
    i64toi32_i32$1 = $63_1;
    i64toi32_i32$0 = $65$hi;
    i64toi32_i32$3 = $126;
    i64toi32_i32$0 = i64toi32_i32$4 ^ i64toi32_i32$0;
    $136 = i64toi32_i32$1 ^ i64toi32_i32$3;
    i64toi32_i32$1 = -1084733587;
    i64toi32_i32$1 = __wasm_i64_mul($136, i64toi32_i32$0, 484763065, i64toi32_i32$1);
    i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
    $5_1 = i64toi32_i32$1;
    $5$hi = i64toi32_i32$0;
    $68_1 = i64toi32_i32$1;
    $68$hi = i64toi32_i32$0;
    i64toi32_i32$4 = i64toi32_i32$1;
    i64toi32_i32$1 = 0;
    i64toi32_i32$3 = 27;
    i64toi32_i32$5 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$1 = 0;
      $127 = i64toi32_i32$0 >>> i64toi32_i32$5;
    } else {
      i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$5;
      $127 = (((1 << i64toi32_i32$5) - 1) & i64toi32_i32$0) << (32 - i64toi32_i32$5) | (i64toi32_i32$4 >>> i64toi32_i32$5);
    }
    $70$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $68$hi;
    i64toi32_i32$0 = $68_1;
    i64toi32_i32$4 = $70$hi;
    i64toi32_i32$3 = $127;
    i64toi32_i32$4 = i64toi32_i32$1 ^ i64toi32_i32$4;
    $137 = i64toi32_i32$0 ^ i64toi32_i32$3;
    i64toi32_i32$0 = -1798288965;
    i64toi32_i32$0 = __wasm_i64_mul($137, i64toi32_i32$4, 321982955, i64toi32_i32$0);
    i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
    $5_1 = i64toi32_i32$0;
    $5$hi = i64toi32_i32$4;
    $73_1 = i64toi32_i32$0;
    $73$hi = i64toi32_i32$4;
    i64toi32_i32$1 = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = 31;
    i64toi32_i32$5 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$0 = 0;
      $128 = i64toi32_i32$4 >>> i64toi32_i32$5;
    } else {
      i64toi32_i32$0 = i64toi32_i32$4 >>> i64toi32_i32$5;
      $128 = (((1 << i64toi32_i32$5) - 1) & i64toi32_i32$4) << (32 - i64toi32_i32$5) | (i64toi32_i32$1 >>> i64toi32_i32$5);
    }
    $75$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $73$hi;
    i64toi32_i32$4 = $73_1;
    i64toi32_i32$1 = $75$hi;
    i64toi32_i32$3 = $128;
    i64toi32_i32$1 = i64toi32_i32$0 ^ i64toi32_i32$1;
    $7_1 = i64toi32_i32$4 ^ i64toi32_i32$3;
    $7$hi = i64toi32_i32$1;
    i64toi32_i32$0 = $7_1;
    i64toi32_i32$4 = 0xff;
    i64toi32_i32$3 = 0;
    i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
    $14_1 = i64toi32_i32$0 & i64toi32_i32$3;
    $14$hi = i64toi32_i32$4;
    i64toi32_i32$4 = i64toi32_i32$1;
    i64toi32_i32$4 = i64toi32_i32$1;
    i64toi32_i32$1 = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = -16777216;
    i64toi32_i32$0 = i64toi32_i32$4 & i64toi32_i32$0;
    $15_1 = i64toi32_i32$1 & i64toi32_i32$3;
    $15$hi = i64toi32_i32$0;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$4 = i64toi32_i32$1;
    i64toi32_i32$1 = 0;
    i64toi32_i32$3 = 0xff0000;
    i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$1;
    $16_1 = i64toi32_i32$4 & i64toi32_i32$3;
    $16$hi = i64toi32_i32$1;
    i64toi32_i32$1 = i64toi32_i32$0;
    i64toi32_i32$0 = i64toi32_i32$4;
    i64toi32_i32$4 = 0;
    i64toi32_i32$3 = 0xff00;
    i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
    $17_1 = i64toi32_i32$0 & i64toi32_i32$3;
    $17$hi = i64toi32_i32$4;
    label$1: {
      label$2: {
        label$3: {
          i64toi32_i32$4 = $1$hi;
          i64toi32_i32$1 = $1_1;
          i64toi32_i32$0 = 1640531526;
          i64toi32_i32$3 = -2135587861;
          i64toi32_i32$5 = i64toi32_i32$1 - i64toi32_i32$3;
          i64toi32_i32$6 = i64toi32_i32$1 >>> 0 < i64toi32_i32$3 >>> 0;
          i64toi32_i32$2 = i64toi32_i32$6 + i64toi32_i32$0;
          i64toi32_i32$2 = i64toi32_i32$4 - i64toi32_i32$2;
          $1_1 = i64toi32_i32$5;
          $1$hi = i64toi32_i32$2;
          $87 = i64toi32_i32$5;
          $87$hi = i64toi32_i32$2;
          i64toi32_i32$4 = i64toi32_i32$5;
          i64toi32_i32$1 = 0;
          i64toi32_i32$3 = 30;
          i64toi32_i32$0 = i64toi32_i32$3 & 31;
          if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
            i64toi32_i32$1 = 0;
            $129 = i64toi32_i32$2 >>> i64toi32_i32$0;
          } else {
            i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$0;
            $129 = (((1 << i64toi32_i32$0) - 1) & i64toi32_i32$2) << (32 - i64toi32_i32$0) | (i64toi32_i32$4 >>> i64toi32_i32$0);
          }
          $89$hi = i64toi32_i32$1;
          i64toi32_i32$1 = $87$hi;
          i64toi32_i32$2 = $87;
          i64toi32_i32$4 = $89$hi;
          i64toi32_i32$3 = $129;
          i64toi32_i32$4 = i64toi32_i32$1 ^ i64toi32_i32$4;
          $138 = i64toi32_i32$2 ^ i64toi32_i32$3;
          i64toi32_i32$2 = -1084733587;
          i64toi32_i32$2 = __wasm_i64_mul($138, i64toi32_i32$4, 484763065, i64toi32_i32$2);
          i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
          $1_1 = i64toi32_i32$2;
          $1$hi = i64toi32_i32$4;
          $92 = i64toi32_i32$2;
          $92$hi = i64toi32_i32$4;
          i64toi32_i32$1 = i64toi32_i32$2;
          i64toi32_i32$2 = 0;
          i64toi32_i32$3 = 27;
          i64toi32_i32$0 = i64toi32_i32$3 & 31;
          if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
            i64toi32_i32$2 = 0;
            $130 = i64toi32_i32$4 >>> i64toi32_i32$0;
          } else {
            i64toi32_i32$2 = i64toi32_i32$4 >>> i64toi32_i32$0;
            $130 = (((1 << i64toi32_i32$0) - 1) & i64toi32_i32$4) << (32 - i64toi32_i32$0) | (i64toi32_i32$1 >>> i64toi32_i32$0);
          }
          $94$hi = i64toi32_i32$2;
          i64toi32_i32$2 = $92$hi;
          i64toi32_i32$4 = $92;
          i64toi32_i32$1 = $94$hi;
          i64toi32_i32$3 = $130;
          i64toi32_i32$1 = i64toi32_i32$2 ^ i64toi32_i32$1;
          $139 = i64toi32_i32$4 ^ i64toi32_i32$3;
          i64toi32_i32$4 = -1798288965;
          i64toi32_i32$4 = __wasm_i64_mul($139, i64toi32_i32$1, 321982955, i64toi32_i32$4);
          i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
          $1_1 = i64toi32_i32$4;
          $1$hi = i64toi32_i32$1;
          $97 = i64toi32_i32$4;
          $97$hi = i64toi32_i32$1;
          i64toi32_i32$2 = i64toi32_i32$4;
          i64toi32_i32$4 = 0;
          i64toi32_i32$3 = 31;
          i64toi32_i32$0 = i64toi32_i32$3 & 31;
          if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
            i64toi32_i32$4 = 0;
            $131 = i64toi32_i32$1 >>> i64toi32_i32$0;
          } else {
            i64toi32_i32$4 = i64toi32_i32$1 >>> i64toi32_i32$0;
            $131 = (((1 << i64toi32_i32$0) - 1) & i64toi32_i32$1) << (32 - i64toi32_i32$0) | (i64toi32_i32$2 >>> i64toi32_i32$0);
          }
          $99$hi = i64toi32_i32$4;
          i64toi32_i32$4 = $97$hi;
          i64toi32_i32$1 = $97;
          i64toi32_i32$2 = $99$hi;
          i64toi32_i32$3 = $131;
          i64toi32_i32$2 = i64toi32_i32$4 ^ i64toi32_i32$2;
          $8_1 = i64toi32_i32$1 ^ i64toi32_i32$3;
          $8$hi = i64toi32_i32$2;
          i64toi32_i32$4 = $8_1;
          i64toi32_i32$1 = 0xff;
          i64toi32_i32$3 = -1;
          i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1;
          i64toi32_i32$2 = i64toi32_i32$4 & i64toi32_i32$3;
          i64toi32_i32$4 = 0;
          i64toi32_i32$3 = 0;
          if((i64toi32_i32$2) != (i64toi32_i32$3) | (i64toi32_i32$1) != (i64toi32_i32$4)) {
            break label$3
          }
          i64toi32_i32$2 = $1$hi;
          i64toi32_i32$3 = $1_1;
          i64toi32_i32$1 = 0xff00;
          i64toi32_i32$4 = 0;
          i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1;
          i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$4;
          i64toi32_i32$3 = 0;
          i64toi32_i32$4 = 0;
          if((i64toi32_i32$2) != (i64toi32_i32$4) | (i64toi32_i32$1) != (i64toi32_i32$3)) {
            break label$3
          }
          i64toi32_i32$2 = $1$hi;
          i64toi32_i32$4 = $1_1;
          i64toi32_i32$1 = 0xff0000;
          i64toi32_i32$3 = 0;
          i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1;
          i64toi32_i32$2 = i64toi32_i32$4 & i64toi32_i32$3;
          i64toi32_i32$4 = 0;
          i64toi32_i32$3 = 0;
          if((i64toi32_i32$2) != (i64toi32_i32$3) | (i64toi32_i32$1) != (i64toi32_i32$4)) {
            break label$3
          }
          i64toi32_i32$2 = $1$hi;
          i64toi32_i32$3 = $1_1;
          i64toi32_i32$1 = 16777215;
          i64toi32_i32$4 = -1;
          if(i64toi32_i32$2 >>> 0 > i64toi32_i32$1 >>> 0 | ((i64toi32_i32$2) == (i64toi32_i32$1) & i64toi32_i32$3 >>> 0 > i64toi32_i32$4 >>> 0)) {
            break label$3
          }
          i64toi32_i32$3 = $7$hi;
          if($7_1 & 0xff) {
            break label$3
          }
          i64toi32_i32$3 = $17$hi;
          i64toi32_i32$4 = $17_1;
          i64toi32_i32$2 = 0;
          i64toi32_i32$1 = 0;
          if((i64toi32_i32$4) != (i64toi32_i32$1) | (i64toi32_i32$3) != (i64toi32_i32$2)) {
            break label$3
          }
          i64toi32_i32$4 = $16$hi;
          i64toi32_i32$1 = $16_1;
          i64toi32_i32$3 = 0;
          i64toi32_i32$2 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$2) | (i64toi32_i32$4) != (i64toi32_i32$3)) {
            break label$3
          }
          i64toi32_i32$1 = $15$hi;
          i64toi32_i32$2 = $15_1;
          i64toi32_i32$4 = 0;
          i64toi32_i32$3 = 0;
          if((i64toi32_i32$2) != (i64toi32_i32$3) | (i64toi32_i32$1) != (i64toi32_i32$4)) {
            break label$3
          }
          i64toi32_i32$2 = $14$hi;
          i64toi32_i32$3 = $14_1;
          i64toi32_i32$1 = 0;
          i64toi32_i32$4 = 0;
          if((i64toi32_i32$3) != (i64toi32_i32$4) | (i64toi32_i32$2) != (i64toi32_i32$1)) {
            break label$3
          }
          i64toi32_i32$3 = $5$hi;
          i64toi32_i32$4 = $5_1;
          i64toi32_i32$2 = 0xff00;
          i64toi32_i32$1 = 0;
          i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$2;
          i64toi32_i32$3 = i64toi32_i32$4 & i64toi32_i32$1;
          i64toi32_i32$4 = 0;
          i64toi32_i32$1 = 0;
          if((i64toi32_i32$3) != (i64toi32_i32$1) | (i64toi32_i32$2) != (i64toi32_i32$4)) {
            break label$3
          }
          i64toi32_i32$3 = $5$hi;
          i64toi32_i32$1 = $5_1;
          i64toi32_i32$2 = 0xff0000;
          i64toi32_i32$4 = 0;
          i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$2;
          i64toi32_i32$3 = i64toi32_i32$1 & i64toi32_i32$4;
          i64toi32_i32$1 = 0;
          i64toi32_i32$4 = 0;
          if((i64toi32_i32$3) != (i64toi32_i32$4) | (i64toi32_i32$2) != (i64toi32_i32$1)) {
            break label$3
          }
          i64toi32_i32$3 = $5$hi;
          i64toi32_i32$4 = $5_1;
          i64toi32_i32$2 = 16777215;
          i64toi32_i32$1 = -1;
          if(i64toi32_i32$3 >>> 0 > i64toi32_i32$2 >>> 0 | ((i64toi32_i32$3) == (i64toi32_i32$2) & i64toi32_i32$4 >>> 0 > i64toi32_i32$1 >>> 0)) {
            break label$3
          }
          i64toi32_i32$4 = $6$hi;
          if($6_1 & 0xff) {
            break label$3
          }
          i64toi32_i32$4 = $13$hi;
          i64toi32_i32$1 = $13_1;
          i64toi32_i32$3 = 0;
          i64toi32_i32$2 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$2) | (i64toi32_i32$4) != (i64toi32_i32$3)) {
            break label$3
          }
          i64toi32_i32$1 = $12$hi;
          i64toi32_i32$2 = $12_1;
          i64toi32_i32$4 = 0;
          i64toi32_i32$3 = 0;
          if((i64toi32_i32$2) != (i64toi32_i32$3) | (i64toi32_i32$1) != (i64toi32_i32$4)) {
            break label$3
          }
          i64toi32_i32$2 = $11$hi;
          i64toi32_i32$3 = $11_1;
          i64toi32_i32$1 = 0;
          i64toi32_i32$4 = 0;
          if((i64toi32_i32$3) != (i64toi32_i32$4) | (i64toi32_i32$2) != (i64toi32_i32$1)) {
            break label$3
          }
          i64toi32_i32$3 = $10$hi;
          i64toi32_i32$4 = $10_1;
          i64toi32_i32$2 = 0;
          i64toi32_i32$1 = 0;
          if((i64toi32_i32$4) != (i64toi32_i32$1) | (i64toi32_i32$3) != (i64toi32_i32$2)) {
            break label$3
          }
          i64toi32_i32$4 = $4$hi;
          i64toi32_i32$1 = $4_1;
          i64toi32_i32$3 = 0xff00;
          i64toi32_i32$2 = 0;
          i64toi32_i32$3 = i64toi32_i32$4 & i64toi32_i32$3;
          i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$2;
          i64toi32_i32$1 = 0;
          i64toi32_i32$2 = 0;
          if((i64toi32_i32$4) != (i64toi32_i32$2) | (i64toi32_i32$3) != (i64toi32_i32$1)) {
            break label$3
          }
          i64toi32_i32$4 = $4$hi;
          i64toi32_i32$2 = $4_1;
          i64toi32_i32$3 = 0xff0000;
          i64toi32_i32$1 = 0;
          i64toi32_i32$3 = i64toi32_i32$4 & i64toi32_i32$3;
          i64toi32_i32$4 = i64toi32_i32$2 & i64toi32_i32$1;
          i64toi32_i32$2 = 0;
          i64toi32_i32$1 = 0;
          if((i64toi32_i32$4) != (i64toi32_i32$1) | (i64toi32_i32$3) != (i64toi32_i32$2)) {
            break label$3
          }
          i64toi32_i32$4 = $4$hi;
          i64toi32_i32$1 = $4_1;
          i64toi32_i32$3 = 16777215;
          i64toi32_i32$2 = -1;
          if(i64toi32_i32$4 >>> 0 > i64toi32_i32$3 >>> 0 | ((i64toi32_i32$4) == (i64toi32_i32$3) & i64toi32_i32$1 >>> 0 > i64toi32_i32$2 >>> 0)) {
            break label$3
          }
          i64toi32_i32$1 = $3$hi;
          if($3_1 & 0xff) {
            break label$3
          }
          i64toi32_i32$1 = $3$hi;
          i64toi32_i32$2 = $3_1;
          i64toi32_i32$4 = 0;
          i64toi32_i32$3 = 0xff00;
          i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
          i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$3;
          i64toi32_i32$2 = 0;
          i64toi32_i32$3 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$3) | (i64toi32_i32$4) != (i64toi32_i32$2)) {
            break label$3
          }
          i64toi32_i32$1 = $3$hi;
          i64toi32_i32$3 = $3_1;
          i64toi32_i32$4 = 0;
          i64toi32_i32$2 = 0xff0000;
          i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
          i64toi32_i32$1 = i64toi32_i32$3 & i64toi32_i32$2;
          i64toi32_i32$3 = 0;
          i64toi32_i32$2 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$2) | (i64toi32_i32$4) != (i64toi32_i32$3)) {
            break label$3
          }
          i64toi32_i32$1 = $3$hi;
          i64toi32_i32$2 = $3_1;
          i64toi32_i32$4 = 0;
          i64toi32_i32$3 = -16777216;
          i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
          i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$3;
          i64toi32_i32$2 = 0;
          i64toi32_i32$3 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$3) | (i64toi32_i32$4) != (i64toi32_i32$2)) {
            break label$3
          }
          i64toi32_i32$1 = $3$hi;
          i64toi32_i32$3 = $3_1;
          i64toi32_i32$4 = 0xff;
          i64toi32_i32$2 = 0;
          i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
          i64toi32_i32$1 = i64toi32_i32$3 & i64toi32_i32$2;
          i64toi32_i32$3 = 0;
          i64toi32_i32$2 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$2) | (i64toi32_i32$4) != (i64toi32_i32$3)) {
            break label$3
          }
          i64toi32_i32$1 = $9$hi;
          i64toi32_i32$2 = $9_1;
          i64toi32_i32$4 = 0xff00;
          i64toi32_i32$3 = 0;
          i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
          i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$3;
          i64toi32_i32$2 = 0;
          i64toi32_i32$3 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$3) | (i64toi32_i32$4) != (i64toi32_i32$2)) {
            break label$3
          }
          i64toi32_i32$1 = $9$hi;
          i64toi32_i32$3 = $9_1;
          i64toi32_i32$4 = 0xff0000;
          i64toi32_i32$2 = 0;
          i64toi32_i32$4 = i64toi32_i32$1 & i64toi32_i32$4;
          i64toi32_i32$1 = i64toi32_i32$3 & i64toi32_i32$2;
          i64toi32_i32$3 = 0;
          i64toi32_i32$2 = 0;
          if((i64toi32_i32$1) != (i64toi32_i32$2) | (i64toi32_i32$4) != (i64toi32_i32$3)) {
            break label$3
          }
          i64toi32_i32$1 = $9$hi;
          i64toi32_i32$2 = $9_1;
          i64toi32_i32$4 = 16777216;
          i64toi32_i32$3 = 0;
          if(i64toi32_i32$1 >>> 0 < i64toi32_i32$4 >>> 0 | ((i64toi32_i32$1) == (i64toi32_i32$4) & i64toi32_i32$2 >>> 0 < i64toi32_i32$3 >>> 0)) {
            break label$2
          }
        }
        i64toi32_i32$2 = $3$hi;
        i64toi32_i32$1 = $2_1;
        HEAP32[(i64toi32_i32$1 + 24) >> 2] = $3_1;
        HEAP32[(i64toi32_i32$1 + 28) >> 2] = i64toi32_i32$2;
        i64toi32_i32$2 = $6$hi;
        i64toi32_i32$3 = $6_1;
        i64toi32_i32$1 = 0;
        i64toi32_i32$4 = 0xff;
        i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1;
        $177 = i64toi32_i32$3 & i64toi32_i32$4;
        $177$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $4$hi;
        i64toi32_i32$2 = $4_1;
        i64toi32_i32$3 = -256;
        i64toi32_i32$4 = 0;
        i64toi32_i32$3 = i64toi32_i32$1 & i64toi32_i32$3;
        $179$hi = i64toi32_i32$3;
        i64toi32_i32$3 = $10$hi;
        i64toi32_i32$3 = $179$hi;
        i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$4;
        i64toi32_i32$2 = $10$hi;
        i64toi32_i32$4 = $10_1;
        i64toi32_i32$2 = i64toi32_i32$3 | i64toi32_i32$2;
        $181$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $11$hi;
        i64toi32_i32$2 = $181$hi;
        i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$4;
        i64toi32_i32$1 = $11$hi;
        i64toi32_i32$4 = $11_1;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1;
        $183$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $12$hi;
        i64toi32_i32$1 = $183$hi;
        i64toi32_i32$2 = i64toi32_i32$3 | i64toi32_i32$4;
        i64toi32_i32$3 = $12$hi;
        i64toi32_i32$4 = $12_1;
        i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$3;
        $185$hi = i64toi32_i32$3;
        i64toi32_i32$3 = $13$hi;
        i64toi32_i32$3 = $185$hi;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$4;
        i64toi32_i32$2 = $13$hi;
        i64toi32_i32$4 = $13_1;
        i64toi32_i32$2 = i64toi32_i32$3 | i64toi32_i32$2;
        $187 = i64toi32_i32$1 | i64toi32_i32$4;
        $187$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $177$hi;
        i64toi32_i32$3 = $177;
        i64toi32_i32$1 = $187$hi;
        i64toi32_i32$4 = $187;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1;
        $188 = i64toi32_i32$3 | i64toi32_i32$4;
        i64toi32_i32$3 = $2_1;
        HEAP32[(i64toi32_i32$3 + 16) >> 2] = $188;
        HEAP32[(i64toi32_i32$3 + 20) >> 2] = i64toi32_i32$1;
        i64toi32_i32$1 = $7$hi;
        i64toi32_i32$2 = $7_1;
        i64toi32_i32$3 = 0;
        i64toi32_i32$4 = 0xff;
        i64toi32_i32$3 = i64toi32_i32$1 & i64toi32_i32$3;
        $191 = i64toi32_i32$2 & i64toi32_i32$4;
        $191$hi = i64toi32_i32$3;
        i64toi32_i32$3 = $5$hi;
        i64toi32_i32$1 = $5_1;
        i64toi32_i32$2 = -256;
        i64toi32_i32$4 = 0;
        i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$2;
        $193$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $14$hi;
        i64toi32_i32$2 = $193$hi;
        i64toi32_i32$3 = i64toi32_i32$1 & i64toi32_i32$4;
        i64toi32_i32$1 = $14$hi;
        i64toi32_i32$4 = $14_1;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1;
        $195$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $15$hi;
        i64toi32_i32$1 = $195$hi;
        i64toi32_i32$2 = i64toi32_i32$3 | i64toi32_i32$4;
        i64toi32_i32$3 = $15$hi;
        i64toi32_i32$4 = $15_1;
        i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$3;
        $197$hi = i64toi32_i32$3;
        i64toi32_i32$3 = $16$hi;
        i64toi32_i32$3 = $197$hi;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$4;
        i64toi32_i32$2 = $16$hi;
        i64toi32_i32$4 = $16_1;
        i64toi32_i32$2 = i64toi32_i32$3 | i64toi32_i32$2;
        $199$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $17$hi;
        i64toi32_i32$2 = $199$hi;
        i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$4;
        i64toi32_i32$1 = $17$hi;
        i64toi32_i32$4 = $17_1;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1;
        $201 = i64toi32_i32$3 | i64toi32_i32$4;
        $201$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $191$hi;
        i64toi32_i32$2 = $191;
        i64toi32_i32$3 = $201$hi;
        i64toi32_i32$4 = $201;
        i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$3;
        $202 = i64toi32_i32$2 | i64toi32_i32$4;
        i64toi32_i32$2 = $2_1;
        HEAP32[(i64toi32_i32$2 + 8) >> 2] = $202;
        HEAP32[(i64toi32_i32$2 + 12) >> 2] = i64toi32_i32$3;
        i64toi32_i32$3 = $8$hi;
        i64toi32_i32$1 = $8_1;
        i64toi32_i32$2 = 0;
        i64toi32_i32$4 = 0xff;
        i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$2;
        $205 = i64toi32_i32$1 & i64toi32_i32$4;
        $205$hi = i64toi32_i32$2;
        i64toi32_i32$2 = i64toi32_i32$3;
        i64toi32_i32$3 = i64toi32_i32$1;
        i64toi32_i32$1 = 0;
        i64toi32_i32$4 = 0xff00;
        i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1;
        $207 = i64toi32_i32$3 & i64toi32_i32$4;
        $207$hi = i64toi32_i32$1;
        i64toi32_i32$1 = i64toi32_i32$2;
        i64toi32_i32$2 = i64toi32_i32$3;
        i64toi32_i32$3 = 0;
        i64toi32_i32$4 = 0xff0000;
        i64toi32_i32$3 = i64toi32_i32$1 & i64toi32_i32$3;
        $209 = i64toi32_i32$2 & i64toi32_i32$4;
        $209$hi = i64toi32_i32$3;
        i64toi32_i32$3 = i64toi32_i32$1;
        i64toi32_i32$3 = i64toi32_i32$1;
        i64toi32_i32$1 = i64toi32_i32$2;
        i64toi32_i32$2 = 0;
        i64toi32_i32$4 = -16777216;
        i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$2;
        $211 = i64toi32_i32$1 & i64toi32_i32$4;
        $211$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $1$hi;
        i64toi32_i32$3 = $1_1;
        i64toi32_i32$1 = -256;
        i64toi32_i32$4 = 0;
        i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1;
        $213 = i64toi32_i32$3 & i64toi32_i32$4;
        $213$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $8$hi;
        i64toi32_i32$2 = $8_1;
        i64toi32_i32$3 = 0xff;
        i64toi32_i32$4 = 0;
        i64toi32_i32$3 = i64toi32_i32$1 & i64toi32_i32$3;
        $215 = i64toi32_i32$2 & i64toi32_i32$4;
        $215$hi = i64toi32_i32$3;
        i64toi32_i32$3 = $213$hi;
        i64toi32_i32$1 = $213;
        i64toi32_i32$2 = $215$hi;
        i64toi32_i32$4 = $215;
        i64toi32_i32$2 = i64toi32_i32$3 | i64toi32_i32$2;
        $216 = i64toi32_i32$1 | i64toi32_i32$4;
        $216$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $211$hi;
        i64toi32_i32$3 = $211;
        i64toi32_i32$1 = $216$hi;
        i64toi32_i32$4 = $216;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1;
        $217 = i64toi32_i32$3 | i64toi32_i32$4;
        $217$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $209$hi;
        i64toi32_i32$2 = $209;
        i64toi32_i32$3 = $217$hi;
        i64toi32_i32$4 = $217;
        i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$3;
        $218 = i64toi32_i32$2 | i64toi32_i32$4;
        $218$hi = i64toi32_i32$3;
        i64toi32_i32$3 = $207$hi;
        i64toi32_i32$1 = $207;
        i64toi32_i32$2 = $218$hi;
        i64toi32_i32$4 = $218;
        i64toi32_i32$2 = i64toi32_i32$3 | i64toi32_i32$2;
        $219 = i64toi32_i32$1 | i64toi32_i32$4;
        $219$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $205$hi;
        i64toi32_i32$3 = $205;
        i64toi32_i32$1 = $219$hi;
        i64toi32_i32$4 = $219;
        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1;
        $220 = i64toi32_i32$3 | i64toi32_i32$4;
        i64toi32_i32$3 = $2_1;
        HEAP32[i64toi32_i32$3 >> 2] = $220;
        HEAP32[(i64toi32_i32$3 + 4) >> 2] = i64toi32_i32$1;
        break label$1;
      }
      i64toi32_i32$1 = 0;
      rand($2_1, 0, i64toi32_i32$1);
    }
    memcpy($0_1, $2_1, 32);
    global$0 = $2_1 + 32;
  }

  function __free($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $32_1 = 0;
    $7_1 = global$0 - 16;
    global$0 = $7_1;
    label$1: {
      if(!$0_1) {
        break label$1
      }
      if(!$1_1) {
        break label$1
      }
      label$2: {
        if($2_1 >>> 0 >= 5 >>> 0) {
          break label$2
        }
        $2_1 = (($1_1 + 3) >>> 2) - 1;
        if($2_1 >>> 0 > 0xff >>> 0) {
          break label$2
        }
        HEAP32[$0_1 >> 2] = 0;
        $1_1 = $0_1 - 8;
        HEAP32[$1_1 >> 2] = (HEAP32[$1_1 >> 2]) & -2;
        HEAP32[($7_1 + 12) >> 2] = 1053184;
        $32_1 = $0_1;
        $0_1 = ($2_1 << 2) + 1053188;
        HEAP32[$32_1 >> 2] = HEAP32[$0_1 >> 2];
        HEAP32[$0_1 >> 2] = $1_1;
        break label$1;
      }
      HEAP32[$0_1 >> 2] = 0;
      $4_1 = $0_1 - 8;
      $3_1 = HEAP32[$4_1 >> 2];
      HEAP32[$4_1 >> 2] = $3_1 & -2;
      $8_1 = HEAP32[1053184 >> 2];
      label$3: {
        label$4: {
          label$5: {
            $6_1 = $0_1 - 4;
            $1_1 = (HEAP32[$6_1 >> 2]) & -4;
            if(!$1_1) {
              break label$5
            }
            $2_1 = HEAP32[$1_1 >> 2];
            if($2_1 & 1) {
              break label$5
            }
            label$6: {
              label$7: {
                $0_1 = $3_1 & -4;
                if(!$0_1) {
                  $5_1 = $1_1;
                  break label$7;
                }
                $5_1 = $1_1;
                $3_1 = $3_1 & 2 ? 0 : $0_1;
                if(!$3_1) {
                  break label$7
                }
                HEAP32[($3_1 + 4) >> 2] = (HEAP32[($3_1 + 4) >> 2]) & 3 | $1_1;
                $0_1 = HEAP32[$6_1 >> 2];
                $5_1 = $0_1 & -4;
                if(!$5_1) {
                  break label$6
                }
                $0_1 = (HEAP32[$4_1 >> 2]) & -4;
                $2_1 = HEAP32[$5_1 >> 2];
              }
              HEAP32[$5_1 >> 2] = $0_1 | ($2_1 & 3);
              $0_1 = HEAP32[$6_1 >> 2];
            }
            HEAP32[$6_1 >> 2] = $0_1 & 3;
            $0_1 = HEAP32[$4_1 >> 2];
            HEAP32[$4_1 >> 2] = $0_1 & 3;
            if(!($0_1 & 2)) {
              break label$4
            }
            HEAP32[$1_1 >> 2] = HEAP32[$1_1 >> 2] | 2;
            break label$4;
          }
          $1_1 = $3_1 & -4;
          if(!$1_1) {
            break label$3
          }
          $1_1 = $3_1 & 2 ? 0 : $1_1;
          if(!$1_1) {
            break label$3
          }
          if((HEAPU8[$1_1 >> 0]) & 1) {
            break label$3
          }
          HEAP32[$0_1 >> 2] = (HEAP32[($1_1 + 8) >> 2]) & -4;
          HEAP32[($1_1 + 8) >> 2] = $4_1 | 1;
        }
        HEAP32[1053184 >> 2] = $8_1;
        break label$1;
      }
      HEAP32[$0_1 >> 2] = $8_1;
      HEAP32[1053184 >> 2] = $4_1;
    }
    global$0 = $7_1 + 16;
  }

  function _malloc_internal($0_1, $1_1, $2_1, $3_1, $4_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    var $5_1 = 0,
      $7_1 = 0,
      $6_1 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $43_1 = 0,
      $12_1 = 0,
      $82 = 0,
      $10_1 = 0,
      $11_1 = 0,
      $67_1 = 0,
      $85 = 0;
    $5_1 = HEAP32[$2_1 >> 2];
    if($5_1) {
      $10_1 = $1_1 - 1;
      $9_1 = $0_1 << 2;
      $11_1 = 0 - $1_1;
      label$2: while(1) {
        $6_1 = $5_1 + 8;
        label$3: {
          $7_1 = HEAP32[($5_1 + 8) >> 2];
          if(!($7_1 & 1)) {
            $1_1 = $5_1;
            break label$3;
          }
          label$5: while(1) {
            HEAP32[$6_1 >> 2] = $7_1 & -2;
            $7_1 = HEAP32[($5_1 + 4) >> 2];
            $6_1 = $7_1 & -4;
            if($6_1) {
              $43_1 = (HEAPU8[$6_1 >> 0]) & 1 ? 0 : $6_1
            } else {
              $43_1 = 0
            }
            $1_1 = $43_1;
            label$8: {
              $8_1 = HEAP32[$5_1 >> 2];
              $12_1 = $8_1 & -4;
              if(!$12_1) {
                break label$8
              }
              $8_1 = $8_1 & 2 ? 0 : $12_1;
              if(!$8_1) {
                break label$8
              }
              HEAP32[($8_1 + 4) >> 2] = (HEAP32[($8_1 + 4) >> 2]) & 3 | $6_1;
              $7_1 = HEAP32[($5_1 + 4) >> 2];
              $6_1 = $7_1 & -4;
            }
            $67_1 = $5_1;
            if($6_1) {
              HEAP32[$6_1 >> 2] = (HEAP32[$6_1 >> 2]) & 3 | ((HEAP32[$5_1 >> 2]) & -4);
              $82 = HEAP32[($5_1 + 4) >> 2];
            } else {
              $82 = $7_1
            }
            HEAP32[($67_1 + 4) >> 2] = $82 & 3;
            $85 = $5_1;
            $5_1 = HEAP32[$5_1 >> 2];
            HEAP32[$85 >> 2] = $5_1 & 3;
            if($5_1 & 2) {
              HEAP32[$1_1 >> 2] = HEAP32[$1_1 >> 2] | 2
            }
            HEAP32[$2_1 >> 2] = $1_1;
            $6_1 = $1_1 + 8;
            $5_1 = $1_1;
            $7_1 = HEAP32[($5_1 + 8) >> 2];
            if($7_1 & 1) {
              continue label$5
            }
            break label$5;
          };
        }
        label$12: {
          $7_1 = (HEAP32[$1_1 >> 2]) & -4;
          $5_1 = $1_1 + 8;
          if(($7_1 - $5_1) >>> 0 < $9_1 >>> 0) {
            break label$12
          }
          label$13: {
            $7_1 = ($7_1 - $9_1) & $11_1;
            if($7_1 >>> 0 < (($5_1 + ((FUNCTION_TABLE[HEAP32[($4_1 + 16) >> 2]]($3_1, $0_1)) << 2)) + 8) >>> 0) {
              if($5_1 & $10_1) {
                break label$12
              }
              HEAP32[$2_1 >> 2] = (HEAP32[$6_1 >> 2]) & -4;
              HEAP32[$1_1 >> 2] = HEAP32[$1_1 >> 2] | 1;
              $5_1 = $1_1;
              break label$13;
            }
            HEAP32[$7_1 >> 2] = 0;
            $5_1 = $7_1 - 8;
            HEAP32[$5_1 >> 2] = 0;
            HEAP32[($5_1 + 4) >> 2] = 0;
            HEAP32[$5_1 >> 2] = (HEAP32[$1_1 >> 2]) & -4;
            label$15: {
              $0_1 = HEAP32[$1_1 >> 2];
              $2_1 = $0_1 & -4;
              if(!$2_1) {
                break label$15
              }
              $0_1 = $0_1 & 2 ? 0 : $2_1;
              if(!$0_1) {
                break label$15
              }
              HEAP32[($0_1 + 4) >> 2] = (HEAP32[($0_1 + 4) >> 2]) & 3 | $5_1;
            }
            HEAP32[($5_1 + 4) >> 2] = (HEAP32[($5_1 + 4) >> 2]) & 3 | $1_1;
            HEAP32[$6_1 >> 2] = (HEAP32[$6_1 >> 2]) & -2;
            $0_1 = HEAP32[$1_1 >> 2];
            $2_1 = $0_1 & 3 | $5_1;
            HEAP32[$1_1 >> 2] = $2_1;
            label$16: {
              if(!($0_1 & 2)) {
                $1_1 = HEAP32[$5_1 >> 2];
                break label$16;
              }
              HEAP32[$1_1 >> 2] = $2_1 & -3;
              $1_1 = HEAP32[$5_1 >> 2] | 2;
              HEAP32[$5_1 >> 2] = $1_1;
            }
            HEAP32[$5_1 >> 2] = $1_1 | 1;
          }
          return $5_1 + 8;
        }
        $5_1 = HEAP32[($1_1 + 8) >> 2];
        HEAP32[$2_1 >> 2] = $5_1;
        if($5_1) {
          continue label$2
        }
        break label$2;
      };
    }
    return 0;
  }

  function $8($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      i64toi32_i32$0 = 0,
      $6_1 = 0,
      i64toi32_i32$1 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $10_1 = 0,
      i64toi32_i32$2 = 0,
      $9_1 = 0,
      $12_1 = 0,
      $11_1 = 0,
      $17_1 = 0,
      $108 = 0,
      wasm2js_i32$0 = 0,
      wasm2js_i32$1 = 0,
      wasm2js_i32$2 = 0;
    $3_1 = global$0 - 48;
    global$0 = $3_1;
    HEAP32[($3_1 + 36) >> 2] = $1_1;
    HEAP8[($3_1 + 40) >> 0] = 3;
    i64toi32_i32$1 = $3_1;
    i64toi32_i32$0 = 32;
    HEAP32[($3_1 + 8) >> 2] = 0;
    HEAP32[($3_1 + 12) >> 2] = i64toi32_i32$0;
    HEAP32[($3_1 + 32) >> 2] = $0_1;
    HEAP32[($3_1 + 24) >> 2] = 0;
    HEAP32[($3_1 + 16) >> 2] = 0;
    label$1: {
      label$2: {
        label$3: {
          $10_1 = HEAP32[($2_1 + 8) >> 2];
          if(!$10_1) {
            $4_1 = HEAP32[($2_1 + 20) >> 2];
            if(!$4_1) {
              break label$3
            }
            $1_1 = HEAP32[$2_1 >> 2];
            $0_1 = HEAP32[($2_1 + 16) >> 2];
            $7_1 = (($4_1 - 1) & 0x1fffffff) + 1;
            $4_1 = $7_1;
            label$5: while(1) {
              $5_1 = HEAP32[($1_1 + 4) >> 2];
              if($5_1) {
                if(FUNCTION_TABLE[HEAP32[((HEAP32[($3_1 + 36) >> 2]) + 12) >> 2]](HEAP32[($3_1 + 32) >> 2], HEAP32[$1_1 >> 2], $5_1)) {
                  break label$2
                }
              }
              if(FUNCTION_TABLE[HEAP32[($0_1 + 4) >> 2]](HEAP32[$0_1 >> 2], $3_1 + 8)) {
                break label$2
              }
              $0_1 = $0_1 + 8;
              $1_1 = $1_1 + 8;
              $4_1 = $4_1 - 1;
              if($4_1) {
                continue label$5
              }
              break label$5;
            };
            break label$3;
          }
          $0_1 = HEAP32[($2_1 + 12) >> 2];
          if(!$0_1) {
            break label$3
          }
          $11_1 = $0_1 << 5;
          $7_1 = (($0_1 - 1) & 134217727) + 1;
          $1_1 = HEAP32[$2_1 >> 2];
          label$7: while(1) {
            $0_1 = HEAP32[($1_1 + 4) >> 2];
            if($0_1) {
              if(FUNCTION_TABLE[HEAP32[((HEAP32[($3_1 + 36) >> 2]) + 12) >> 2]](HEAP32[($3_1 + 32) >> 2], HEAP32[$1_1 >> 2], $0_1)) {
                break label$2
              }
            }
            $5_1 = $4_1 + $10_1;
            HEAP8[($3_1 + 40) >> 0] = HEAPU8[($5_1 + 28) >> 0];
            i64toi32_i32$2 = $5_1 + 4;
            i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
            i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
            $17_1 = i64toi32_i32$0;
            i64toi32_i32$0 = 0;
            i64toi32_i32$0 = __wasm_rotl_i64($17_1, i64toi32_i32$1, 32, i64toi32_i32$0);
            i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
            $108 = i64toi32_i32$0;
            i64toi32_i32$0 = $3_1;
            HEAP32[($3_1 + 8) >> 2] = $108;
            HEAP32[($3_1 + 12) >> 2] = i64toi32_i32$1;
            $6_1 = HEAP32[($5_1 + 24) >> 2];
            $8_1 = HEAP32[($2_1 + 16) >> 2];
            $9_1 = 0;
            $0_1 = 0;
            label$9: {
              label$10: {
                switch((HEAP32[($5_1 + 20) >> 2]) - 1) {
                  case 0:
                    $12_1 = $8_1 + ($6_1 << 3);
                    if((HEAP32[($12_1 + 4) >> 2]) != (37)) {
                      break label$9
                    }
                    $6_1 = HEAP32[(HEAP32[$12_1 >> 2]) >> 2];
                    break;
                  case 1:
                    break label$9;
                  default:
                    break label$10;
                };
              }
              $0_1 = 1;
            }
            HEAP32[($3_1 + 20) >> 2] = $6_1;
            HEAP32[($3_1 + 16) >> 2] = $0_1;
            $0_1 = HEAP32[($5_1 + 16) >> 2];
            label$12: {
              label$13: {
                switch((HEAP32[($5_1 + 12) >> 2]) - 1) {
                  case 0:
                    $6_1 = $8_1 + ($0_1 << 3);
                    if((HEAP32[($6_1 + 4) >> 2]) != (37)) {
                      break label$12
                    }
                    $0_1 = HEAP32[(HEAP32[$6_1 >> 2]) >> 2];
                    break;
                  case 1:
                    break label$12;
                  default:
                    break label$13;
                };
              }
              $9_1 = 1;
            }
            HEAP32[($3_1 + 28) >> 2] = $0_1;
            HEAP32[($3_1 + 24) >> 2] = $9_1;
            $0_1 = $8_1 + ((HEAP32[$5_1 >> 2]) << 3);
            if(FUNCTION_TABLE[HEAP32[($0_1 + 4) >> 2]](HEAP32[$0_1 >> 2], $3_1 + 8)) {
              break label$2
            }
            $1_1 = $1_1 + 8;
            $4_1 = $4_1 + 32;
            if(($11_1) != ($4_1)) {
              continue label$7
            }
            break label$7;
          };
        }
        $0_1 = 0;
        $1_1 = $7_1 >>> 0 < (HEAP32[($2_1 + 4) >> 2]) >>> 0;
        if(!$1_1) {
          break label$1
        }
        $1_1 = (wasm2js_i32$0 = (HEAP32[$2_1 >> 2]) + ($7_1 << 3), wasm2js_i32$1 = 0, wasm2js_i32$2 = $1_1, wasm2js_i32$2 ? wasm2js_i32$0 : wasm2js_i32$1);
        if(!(FUNCTION_TABLE[HEAP32[((HEAP32[($3_1 + 36) >> 2]) + 12) >> 2]](HEAP32[($3_1 + 32) >> 2], HEAP32[$1_1 >> 2], HEAP32[($1_1 + 4) >> 2]))) {
          break label$1
        }
      }
      $0_1 = 1;
    }
    global$0 = $3_1 + 48;
    return $0_1;
  }

  function $9($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$1 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $23_1 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$3 = 0,
      $9_1 = 0,
      $10_1 = 0,
      $10$hi = 0,
      $70_1 = 0;
    $6_1 = global$0 - 16;
    global$0 = $6_1;
    label$1: {
      $7_1 = HEAP32[($1_1 + 24) >> 2];
      $8_1 = HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 16) >> 2];
      $23_1 = 1;
      if(FUNCTION_TABLE[$8_1]($7_1, 39)) {
        break label$1
      }
      $1_1 = 48;
      $2_1 = 2;
      label$2: {
        label$3: {
          label$4: {
            label$5: {
              label$6: {
                label$7: {
                  label$8: {
                    $0_1 = HEAP32[$0_1 >> 2];
                    switch($0_1) {
                      case 0:
                        break label$2;
                      case 1:
                      case 2:
                      case 3:
                      case 4:
                      case 5:
                      case 6:
                      case 7:
                      case 8:
                      case 11:
                      case 12:
                      case 14:
                      case 15:
                      case 16:
                      case 17:
                      case 18:
                      case 19:
                      case 20:
                      case 21:
                      case 22:
                      case 23:
                      case 24:
                      case 25:
                      case 26:
                      case 27:
                      case 28:
                      case 29:
                      case 30:
                      case 31:
                      case 32:
                      case 33:
                      case 34:
                      case 35:
                      case 36:
                      case 37:
                      case 38:
                        break label$3;
                      case 39:
                        break label$4;
                      case 10:
                        break label$5;
                      case 13:
                        break label$6;
                      case 9:
                        break label$7;
                      default:
                        break label$8;
                    };
                  }
                  $1_1 = 92;
                  if(($0_1) == (92)) {
                    break label$2
                  }
                  break label$3;
                }
                $1_1 = 116;
                break label$2;
              }
              $1_1 = 114;
              break label$2;
            }
            $1_1 = 110;
            break label$2;
          }
          $1_1 = 39;
          break label$2;
        }
        $1_1 = $0_1;
        $5_1 = $0_1;
        $0_1 = 0;
        $3_1 = $1_1 << 11;
        $4_1 = 32;
        $2_1 = 32;
        label$9: {
          label$10: while(1) {
            label$11: {
              label$12: {
                $4_1 = ($4_1 >>> 1) + $0_1;
                $9_1 = (HEAP32[(($4_1 << 2) + 1052348) >> 2]) << 11;
                if($9_1 >>> 0 >= $3_1 >>> 0) {
                  if(($3_1) == ($9_1)) {
                    break label$11
                  }
                  $2_1 = $4_1;
                  break label$12;
                }
                $0_1 = $4_1 + 1;
              }
              $4_1 = $2_1 - $0_1;
              if($0_1 >>> 0 < $2_1 >>> 0) {
                continue label$10
              }
              break label$9;
            }
            break label$10;
          };
          $0_1 = $4_1 + 1;
        }
        label$14: {
          label$15: {
            label$16: {
              if($0_1 >>> 0 <= 31 >>> 0) {
                $4_1 = $0_1 << 2;
                $2_1 = 707;
                if(($0_1) != (31)) {
                  $2_1 = (HEAP32[($4_1 + 1052352) >> 2]) >>> 21
                }
                $3_1 = 0;
                $70_1 = $0_1;
                $0_1 = $0_1 - 1;
                if($70_1 >>> 0 >= $0_1 >>> 0) {
                  if($0_1 >>> 0 >= 32 >>> 0) {
                    break label$16
                  }
                  $3_1 = (HEAP32[(($0_1 << 2) + 1052348) >> 2]) & 2097151;
                }
                label$20: {
                  $0_1 = (HEAP32[($4_1 + 1052348) >> 2]) >>> 21;
                  if(!($2_1 + ($0_1 ^ -1))) {
                    break label$20
                  }
                  $5_1 = $5_1 - $3_1;
                  $3_1 = $0_1 >>> 0 > 707 >>> 0 ? $0_1 : 707;
                  $4_1 = $2_1 - 1;
                  $2_1 = 0;
                  label$21: while(1) {
                    if(($0_1) == ($3_1)) {
                      break label$15
                    }
                    $2_1 = $2_1 + (HEAPU8[($0_1 + 1052476) >> 0]);
                    if($5_1 >>> 0 < $2_1 >>> 0) {
                      break label$20
                    }
                    $0_1 = $0_1 + 1;
                    if(($4_1) != ($0_1)) {
                      continue label$21
                    }
                    break label$21;
                  };
                  $0_1 = $4_1;
                }
                $0_1 = $0_1 & 1;
                break label$14;
              }
              $31($0_1, 32, 1052224);
              abort();
            }
            $31($0_1, 32, 1052256);
            abort();
          }
          $31($3_1, 707, 1052240);
          abort();
        }
        if($0_1) {
          i64toi32_i32$0 = 0;
          i64toi32_i32$2 = (Math_clz32($1_1 | 1) >>> 2) ^ 7;
          i64toi32_i32$1 = 5;
          i64toi32_i32$3 = 0;
          i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1;
          $10_1 = i64toi32_i32$2 | i64toi32_i32$3;
          $10$hi = i64toi32_i32$1;
          $2_1 = 3;
          break label$2;
        }
        label$23: {
          label$24: {
            label$25: {
              if($1_1 >>> 0 >= 65536 >>> 0) {
                if($1_1 >>> 0 >= 131072 >>> 0) {
                  break label$25
                }
                if($10($1_1, 1051467, 42, 1051551, 192, 1051743, 438)) {
                  break label$23
                }
                break label$24;
              }
              if(!($10($1_1, 1050796, 40, 1050876, 288, 1051164, 303))) {
                break label$24
              }
              break label$23;
            }
            if($1_1 >>> 0 > 917999 >>> 0) {
              break label$24
            }
            if(($1_1 & 2097150) == (178206)) {
              break label$24
            }
            if(($1_1 & 2097120) == (173792)) {
              break label$24
            }
            if(($1_1 - 177977) >>> 0 < 7 >>> 0) {
              break label$24
            }
            if(($1_1 - 183984) >>> 0 > -15 >>> 0) {
              break label$24
            }
            if(($1_1 - 194560) >>> 0 > -3104 >>> 0) {
              break label$24
            }
            if(($1_1 - 196608) >>> 0 > -1507 >>> 0) {
              break label$24
            }
            if(($1_1 - 917760) >>> 0 < -716213 >>> 0) {
              break label$23
            }
          }
          i64toi32_i32$1 = 0;
          i64toi32_i32$0 = (Math_clz32($1_1 | 1) >>> 2) ^ 7;
          i64toi32_i32$2 = 5;
          i64toi32_i32$3 = 0;
          i64toi32_i32$2 = i64toi32_i32$1 | i64toi32_i32$2;
          $10_1 = i64toi32_i32$0 | i64toi32_i32$3;
          $10$hi = i64toi32_i32$2;
          $2_1 = 3;
          break label$2;
        }
        $2_1 = 1;
      }
      HEAP32[($6_1 + 4) >> 2] = $1_1;
      HEAP32[$6_1 >> 2] = $2_1;
      $0_1 = $6_1 + 8;
      i64toi32_i32$2 = $10$hi;
      i64toi32_i32$0 = $0_1;
      HEAP32[$0_1 >> 2] = $10_1;
      HEAP32[($0_1 + 4) >> 2] = i64toi32_i32$2;
      $3_1 = HEAPU8[($6_1 + 12) >> 0];
      $5_1 = HEAP32[$0_1 >> 2];
      $1_1 = HEAP32[$6_1 >> 2];
      label$27: {
        label$28: {
          $2_1 = HEAP32[($6_1 + 4) >> 2];
          if(($2_1) != (1114112)) {
            label$30: while(1) {
              $4_1 = $1_1;
              $0_1 = 92;
              $1_1 = 1;
              label$31: {
                label$32: {
                  label$33: {
                    switch($4_1 - 1) {
                      case 2:
                        $4_1 = $3_1 & 0xff;
                        $3_1 = 0;
                        $1_1 = 3;
                        $0_1 = 125;
                        label$35: {
                          switch($4_1 - 1) {
                            case 2:
                              $3_1 = 2;
                              $0_1 = 123;
                              break label$31;
                            case 3:
                              $0_1 = 117;
                              $3_1 = 3;
                              break label$31;
                            case 0:
                              break label$31;
                            case 1:
                              break label$32;
                            case 4:
                              break label$35;
                            default:
                              break label$27;
                          };
                        }
                        $3_1 = 4;
                        $0_1 = 92;
                        break label$31;
                      case 1:
                        break label$31;
                      case 0:
                        break label$33;
                      default:
                        break label$27;
                    };
                  }
                  $1_1 = 0;
                  $0_1 = $2_1;
                  break label$31;
                }
                $3_1 = $5_1 ? 2 : 1;
                $0_1 = ($2_1 >>> ($5_1 << 2)) & 0xf;
                $0_1 = $0_1 + ($0_1 >>> 0 < 10 >>> 0 ? 48 : 87);
                $5_1 = $5_1 ? $5_1 - 1 : 0;
              }
              if(!(FUNCTION_TABLE[$8_1]($7_1, $0_1))) {
                continue label$30
              }
              break label$28;
            }
          }
          label$38: while(1) {
            $2_1 = $1_1;
            $0_1 = 92;
            $1_1 = 1;
            label$39: {
              label$40: {
                switch($2_1 - 2) {
                  case 0:
                    break label$39;
                  case 1:
                    break label$40;
                  default:
                    break label$27;
                };
              }
              $2_1 = $3_1 & 0xff;
              $3_1 = 0;
              $1_1 = 3;
              $0_1 = 125;
              label$41: {
                switch($2_1 - 1) {
                  case 4:
                    $3_1 = 4;
                    $0_1 = 92;
                    break label$39;
                  case 3:
                    $0_1 = 117;
                    $3_1 = 3;
                    break label$39;
                  case 2:
                    $3_1 = 2;
                    $0_1 = 123;
                    break label$39;
                  case 0:
                    break label$39;
                  case 1:
                    break label$41;
                  default:
                    break label$27;
                };
              }
              $3_1 = $5_1 ? 2 : 1;
              $0_1 = (1114112 >>> ($5_1 << 2)) & 1 | 48;
              $5_1 = $5_1 ? $5_1 - 1 : 0;
            }
            if(!(FUNCTION_TABLE[$8_1]($7_1, $0_1))) {
              continue label$38
            }
            break label$38;
          };
        }
        $23_1 = 1;
        break label$1;
      }
      $23_1 = FUNCTION_TABLE[$8_1]($7_1, 39);
    }
    $2_1 = $23_1;
    global$0 = $6_1 + 16;
    return $2_1;
  }

  function $10($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    $5_1 = $5_1;
    $6_1 = $6_1;
    var $7_1 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $10_1 = 0,
      $11_1 = 0,
      $12_1 = 0,
      $104 = 0,
      $13_1 = 0;
    $9_1 = 1;
    label$1: {
      label$2: {
        if(!$2_1) {
          break label$2
        }
        $10_1 = $1_1 + ($2_1 << 1);
        $11_1 = ($0_1 & 0xff00) >>> 8;
        $13_1 = $0_1 & 0xff;
        label$3: {
          label$4: while(1) {
            $12_1 = $1_1 + 2;
            $2_1 = HEAPU8[($1_1 + 1) >> 0];
            $8_1 = $7_1 + $2_1;
            $1_1 = HEAPU8[$1_1 >> 0];
            if(($11_1) != ($1_1)) {
              if($1_1 >>> 0 > $11_1 >>> 0) {
                break label$2
              }
              $7_1 = $8_1;
              $1_1 = $12_1;
              if(($10_1) != ($1_1)) {
                continue label$4
              }
              break label$2;
            }
            if($7_1 >>> 0 <= $8_1 >>> 0) {
              if($4_1 >>> 0 < $8_1 >>> 0) {
                break label$3
              }
              $1_1 = $3_1 + $7_1;
              label$7: {
                label$8: while(1) {
                  if(!$2_1) {
                    break label$7
                  }
                  $2_1 = $2_1 - 1;
                  $7_1 = HEAPU8[$1_1 >> 0];
                  $1_1 = $1_1 + 1;
                  if(($7_1) != ($13_1)) {
                    continue label$8
                  }
                  break label$8;
                };
                $9_1 = 0;
                break label$1;
              }
              $7_1 = $8_1;
              $1_1 = $12_1;
              if(($10_1) != ($1_1)) {
                continue label$4
              }
              break label$2;
            }
            break label$4;
          };
          $69($7_1, $8_1);
          abort();
        }
        $68($8_1, $4_1);
        abort();
      }
      if(!$6_1) {
        break label$1
      }
      $3_1 = $5_1 + $6_1;
      $1_1 = $0_1 & 0xffff;
      label$9: while(1) {
        label$10: {
          $0_1 = $5_1 + 1;
          $2_1 = HEAPU8[$5_1 >> 0];
          $4_1 = ($2_1 << 24) >> 24;
          if(($4_1) >= (0)) {
            $104 = $0_1
          } else {
            if(($0_1) == ($3_1)) {
              break label$10
            }
            $2_1 = HEAPU8[($5_1 + 1) >> 0] | (($4_1 & 127) << 8);
            $104 = $5_1 + 2;
          }
          $5_1 = $104;
          $1_1 = $1_1 - $2_1;
          if(($1_1) < (0)) {
            break label$1
          }
          $9_1 = $9_1 ^ 1;
          if(($3_1) != ($5_1)) {
            continue label$9
          }
          break label$1;
        }
        break label$9;
      };
      $40(1049564, 1050780);
      abort();
    }
    return $9_1 & 1;
  }

  function $11($0_1, $1_1, $2_1, $3_1, $4_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    var $5_1 = 0,
      $6_1 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $78_1 = 0,
      $10_1 = 0,
      $10$hi = 0,
      $90 = 0;
    $5_1 = global$0 + -64;
    global$0 = $5_1;
    $7_1 = 1;
    label$1: {
      if(HEAPU8[($0_1 + 4) >> 0]) {
        break label$1
      }
      $8_1 = HEAPU8[($0_1 + 5) >> 0];
      $6_1 = HEAP32[$0_1 >> 2];
      $9_1 = HEAP32[$6_1 >> 2];
      if(!($9_1 & 4)) {
        if(FUNCTION_TABLE[HEAP32[((HEAP32[($6_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($6_1 + 24) >> 2], $8_1 ? 1049677 : 1049679, $8_1 ? 2 : 3)) {
          break label$1
        }
        if(FUNCTION_TABLE[HEAP32[((HEAP32[($6_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($6_1 + 24) >> 2], $1_1, $2_1)) {
          break label$1
        }
        if(FUNCTION_TABLE[HEAP32[((HEAP32[($6_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($6_1 + 24) >> 2], 1049625, 2)) {
          break label$1
        }
        $7_1 = FUNCTION_TABLE[HEAP32[($4_1 + 12) >> 2]]($3_1, $6_1);
        break label$1;
      }
      if(!$8_1) {
        if(FUNCTION_TABLE[HEAP32[((HEAP32[($6_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($6_1 + 24) >> 2], 1049672, 3)) {
          break label$1
        }
        $9_1 = HEAP32[$6_1 >> 2];
      }
      HEAP8[($5_1 + 23) >> 0] = 1;
      HEAP32[($5_1 + 52) >> 2] = 1049644;
      HEAP32[($5_1 + 16) >> 2] = $5_1 + 23;
      HEAP32[($5_1 + 24) >> 2] = $9_1;
      i64toi32_i32$0 = HEAP32[($6_1 + 24) >> 2];
      i64toi32_i32$1 = HEAP32[($6_1 + 28) >> 2];
      $78_1 = i64toi32_i32$0;
      i64toi32_i32$0 = $5_1;
      HEAP32[($5_1 + 8) >> 2] = $78_1;
      HEAP32[($5_1 + 12) >> 2] = i64toi32_i32$1;
      i64toi32_i32$1 = HEAP32[($6_1 + 8) >> 2];
      i64toi32_i32$0 = HEAP32[($6_1 + 12) >> 2];
      $10_1 = i64toi32_i32$1;
      $10$hi = i64toi32_i32$0;
      i64toi32_i32$0 = HEAP32[($6_1 + 16) >> 2];
      i64toi32_i32$1 = HEAP32[($6_1 + 20) >> 2];
      HEAP8[($5_1 + 56) >> 0] = HEAPU8[($6_1 + 32) >> 0];
      HEAP32[($5_1 + 28) >> 2] = HEAP32[($6_1 + 4) >> 2];
      $90 = i64toi32_i32$0;
      i64toi32_i32$0 = $5_1;
      HEAP32[($5_1 + 40) >> 2] = $90;
      HEAP32[($5_1 + 44) >> 2] = i64toi32_i32$1;
      i64toi32_i32$1 = $10$hi;
      i64toi32_i32$0 = $5_1;
      HEAP32[($5_1 + 32) >> 2] = $10_1;
      HEAP32[($5_1 + 36) >> 2] = i64toi32_i32$1;
      $6_1 = $5_1 + 8;
      HEAP32[($5_1 + 48) >> 2] = $6_1;
      if($4($6_1, $1_1, $2_1)) {
        break label$1
      }
      if($4($5_1 + 8, 1049625, 2)) {
        break label$1
      }
      if(FUNCTION_TABLE[HEAP32[($4_1 + 12) >> 2]]($3_1, $5_1 + 24)) {
        break label$1
      }
      $7_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($5_1 + 52) >> 2]) + 12) >> 2]](HEAP32[($5_1 + 48) >> 2], 1049675, 2);
    }
    HEAP8[($0_1 + 5) >> 0] = 1;
    HEAP8[($0_1 + 4) >> 0] = $7_1;
    global$0 = $5_1 - -64;
    return $0_1;
  }

  /**
   * @param {*} $0_1 ptr
   * @param {*} $1_1 len
   * @returns ptr
   */
  function __malloc($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0;
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    label$1: {
      if(!$0_1) {
        $0_1 = $1_1;
        break label$1;
      }
      $3_1 = $0_1 + 3;
      $4_1 = $3_1 >>> 2;
      label$3: {
        if($1_1 >>> 0 >= 5 >>> 0) {
          break label$3
        }
        $0_1 = $4_1 - 1;
        if($0_1 >>> 0 > 0xff >>> 0) {
          break label$3
        }
        HEAP32[($2_1 + 8) >> 2] = 1053184;
        $3_1 = $0_1 >>> 0 < 256 >>> 0 ? ($0_1 << 2) + 1053188 : 0;
        HEAP32[($2_1 + 12) >> 2] = HEAP32[$3_1 >> 2];
        label$4: {
          $0_1 = _malloc_internal($4_1, $1_1, $2_1 + 12, $2_1 + 8, 1048864);
          if($0_1) {
            break label$4
          }
          __malloc_internal($2_1, $2_1 + 8, $4_1, $1_1);
          $0_1 = 0;
          if(HEAP32[$2_1 >> 2]) {
            break label$4
          }
          $0_1 = HEAP32[($2_1 + 4) >> 2];
          HEAP32[($0_1 + 8) >> 2] = HEAP32[($2_1 + 12) >> 2];
          HEAP32[($2_1 + 12) >> 2] = $0_1;
          $0_1 = _malloc_internal($4_1, $1_1, $2_1 + 12, $2_1 + 8, 1048864);
        }
        HEAP32[$3_1 >> 2] = HEAP32[($2_1 + 12) >> 2];
        break label$1;
      }
      HEAP32[($2_1 + 12) >> 2] = HEAP32[1053184 >> 2];
      label$5: {
        $0_1 = _malloc_internal($4_1, $1_1, $2_1 + 12, 1048838, 1048840);
        if($0_1) {
          break label$5
        }
        $0_1 = $3_1 & -4;
        $3_1 = ($1_1 << 3) + 16384;
        $3_1 = ($0_1 >>> 0 > $3_1 >>> 0 ? $0_1 : $3_1) + 65543;
        $0_1 = __wasm_memory_grow($3_1 >>> 16);
        if(($0_1) == (-1)) {
          $0_1 = 0;
          break label$5;
        }
        $0_1 = $0_1 << 16;
        HEAP32[($0_1 + 8) >> 2] = HEAP32[($2_1 + 12) >> 2];
        HEAP32[($0_1 + 4) >> 2] = 0;
        HEAP32[$0_1 >> 2] = $0_1 + ($3_1 & -65536) | 2;
        HEAP32[($2_1 + 12) >> 2] = $0_1;
        $0_1 = _malloc_internal($4_1, $1_1, $2_1 + 12, 1048838, 1048840);
      }
      HEAP32[1053184 >> 2] = HEAP32[($2_1 + 12) >> 2];
    }
    global$0 = $2_1 + 16;
    return $0_1;
  }

  function $13($0_1, $0$hi, $1_1) {
    $0_1 = $0_1;
    $0$hi = $0$hi;
    $1_1 = $1_1;
    var i64toi32_i32$2 = 0,
      $2_1 = 0,
      i64toi32_i32$0 = 0,
      $3_1 = 0,
      $4_1 = 0,
      i64toi32_i32$1 = 0,
      $7_1 = 0,
      i64toi32_i32$3 = 0,
      $7$hi = 0,
      i64toi32_i32$5 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $17_1 = 0,
      $18_1 = 0,
      $19_1 = 0,
      $20_1 = 0,
      $21_1 = 0,
      $22_1 = 0,
      $23_1 = 0,
      $25_1 = 0,
      $26_1 = 0,
      $27_1 = 0,
      $28_1 = 0,
      $29_1 = 0,
      $24_1 = 0,
      $24$hi = 0;
    $4_1 = global$0 - 48;
    global$0 = $4_1;
    $2_1 = 39;
    label$1: {
      i64toi32_i32$0 = $0$hi;
      i64toi32_i32$2 = $0_1;
      i64toi32_i32$1 = 0;
      i64toi32_i32$3 = 1e4;
      if(i64toi32_i32$0 >>> 0 < i64toi32_i32$1 >>> 0 | ((i64toi32_i32$0) == (i64toi32_i32$1) & i64toi32_i32$2 >>> 0 < i64toi32_i32$3 >>> 0)) {
        i64toi32_i32$2 = $0$hi;
        $7_1 = $0_1;
        $7$hi = i64toi32_i32$2;
        break label$1;
      }
      label$3: while(1) {
        $3_1 = ($4_1 + 9) + $2_1;
        i64toi32_i32$2 = $0$hi;
        i64toi32_i32$0 = 0;
        i64toi32_i32$0 = __wasm_i64_udiv($0_1, i64toi32_i32$2, 1e4, i64toi32_i32$0);
        i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
        $7_1 = i64toi32_i32$0;
        $7$hi = i64toi32_i32$2;
        i64toi32_i32$0 = 0;
        i64toi32_i32$0 = __wasm_i64_mul($7_1, i64toi32_i32$2, 1e4, i64toi32_i32$0);
        i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
        $24_1 = i64toi32_i32$0;
        $24$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $0$hi;
        i64toi32_i32$3 = $0_1;
        i64toi32_i32$0 = $24$hi;
        i64toi32_i32$1 = $24_1;
        i64toi32_i32$5 = ($0_1 >>> 0 < i64toi32_i32$1 >>> 0) + i64toi32_i32$0;
        i64toi32_i32$5 = i64toi32_i32$2 - i64toi32_i32$5;
        $5_1 = $0_1 - i64toi32_i32$1;
        $6_1 = (($5_1 & 0xffff) >>> 0) / (100 >>> 0);
        $17_1 = ($6_1 << 1) + 1049711;
        $18_1 = $3_1 - 4;
        $19_1 = HEAPU8[$17_1 >> 0] | ((HEAPU8[($17_1 + 1) >> 0]) << 8);
        HEAP8[$18_1 >> 0] = $19_1;
        HEAP8[($18_1 + 1) >> 0] = $19_1 >>> 8;
        $20_1 = ((($5_1 - Math_imul($6_1, 100)) & 0xffff) << 1) + 1049711;
        $21_1 = $3_1 - 2;
        $22_1 = HEAPU8[$20_1 >> 0] | ((HEAPU8[($20_1 + 1) >> 0]) << 8);
        HEAP8[$21_1 >> 0] = $22_1;
        HEAP8[($21_1 + 1) >> 0] = $22_1 >>> 8;
        $2_1 = $2_1 - 4;
        i64toi32_i32$5 = i64toi32_i32$2;
        i64toi32_i32$5 = i64toi32_i32$2;
        i64toi32_i32$2 = $0_1;
        i64toi32_i32$3 = 0;
        i64toi32_i32$1 = 99999999;
        $3_1 = $0$hi >>> 0 > i64toi32_i32$3 >>> 0 | (($0$hi) == (i64toi32_i32$3) & i64toi32_i32$2 >>> 0 > i64toi32_i32$1 >>> 0);
        i64toi32_i32$2 = $7$hi;
        $0_1 = $7_1;
        $0$hi = i64toi32_i32$2;
        if($3_1) {
          continue label$3
        }
        break label$3;
      };
    }
    i64toi32_i32$2 = $7$hi;
    $3_1 = $7_1;
    if($3_1 >>> 0 > 99 >>> 0) {
      i64toi32_i32$2 = $7$hi;
      $5_1 = $7_1;
      $3_1 = (($7_1 & 0xffff) >>> 0) / (100 >>> 0);
      $2_1 = $2_1 - 2;
      $23_1 = ((($7_1 - Math_imul($3_1, 100)) & 0xffff) << 1) + 1049711;
      $25_1 = $2_1 + ($4_1 + 9);
      $26_1 = HEAPU8[$23_1 >> 0] | ((HEAPU8[($23_1 + 1) >> 0]) << 8);
      HEAP8[$25_1 >> 0] = $26_1;
      HEAP8[($25_1 + 1) >> 0] = $26_1 >>> 8;
    }
    label$5: {
      if($3_1 >>> 0 >= 10 >>> 0) {
        $2_1 = $2_1 - 2;
        $27_1 = ($3_1 << 1) + 1049711;
        $28_1 = $2_1 + ($4_1 + 9);
        $29_1 = HEAPU8[$27_1 >> 0] | ((HEAPU8[($27_1 + 1) >> 0]) << 8);
        HEAP8[$28_1 >> 0] = $29_1;
        HEAP8[($28_1 + 1) >> 0] = $29_1 >>> 8;
        break label$5;
      }
      $2_1 = $2_1 - 1;
      HEAP8[($2_1 + ($4_1 + 9)) >> 0] = $3_1 + 48;
    }
    $1_1 = $3($1_1, 1049484, 0, ($4_1 + 9) + $2_1, 39 - $2_1);
    global$0 = $4_1 + 48;
    return $1_1;
  }

  function $14($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0,
      i64toi32_i32$1 = 0;
    $4_1 = global$0 - 128;
    global$0 = $4_1;
    label$1: {
      label$2: {
        label$3: {
          label$4: {
            $2_1 = HEAP32[$1_1 >> 2];
            if(!($2_1 & 16)) {
              if($2_1 & 32) {
                break label$4
              }
              i64toi32_i32$1 = 0;
              $0_1 = $13(HEAP32[$0_1 >> 2], i64toi32_i32$1, $1_1);
              break label$1;
            }
            $0_1 = HEAP32[$0_1 >> 2];
            $2_1 = 0;
            label$6: while(1) {
              $3_1 = $0_1 & 0xf;
              HEAP8[(($2_1 + $4_1) + 127) >> 0] = $3_1 + ($3_1 >>> 0 < 10 >>> 0 ? 48 : 87);
              $2_1 = $2_1 - 1;
              $3_1 = $0_1 >>> 0 > 15 >>> 0;
              $0_1 = $0_1 >>> 4;
              if($3_1) {
                continue label$6
              }
              break label$6;
            };
            $0_1 = $2_1 + 128;
            if($0_1 >>> 0 >= 129 >>> 0) {
              break label$3
            }
            $0_1 = $3($1_1, 1049709, 2, ($2_1 + $4_1) + 128, 0 - $2_1);
            break label$1;
          }
          $0_1 = HEAP32[$0_1 >> 2];
          $2_1 = 0;
          label$7: while(1) {
            $3_1 = $0_1 & 0xf;
            HEAP8[(($2_1 + $4_1) + 127) >> 0] = $3_1 + ($3_1 >>> 0 < 10 >>> 0 ? 48 : 55);
            $2_1 = $2_1 - 1;
            $3_1 = $0_1 >>> 0 > 15 >>> 0;
            $0_1 = $0_1 >>> 4;
            if($3_1) {
              continue label$7
            }
            break label$7;
          };
          $0_1 = $2_1 + 128;
          if($0_1 >>> 0 >= 129 >>> 0) {
            break label$2
          }
          $0_1 = $3($1_1, 1049709, 2, ($2_1 + $4_1) + 128, 0 - $2_1);
          break label$1;
        }
        $67($0_1, 128);
        abort();
      }
      $67($0_1, 128);
      abort();
    }
    global$0 = $4_1 + 128;
    return $0_1;
  }

  /**
   * Entry to iter pow solving
   * @param {*} $0_1 stack
   * @param {*} $1_1 date
   * @param {*} $2_1 str
   * @param {*} $3_1 len
   * @param {*} $4_1 difficulty
   */
  function solve_with_iter($0_1, $1_1, $2_1, $3_1, $4_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    var $5_1 = 0,
      $6_1 = 0,
      i64toi32_i32$1 = 0,
      i64toi32_i32$0 = 0,
      $7_1 = 0,
      i64toi32_i32$2 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $10_1 = 0,
      $11_1 = 0,
      $12_1 = 0,
      $78_1 = 0,
      $34_1 = 0,
      $13_1 = 0,
      $177 = 0,
      $182 = 0,
      $185 = 0;
    $5_1 = global$0 - 80;
    global$0 = $5_1;
    $7_1 = $5_1 + 40;
    _solve($7_1, $1_1, $2_1, $3_1, $4_1);
    HEAP32[($5_1 + 20) >> 2] = HEAP32[($5_1 + 40) >> 2];
    HEAP32[($5_1 + 32) >> 2] = HEAP32[($7_1 + 12) >> 2];
    i64toi32_i32$2 = $5_1;
    i64toi32_i32$0 = HEAP32[($5_1 + 44) >> 2];
    i64toi32_i32$1 = HEAP32[($5_1 + 48) >> 2];
    $34_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $5_1;
    HEAP32[($5_1 + 24) >> 2] = $34_1;
    HEAP32[($5_1 + 28) >> 2] = i64toi32_i32$1;
    HEAP32[($5_1 + 60) >> 2] = 2;
    $1_1 = $5_1 - -64;
    HEAP32[($1_1 + 12) >> 2] = 1;
    i64toi32_i32$0 = $5_1;
    i64toi32_i32$1 = 0;
    HEAP32[($5_1 + 44) >> 2] = 3;
    HEAP32[($5_1 + 48) >> 2] = i64toi32_i32$1;
    HEAP32[($5_1 + 40) >> 2] = 1048752;
    HEAP32[($5_1 + 68) >> 2] = 2;
    HEAP32[($5_1 + 56) >> 2] = $1_1;
    HEAP32[($5_1 + 72) >> 2] = $5_1 + 24;
    HEAP32[($5_1 + 64) >> 2] = $5_1 + 20;
    $9_1 = $5_1 + 8;
    $8_1 = global$0 - 32;
    global$0 = $8_1;
    $13_1 = HEAP32[($7_1 + 20) >> 2];
    $4_1 = HEAP32[$7_1 >> 2];
    label$1: {
      $11_1 = HEAP32[($7_1 + 4) >> 2];
      if(!($11_1 << 3)) {
        break label$1
      }
      $1_1 = ($11_1 - 1) & 0x1fffffff;
      $6_1 = $1_1 + 1;
      $10_1 = $6_1 & 7;
      label$2: {
        if($1_1 >>> 0 < 7 >>> 0) {
          $6_1 = 0;
          $78_1 = $4_1;
          break label$2;
        }
        $1_1 = $4_1 + 60;
        $12_1 = $6_1 & 0x3ffffff8;
        $6_1 = 0;
        label$4: while(1) {
          $6_1 = (HEAP32[$1_1 >> 2]) + ((HEAP32[($1_1 - 8) >> 2]) + ((HEAP32[($1_1 - 16) >> 2]) + ((HEAP32[($1_1 - 24) >> 2]) + ((HEAP32[($1_1 - 32) >> 2]) + ((HEAP32[($1_1 - 40) >> 2]) + ((HEAP32[($1_1 - 48) >> 2]) + ((HEAP32[($1_1 - 56) >> 2]) + $6_1)))))));
          $1_1 = $1_1 - -64;
          $12_1 = $12_1 - 8;
          if($12_1) {
            continue label$4
          }
          break label$4;
        };
        $78_1 = $1_1 - 60;
      }
      $1_1 = $78_1;
      if(!$10_1) {
        break label$1
      }
      $1_1 = $1_1 + 4;
      label$5: while(1) {
        $6_1 = (HEAP32[$1_1 >> 2]) + $6_1;
        $1_1 = $1_1 + 8;
        $10_1 = $10_1 - 1;
        if($10_1) {
          continue label$5
        }
        break label$5;
      };
    }
    label$6: {
      label$7: {
        label$8: {
          if(!$13_1) {
            $1_1 = $6_1;
            break label$8;
          }
          label$10: {
            if(!$11_1) {
              break label$10
            }
            if(HEAP32[($4_1 + 4) >> 2]) {
              break label$10
            }
            if($6_1 >>> 0 < 16 >>> 0) {
              break label$7
            }
          }
          $1_1 = $6_1 + $6_1;
          if($6_1 >>> 0 > $1_1 >>> 0) {
            break label$7
          }
        }
        if(!$1_1) {
          break label$7
        }
        label$11: {
          if(($1_1) > (-1)) {
            $6_1 = _malloc($1_1, 1);
            if(!$6_1) {
              break label$11
            }
            break label$6;
          }
          $42();
          abort();
        }
        $0_1 = HEAP32[1054248 >> 2];
        FUNCTION_TABLE[($0_1 ? $0_1 : 13)]($1_1, 1);
        abort();
      }
      $6_1 = 1;
      $1_1 = 0;
    }
    HEAP32[($9_1 + 8) >> 2] = 0;
    HEAP32[($9_1 + 4) >> 2] = $1_1;
    HEAP32[$9_1 >> 2] = $6_1;
    HEAP32[($8_1 + 4) >> 2] = $9_1;
    $1_1 = $8_1 + 8;
    i64toi32_i32$2 = $7_1 + 16;
    i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $177 = i64toi32_i32$1;
    i64toi32_i32$1 = $1_1 + 16;
    HEAP32[i64toi32_i32$1 >> 2] = $177;
    HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    i64toi32_i32$2 = $7_1 + 8;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $182 = i64toi32_i32$0;
    i64toi32_i32$0 = $1_1 + 8;
    HEAP32[i64toi32_i32$0 >> 2] = $182;
    HEAP32[(i64toi32_i32$0 + 4) >> 2] = i64toi32_i32$1;
    i64toi32_i32$2 = $7_1;
    i64toi32_i32$1 = HEAP32[$7_1 >> 2];
    i64toi32_i32$0 = HEAP32[($7_1 + 4) >> 2];
    $185 = i64toi32_i32$1;
    i64toi32_i32$1 = $8_1;
    HEAP32[(i64toi32_i32$1 + 8) >> 2] = $185;
    HEAP32[(i64toi32_i32$1 + 12) >> 2] = i64toi32_i32$0;
    label$13: {
      if(!($8(i64toi32_i32$1 + 4, 1049204, $1_1))) {
        global$0 = $8_1 + 32;
        break label$13;
      }
      $28(1049332, 51, $8_1 + 8, 1049244, 1049408);
      abort();
    }
    $1_1 = HEAP32[($5_1 + 28) >> 2];
    if($1_1) {
      _free(HEAP32[($5_1 + 24) >> 2], $1_1, 1)
    }
    if($3_1) {
      _free($2_1, $3_1, 1)
    }
    $2_1 = HEAP32[($5_1 + 8) >> 2];
    label$17: {
      $4_1 = HEAP32[($5_1 + 12) >> 2];
      $3_1 = HEAP32[($5_1 + 16) >> 2];
      if($4_1 >>> 0 <= $3_1 >>> 0) {
        $1_1 = $2_1;
        break label$17;
      }
      if(!$3_1) {
        $1_1 = 1;
        _free($2_1, $4_1, 1);
        break label$17;
      }
      $1_1 = _realloc($2_1, $4_1, 1, $3_1);
      if($1_1) {
        break label$17
      }
      $0_1 = HEAP32[1054248 >> 2];
      FUNCTION_TABLE[($0_1 ? $0_1 : 13)]($3_1, 1);
      abort();
    }
    HEAP32[($0_1 + 4) >> 2] = $3_1;
    HEAP32[$0_1 >> 2] = $1_1;
    global$0 = $5_1 + 80;
  }

  function $16($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var i64toi32_i32$1 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$2 = 0,
      $2_1 = 0,
      $3_1 = 0,
      $5_1 = 0,
      $4_1 = 0,
      $6_1 = 0,
      $32_1 = 0,
      $37_1 = 0,
      $40_1 = 0,
      $51_1 = 0,
      $7_1 = 0,
      $7$hi = 0,
      $74_1 = 0;
    $2_1 = global$0 - 48;
    global$0 = $2_1;
    $4_1 = $1_1 + 4;
    if(!(HEAP32[($1_1 + 4) >> 2])) {
      $3_1 = HEAP32[$1_1 >> 2];
      $5_1 = $2_1 + 8;
      $6_1 = $5_1 + 8;
      HEAP32[$6_1 >> 2] = 0;
      i64toi32_i32$1 = $2_1;
      i64toi32_i32$0 = 0;
      HEAP32[(i64toi32_i32$1 + 8) >> 2] = 1;
      HEAP32[(i64toi32_i32$1 + 12) >> 2] = i64toi32_i32$0;
      HEAP32[(i64toi32_i32$1 + 20) >> 2] = $5_1;
      $5_1 = i64toi32_i32$1 + 24;
      i64toi32_i32$2 = $3_1 + 16;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
      $32_1 = i64toi32_i32$0;
      i64toi32_i32$0 = $5_1 + 16;
      HEAP32[i64toi32_i32$0 >> 2] = $32_1;
      HEAP32[(i64toi32_i32$0 + 4) >> 2] = i64toi32_i32$1;
      i64toi32_i32$2 = $3_1 + 8;
      i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2];
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
      $37_1 = i64toi32_i32$1;
      i64toi32_i32$1 = $5_1 + 8;
      HEAP32[i64toi32_i32$1 >> 2] = $37_1;
      HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
      i64toi32_i32$2 = $3_1;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
      $40_1 = i64toi32_i32$0;
      i64toi32_i32$0 = $2_1;
      HEAP32[(i64toi32_i32$0 + 24) >> 2] = $40_1;
      HEAP32[(i64toi32_i32$0 + 28) >> 2] = i64toi32_i32$1;
      $8(i64toi32_i32$0 + 20, 1048912, $5_1);
      HEAP32[($4_1 + 8) >> 2] = HEAP32[$6_1 >> 2];
      i64toi32_i32$2 = i64toi32_i32$0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 8) >> 2];
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$0 + 12) >> 2];
      $51_1 = i64toi32_i32$1;
      i64toi32_i32$1 = $4_1;
      HEAP32[i64toi32_i32$1 >> 2] = $51_1;
      HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    }
    $3_1 = $2_1 + 32;
    HEAP32[$3_1 >> 2] = HEAP32[($4_1 + 8) >> 2];
    HEAP32[($1_1 + 12) >> 2] = 0;
    i64toi32_i32$2 = $4_1;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $7_1 = i64toi32_i32$0;
    $7$hi = i64toi32_i32$1;
    i64toi32_i32$0 = $1_1;
    i64toi32_i32$1 = 0;
    HEAP32[(i64toi32_i32$0 + 4) >> 2] = 1;
    HEAP32[(i64toi32_i32$0 + 8) >> 2] = i64toi32_i32$1;
    i64toi32_i32$1 = $7$hi;
    i64toi32_i32$0 = $2_1;
    HEAP32[(i64toi32_i32$0 + 24) >> 2] = $7_1;
    HEAP32[(i64toi32_i32$0 + 28) >> 2] = i64toi32_i32$1;
    $1_1 = _malloc(12, 4);
    if(!$1_1) {
      $0_1 = HEAP32[1054248 >> 2];
      FUNCTION_TABLE[($0_1 ? $0_1 : 13)](12, 4);
      abort();
    }
    i64toi32_i32$2 = $2_1;
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 24) >> 2];
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 28) >> 2];
    $74_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $1_1;
    HEAP32[i64toi32_i32$1 >> 2] = $74_1;
    HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    HEAP32[(i64toi32_i32$1 + 8) >> 2] = HEAP32[$3_1 >> 2];
    HEAP32[($0_1 + 4) >> 2] = 1049132;
    HEAP32[$0_1 >> 2] = i64toi32_i32$1;
    global$0 = i64toi32_i32$2 + 48;
  }

  function $17($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $4_1 = 0,
      $3_1 = 0,
      $52_1 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $25_1 = 0,
      $7_1 = 0,
      $47_1 = 0,
      $100 = 0,
      $8_1 = 0,
      $8$hi = 0,
      $112 = 0,
      wasm2js_i32$0 = 0,
      wasm2js_i32$1 = 0;
    $3_1 = global$0 - 16;
    global$0 = $3_1;
    label$1: {
      $0_1 = HEAP32[$0_1 >> 2];
      if(!(HEAPU8[$0_1 >> 0])) {
        $25_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1052276, 4);
        break label$1;
      }
      (wasm2js_i32$0 = $3_1, wasm2js_i32$1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1052272, 4)),
      HEAP8[(wasm2js_i32$0 + 8) >> 0] = wasm2js_i32$1;
      HEAP32[$3_1 >> 2] = $1_1;
      HEAP8[($3_1 + 9) >> 0] = 0;
      HEAP32[($3_1 + 4) >> 2] = 0;
      $1_1 = 1;
      HEAP32[($3_1 + 12) >> 2] = $0_1 + 1;
      $0_1 = $3_1;
      $7_1 = $0_1 + 12;
      $2_1 = global$0 + -64;
      global$0 = $2_1;
      $47_1 = $0_1;
      label$3: {
        if(HEAPU8[($0_1 + 8) >> 0]) {
          $5_1 = HEAP32[($0_1 + 4) >> 2];
          $52_1 = 1;
          break label$3;
        }
        $5_1 = HEAP32[($0_1 + 4) >> 2];
        $4_1 = HEAP32[$0_1 >> 2];
        $6_1 = HEAP32[$4_1 >> 2];
        if(!($6_1 & 4)) {
          $52_1 = 1;
          if(FUNCTION_TABLE[HEAP32[((HEAP32[($4_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($4_1 + 24) >> 2], $5_1 ? 1049677 : 1049687, $5_1 ? 2 : 1)) {
            break label$3
          }
          $52_1 = FUNCTION_TABLE[HEAP32[1049704 >> 2]]($7_1, $4_1);
          break label$3;
        }
        if(!$5_1) {
          if(FUNCTION_TABLE[HEAP32[((HEAP32[($4_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($4_1 + 24) >> 2], 1049685, 2)) {
            $5_1 = 0;
            $52_1 = 1;
            break label$3;
          }
          $6_1 = HEAP32[$4_1 >> 2];
        }
        HEAP8[($2_1 + 23) >> 0] = 1;
        HEAP32[($2_1 + 52) >> 2] = 1049644;
        HEAP32[($2_1 + 16) >> 2] = $2_1 + 23;
        HEAP32[($2_1 + 24) >> 2] = $6_1;
        i64toi32_i32$0 = HEAP32[($4_1 + 24) >> 2];
        i64toi32_i32$1 = HEAP32[($4_1 + 28) >> 2];
        $100 = i64toi32_i32$0;
        i64toi32_i32$0 = $2_1;
        HEAP32[($2_1 + 8) >> 2] = $100;
        HEAP32[($2_1 + 12) >> 2] = i64toi32_i32$1;
        i64toi32_i32$1 = HEAP32[($4_1 + 8) >> 2];
        i64toi32_i32$0 = HEAP32[($4_1 + 12) >> 2];
        $8_1 = i64toi32_i32$1;
        $8$hi = i64toi32_i32$0;
        i64toi32_i32$0 = HEAP32[($4_1 + 16) >> 2];
        i64toi32_i32$1 = HEAP32[($4_1 + 20) >> 2];
        HEAP8[($2_1 + 56) >> 0] = HEAPU8[($4_1 + 32) >> 0];
        HEAP32[($2_1 + 28) >> 2] = HEAP32[($4_1 + 4) >> 2];
        $112 = i64toi32_i32$0;
        i64toi32_i32$0 = $2_1;
        HEAP32[($2_1 + 40) >> 2] = $112;
        HEAP32[($2_1 + 44) >> 2] = i64toi32_i32$1;
        i64toi32_i32$1 = $8$hi;
        i64toi32_i32$0 = $2_1;
        HEAP32[($2_1 + 32) >> 2] = $8_1;
        HEAP32[($2_1 + 36) >> 2] = i64toi32_i32$1;
        HEAP32[($2_1 + 48) >> 2] = $2_1 + 8;
        $52_1 = 1;
        if(FUNCTION_TABLE[HEAP32[1049704 >> 2]]($7_1, $2_1 + 24)) {
          break label$3
        }
        $52_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($2_1 + 52) >> 2]) + 12) >> 2]](HEAP32[($2_1 + 48) >> 2], 1049675, 2);
      }
      HEAP8[($47_1 + 8) >> 0] = $52_1;
      HEAP32[($0_1 + 4) >> 2] = $5_1 + 1;
      global$0 = $2_1 - -64;
      $0_1 = HEAPU8[($3_1 + 8) >> 0];
      label$8: {
        $2_1 = HEAP32[($3_1 + 4) >> 2];
        if(!$2_1) {
          $1_1 = $0_1;
          break label$8;
        }
        if($0_1) {
          break label$8
        }
        $0_1 = HEAP32[$3_1 >> 2];
        label$10: {
          if(($2_1) != (1)) {
            break label$10
          }
          if(!(HEAPU8[($3_1 + 9) >> 0])) {
            break label$10
          }
          if((HEAPU8[$0_1 >> 0]) & 4) {
            break label$10
          }
          if(FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], 1049688, 1)) {
            break label$8
          }
        }
        $1_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], 1049484, 1);
      }
      $25_1 = ($1_1 & 0xff) != (0);
    }
    $0_1 = $25_1;
    global$0 = $3_1 + 16;
    return $0_1;
  }

  function $18($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $31_1 = 0,
      $9_1 = 0,
      $11_1 = 0;
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    $0_1 = HEAP32[$0_1 >> 2];
    HEAP32[($2_1 + 12) >> 2] = 0;
    $9_1 = $0_1;
    $11_1 = $2_1 + 12;
    label$1: {
      label$2: {
        label$3: {
          if($1_1 >>> 0 >= 128 >>> 0) {
            if($1_1 >>> 0 < 2048 >>> 0) {
              break label$3
            }
            if($1_1 >>> 0 >= 65536 >>> 0) {
              break label$2
            }
            HEAP8[($2_1 + 14) >> 0] = $1_1 & 63 | 128;
            HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 12 | 224;
            HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 6) & 63 | 128;
            $31_1 = 3;
            break label$1;
          }
          HEAP8[($2_1 + 12) >> 0] = $1_1;
          $31_1 = 1;
          break label$1;
        }
        HEAP8[($2_1 + 13) >> 0] = $1_1 & 63 | 128;
        HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 6 | 192;
        $31_1 = 2;
        break label$1;
      }
      HEAP8[($2_1 + 15) >> 0] = $1_1 & 63 | 128;
      HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 18 | 240;
      HEAP8[($2_1 + 14) >> 0] = ($1_1 >>> 6) & 63 | 128;
      HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 12) & 63 | 128;
      $31_1 = 4;
    }
    $0_1 = $4($9_1, $11_1, $31_1);
    global$0 = $2_1 + 16;
    return $0_1;
  }

  function $19($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $29_1 = 0,
      $7_1 = 0,
      $9_1 = 0;
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    HEAP32[($2_1 + 12) >> 2] = 0;
    $7_1 = $0_1;
    $9_1 = $2_1 + 12;
    label$1: {
      label$2: {
        label$3: {
          if($1_1 >>> 0 >= 128 >>> 0) {
            if($1_1 >>> 0 < 2048 >>> 0) {
              break label$3
            }
            if($1_1 >>> 0 >= 65536 >>> 0) {
              break label$2
            }
            HEAP8[($2_1 + 14) >> 0] = $1_1 & 63 | 128;
            HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 12 | 224;
            HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 6) & 63 | 128;
            $29_1 = 3;
            break label$1;
          }
          HEAP8[($2_1 + 12) >> 0] = $1_1;
          $29_1 = 1;
          break label$1;
        }
        HEAP8[($2_1 + 13) >> 0] = $1_1 & 63 | 128;
        HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 6 | 192;
        $29_1 = 2;
        break label$1;
      }
      HEAP8[($2_1 + 15) >> 0] = $1_1 & 63 | 128;
      HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 18 | 240;
      HEAP8[($2_1 + 14) >> 0] = ($1_1 >>> 6) & 63 | 128;
      HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 12) & 63 | 128;
      $29_1 = 4;
    }
    $0_1 = $4($7_1, $9_1, $29_1);
    global$0 = $2_1 + 16;
    return $0_1;
  }

  function __malloc_internal($0_1, $1_1, $2_1, $3_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    var $4_1 = 0,
      $52_1 = 0;
    $3_1 = global$0 - 16;
    global$0 = $3_1;
    $1_1 = HEAP32[$1_1 >> 2];
    HEAP32[($3_1 + 12) >> 2] = HEAP32[$1_1 >> 2];
    label$1: {
      label$2: {
        $2_1 = $2_1 + 2;
        $2_1 = Math_imul($2_1, $2_1);
        $4_1 = $2_1 >>> 0 > 2048 >>> 0 ? $2_1 : 2048;
        $2_1 = _malloc_internal($4_1, 4, $3_1 + 12, 1048888, 1048888);
        if($2_1) {
          HEAP32[$1_1 >> 2] = HEAP32[($3_1 + 12) >> 2];
          break label$2;
        }
        ___malloc_internal($3_1, 1048888, $4_1, 4);
        label$4: {
          if(HEAP32[$3_1 >> 2]) {
            HEAP32[$1_1 >> 2] = HEAP32[($3_1 + 12) >> 2];
            break label$4;
          }
          $2_1 = HEAP32[($3_1 + 4) >> 2];
          HEAP32[($2_1 + 8) >> 2] = HEAP32[($3_1 + 12) >> 2];
          HEAP32[($3_1 + 12) >> 2] = $2_1;
          $2_1 = _malloc_internal($4_1, 4, $3_1 + 12, 1048888, 1048888);
          HEAP32[$1_1 >> 2] = HEAP32[($3_1 + 12) >> 2];
          if($2_1) {
            break label$2
          }
        }
        $52_1 = 1;
        break label$1;
      }
      HEAP32[($2_1 + 4) >> 2] = 0;
      HEAP32[($2_1 + 8) >> 2] = 0;
      HEAP32[$2_1 >> 2] = $2_1 + ($4_1 << 2) | 2;
      $52_1 = 0;
    }
    $1_1 = $52_1;
    HEAP32[($0_1 + 4) >> 2] = $2_1;
    HEAP32[$0_1 >> 2] = $1_1;
    global$0 = $3_1 + 16;
  }

  function $21($0_1, $1_1, $2_1, $3_1, $4_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    var $5_1 = 0,
      $6_1 = 0,
      $7_1 = 0,
      $53_1 = 0,
      i64toi32_i32$1 = 0;
    $5_1 = global$0 - 32;
    global$0 = $5_1;
    $6_1 = 1;
    $7_1 = HEAP32[1054264 >> 2];
    HEAP32[1054264 >> 2] = $7_1 + 1;
    label$1: {
      if(HEAPU8[1054268 >> 0]) {
        $6_1 = (HEAP32[1054272 >> 2]) + 1;
        break label$1;
      }
      HEAP8[1054268 >> 0] = 1;
    }
    HEAP32[1054272 >> 2] = $6_1;
    label$3: {
      label$4: {
        if(($7_1) < (0)) {
          break label$4
        }
        if($6_1 >>> 0 > 2 >>> 0) {
          break label$4
        }
        HEAP8[($5_1 + 24) >> 0] = $4_1;
        HEAP32[($5_1 + 20) >> 2] = $3_1;
        HEAP32[($5_1 + 16) >> 2] = $2_1;
        $2_1 = HEAP32[1054252 >> 2];
        if(($2_1) <= (-1)) {
          break label$4
        }
        $2_1 = $2_1 + 1;
        HEAP32[1054252 >> 2] = $2_1;
        $3_1 = HEAP32[1054260 >> 2];
        if($3_1) {
          $2_1 = HEAP32[1054256 >> 2];
          FUNCTION_TABLE[HEAP32[($1_1 + 16) >> 2]]($5_1, $0_1);
          i64toi32_i32$1 = HEAP32[($5_1 + 4) >> 2];
          HEAP32[($5_1 + 8) >> 2] = HEAP32[$5_1 >> 2];
          HEAP32[($5_1 + 12) >> 2] = i64toi32_i32$1;
          FUNCTION_TABLE[HEAP32[($3_1 + 20) >> 2]]($2_1, $5_1 + 8);
          $53_1 = HEAP32[1054252 >> 2];
        } else {
          $53_1 = $2_1
        }
        HEAP32[1054252 >> 2] = $53_1 - 1;
        if($6_1 >>> 0 > 1 >>> 0) {
          break label$4
        }
        if($4_1) {
          break label$3
        }
      }
      abort();
    }
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    HEAP32[($2_1 + 12) >> 2] = $1_1;
    HEAP32[($2_1 + 8) >> 2] = $0_1;
    abort();
  }

  function $22($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $4_1 = 0,
      $38_1 = 0,
      $8_1 = 0,
      $29_1 = 0,
      $53_1 = 0;
    $3_1 = global$0 - 32;
    global$0 = $3_1;
    label$1: {
      $8_1 = $1_1;
      $1_1 = $1_1 + $2_1;
      if($8_1 >>> 0 > $1_1 >>> 0) {
        break label$1
      }
      $2_1 = HEAP32[($0_1 + 4) >> 2];
      $4_1 = $2_1 << 1;
      $1_1 = $1_1 >>> 0 < $4_1 >>> 0 ? $4_1 : $1_1;
      $1_1 = $1_1 >>> 0 > 8 >>> 0 ? $1_1 : 8;
      $29_1 = $3_1;
      if($2_1) {
        HEAP32[($3_1 + 20) >> 2] = $2_1;
        HEAP32[($3_1 + 16) >> 2] = HEAP32[$0_1 >> 2];
        $38_1 = 1;
      } else {
        $38_1 = 0
      }
      HEAP32[($29_1 + 24) >> 2] = $38_1;
      $25($3_1, $1_1, $3_1 + 16);
      if(HEAP32[$3_1 >> 2]) {
        $0_1 = HEAP32[($3_1 + 8) >> 2];
        if(!$0_1) {
          break label$1
        }
        $53_1 = $0_1;
        $0_1 = HEAP32[1054248 >> 2];
        FUNCTION_TABLE[($0_1 ? $0_1 : 13)](HEAP32[($3_1 + 4) >> 2], $53_1);
        abort();
      }
      $2_1 = HEAP32[($3_1 + 4) >> 2];
      HEAP32[($0_1 + 4) >> 2] = $1_1;
      HEAP32[$0_1 >> 2] = $2_1;
      global$0 = $3_1 + 32;
      return;
    }
    $42();
    abort();
  }

  function $23($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0,
      $37_1 = 0,
      $8_1 = 0,
      $28_1 = 0,
      $52_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    label$1: {
      $8_1 = $1_1;
      $1_1 = $1_1 + 1;
      if($8_1 >>> 0 > $1_1 >>> 0) {
        break label$1
      }
      $3_1 = HEAP32[($0_1 + 4) >> 2];
      $4_1 = $3_1 << 1;
      $1_1 = $1_1 >>> 0 < $4_1 >>> 0 ? $4_1 : $1_1;
      $1_1 = $1_1 >>> 0 > 8 >>> 0 ? $1_1 : 8;
      $28_1 = $2_1;
      if($3_1) {
        HEAP32[($2_1 + 20) >> 2] = $3_1;
        HEAP32[($2_1 + 16) >> 2] = HEAP32[$0_1 >> 2];
        $37_1 = 1;
      } else {
        $37_1 = 0
      }
      HEAP32[($28_1 + 24) >> 2] = $37_1;
      $25($2_1, $1_1, $2_1 + 16);
      if(HEAP32[$2_1 >> 2]) {
        $0_1 = HEAP32[($2_1 + 8) >> 2];
        if(!$0_1) {
          break label$1
        }
        $52_1 = $0_1;
        $0_1 = HEAP32[1054248 >> 2];
        FUNCTION_TABLE[($0_1 ? $0_1 : 13)](HEAP32[($2_1 + 4) >> 2], $52_1);
        abort();
      }
      $3_1 = HEAP32[($2_1 + 4) >> 2];
      HEAP32[($0_1 + 4) >> 2] = $1_1;
      HEAP32[$0_1 >> 2] = $3_1;
      global$0 = $2_1 + 32;
      return;
    }
    $42();
    abort();
  }

  function $24($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0,
      i64toi32_i32$2 = 0,
      $3_1 = 0,
      $2_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      $30_1 = 0,
      $35_1 = 0,
      $38_1 = 0,
      $49_1 = 0;
    $2_1 = global$0 - 48;
    global$0 = $2_1;
    $4_1 = $1_1 + 4;
    if(!(HEAP32[($1_1 + 4) >> 2])) {
      $1_1 = HEAP32[$1_1 >> 2];
      $3_1 = $2_1 + 8;
      $5_1 = $3_1 + 8;
      HEAP32[$5_1 >> 2] = 0;
      i64toi32_i32$1 = $2_1;
      i64toi32_i32$0 = 0;
      HEAP32[(i64toi32_i32$1 + 8) >> 2] = 1;
      HEAP32[(i64toi32_i32$1 + 12) >> 2] = i64toi32_i32$0;
      HEAP32[(i64toi32_i32$1 + 20) >> 2] = $3_1;
      $3_1 = i64toi32_i32$1 + 24;
      i64toi32_i32$2 = $1_1 + 16;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
      $30_1 = i64toi32_i32$0;
      i64toi32_i32$0 = $3_1 + 16;
      HEAP32[i64toi32_i32$0 >> 2] = $30_1;
      HEAP32[(i64toi32_i32$0 + 4) >> 2] = i64toi32_i32$1;
      i64toi32_i32$2 = $1_1 + 8;
      i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2];
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
      $35_1 = i64toi32_i32$1;
      i64toi32_i32$1 = $3_1 + 8;
      HEAP32[i64toi32_i32$1 >> 2] = $35_1;
      HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
      i64toi32_i32$2 = $1_1;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
      $38_1 = i64toi32_i32$0;
      i64toi32_i32$0 = $2_1;
      HEAP32[(i64toi32_i32$0 + 24) >> 2] = $38_1;
      HEAP32[(i64toi32_i32$0 + 28) >> 2] = i64toi32_i32$1;
      $8(i64toi32_i32$0 + 20, 1048912, $3_1);
      HEAP32[($4_1 + 8) >> 2] = HEAP32[$5_1 >> 2];
      i64toi32_i32$2 = i64toi32_i32$0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 8) >> 2];
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$0 + 12) >> 2];
      $49_1 = i64toi32_i32$1;
      i64toi32_i32$1 = $4_1;
      HEAP32[i64toi32_i32$1 >> 2] = $49_1;
      HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    }
    HEAP32[($0_1 + 4) >> 2] = 1049132;
    HEAP32[$0_1 >> 2] = $4_1;
    global$0 = $2_1 + 48;
  }

  function $25($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $14_1 = 0,
      $3_1 = 0,
      $4_1 = 0;
    label$1: {
      label$2: {
        $3_1 = 1;
        label$3: {
          label$4: {
            label$5: {
              if(($1_1) >= (0)) {
                if(!(HEAP32[($2_1 + 8) >> 2])) {
                  break label$4
                }
                $4_1 = HEAP32[($2_1 + 4) >> 2];
                if($4_1) {
                  break label$5
                }
                if($1_1) {
                  break label$3
                }
                $14_1 = 1;
                break label$2;
              }
              $1_1 = 0;
              break label$1;
            }
            $14_1 = _realloc(HEAP32[$2_1 >> 2], $4_1, 1, $1_1);
            break label$2;
          }
          if($1_1) {
            break label$3
          }
          $14_1 = 1;
          break label$2;
        }
        $14_1 = _malloc($1_1, 1);
      }
      $2_1 = $14_1;
      if($2_1) {
        HEAP32[($0_1 + 4) >> 2] = $2_1;
        $3_1 = 0;
        break label$1;
      }
      HEAP32[($0_1 + 4) >> 2] = $1_1;
      $1_1 = 1;
    }
    HEAP32[$0_1 >> 2] = $3_1;
    HEAP32[($0_1 + 8) >> 2] = $1_1;
  }

  /**
   * Entry to pow solving
   * @param {*} $0_1 stack
   * @param {*} $1_1 date
   * @param {*} $2_1 str
   * @param {*} $3_1 len
   * @param {*} $4_1 difficulty
   */
  function solve($0_1, $1_1, $2_1, $3_1, $4_1) {
    global$0 -= 16;
    _solve(global$0, $1_1, $2_1, $3_1, $4_1);
    _free($2_1, $3_1, 1);
    HEAP32[($0_1 + 4) >> 2] = HEAP32[(global$0 + 12) >> 2]; /* out str len */
    HEAP32[$0_1 >> 2] = HEAP32[(global$0 + 4) >> 2]; /* out str ptr */
    global$0 += 16;
  }

  function ___malloc_internal($0_1, $1_1, $2_1, $3_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    var $21_1 = 0;
    label$1: {
      $1_1 = $2_1 << 2;
      $2_1 = ($3_1 << 3) + 16384;
      $1_1 = ($1_1 >>> 0 > $2_1 >>> 0 ? $1_1 : $2_1) + 65543;
      $2_1 = __wasm_memory_grow($1_1 >>> 16);
      if(($2_1) == (-1)) {
        $3_1 = 0;
        $21_1 = 1;
        break label$1;
      }
      $3_1 = $2_1 << 16;
      HEAP32[$3_1 >> 2] = 0;
      HEAP32[($3_1 + 4) >> 2] = 0;
      HEAP32[($3_1 + 8) >> 2] = 0;
      HEAP32[$3_1 >> 2] = $3_1 + ($1_1 & -65536) | 2;
      $21_1 = 0;
    }
    $2_1 = $21_1;
    HEAP32[($0_1 + 4) >> 2] = $3_1;
    HEAP32[$0_1 >> 2] = $2_1;
  }

  function $28($0_1, $1_1, $2_1, $3_1, $4_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    $4_1 = $4_1;
    var $5_1 = 0;
    $5_1 = global$0 + -64;
    global$0 = $5_1;
    HEAP32[($5_1 + 12) >> 2] = $1_1;
    HEAP32[($5_1 + 8) >> 2] = $0_1;
    HEAP32[($5_1 + 20) >> 2] = $3_1;
    HEAP32[($5_1 + 16) >> 2] = $2_1;
    HEAP32[($5_1 + 44) >> 2] = 2;
    HEAP32[($5_1 + 60) >> 2] = 38;
    HEAP32[($5_1 + 28) >> 2] = 2;
    HEAP32[($5_1 + 32) >> 2] = 0;
    HEAP32[($5_1 + 24) >> 2] = 1049628;
    HEAP32[($5_1 + 52) >> 2] = 34;
    HEAP32[($5_1 + 40) >> 2] = $5_1 + 48;
    HEAP32[($5_1 + 56) >> 2] = $5_1 + 16;
    HEAP32[($5_1 + 48) >> 2] = $5_1 + 8;
    $43($5_1 + 24, $4_1);
    abort();
  }

  function $29($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    $3_1 = 1;
    label$1: {
      if($14($0_1, $1_1)) {
        break label$1
      }
      $4_1 = HEAP32[($1_1 + 28) >> 2];
      $5_1 = HEAP32[($1_1 + 24) >> 2];
      HEAP32[($2_1 + 28) >> 2] = 0;
      HEAP32[($2_1 + 24) >> 2] = 1049484;
      HEAP32[($2_1 + 12) >> 2] = 1;
      HEAP32[($2_1 + 16) >> 2] = 0;
      HEAP32[($2_1 + 8) >> 2] = 1049488;
      if($8($5_1, $4_1, $2_1 + 8)) {
        break label$1
      }
      $3_1 = $14($0_1 + 4, $1_1);
    }
    global$0 = $2_1 + 32;
    return $3_1;
  }

  function $30($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $3_1 = 0,
      $2_1 = 0,
      $4_1 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0,
      $5_1 = 0,
      $7_1 = 0,
      $6_1 = 0,
      $134 = 0,
      $81_1 = 0,
      $8_1 = 0,
      $8$hi = 0,
      $93 = 0;
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    $0_1 = HEAP32[$0_1 >> 2];
    $5_1 = HEAP32[($0_1 + 8) >> 2];
    $0_1 = HEAP32[$0_1 >> 2];
    $3_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1049690, 1);
    HEAP8[($2_1 + 5) >> 0] = 0;
    HEAP8[($2_1 + 4) >> 0] = $3_1;
    HEAP32[$2_1 >> 2] = $1_1;
    if($5_1) {
      label$2: while(1) {
        HEAP32[($2_1 + 12) >> 2] = $0_1;
        $6_1 = $2_1 + 12;
        $1_1 = global$0 + -64;
        global$0 = $1_1;
        $4_1 = 1;
        label$3: {
          if(HEAPU8[($2_1 + 4) >> 0]) {
            break label$3
          }
          $4_1 = HEAPU8[($2_1 + 5) >> 0];
          label$4: {
            label$5: {
              label$6: {
                $3_1 = HEAP32[$2_1 >> 2];
                $7_1 = HEAP32[$3_1 >> 2];
                if(!($7_1 & 4)) {
                  if($4_1) {
                    break label$6
                  }
                  break label$4;
                }
                if($4_1) {
                  break label$5
                }
                $4_1 = 1;
                if(FUNCTION_TABLE[HEAP32[((HEAP32[($3_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($3_1 + 24) >> 2], 1049689, 1)) {
                  break label$3
                }
                $7_1 = HEAP32[$3_1 >> 2];
                break label$5;
              }
              $4_1 = 1;
              if(!(FUNCTION_TABLE[HEAP32[((HEAP32[($3_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($3_1 + 24) >> 2], 1049677, 2))) {
                break label$4
              }
              break label$3;
            }
            $4_1 = 1;
            HEAP8[($1_1 + 23) >> 0] = 1;
            HEAP32[($1_1 + 52) >> 2] = 1049644;
            HEAP32[($1_1 + 16) >> 2] = $1_1 + 23;
            HEAP32[($1_1 + 24) >> 2] = $7_1;
            i64toi32_i32$0 = HEAP32[($3_1 + 24) >> 2];
            i64toi32_i32$1 = HEAP32[($3_1 + 28) >> 2];
            $81_1 = i64toi32_i32$0;
            i64toi32_i32$0 = $1_1;
            HEAP32[($1_1 + 8) >> 2] = $81_1;
            HEAP32[($1_1 + 12) >> 2] = i64toi32_i32$1;
            i64toi32_i32$1 = HEAP32[($3_1 + 8) >> 2];
            i64toi32_i32$0 = HEAP32[($3_1 + 12) >> 2];
            $8_1 = i64toi32_i32$1;
            $8$hi = i64toi32_i32$0;
            i64toi32_i32$0 = HEAP32[($3_1 + 16) >> 2];
            i64toi32_i32$1 = HEAP32[($3_1 + 20) >> 2];
            HEAP8[($1_1 + 56) >> 0] = HEAPU8[($3_1 + 32) >> 0];
            HEAP32[($1_1 + 28) >> 2] = HEAP32[($3_1 + 4) >> 2];
            $93 = i64toi32_i32$0;
            i64toi32_i32$0 = $1_1;
            HEAP32[($1_1 + 40) >> 2] = $93;
            HEAP32[($1_1 + 44) >> 2] = i64toi32_i32$1;
            i64toi32_i32$1 = $8$hi;
            i64toi32_i32$0 = $1_1;
            HEAP32[($1_1 + 32) >> 2] = $8_1;
            HEAP32[($1_1 + 36) >> 2] = i64toi32_i32$1;
            HEAP32[($1_1 + 48) >> 2] = $1_1 + 8;
            if(FUNCTION_TABLE[HEAP32[1049240 >> 2]]($6_1, $1_1 + 24)) {
              break label$3
            }
            $4_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 52) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 48) >> 2], 1049675, 2);
            break label$3;
          }
          $4_1 = FUNCTION_TABLE[HEAP32[1049240 >> 2]]($6_1, $3_1);
        }
        HEAP8[($2_1 + 5) >> 0] = 1;
        HEAP8[($2_1 + 4) >> 0] = $4_1;
        global$0 = $1_1 - -64;
        $0_1 = $0_1 + 1;
        $5_1 = $5_1 - 1;
        if($5_1) {
          continue label$2
        }
        break label$2;
      }
    }
    if(HEAPU8[($2_1 + 4) >> 0]) {
      $134 = 1
    } else {
      $0_1 = HEAP32[$2_1 >> 2];
      $134 = FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], 1049708, 1);
    }
    $0_1 = $134;
    global$0 = $2_1 + 16;
    return $0_1;
  }

  function $31($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0;
    $3_1 = global$0 - 48;
    global$0 = $3_1;
    HEAP32[($3_1 + 4) >> 2] = $1_1;
    HEAP32[$3_1 >> 2] = $0_1;
    HEAP32[($3_1 + 28) >> 2] = 2;
    HEAP32[($3_1 + 44) >> 2] = 2;
    HEAP32[($3_1 + 12) >> 2] = 2;
    HEAP32[($3_1 + 16) >> 2] = 0;
    HEAP32[($3_1 + 8) >> 2] = 1049548;
    HEAP32[($3_1 + 36) >> 2] = 2;
    HEAP32[($3_1 + 24) >> 2] = $3_1 + 32;
    HEAP32[($3_1 + 40) >> 2] = $3_1;
    HEAP32[($3_1 + 32) >> 2] = $3_1 + 4;
    $43($3_1 + 8, $2_1);
    abort();
  }

  function $32($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$1 = 0,
      $2_1 = 0,
      $15_1 = 0,
      $20_1 = 0,
      $23_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    HEAP32[($2_1 + 4) >> 2] = HEAP32[$0_1 >> 2];
    $0_1 = $2_1 + 8;
    i64toi32_i32$2 = $1_1 + 16;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $15_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1 + 16;
    HEAP32[i64toi32_i32$0 >> 2] = $15_1;
    HEAP32[(i64toi32_i32$0 + 4) >> 2] = i64toi32_i32$1;
    i64toi32_i32$2 = $1_1 + 8;
    i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $20_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1 + 8;
    HEAP32[i64toi32_i32$1 >> 2] = $20_1;
    HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    i64toi32_i32$2 = $1_1;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $23_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $2_1;
    HEAP32[(i64toi32_i32$0 + 8) >> 2] = $23_1;
    HEAP32[(i64toi32_i32$0 + 12) >> 2] = i64toi32_i32$1;
    $0_1 = $8(i64toi32_i32$0 + 4, 1048912, $0_1);
    global$0 = i64toi32_i32$0 + 32;
    return $0_1;
  }

  function $33($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $1_1 = global$0 - 48;
    global$0 = $1_1;
    if(HEAPU8[1054212 >> 0]) {
      HEAP32[($1_1 + 28) >> 2] = 1;
      HEAP32[($1_1 + 12) >> 2] = 2;
      HEAP32[($1_1 + 16) >> 2] = 0;
      HEAP32[($1_1 + 8) >> 2] = 1049016;
      HEAP32[($1_1 + 36) >> 2] = 2;
      HEAP32[($1_1 + 44) >> 2] = $0_1;
      HEAP32[($1_1 + 24) >> 2] = $1_1 + 32;
      HEAP32[($1_1 + 32) >> 2] = $1_1 + 44;
      $43($1_1 + 8, 1049056);
      abort();
    }
    global$0 = $1_1 + 48;
  }

  function $34($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$1 = 0,
      $2_1 = 0,
      $15_1 = 0,
      $20_1 = 0,
      $23_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    HEAP32[($2_1 + 4) >> 2] = HEAP32[$0_1 >> 2];
    $0_1 = $2_1 + 8;
    i64toi32_i32$2 = $1_1 + 16;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $15_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1 + 16;
    HEAP32[i64toi32_i32$0 >> 2] = $15_1;
    HEAP32[(i64toi32_i32$0 + 4) >> 2] = i64toi32_i32$1;
    i64toi32_i32$2 = $1_1 + 8;
    i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $20_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1 + 8;
    HEAP32[i64toi32_i32$1 >> 2] = $20_1;
    HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    i64toi32_i32$2 = $1_1;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $23_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $2_1;
    HEAP32[(i64toi32_i32$0 + 8) >> 2] = $23_1;
    HEAP32[(i64toi32_i32$0 + 12) >> 2] = i64toi32_i32$1;
    $0_1 = $8(i64toi32_i32$0 + 4, 1049204, $0_1);
    global$0 = i64toi32_i32$0 + 32;
    return $0_1;
  }

  function $35($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$1 = 0,
      $2_1 = 0,
      $15_1 = 0,
      $20_1 = 0,
      $23_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    HEAP32[($2_1 + 4) >> 2] = HEAP32[$0_1 >> 2];
    $0_1 = $2_1 + 8;
    i64toi32_i32$2 = $1_1 + 16;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $15_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1 + 16;
    HEAP32[i64toi32_i32$0 >> 2] = $15_1;
    HEAP32[(i64toi32_i32$0 + 4) >> 2] = i64toi32_i32$1;
    i64toi32_i32$2 = $1_1 + 8;
    i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $20_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1 + 8;
    HEAP32[i64toi32_i32$1 >> 2] = $20_1;
    HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    i64toi32_i32$2 = $1_1;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $23_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $2_1;
    HEAP32[(i64toi32_i32$0 + 8) >> 2] = $23_1;
    HEAP32[(i64toi32_i32$0 + 12) >> 2] = i64toi32_i32$1;
    $0_1 = $8(i64toi32_i32$0 + 4, 1049912, $0_1);
    global$0 = i64toi32_i32$0 + 32;
    return $0_1;
  }

  function $36($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$1 = 0,
      $2_1 = 0,
      $14_1 = 0,
      $19_1 = 0,
      $22_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    HEAP32[($2_1 + 4) >> 2] = $0_1;
    $0_1 = $2_1 + 8;
    i64toi32_i32$2 = $1_1 + 16;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $14_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1 + 16;
    HEAP32[i64toi32_i32$0 >> 2] = $14_1;
    HEAP32[(i64toi32_i32$0 + 4) >> 2] = i64toi32_i32$1;
    i64toi32_i32$2 = $1_1 + 8;
    i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $19_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1 + 8;
    HEAP32[i64toi32_i32$1 >> 2] = $19_1;
    HEAP32[(i64toi32_i32$1 + 4) >> 2] = i64toi32_i32$0;
    i64toi32_i32$2 = $1_1;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2];
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4) >> 2];
    $22_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $2_1;
    HEAP32[(i64toi32_i32$0 + 8) >> 2] = $22_1;
    HEAP32[(i64toi32_i32$0 + 12) >> 2] = i64toi32_i32$1;
    $0_1 = $8(i64toi32_i32$0 + 4, 1049912, $0_1);
    global$0 = i64toi32_i32$0 + 32;
    return $0_1;
  }

  function $37($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $40_1 = 0,
      $37_1 = 0;
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    $3_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1049468, 13);
    HEAP8[($2_1 + 5) >> 0] = 0;
    HEAP8[($2_1 + 4) >> 0] = $3_1;
    HEAP32[$2_1 >> 2] = $1_1;
    HEAP32[($2_1 + 12) >> 2] = $0_1;
    $1_1 = $2_1 + 12;
    $11($2_1, 1049440, 5, $1_1, 1049424);
    HEAP32[($2_1 + 12) >> 2] = $0_1 + 12;
    $11($2_1, 1049445, 5, $1_1, 1049452);
    $0_1 = $2_1;
    $3_1 = HEAPU8[($2_1 + 4) >> 0];
    if(HEAPU8[($2_1 + 5) >> 0]) {
      $37_1 = $0_1;
      label$2: {
        $40_1 = 1;
        if($3_1 & 0xff) {
          break label$2
        }
        $1_1 = HEAP32[$0_1 >> 2];
        if(!((HEAPU8[$1_1 >> 0]) & 4)) {
          $40_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1049683, 2);
          break label$2;
        }
        $40_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1049682, 1);
      }
      $3_1 = $40_1;
      HEAP8[($37_1 + 4) >> 0] = $3_1;
    }
    global$0 = $2_1 + 16;
    return ($3_1 & 0xff) != (0);
  }

  function $38($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $4_1 = 0;
    $3_1 = HEAP32[$0_1 >> 2];
    $4_1 = $3_1 + 8;
    $0_1 = HEAP32[$4_1 >> 2];
    if($2_1 >>> 0 > ((HEAP32[($3_1 + 4) >> 2]) - $0_1) >>> 0) {
      $22($3_1, $0_1, $2_1);
      $0_1 = HEAP32[$4_1 >> 2];
    }
    memcpy((HEAP32[$3_1 >> 2]) + $0_1, $1_1, $2_1);
    HEAP32[$4_1 >> 2] = $0_1 + $2_1;
    return 0;
  }

  function $39($0_1, $1_1, $2_1, $3_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    var $14_1 = 0;
    label$1: {
      label$2: {
        if(($1_1) != (1114112)) {
          $14_1 = 1;
          if(FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 16) >> 2]](HEAP32[($0_1 + 24) >> 2], $1_1)) {
            break label$2
          }
        }
        if($2_1) {
          break label$1
        }
        $14_1 = 0;
      }
      return $14_1;
    }
    return FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($0_1 + 24) >> 2], $2_1, $3_1);
  }

  function $40($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    HEAP32[($2_1 + 20) >> 2] = 0;
    HEAP32[($2_1 + 16) >> 2] = 1049484;
    HEAP32[($2_1 + 4) >> 2] = 1;
    HEAP32[($2_1 + 8) >> 2] = 0;
    HEAP32[($2_1 + 28) >> 2] = 43;
    HEAP32[($2_1 + 24) >> 2] = $0_1;
    HEAP32[$2_1 >> 2] = $2_1 + 24;
    $43($2_1, $1_1);
    abort();
  }

  function $41($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0;
    $2_1 = HEAP32[($1_1 + 4) >> 2];
    $3_1 = HEAP32[$1_1 >> 2];
    $1_1 = _malloc(8, 4);
    if(!$1_1) {
      $0_1 = HEAP32[1054248 >> 2];
      FUNCTION_TABLE[($0_1 ? $0_1 : 13)](8, 4);
      abort();
    }
    HEAP32[($1_1 + 4) >> 2] = $2_1;
    HEAP32[$1_1 >> 2] = $3_1;
    HEAP32[($0_1 + 4) >> 2] = 1049148;
    HEAP32[$0_1 >> 2] = $1_1;
  }

  function $42() {
    var $0_1 = 0;
    $0_1 = global$0 - 32;
    global$0 = $0_1;
    HEAP32[($0_1 + 28) >> 2] = 0;
    HEAP32[($0_1 + 24) >> 2] = 1049244;
    HEAP32[($0_1 + 12) >> 2] = 1;
    HEAP32[($0_1 + 16) >> 2] = 0;
    HEAP32[($0_1 + 8) >> 2] = 1049308;
    $43($0_1 + 8, 1049316);
    abort();
  }

  function $43($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0,
      $50_1 = 0;
    $2_1 = global$0 - 32;
    global$0 = $2_1;
    HEAP8[($2_1 + 24) >> 0] = 1;
    HEAP32[($2_1 + 20) >> 2] = $1_1;
    HEAP32[($2_1 + 16) >> 2] = $0_1;
    HEAP32[($2_1 + 12) >> 2] = 1049608;
    HEAP32[($2_1 + 8) >> 2] = 1049484;
    $0_1 = global$0 - 16;
    global$0 = $0_1;
    $1_1 = $2_1 + 8;
    $2_1 = HEAP32[($1_1 + 12) >> 2];
    if(!$2_1) {
      $40(1048936, 1049100);
      abort();
    }
    $4_1 = HEAP32[($1_1 + 8) >> 2];
    if(!$4_1) {
      $40(1048936, 1049116);
      abort();
    }
    HEAP32[($0_1 + 8) >> 2] = $2_1;
    HEAP32[($0_1 + 4) >> 2] = $1_1;
    HEAP32[$0_1 >> 2] = $4_1;
    $1_1 = HEAP32[$0_1 >> 2];
    $2_1 = HEAP32[($0_1 + 4) >> 2];
    $4_1 = HEAP32[($0_1 + 8) >> 2];
    $0_1 = global$0 - 16;
    global$0 = $0_1;
    $3_1 = HEAP32[($1_1 + 20) >> 2];
    label$3: {
      label$4: {
        label$5: {
          switch(HEAP32[($1_1 + 4) >> 2]) {
            case 0:
              if($3_1) {
                break label$3
              }
              $1_1 = 0;
              $50_1 = 1048936;
              break label$4;
            case 1:
              break label$5;
            default:
              break label$3;
          };
        }
        if($3_1) {
          break label$3
        }
        $3_1 = HEAP32[$1_1 >> 2];
        $1_1 = HEAP32[($3_1 + 4) >> 2];
        $50_1 = HEAP32[$3_1 >> 2];
      }
      $3_1 = $50_1;
      HEAP32[($0_1 + 4) >> 2] = $1_1;
      HEAP32[$0_1 >> 2] = $3_1;
      $21($0_1, 1049184, HEAP32[($2_1 + 8) >> 2], $4_1, HEAPU8[($2_1 + 16) >> 0]);
      abort();
    }
    HEAP32[($0_1 + 4) >> 2] = 0;
    HEAP32[$0_1 >> 2] = $1_1;
    $21($0_1, 1049164, HEAP32[($2_1 + 8) >> 2], $4_1, HEAPU8[($2_1 + 16) >> 0]);
    abort();
  }

  function malloc($0_1) {
    $0_1 = $0_1;
    label$1: {
      if($0_1 >>> 0 > -4 >>> 0) {
        break label$1
      }
      if(!$0_1) {
        return 4
      }
      $0_1 = _malloc($0_1, ($0_1 >>> 0 < -3 >>> 0) << 2);
      if(!$0_1) {
        break label$1
      }
      return $0_1;
    }
    abort();
  }

  function $45($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $4_1 = 0,
      $3_1 = 0,
      i64toi32_i32$1 = 0;
    $0_1 = HEAP32[$0_1 >> 2];
    if(!(((HEAPU8[$1_1 >> 0]) & 16) >>> 4)) {
      if(!(((HEAPU8[$1_1 >> 0]) & 32) >>> 5)) {
        i64toi32_i32$1 = 0;
        return $13(HEAPU8[$0_1 >> 0], i64toi32_i32$1, $1_1);
      }
      $3_1 = global$0 - 128;
      global$0 = $3_1;
      $2_1 = HEAPU8[$0_1 >> 0];
      $0_1 = 0;
      label$3: while(1) {
        $4_1 = $2_1 & 0xf;
        HEAP8[(($0_1 + $3_1) + 127) >> 0] = ($4_1 >>> 0 < 10 >>> 0 ? 48 : 55) + $4_1;
        $0_1 = $0_1 - 1;
        $4_1 = $2_1 & 0xff;
        $2_1 = $4_1 >>> 4;
        if($4_1 >>> 0 > 15 >>> 0) {
          continue label$3
        }
        break label$3;
      };
      $2_1 = $0_1 + 128;
      if($2_1 >>> 0 >= 129 >>> 0) {
        $67($2_1, 128);
        abort();
      }
      $0_1 = $3($1_1, 1049709, 2, ($0_1 + $3_1) + 128, 0 - $0_1);
      global$0 = $3_1 + 128;
      return $0_1;
    }
    $3_1 = global$0 - 128;
    global$0 = $3_1;
    $2_1 = HEAPU8[$0_1 >> 0];
    $0_1 = 0;
    label$5: while(1) {
      $4_1 = $2_1 & 0xf;
      HEAP8[(($0_1 + $3_1) + 127) >> 0] = ($4_1 >>> 0 < 10 >>> 0 ? 48 : 87) + $4_1;
      $0_1 = $0_1 - 1;
      $4_1 = $2_1 & 0xff;
      $2_1 = $4_1 >>> 4;
      if($4_1 >>> 0 > 15 >>> 0) {
        continue label$5
      }
      break label$5;
    };
    $2_1 = $0_1 + 128;
    if($2_1 >>> 0 >= 129 >>> 0) {
      $67($2_1, 128);
      abort();
    }
    $0_1 = $3($1_1, 1049709, 2, ($0_1 + $3_1) + 128, 0 - $0_1);
    global$0 = $3_1 + 128;
    return $0_1;
  }

  function $46($0_1, $1_1, $2_1, $3_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    var $4_1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $42_1 = 0,
      $207 = 0,
      i64toi32_i32$0 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $63_1 = 0,
      $36_1 = 0;
    $4_1 = global$0 - 16;
    global$0 = $4_1;
    HEAP32[($4_1 + 12) >> 2] = $3_1;
    HEAP32[($4_1 + 8) >> 2] = $2_1;
    HEAP32[($4_1 + 4) >> 2] = $1_1;
    HEAP32[$4_1 >> 2] = $0_1;
    $2_1 = HEAP32[($4_1 + 4) >> 2];
    $1_1 = HEAP32[($4_1 + 8) >> 2];
    $3_1 = HEAP32[($4_1 + 12) >> 2];
    $5_1 = HEAP32[$4_1 >> 2];
    $0_1 = global$0 - 112;
    global$0 = $0_1;
    HEAP32[($0_1 + 12) >> 2] = $3_1;
    HEAP32[($0_1 + 8) >> 2] = $1_1;
    label$1: {
      label$2: {
        label$3: {
          label$4: {
            label$5: {
              $4_1 = $0_1;
              $36_1 = $4_1;
              label$6: {
                label$7: {
                  if($2_1 >>> 0 >= 257 >>> 0) {
                    label$9: {
                      $42_1 = 256;
                      if((HEAP8[($5_1 + 256) >> 0]) > (-65)) {
                        break label$9
                      }
                      $42_1 = 0xff;
                      if((HEAP8[($5_1 + 0xff) >> 0]) > (-65)) {
                        break label$9
                      }
                      $42_1 = 254;
                      if((HEAP8[($5_1 + 254) >> 0]) > (-65)) {
                        break label$9
                      }
                      $42_1 = 253;
                    }
                    $0_1 = $42_1;
                    if($0_1 >>> 0 < $2_1 >>> 0) {
                      break label$7
                    }
                    if(($0_1) != ($2_1)) {
                      break label$5
                    }
                  }
                  HEAP32[($4_1 + 20) >> 2] = $2_1;
                  HEAP32[($4_1 + 16) >> 2] = $5_1;
                  $6_1 = 1049484;
                  $63_1 = 0;
                  break label$6;
                }
                HEAP32[($4_1 + 20) >> 2] = $0_1;
                HEAP32[($4_1 + 16) >> 2] = $5_1;
                $6_1 = 1050451;
                $63_1 = 5;
              }
              HEAP32[($36_1 + 28) >> 2] = $63_1;
              HEAP32[($4_1 + 24) >> 2] = $6_1;
              $0_1 = $1_1 >>> 0 > $2_1 >>> 0;
              if($0_1) {
                break label$4
              }
              if($2_1 >>> 0 < $3_1 >>> 0) {
                break label$4
              }
              if($1_1 >>> 0 <= $3_1 >>> 0) {
                label$11: {
                  label$12: {
                    if(!$1_1) {
                      break label$12
                    }
                    if($1_1 >>> 0 >= $2_1 >>> 0) {
                      if(($1_1) == ($2_1)) {
                        break label$12
                      }
                      break label$11;
                    }
                    if((HEAP8[($1_1 + $5_1) >> 0]) < (-64)) {
                      break label$11
                    }
                  }
                  $1_1 = $3_1;
                }
                HEAP32[($4_1 + 32) >> 2] = $1_1;
                $0_1 = $2_1;
                if($0_1 >>> 0 > $1_1 >>> 0) {
                  $3_1 = $1_1 + 1;
                  $0_1 = $1_1 - 3;
                  $0_1 = $0_1 >>> 0 > $1_1 >>> 0 ? 0 : $0_1;
                  if($3_1 >>> 0 < $0_1 >>> 0) {
                    break label$3
                  }
                  label$15: {
                    if(($0_1) == ($3_1)) {
                      break label$15
                    }
                    $7_1 = $0_1 + $5_1;
                    $3_1 = ($3_1 + $5_1) - $7_1;
                    $8_1 = $1_1 + $5_1;
                    if((HEAP8[$8_1 >> 0]) > (-65)) {
                      $6_1 = $3_1 - 1;
                      break label$15;
                    }
                    if(($0_1) == ($1_1)) {
                      break label$15
                    }
                    $1_1 = $8_1 - 1;
                    if((HEAP8[$1_1 >> 0]) > (-65)) {
                      $6_1 = $3_1 - 2;
                      break label$15;
                    }
                    if(($1_1) == ($7_1)) {
                      break label$15
                    }
                    $1_1 = $8_1 - 2;
                    if((HEAP8[$1_1 >> 0]) > (-65)) {
                      $6_1 = $3_1 - 3;
                      break label$15;
                    }
                    if(($1_1) == ($7_1)) {
                      break label$15
                    }
                    $1_1 = $8_1 - 3;
                    if((HEAP8[$1_1 >> 0]) > (-65)) {
                      $6_1 = $3_1 - 4;
                      break label$15;
                    }
                    if(($1_1) == ($7_1)) {
                      break label$15
                    }
                    $6_1 = $3_1 - 5;
                  }
                  $0_1 = $0_1 + $6_1;
                }
                label$20: {
                  if(!$0_1) {
                    break label$20
                  }
                  if($0_1 >>> 0 >= $2_1 >>> 0) {
                    if(($0_1) == ($2_1)) {
                      break label$20
                    }
                    break label$1;
                  }
                  if((HEAP8[($0_1 + $5_1) >> 0]) <= (-65)) {
                    break label$1
                  }
                }
                if(($0_1) == ($2_1)) {
                  break label$2
                }
                label$22: {
                  label$23: {
                    label$24: {
                      $2_1 = $0_1 + $5_1;
                      $1_1 = HEAP8[$2_1 >> 0];
                      if(($1_1) <= (-1)) {
                        $5_1 = (HEAPU8[($2_1 + 1) >> 0]) & 63;
                        $3_1 = $1_1 & 31;
                        if($1_1 >>> 0 > -33 >>> 0) {
                          break label$24
                        }
                        $1_1 = $3_1 << 6 | $5_1;
                        break label$23;
                      }
                      HEAP32[($4_1 + 36) >> 2] = $1_1 & 0xff;
                      $207 = 1;
                      break label$22;
                    }
                    $5_1 = (HEAPU8[($2_1 + 2) >> 0]) & 63 | ($5_1 << 6);
                    if($1_1 >>> 0 < -16 >>> 0) {
                      $1_1 = $5_1 | ($3_1 << 12);
                      break label$23;
                    }
                    $1_1 = ($3_1 << 18) & 1835008 | ((HEAPU8[($2_1 + 3) >> 0]) & 63 | ($5_1 << 6));
                    if(($1_1) == (1114112)) {
                      break label$2
                    }
                  }
                  HEAP32[($4_1 + 36) >> 2] = $1_1;
                  $207 = 1;
                  if($1_1 >>> 0 < 128 >>> 0) {
                    break label$22
                  }
                  $207 = 2;
                  if($1_1 >>> 0 < 2048 >>> 0) {
                    break label$22
                  }
                  $207 = $1_1 >>> 0 < 65536 >>> 0 ? 3 : 4;
                }
                $2_1 = $207;
                HEAP32[($4_1 + 40) >> 2] = $0_1;
                HEAP32[($4_1 + 44) >> 2] = $0_1 + $2_1;
                $0_1 = $4_1 + 48;
                HEAP32[($0_1 + 20) >> 2] = 5;
                HEAP32[($4_1 + 108) >> 2] = 34;
                HEAP32[($4_1 + 100) >> 2] = 34;
                $1_1 = $4_1 + 72;
                HEAP32[($1_1 + 20) >> 2] = 35;
                HEAP32[($4_1 + 84) >> 2] = 36;
                i64toi32_i32$0 = 0;
                HEAP32[($4_1 + 52) >> 2] = 5;
                HEAP32[($4_1 + 56) >> 2] = i64toi32_i32$0;
                HEAP32[($4_1 + 48) >> 2] = 1050684;
                HEAP32[($4_1 + 76) >> 2] = 2;
                HEAP32[($4_1 + 64) >> 2] = $1_1;
                HEAP32[($4_1 + 104) >> 2] = $4_1 + 24;
                HEAP32[($4_1 + 96) >> 2] = $4_1 + 16;
                HEAP32[($4_1 + 88) >> 2] = $4_1 + 40;
                HEAP32[($4_1 + 80) >> 2] = $4_1 + 36;
                HEAP32[($4_1 + 72) >> 2] = $4_1 + 32;
                $43($0_1, 1050724);
                abort();
              }
              HEAP32[($4_1 + 100) >> 2] = 34;
              $0_1 = $4_1 + 72;
              HEAP32[($0_1 + 20) >> 2] = 34;
              HEAP32[($4_1 + 84) >> 2] = 2;
              $1_1 = $4_1 + 48;
              HEAP32[($1_1 + 20) >> 2] = 4;
              i64toi32_i32$0 = 0;
              HEAP32[($4_1 + 52) >> 2] = 4;
              HEAP32[($4_1 + 56) >> 2] = i64toi32_i32$0;
              HEAP32[($4_1 + 48) >> 2] = 1050568;
              HEAP32[($4_1 + 76) >> 2] = 2;
              HEAP32[($4_1 + 64) >> 2] = $0_1;
              HEAP32[($4_1 + 96) >> 2] = $4_1 + 24;
              HEAP32[($4_1 + 88) >> 2] = $4_1 + 16;
              HEAP32[($4_1 + 80) >> 2] = $4_1 + 12;
              HEAP32[($4_1 + 72) >> 2] = $4_1 + 8;
              $43($1_1, 1050600);
              abort();
            }
            $46($5_1, $2_1, 0, $0_1);
            abort();
          }
          HEAP32[($4_1 + 40) >> 2] = $0_1 ? $1_1 : $3_1;
          $0_1 = $4_1 + 48;
          HEAP32[($0_1 + 20) >> 2] = 3;
          $1_1 = $4_1 + 72;
          HEAP32[($1_1 + 20) >> 2] = 34;
          HEAP32[($4_1 + 84) >> 2] = 34;
          i64toi32_i32$0 = 0;
          HEAP32[($4_1 + 52) >> 2] = 3;
          HEAP32[($4_1 + 56) >> 2] = i64toi32_i32$0;
          HEAP32[($4_1 + 48) >> 2] = 1050492;
          HEAP32[($4_1 + 76) >> 2] = 2;
          HEAP32[($4_1 + 64) >> 2] = $1_1;
          HEAP32[($4_1 + 88) >> 2] = $4_1 + 24;
          HEAP32[($4_1 + 80) >> 2] = $4_1 + 16;
          HEAP32[($4_1 + 72) >> 2] = $4_1 + 40;
          $43($0_1, 1050516);
          abort();
        }
        $69($0_1, $3_1);
        abort();
      }
      $40(1049564, 1050616);
      abort();
    }
    $46($5_1, $2_1, $0_1, $2_1);
    abort();
  }

  function $47($0_1) {
    $0_1 = $0_1;
    var $1_1 = 0;
    label$1: {
      $1_1 = HEAP32[($0_1 + 4) >> 2];
      if(!$1_1) {
        break label$1
      }
      $0_1 = HEAP32[($0_1 + 8) >> 2];
      if(!$0_1) {
        break label$1
      }
      _free($1_1, $0_1, 1);
    }
  }

  function realloc($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    label$1: {
      if($1_1 >>> 0 <= -4 >>> 0) {
        $0_1 = _realloc($0_1, $1_1, 4, $2_1);
        if($0_1) {
          break label$1
        }
      }
      abort();
    }
    return $0_1;
  }

  function $49($0_1) {
    $0_1 = $0_1;
    var $1_1 = 0;
    $1_1 = HEAP32[($0_1 + 4) >> 2];
    if($1_1) {
      _free(HEAP32[$0_1 >> 2], $1_1, 1)
    }
  }

  function $50($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1052296, 5);
  }

  /**
   * @param {*} $0_1 ptr
   * @param {*} $1_1 new size
   * @param {*} $2_1 
   * @param {*} $3_1 old size
   * @returns new ptr
   */
  function _realloc($0_1, $1_1, $2_1, $3_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    $3_1 = $3_1;
    var $4_1 = 0;
    $4_1 = __malloc($3_1, $2_1);
    if($4_1) {
      memcpy($4_1, $0_1, ($1_1 >>> 0 > $3_1 >>> 0 ? $3_1 : $1_1));
      __free($0_1, $1_1, $2_1);
    }
    return $4_1;
  }

  function free($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    if($1_1) {
      _free($0_1, $1_1, 4)
    }
  }

  function $53($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return FUNCTION_TABLE[HEAP32[((HEAP32[($0_1 + 4) >> 2]) + 12) >> 2]](HEAP32[$0_1 >> 2], $1_1);
  }

  function $54($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return $2($1_1, HEAP32[$0_1 >> 2], HEAP32[($0_1 + 8) >> 2]);
  }

  function _malloc($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return __malloc($0_1, $1_1);
  }

  function $56($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $4_1 = 0,
      $3_1 = 0,
      $23_1 = 0;
    $3_1 = HEAP32[$0_1 >> 2];
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    label$1: {
      label$2: {
        label$3: {
          if($1_1 >>> 0 >= 128 >>> 0) {
            HEAP32[($2_1 + 12) >> 2] = 0;
            if($1_1 >>> 0 >= 2048 >>> 0) {
              break label$3
            }
            HEAP8[($2_1 + 13) >> 0] = $1_1 & 63 | 128;
            HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 6 | 192;
            $23_1 = 2;
            break label$2;
          }
          $4_1 = HEAP32[($3_1 + 8) >> 2];
          if(($4_1) == (HEAP32[($3_1 + 4) >> 2])) {
            $23($3_1, $4_1);
            $4_1 = HEAP32[($3_1 + 8) >> 2];
          }
          HEAP32[($3_1 + 8) >> 2] = $4_1 + 1;
          HEAP8[((HEAP32[$3_1 >> 2]) + $4_1) >> 0] = $1_1;
          break label$1;
        }
        if($1_1 >>> 0 >= 65536 >>> 0) {
          HEAP8[($2_1 + 15) >> 0] = $1_1 & 63 | 128;
          HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 18 | 240;
          HEAP8[($2_1 + 14) >> 0] = ($1_1 >>> 6) & 63 | 128;
          HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 12) & 63 | 128;
          $23_1 = 4;
          break label$2;
        }
        HEAP8[($2_1 + 14) >> 0] = $1_1 & 63 | 128;
        HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 12 | 224;
        HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 6) & 63 | 128;
        $23_1 = 3;
      }
      $0_1 = $23_1;
      $1_1 = $3_1 + 8;
      $4_1 = HEAP32[$1_1 >> 2];
      if($0_1 >>> 0 > ((HEAP32[($3_1 + 4) >> 2]) - $4_1) >>> 0) {
        $22($3_1, $4_1, $0_1);
        $4_1 = HEAP32[$1_1 >> 2];
      }
      memcpy((HEAP32[$3_1 >> 2]) + $4_1, $2_1 + 12, $0_1);
      HEAP32[$1_1 >> 2] = $0_1 + $4_1;
    }
    global$0 = $2_1 + 16;
    return 0;
  }

  function $57($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    HEAP32[($0_1 + 4) >> 2] = 1049148;
    HEAP32[$0_1 >> 2] = $1_1;
  }

  function $58($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return $2($1_1, HEAP32[$0_1 >> 2], HEAP32[($0_1 + 4) >> 2]);
  }

  function _free($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    __free($0_1, $1_1, $2_1);
  }

  function $60($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $4_1 = 0,
      $3_1 = 0,
      $30_1 = 0;
    $3_1 = HEAP32[$0_1 >> 2];
    $2_1 = global$0 - 16;
    global$0 = $2_1;
    label$1: {
      label$2: {
        label$3: {
          label$4: {
            if($1_1 >>> 0 >= 128 >>> 0) {
              HEAP32[($2_1 + 12) >> 2] = 0;
              if($1_1 >>> 0 < 2048 >>> 0) {
                break label$4
              }
              if($1_1 >>> 0 >= 65536 >>> 0) {
                break label$3
              }
              HEAP8[($2_1 + 14) >> 0] = $1_1 & 63 | 128;
              HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 12 | 224;
              HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 6) & 63 | 128;
              $30_1 = 3;
              break label$2;
            }
            $4_1 = HEAP32[($3_1 + 8) >> 2];
            if(($4_1) == (HEAP32[($3_1 + 4) >> 2])) {
              $23($3_1, $4_1);
              $4_1 = HEAP32[($3_1 + 8) >> 2];
            }
            HEAP32[($3_1 + 8) >> 2] = $4_1 + 1;
            HEAP8[((HEAP32[$3_1 >> 2]) + $4_1) >> 0] = $1_1;
            break label$1;
          }
          HEAP8[($2_1 + 13) >> 0] = $1_1 & 63 | 128;
          HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 6 | 192;
          $30_1 = 2;
          break label$2;
        }
        HEAP8[($2_1 + 15) >> 0] = $1_1 & 63 | 128;
        HEAP8[($2_1 + 12) >> 0] = $1_1 >>> 18 | 240;
        HEAP8[($2_1 + 14) >> 0] = ($1_1 >>> 6) & 63 | 128;
        HEAP8[($2_1 + 13) >> 0] = ($1_1 >>> 12) & 63 | 128;
        $30_1 = 4;
      }
      $0_1 = $30_1;
      $1_1 = $3_1 + 8;
      $4_1 = HEAP32[$1_1 >> 2];
      if($0_1 >>> 0 > ((HEAP32[($3_1 + 4) >> 2]) - $4_1) >>> 0) {
        $22($3_1, $4_1, $0_1);
        $4_1 = HEAP32[$1_1 >> 2];
      }
      memcpy((HEAP32[$3_1 >> 2]) + $4_1, $2_1 + 12, $0_1);
      HEAP32[$1_1 >> 2] = $0_1 + $4_1;
    }
    global$0 = $2_1 + 16;
    return 0;
  }

  function $61($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    HEAP32[$0_1 >> 2];
    label$1: while(1) continue label$1;
  }

  function $62($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var i64toi32_i32$1 = 0;
    i64toi32_i32$1 = 0;
    return $13(HEAP32[$0_1 >> 2], i64toi32_i32$1, $1_1);
  }

  function $63($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    return $4(HEAP32[$0_1 >> 2], $1_1, $2_1);
  }

  function add_to_stack_pointer($0_1) {
    $0_1 = $0_1;
    global$0 = $0_1 + global$0;
    return global$0;
  }

  /**
   * Weird SHA1 implementation, going 64 bytes at a time
   * @param {*} $0_1 output
   * @param {*} $1_1 input
   * @param {*} $2_1 len
   */
  function sha1($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $5_1 = 0,
      $4_1 = 0,
      $6_1 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $11_1 = 0,
      $12_1 = 0,
      $10_1 = 0,
      $14_1 = 0,
      $13_1 = 0,
      $15_1 = 0,
      $16_1 = 0,
      $17_1 = 0,
      $18_1 = 0,
      $19_1 = 0,
      $22_1 = 0,
      $23_1 = 0,
      $24_1 = 0,
      $25_1 = 0,
      $21_1 = 0,
      $20_1 = 0,
      $29_1 = 0,
      $30_1 = 0,
      $26_1 = 0,
      $27_1 = 0,
      $28_1 = 0,
      $32_1 = 0,
      $33_1 = 0,
      $34_1 = 0,
      $35_1 = 0,
      $36_1 = 0,
      $37_1 = 0,
      $38_1 = 0,
      $39_1 = 0,
      $40_1 = 0,
      $41_1 = 0,
      $42_1 = 0,
      $43_1 = 0,
      $44_1 = 0,
      $45_1 = 0,
      $46_1 = 0,
      $47_1 = 0,
      $48_1 = 0,
      $49_1 = 0,
      $50_1 = 0,
      $51_1 = 0,
      $52_1 = 0,
      $53_1 = 0,
      $54_1 = 0,
      $55_1 = 0,
      $56_1 = 0,
      $57_1 = 0,
      $58_1 = 0,
      $59_1 = 0,
      $60_1 = 0,
      $61_1 = 0,
      $62_1 = 0,
      $63_1 = 0,
      $65_1 = 0,
      $66_1 = 0,
      $67_1 = 0,
      $68_1 = 0,
      $69_1 = 0,
      $70_1 = 0,
      $71_1 = 0,
      $31_1 = 0,
      $109 = 0,
      $110 = 0,
      $111 = 0,
      $112 = 0,
      $113 = 0,
      $114 = 0,
      $115 = 0,
      $116 = 0,
      $117 = 0,
      $118 = 0,
      $119 = 0,
      $120 = 0,
      $121 = 0,
      $122 = 0,
      $123 = 0,
      $64_1 = 0,
      $73_1 = 0,
      $74_1 = 0,
      $75_1 = 0,
      $76_1 = 0,
      $72_1 = 0,
      $77_1 = 0,
      $78_1 = 0,
      $82 = 0,
      $79_1 = 0,
      $80_1 = 0,
      $81_1 = 0,
      $843 = 0,
      $860 = 0,
      $879 = 0,
      $925 = 0,
      $981 = 0,
      $1000 = 0,
      $1049 = 0,
      $1066 = 0,
      $1083 = 0,
      $1115 = 0,
      $1134 = 0,
      $1226 = 0,
      $1251 = 0,
      $1326 = 0,
      $1376 = 0,
      $1401 = 0,
      $1452 = 0,
      $1527 = 0,
      $1736 = 0,
      $1791 = 0,
      $1812 = 0,
      $1974 = 0,
      $2015 = 0,
      $2065 = 0,
      $2104 = 0,
      $2172 = 0;
    $31_1 = HEAP32[($0_1 + 16) >> 2];
    $26_1 = HEAP32[($0_1 + 12) >> 2];
    $20_1 = HEAP32[($0_1 + 8) >> 2];
    $28_1 = HEAP32[($0_1 + 4) >> 2];
    $27_1 = HEAP32[$0_1 >> 2];
    if($2_1) {
      $81_1 = $1_1 + $2_1 * 64;
      label$2: while(1) {
        $109 = $1_1 + 20;
        $2_1 = HEAPU8[$109 >> 0] | ((HEAPU8[($109 + 1) >> 0]) << 8) | ((HEAPU8[($109 + 2) >> 0]) << 16 | ((HEAPU8[($109 + 3) >> 0]) << 24));
        $29_1 = ($2_1 << 8) & 0xff0000 | ($2_1 << 24) | (($2_1 >>> 8) & 0xff00 | ($2_1 >>> 24));
        $110 = $1_1 + 12;
        $2_1 = HEAPU8[$110 >> 0] | ((HEAPU8[($110 + 1) >> 0]) << 8) | ((HEAPU8[($110 + 2) >> 0]) << 16 | ((HEAPU8[($110 + 3) >> 0]) << 24));
        $16_1 = ($2_1 << 8) & 0xff0000 | ($2_1 << 24) | (($2_1 >>> 8) & 0xff00 | ($2_1 >>> 24));
        $111 = $1_1 + 44;
        $2_1 = HEAPU8[$111 >> 0] | ((HEAPU8[($111 + 1) >> 0]) << 8) | ((HEAPU8[($111 + 2) >> 0]) << 16 | ((HEAPU8[($111 + 3) >> 0]) << 24));
        $21_1 = ($2_1 << 8) & 0xff0000 | ($2_1 << 24) | (($2_1 >>> 8) & 0xff00 | ($2_1 >>> 24));
        $112 = $1_1 + 8;
        $2_1 = HEAPU8[$112 >> 0] | ((HEAPU8[($112 + 1) >> 0]) << 8) | ((HEAPU8[($112 + 2) >> 0]) << 16 | ((HEAPU8[($112 + 3) >> 0]) << 24));
        $12_1 = ($2_1 << 8) & 0xff0000 | ($2_1 << 24) | (($2_1 >>> 8) & 0xff00 | ($2_1 >>> 24));
        $2_1 = HEAPU8[$1_1 >> 0] | ((HEAPU8[($1_1 + 1) >> 0]) << 8) | ((HEAPU8[($1_1 + 2) >> 0]) << 16 | ((HEAPU8[($1_1 + 3) >> 0]) << 24));
        $10_1 = ($2_1 << 8) & 0xff0000 | ($2_1 << 24) | (($2_1 >>> 8) & 0xff00 | ($2_1 >>> 24));
        $113 = $1_1 + 32;
        $2_1 = HEAPU8[$113 >> 0] | ((HEAPU8[($113 + 1) >> 0]) << 8) | ((HEAPU8[($113 + 2) >> 0]) << 16 | ((HEAPU8[($113 + 3) >> 0]) << 24));
        $17_1 = ($2_1 << 8) & 0xff0000 | ($2_1 << 24) | (($2_1 >>> 8) & 0xff00 | ($2_1 >>> 24));
        $114 = $1_1 + 52;
        $2_1 = HEAPU8[$114 >> 0] | ((HEAPU8[($114 + 1) >> 0]) << 8) | ((HEAPU8[($114 + 2) >> 0]) << 16 | ((HEAPU8[($114 + 3) >> 0]) << 24));
        $5_1 = ($2_1 << 8) & 0xff0000 | ($2_1 << 24) | (($2_1 >>> 8) & 0xff00 | ($2_1 >>> 24));
        $7_1 = __wasm_rotl_i32((($12_1 ^ $10_1) ^ $17_1) ^ $5_1, 1);
        $2_1 = __wasm_rotl_i32((($29_1 ^ $16_1) ^ $21_1) ^ $7_1, 1);
        $115 = $1_1 + 24;
        $4_1 = HEAPU8[$115 >> 0] | ((HEAPU8[($115 + 1) >> 0]) << 8) | ((HEAPU8[($115 + 2) >> 0]) << 16 | ((HEAPU8[($115 + 3) >> 0]) << 24));
        $74_1 = ($4_1 << 8) & 0xff0000 | ($4_1 << 24) | (($4_1 >>> 8) & 0xff00 | ($4_1 >>> 24));
        $116 = $1_1 + 56;
        $4_1 = HEAPU8[$116 >> 0] | ((HEAPU8[($116 + 1) >> 0]) << 8) | ((HEAPU8[($116 + 2) >> 0]) << 16 | ((HEAPU8[($116 + 3) >> 0]) << 24));
        $8_1 = ($4_1 << 8) & 0xff0000 | ($4_1 << 24) | (($4_1 >>> 8) & 0xff00 | ($4_1 >>> 24));
        $4_1 = __wasm_rotl_i32($2_1 ^ (($74_1 ^ $17_1) ^ $8_1), 1);
        $117 = $1_1 + 16;
        $6_1 = HEAPU8[$117 >> 0] | ((HEAPU8[($117 + 1) >> 0]) << 8) | ((HEAPU8[($117 + 2) >> 0]) << 16 | ((HEAPU8[($117 + 3) >> 0]) << 24));
        $19_1 = ($6_1 << 8) & 0xff0000 | ($6_1 << 24) | (($6_1 >>> 8) & 0xff00 | ($6_1 >>> 24));
        $118 = $1_1 + 48;
        $6_1 = HEAPU8[$118 >> 0] | ((HEAPU8[($118 + 1) >> 0]) << 8) | ((HEAPU8[($118 + 2) >> 0]) << 16 | ((HEAPU8[($118 + 3) >> 0]) << 24));
        $22_1 = ($6_1 << 8) & 0xff0000 | ($6_1 << 24) | (($6_1 >>> 8) & 0xff00 | ($6_1 >>> 24));
        $119 = $1_1 + 4;
        $6_1 = HEAPU8[$119 >> 0] | ((HEAPU8[($119 + 1) >> 0]) << 8) | ((HEAPU8[($119 + 2) >> 0]) << 16 | ((HEAPU8[($119 + 3) >> 0]) << 24));
        $15_1 = ($6_1 << 8) & 0xff0000 | ($6_1 << 24) | (($6_1 >>> 8) & 0xff00 | ($6_1 >>> 24));
        $120 = $1_1 + 36;
        $6_1 = HEAPU8[$120 >> 0] | ((HEAPU8[($120 + 1) >> 0]) << 8) | ((HEAPU8[($120 + 2) >> 0]) << 16 | ((HEAPU8[($120 + 3) >> 0]) << 24));
        $18_1 = ($6_1 << 8) & 0xff0000 | ($6_1 << 24) | (($6_1 >>> 8) & 0xff00 | ($6_1 >>> 24));
        $11_1 = __wasm_rotl_i32((($15_1 ^ $16_1) ^ $18_1) ^ $8_1, 1);
        $23_1 = __wasm_rotl_i32((($19_1 ^ $74_1) ^ $22_1) ^ $11_1, 1);
        $32_1 = __wasm_rotl_i32((($18_1 ^ $21_1) ^ $11_1) ^ $4_1, 1);
        $6_1 = __wasm_rotl_i32(($23_1 ^ ($8_1 ^ $22_1)) ^ $32_1, 1);
        $121 = $1_1 + 28;
        $3_1 = HEAPU8[$121 >> 0] | ((HEAPU8[($121 + 1) >> 0]) << 8) | ((HEAPU8[($121 + 2) >> 0]) << 16 | ((HEAPU8[($121 + 3) >> 0]) << 24));
        $75_1 = ($3_1 << 8) & 0xff0000 | ($3_1 << 24) | (($3_1 >>> 8) & 0xff00 | ($3_1 >>> 24));
        $122 = $1_1 + 40;
        $3_1 = HEAPU8[$122 >> 0] | ((HEAPU8[($122 + 1) >> 0]) << 8) | ((HEAPU8[($122 + 2) >> 0]) << 16 | ((HEAPU8[($122 + 3) >> 0]) << 24));
        $24_1 = ($3_1 << 8) & 0xff0000 | ($3_1 << 24) | (($3_1 >>> 8) & 0xff00 | ($3_1 >>> 24));
        $123 = $1_1 + 60;
        $3_1 = HEAPU8[$123 >> 0] | ((HEAPU8[($123 + 1) >> 0]) << 8) | ((HEAPU8[($123 + 2) >> 0]) << 16 | ((HEAPU8[($123 + 3) >> 0]) << 24));
        $14_1 = ($3_1 << 8) & 0xff0000 | ($3_1 << 24) | (($3_1 >>> 8) & 0xff00 | ($3_1 >>> 24));
        $25_1 = __wasm_rotl_i32(($24_1 ^ ($12_1 ^ $19_1)) ^ $14_1, 1);
        $3_1 = __wasm_rotl_i32((($75_1 ^ $29_1) ^ $5_1) ^ $25_1, 1);
        $33_1 = __wasm_rotl_i32((($18_1 ^ $75_1) ^ $14_1) ^ $23_1, 1);
        $34_1 = __wasm_rotl_i32($33_1 ^ (($22_1 ^ $24_1) ^ $25_1), 1);
        $35_1 = __wasm_rotl_i32((($11_1 ^ $14_1) ^ $33_1) ^ $6_1, 1);
        $36_1 = __wasm_rotl_i32(($34_1 ^ ($23_1 ^ $25_1)) ^ $35_1, 1);
        $37_1 = __wasm_rotl_i32($3_1 ^ (($17_1 ^ $24_1) ^ $7_1), 1);
        $38_1 = __wasm_rotl_i32($37_1 ^ (($5_1 ^ $21_1) ^ $2_1), 1);
        $39_1 = __wasm_rotl_i32($38_1 ^ (($7_1 ^ $8_1) ^ $4_1), 1);
        $40_1 = __wasm_rotl_i32($39_1 ^ (($2_1 ^ $11_1) ^ $32_1), 1);
        $41_1 = __wasm_rotl_i32($40_1 ^ (($4_1 ^ $23_1) ^ $6_1), 1);
        $42_1 = __wasm_rotl_i32($41_1 ^ (($32_1 ^ $33_1) ^ $35_1), 1);
        $43_1 = __wasm_rotl_i32(($36_1 ^ ($6_1 ^ $34_1)) ^ $42_1, 1);
        $44_1 = __wasm_rotl_i32((($5_1 ^ $14_1) ^ $3_1) ^ $34_1, 1);
        $45_1 = __wasm_rotl_i32($44_1 ^ (($7_1 ^ $25_1) ^ $37_1), 1);
        $46_1 = __wasm_rotl_i32($45_1 ^ (($2_1 ^ $3_1) ^ $38_1), 1);
        $47_1 = __wasm_rotl_i32($46_1 ^ (($4_1 ^ $37_1) ^ $39_1), 1);
        $48_1 = __wasm_rotl_i32($47_1 ^ (($32_1 ^ $38_1) ^ $40_1), 1);
        $49_1 = __wasm_rotl_i32($48_1 ^ (($6_1 ^ $39_1) ^ $41_1), 1);
        $50_1 = __wasm_rotl_i32($49_1 ^ (($35_1 ^ $40_1) ^ $42_1), 1);
        $9_1 = __wasm_rotl_i32(($43_1 ^ ($36_1 ^ $41_1)) ^ $50_1, 1);
        $51_1 = __wasm_rotl_i32((($3_1 ^ $33_1) ^ $44_1) ^ $36_1, 1);
        $52_1 = __wasm_rotl_i32($51_1 ^ (($34_1 ^ $37_1) ^ $45_1), 1);
        $53_1 = __wasm_rotl_i32((($35_1 ^ $44_1) ^ $51_1) ^ $43_1, 1);
        $54_1 = __wasm_rotl_i32(($52_1 ^ ($36_1 ^ $45_1)) ^ $53_1, 1);
        $55_1 = __wasm_rotl_i32((($42_1 ^ $51_1) ^ $53_1) ^ $9_1, 1);
        $56_1 = __wasm_rotl_i32(($54_1 ^ ($43_1 ^ $52_1)) ^ $55_1, 1);
        $57_1 = __wasm_rotl_i32((($38_1 ^ $44_1) ^ $46_1) ^ $52_1, 1);
        $58_1 = __wasm_rotl_i32($57_1 ^ (($39_1 ^ $45_1) ^ $47_1), 1);
        $59_1 = __wasm_rotl_i32($58_1 ^ (($40_1 ^ $46_1) ^ $48_1), 1);
        $60_1 = __wasm_rotl_i32($59_1 ^ (($41_1 ^ $47_1) ^ $49_1), 1);
        $61_1 = __wasm_rotl_i32($60_1 ^ (($42_1 ^ $48_1) ^ $50_1), 1);
        $62_1 = __wasm_rotl_i32($61_1 ^ (($43_1 ^ $49_1) ^ $9_1), 1);
        $63_1 = __wasm_rotl_i32($62_1 ^ (($50_1 ^ $53_1) ^ $55_1), 1);
        $64_1 = __wasm_rotl_i32(($56_1 ^ ($9_1 ^ $54_1)) ^ $63_1, 1);
        $65_1 = __wasm_rotl_i32((($46_1 ^ $51_1) ^ $57_1) ^ $54_1, 1);
        $66_1 = __wasm_rotl_i32($65_1 ^ (($47_1 ^ $52_1) ^ $58_1), 1);
        $67_1 = __wasm_rotl_i32((($53_1 ^ $57_1) ^ $65_1) ^ $56_1, 1);
        $68_1 = __wasm_rotl_i32(($66_1 ^ ($54_1 ^ $58_1)) ^ $67_1, 1);
        $76_1 = __wasm_rotl_i32((($55_1 ^ $65_1) ^ $67_1) ^ $64_1, 1);
        $72_1 = __wasm_rotl_i32(($68_1 ^ ($56_1 ^ $66_1)) ^ $76_1, 1);
        $69_1 = __wasm_rotl_i32((($48_1 ^ $57_1) ^ $59_1) ^ $66_1, 1);
        $70_1 = __wasm_rotl_i32($69_1 ^ (($49_1 ^ $58_1) ^ $60_1), 1);
        $71_1 = __wasm_rotl_i32($70_1 ^ (($50_1 ^ $59_1) ^ $61_1), 1);
        $77_1 = __wasm_rotl_i32($71_1 ^ (($9_1 ^ $60_1) ^ $62_1), 1);
        $78_1 = __wasm_rotl_i32($77_1 ^ (($55_1 ^ $61_1) ^ $63_1), 1);
        $82 = __wasm_rotl_i32($78_1 ^ (($56_1 ^ $62_1) ^ $64_1), 1);
        $79_1 = __wasm_rotl_i32($82 ^ (($63_1 ^ $67_1) ^ $76_1), 1);
        $73_1 = __wasm_rotl_i32((($59_1 ^ $65_1) ^ $69_1) ^ $68_1, 1);
        $80_1 = __wasm_rotl_i32(($73_1 ^ ($67_1 ^ $69_1)) ^ $72_1, 1);
        $13_1 = __wasm_rotl_i32($28_1, 30);
        $30_1 = ((((__wasm_rotl_i32($27_1, 5)) + $31_1) + ((($20_1 ^ $26_1) & $28_1) ^ $26_1)) + $10_1) + 1518500249;
        $10_1 = (($15_1 + ($26_1 + ((($13_1 ^ $20_1) & $27_1) ^ $20_1))) + (__wasm_rotl_i32($30_1, 5))) + 1518500249;
        $843 = $12_1 + $20_1;
        $12_1 = __wasm_rotl_i32($27_1, 30);
        $15_1 = (($843 + (($30_1 & ($12_1 ^ $13_1)) ^ $13_1)) + (__wasm_rotl_i32($10_1, 5))) + 1518500249;
        $860 = $13_1 + $16_1;
        $16_1 = __wasm_rotl_i32($30_1, 30);
        $30_1 = (($860 + (($10_1 & ($16_1 ^ $12_1)) ^ $12_1)) + (__wasm_rotl_i32($15_1, 5))) + 1518500249;
        $13_1 = __wasm_rotl_i32($30_1, 30);
        $879 = $12_1 + $19_1;
        $12_1 = __wasm_rotl_i32($10_1, 30);
        $19_1 = (($879 + ((($12_1 ^ $16_1) & $15_1) ^ $16_1)) + (__wasm_rotl_i32($30_1, 5))) + 1518500249;
        $15_1 = __wasm_rotl_i32($15_1, 30);
        $29_1 = ((($16_1 + $29_1) + ((($15_1 ^ $12_1) & $30_1) ^ $12_1)) + (__wasm_rotl_i32($19_1, 5))) + 1518500249;
        $10_1 = __wasm_rotl_i32($29_1, 30);
        $16_1 = __wasm_rotl_i32($19_1, 30);
        $925 = ($15_1 + $75_1) + (($29_1 & ($16_1 ^ $13_1)) ^ $13_1);
        $15_1 = ((($12_1 + $74_1) + (($19_1 & ($13_1 ^ $15_1)) ^ $15_1)) + (__wasm_rotl_i32($29_1, 5))) + 1518500249;
        $12_1 = ($925 + (__wasm_rotl_i32($15_1, 5))) + 1518500249;
        $19_1 = ((($13_1 + $17_1) + ((($10_1 ^ $16_1) & $15_1) ^ $16_1)) + (__wasm_rotl_i32($12_1, 5))) + 1518500249;
        $13_1 = __wasm_rotl_i32($19_1, 30);
        $17_1 = __wasm_rotl_i32($15_1, 30);
        $18_1 = ((($16_1 + $18_1) + ((($17_1 ^ $10_1) & $12_1) ^ $10_1)) + (__wasm_rotl_i32($19_1, 5))) + 1518500249;
        $981 = $10_1 + $24_1;
        $24_1 = __wasm_rotl_i32($12_1, 30);
        $12_1 = (($981 + (($19_1 & ($24_1 ^ $17_1)) ^ $17_1)) + (__wasm_rotl_i32($18_1, 5))) + 1518500249;
        $10_1 = __wasm_rotl_i32($12_1, 30);
        $1000 = $22_1 + $24_1;
        $22_1 = __wasm_rotl_i32($18_1, 30);
        $17_1 = ((($17_1 + $21_1) + (($18_1 & ($13_1 ^ $24_1)) ^ $24_1)) + (__wasm_rotl_i32($12_1, 5))) + 1518500249;
        $21_1 = (($1000 + ((($22_1 ^ $13_1) & $12_1) ^ $13_1)) + (__wasm_rotl_i32($17_1, 5))) + 1518500249;
        $18_1 = ((($5_1 + $13_1) + ((($10_1 ^ $22_1) & $17_1) ^ $22_1)) + (__wasm_rotl_i32($21_1, 5))) + 1518500249;
        $5_1 = __wasm_rotl_i32($18_1, 30);
        $1049 = $8_1 + $22_1;
        $8_1 = __wasm_rotl_i32($17_1, 30);
        $13_1 = (($1049 + (($21_1 & ($8_1 ^ $10_1)) ^ $10_1)) + (__wasm_rotl_i32($18_1, 5))) + 1518500249;
        $1066 = $10_1 + $14_1;
        $14_1 = __wasm_rotl_i32($21_1, 30);
        $10_1 = (($1066 + (($18_1 & ($14_1 ^ $8_1)) ^ $8_1)) + (__wasm_rotl_i32($13_1, 5))) + 1518500249;
        $1083 = $11_1 + $14_1;
        $11_1 = __wasm_rotl_i32($13_1, 30);
        $14_1 = ((($7_1 + $8_1) + ((($5_1 ^ $14_1) & $13_1) ^ $14_1)) + (__wasm_rotl_i32($10_1, 5))) + 1518500249;
        $7_1 = (($1083 + ((($11_1 ^ $5_1) & $10_1) ^ $5_1)) + (__wasm_rotl_i32($14_1, 5))) + 1518500249;
        $1115 = $5_1 + $25_1;
        $5_1 = __wasm_rotl_i32($10_1, 30);
        $25_1 = (($1115 + (($14_1 & ($5_1 ^ $11_1)) ^ $11_1)) + (__wasm_rotl_i32($7_1, 5))) + 1518500249;
        $8_1 = __wasm_rotl_i32($25_1, 30);
        $1134 = $2_1 + $11_1;
        $11_1 = __wasm_rotl_i32($14_1, 30);
        $2_1 = (($1134 + (($7_1 & ($11_1 ^ $5_1)) ^ $5_1)) + (__wasm_rotl_i32($25_1, 5))) + 1518500249;
        $7_1 = __wasm_rotl_i32($7_1, 30);
        $23_1 = ((($5_1 + $23_1) + (($7_1 ^ $11_1) ^ $25_1)) + (__wasm_rotl_i32($2_1, 5))) + 1859775393;
        $5_1 = __wasm_rotl_i32($23_1, 30);
        $14_1 = __wasm_rotl_i32($2_1, 30);
        $3_1 = ((($3_1 + $11_1) + (($7_1 ^ $8_1) ^ $2_1)) + (__wasm_rotl_i32($23_1, 5))) + 1859775393;
        $2_1 = ((($4_1 + $7_1) + (($14_1 ^ $8_1) ^ $23_1)) + (__wasm_rotl_i32($3_1, 5))) + 1859775393;
        $7_1 = ((($8_1 + $33_1) + (($5_1 ^ $14_1) ^ $3_1)) + (__wasm_rotl_i32($2_1, 5))) + 1859775393;
        $4_1 = __wasm_rotl_i32($7_1, 30);
        $8_1 = __wasm_rotl_i32($3_1, 30);
        $3_1 = ((($14_1 + $37_1) + (($8_1 ^ $5_1) ^ $2_1)) + (__wasm_rotl_i32($7_1, 5))) + 1859775393;
        $1226 = $5_1 + $32_1;
        $5_1 = __wasm_rotl_i32($2_1, 30);
        $7_1 = (($1226 + (($5_1 ^ $8_1) ^ $7_1)) + (__wasm_rotl_i32($3_1, 5))) + 1859775393;
        $2_1 = __wasm_rotl_i32($7_1, 30);
        $11_1 = __wasm_rotl_i32($3_1, 30);
        $1251 = ($5_1 + $38_1) + (($11_1 ^ $4_1) ^ $7_1);
        $5_1 = ((($8_1 + $34_1) + (($4_1 ^ $5_1) ^ $3_1)) + (__wasm_rotl_i32($7_1, 5))) + 1859775393;
        $3_1 = ($1251 + (__wasm_rotl_i32($5_1, 5))) + 1859775393;
        $7_1 = ((($4_1 + $6_1) + (($2_1 ^ $11_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) + 1859775393;
        $4_1 = __wasm_rotl_i32($7_1, 30);
        $5_1 = __wasm_rotl_i32($5_1, 30);
        $6_1 = ((($11_1 + $44_1) + (($5_1 ^ $2_1) ^ $3_1)) + (__wasm_rotl_i32($7_1, 5))) + 1859775393;
        $3_1 = __wasm_rotl_i32($3_1, 30);
        $7_1 = ((($2_1 + $39_1) + (($3_1 ^ $5_1) ^ $7_1)) + (__wasm_rotl_i32($6_1, 5))) + 1859775393;
        $2_1 = __wasm_rotl_i32($7_1, 30);
        $8_1 = __wasm_rotl_i32($6_1, 30);
        $1326 = ($3_1 + $45_1) + (($8_1 ^ $4_1) ^ $7_1);
        $3_1 = ((($5_1 + $35_1) + (($3_1 ^ $4_1) ^ $6_1)) + (__wasm_rotl_i32($7_1, 5))) + 1859775393;
        $6_1 = ($1326 + (__wasm_rotl_i32($3_1, 5))) + 1859775393;
        $5_1 = ((($4_1 + $40_1) + (($2_1 ^ $8_1) ^ $3_1)) + (__wasm_rotl_i32($6_1, 5))) + 1859775393;
        $4_1 = __wasm_rotl_i32($5_1, 30);
        $7_1 = __wasm_rotl_i32($3_1, 30);
        $3_1 = ((($8_1 + $36_1) + (($7_1 ^ $2_1) ^ $6_1)) + (__wasm_rotl_i32($5_1, 5))) + 1859775393;
        $1376 = $2_1 + $46_1;
        $2_1 = __wasm_rotl_i32($6_1, 30);
        $5_1 = (($1376 + (($2_1 ^ $7_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) + 1859775393;
        $6_1 = __wasm_rotl_i32($5_1, 30);
        $8_1 = __wasm_rotl_i32($3_1, 30);
        $1401 = ($2_1 + $51_1) + (($8_1 ^ $4_1) ^ $5_1);
        $5_1 = ((($7_1 + $41_1) + (($2_1 ^ $4_1) ^ $3_1)) + (__wasm_rotl_i32($5_1, 5))) + 1859775393;
        $3_1 = ($1401 + (__wasm_rotl_i32($5_1, 5))) + 1859775393;
        $4_1 = ((($4_1 + $47_1) + (($6_1 ^ $8_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) + 1859775393;
        $2_1 = __wasm_rotl_i32($4_1, 30);
        $5_1 = __wasm_rotl_i32($5_1, 30);
        $7_1 = ((($8_1 + $42_1) + (($5_1 ^ $6_1) ^ $3_1)) + (__wasm_rotl_i32($4_1, 5))) + 1859775393;
        $1452 = $4_1;
        $4_1 = __wasm_rotl_i32($3_1, 30);
        $3_1 = ((($6_1 + $52_1) + (($1452 & ($4_1 ^ $5_1)) ^ ($4_1 & $5_1))) + (__wasm_rotl_i32($7_1, 5))) - 1894007588;
        $6_1 = __wasm_rotl_i32($7_1, 30);
        $7_1 = ((($5_1 + $48_1) + ((($2_1 ^ $4_1) & $7_1) ^ ($2_1 & $4_1))) + (__wasm_rotl_i32($3_1, 5))) - 1894007588;
        $5_1 = ((($4_1 + $43_1) + (($3_1 & ($6_1 ^ $2_1)) ^ ($2_1 & $6_1))) + (__wasm_rotl_i32($7_1, 5))) - 1894007588;
        $4_1 = __wasm_rotl_i32($3_1, 30);
        $8_1 = ((($2_1 + $57_1) + (($7_1 & ($4_1 ^ $6_1)) ^ ($4_1 & $6_1))) + (__wasm_rotl_i32($5_1, 5))) - 1894007588;
        $2_1 = __wasm_rotl_i32($8_1, 30);
        $1527 = $6_1 + $49_1;
        $6_1 = __wasm_rotl_i32($7_1, 30);
        $7_1 = (($1527 + ((($6_1 ^ $4_1) & $5_1) ^ ($4_1 & $6_1))) + (__wasm_rotl_i32($8_1, 5))) - 1894007588;
        $3_1 = __wasm_rotl_i32($5_1, 30);
        $8_1 = ((($4_1 + $53_1) + (($8_1 & ($3_1 ^ $6_1)) ^ ($3_1 & $6_1))) + (__wasm_rotl_i32($7_1, 5))) - 1894007588;
        $4_1 = __wasm_rotl_i32($8_1, 30);
        $5_1 = __wasm_rotl_i32($7_1, 30);
        $6_1 = ((($6_1 + $58_1) + (($7_1 & ($2_1 ^ $3_1)) ^ ($2_1 & $3_1))) + (__wasm_rotl_i32($8_1, 5))) - 1894007588;
        $3_1 = ((($3_1 + $50_1) + (($8_1 & ($5_1 ^ $2_1)) ^ ($2_1 & $5_1))) + (__wasm_rotl_i32($6_1, 5))) - 1894007588;
        $7_1 = ((($2_1 + $54_1) + ((($4_1 ^ $5_1) & $6_1) ^ ($4_1 & $5_1))) + (__wasm_rotl_i32($3_1, 5))) - 1894007588;
        $2_1 = __wasm_rotl_i32($7_1, 30);
        $6_1 = __wasm_rotl_i32($6_1, 30);
        $5_1 = ((($5_1 + $59_1) + ((($6_1 ^ $4_1) & $3_1) ^ ($4_1 & $6_1))) + (__wasm_rotl_i32($7_1, 5))) - 1894007588;
        $3_1 = __wasm_rotl_i32($3_1, 30);
        $7_1 = ((($4_1 + $9_1) + (($7_1 & ($3_1 ^ $6_1)) ^ ($3_1 & $6_1))) + (__wasm_rotl_i32($5_1, 5))) - 1894007588;
        $4_1 = __wasm_rotl_i32($7_1, 30);
        $9_1 = __wasm_rotl_i32($5_1, 30);
        $6_1 = ((($6_1 + $65_1) + (($5_1 & ($2_1 ^ $3_1)) ^ ($2_1 & $3_1))) + (__wasm_rotl_i32($7_1, 5))) - 1894007588;
        $3_1 = ((($3_1 + $60_1) + ((($9_1 ^ $2_1) & $7_1) ^ ($2_1 & $9_1))) + (__wasm_rotl_i32($6_1, 5))) - 1894007588;
        $5_1 = ((($2_1 + $55_1) + ((($4_1 ^ $9_1) & $6_1) ^ ($4_1 & $9_1))) + (__wasm_rotl_i32($3_1, 5))) - 1894007588;
        $2_1 = __wasm_rotl_i32($5_1, 30);
        $6_1 = __wasm_rotl_i32($6_1, 30);
        $9_1 = ((($9_1 + $66_1) + (($3_1 & ($6_1 ^ $4_1)) ^ ($4_1 & $6_1))) + (__wasm_rotl_i32($5_1, 5))) - 1894007588;
        $1736 = $4_1 + $61_1;
        $4_1 = __wasm_rotl_i32($3_1, 30);
        $5_1 = (($1736 + (($5_1 & ($4_1 ^ $6_1)) ^ ($4_1 & $6_1))) + (__wasm_rotl_i32($9_1, 5))) - 1894007588;
        $3_1 = __wasm_rotl_i32($9_1, 30);
        $9_1 = ((($6_1 + $56_1) + ((($2_1 ^ $4_1) & $9_1) ^ ($2_1 & $4_1))) + (__wasm_rotl_i32($5_1, 5))) - 1894007588;
        $4_1 = ((($4_1 + $69_1) + ((($3_1 ^ $2_1) & $5_1) ^ ($2_1 & $3_1))) + (__wasm_rotl_i32($9_1, 5))) - 1894007588;
        $1791 = $2_1 + $62_1;
        $2_1 = __wasm_rotl_i32($5_1, 30);
        $5_1 = (($1791 + (($9_1 & ($2_1 ^ $3_1)) ^ ($2_1 & $3_1))) + (__wasm_rotl_i32($4_1, 5))) - 1894007588;
        $6_1 = __wasm_rotl_i32($5_1, 30);
        $1812 = $3_1 + $67_1;
        $3_1 = __wasm_rotl_i32($9_1, 30);
        $9_1 = (($1812 + (($4_1 & ($3_1 ^ $2_1)) ^ ($2_1 & $3_1))) + (__wasm_rotl_i32($5_1, 5))) - 1894007588;
        $4_1 = __wasm_rotl_i32($4_1, 30);
        $5_1 = ((($2_1 + $70_1) + (($4_1 ^ $3_1) ^ $5_1)) + (__wasm_rotl_i32($9_1, 5))) - 899497514;
        $2_1 = __wasm_rotl_i32($5_1, 30);
        $7_1 = __wasm_rotl_i32($9_1, 30);
        $3_1 = ((($3_1 + $63_1) + (($4_1 ^ $6_1) ^ $9_1)) + (__wasm_rotl_i32($5_1, 5))) - 899497514;
        $4_1 = ((($4_1 + $68_1) + (($7_1 ^ $6_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) - 899497514;
        $9_1 = ((($6_1 + $71_1) + (($2_1 ^ $7_1) ^ $3_1)) + (__wasm_rotl_i32($4_1, 5))) - 899497514;
        $6_1 = __wasm_rotl_i32($9_1, 30);
        $5_1 = __wasm_rotl_i32($3_1, 30);
        $3_1 = ((($7_1 + $64_1) + (($5_1 ^ $2_1) ^ $4_1)) + (__wasm_rotl_i32($9_1, 5))) - 899497514;
        $4_1 = __wasm_rotl_i32($4_1, 30);
        $9_1 = ((($2_1 + $73_1) + (($4_1 ^ $5_1) ^ $9_1)) + (__wasm_rotl_i32($3_1, 5))) - 899497514;
        $2_1 = __wasm_rotl_i32($9_1, 30);
        $7_1 = __wasm_rotl_i32($3_1, 30);
        $3_1 = ((($5_1 + $77_1) + (($4_1 ^ $6_1) ^ $3_1)) + (__wasm_rotl_i32($9_1, 5))) - 899497514;
        $4_1 = ((($4_1 + $76_1) + (($7_1 ^ $6_1) ^ $9_1)) + (__wasm_rotl_i32($3_1, 5))) - 899497514;
        $9_1 = __wasm_rotl_i32((($60_1 ^ $66_1) ^ $70_1) ^ $73_1, 1);
        $5_1 = ((($9_1 + $6_1) + (($2_1 ^ $7_1) ^ $3_1)) + (__wasm_rotl_i32($4_1, 5))) - 899497514;
        $6_1 = __wasm_rotl_i32($5_1, 30);
        $1974 = $7_1 + $78_1;
        $7_1 = __wasm_rotl_i32($3_1, 30);
        $3_1 = (($1974 + (($7_1 ^ $2_1) ^ $4_1)) + (__wasm_rotl_i32($5_1, 5))) - 899497514;
        $4_1 = __wasm_rotl_i32($4_1, 30);
        $5_1 = ((($2_1 + $72_1) + (($4_1 ^ $7_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) - 899497514;
        $2_1 = __wasm_rotl_i32($5_1, 30);
        $8_1 = __wasm_rotl_i32($3_1, 30);
        $2015 = $7_1;
        $7_1 = __wasm_rotl_i32((($61_1 ^ $69_1) ^ $71_1) ^ $9_1, 1);
        $3_1 = ((($2015 + $7_1) + (($4_1 ^ $6_1) ^ $3_1)) + (__wasm_rotl_i32($5_1, 5))) - 899497514;
        $4_1 = ((($4_1 + $82) + (($8_1 ^ $6_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) - 899497514;
        $5_1 = ((($6_1 + $80_1) + (($2_1 ^ $8_1) ^ $3_1)) + (__wasm_rotl_i32($4_1, 5))) - 899497514;
        $6_1 = __wasm_rotl_i32($5_1, 30);
        $11_1 = __wasm_rotl_i32((($62_1 ^ $70_1) ^ $77_1) ^ $7_1, 1);
        $2065 = $11_1 + $8_1;
        $8_1 = __wasm_rotl_i32($3_1, 30);
        $3_1 = (($2065 + (($8_1 ^ $2_1) ^ $4_1)) + (__wasm_rotl_i32($5_1, 5))) - 899497514;
        $4_1 = __wasm_rotl_i32($4_1, 30);
        $5_1 = ((($2_1 + $79_1) + (($4_1 ^ $8_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) - 899497514;
        $2_1 = __wasm_rotl_i32($5_1, 30);
        $2104 = (__wasm_rotl_i32((($63_1 ^ $71_1) ^ $78_1) ^ $11_1, 1)) + $4_1;
        $11_1 = __wasm_rotl_i32($3_1, 30);
        $9_1 = __wasm_rotl_i32((($68_1 ^ $70_1) ^ $9_1) ^ $80_1, 1);
        $3_1 = ((($9_1 + $8_1) + (($4_1 ^ $6_1) ^ $3_1)) + (__wasm_rotl_i32($5_1, 5))) - 899497514;
        $4_1 = (($2104 + (($11_1 ^ $6_1) ^ $5_1)) + (__wasm_rotl_i32($3_1, 5))) - 899497514;
        $6_1 = ((((__wasm_rotl_i32((($64_1 ^ $68_1) ^ $72_1) ^ $79_1, 1)) + $6_1) + (($2_1 ^ $11_1) ^ $3_1)) + (__wasm_rotl_i32($4_1, 5))) - 899497514;
        $28_1 = $6_1 + $28_1;
        $2172 = ($27_1 + (__wasm_rotl_i32((($71_1 ^ $73_1) ^ $7_1) ^ $9_1, 1))) + $11_1;
        $3_1 = __wasm_rotl_i32($3_1, 30);
        $27_1 = (($2172 + (($3_1 ^ $2_1) ^ $4_1)) + (__wasm_rotl_i32($6_1, 5))) - 899497514;
        $20_1 = (__wasm_rotl_i32($4_1, 30)) + $20_1;
        $26_1 = $3_1 + $26_1;
        $31_1 = $2_1 + $31_1;
        $1_1 = $1_1 + 64;
        if(($81_1) != ($1_1)) {
          continue label$2
        }
        break label$2;
      };
    }
    HEAP32[($0_1 + 16) >> 2] = $31_1;
    HEAP32[($0_1 + 12) >> 2] = $26_1;
    HEAP32[($0_1 + 8) >> 2] = $20_1;
    HEAP32[($0_1 + 4) >> 2] = $28_1;
    HEAP32[$0_1 >> 2] = $27_1;
  }

  function $66($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $40_1 = 0,
      $2_1 = 0,
      $3_1 = 0;
    $2_1 = HEAP32[$0_1 >> 2];
    $0_1 = global$0 - 16;
    global$0 = $0_1;
    $3_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1052301, 9);
    HEAP8[($0_1 + 5) >> 0] = 0;
    HEAP8[($0_1 + 4) >> 0] = $3_1;
    HEAP32[$0_1 >> 2] = $1_1;
    HEAP32[($0_1 + 12) >> 2] = $2_1;
    $1_1 = $0_1 + 12;
    $3_1 = $11($0_1, 1052310, 11, $1_1, 1052280);
    HEAP32[($0_1 + 12) >> 2] = $2_1 + 4;
    $11($3_1, 1052321, 9, $1_1, 1052332);
    label$1: {
      $2_1 = HEAPU8[($0_1 + 4) >> 0];
      $40_1 = $2_1;
      if(!(HEAPU8[($0_1 + 5) >> 0])) {
        break label$1
      }
      $40_1 = 1;
      if($2_1) {
        break label$1
      }
      $1_1 = HEAP32[$0_1 >> 2];
      if(!((HEAPU8[$1_1 >> 0]) & 4)) {
        $40_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1049683, 2);
        break label$1;
      }
      $40_1 = FUNCTION_TABLE[HEAP32[((HEAP32[($1_1 + 28) >> 2]) + 12) >> 2]](HEAP32[($1_1 + 24) >> 2], 1049682, 1);
    }
    $1_1 = $40_1;
    global$0 = $0_1 + 16;
    return ($1_1 & 0xff) != (0);
  }

  function $67($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0;
    $2_1 = global$0 - 48;
    global$0 = $2_1;
    HEAP32[($2_1 + 4) >> 2] = $1_1;
    HEAP32[$2_1 >> 2] = $0_1;
    HEAP32[($2_1 + 28) >> 2] = 2;
    HEAP32[($2_1 + 44) >> 2] = 2;
    HEAP32[($2_1 + 12) >> 2] = 2;
    HEAP32[($2_1 + 16) >> 2] = 0;
    HEAP32[($2_1 + 8) >> 2] = 1049988;
    HEAP32[($2_1 + 36) >> 2] = 2;
    HEAP32[($2_1 + 24) >> 2] = $2_1 + 32;
    HEAP32[($2_1 + 40) >> 2] = $2_1 + 4;
    HEAP32[($2_1 + 32) >> 2] = $2_1;
    $43($2_1 + 8, 1050036);
    abort();
  }

  function $68($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0;
    $2_1 = global$0 - 48;
    global$0 = $2_1;
    HEAP32[($2_1 + 4) >> 2] = $1_1;
    HEAP32[$2_1 >> 2] = $0_1;
    HEAP32[($2_1 + 28) >> 2] = 2;
    HEAP32[($2_1 + 44) >> 2] = 2;
    HEAP32[($2_1 + 12) >> 2] = 2;
    HEAP32[($2_1 + 16) >> 2] = 0;
    HEAP32[($2_1 + 8) >> 2] = 1050068;
    HEAP32[($2_1 + 36) >> 2] = 2;
    HEAP32[($2_1 + 24) >> 2] = $2_1 + 32;
    HEAP32[($2_1 + 40) >> 2] = $2_1 + 4;
    HEAP32[($2_1 + 32) >> 2] = $2_1;
    $43($2_1 + 8, 1050084);
    abort();
  }

  function $69($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0;
    $2_1 = global$0 - 48;
    global$0 = $2_1;
    HEAP32[($2_1 + 4) >> 2] = $1_1;
    HEAP32[$2_1 >> 2] = $0_1;
    HEAP32[($2_1 + 28) >> 2] = 2;
    HEAP32[($2_1 + 44) >> 2] = 2;
    HEAP32[($2_1 + 12) >> 2] = 2;
    HEAP32[($2_1 + 16) >> 2] = 0;
    HEAP32[($2_1 + 8) >> 2] = 1050136;
    HEAP32[($2_1 + 36) >> 2] = 2;
    HEAP32[($2_1 + 24) >> 2] = $2_1 + 32;
    HEAP32[($2_1 + 40) >> 2] = $2_1 + 4;
    HEAP32[($2_1 + 32) >> 2] = $2_1;
    $43($2_1 + 8, 1050152);
    abort();
  }

  function $70($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return $14(HEAP32[$0_1 >> 2], $1_1);
  }

  function $71($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $3_1 = 0,
      $4_1 = 0,
      i64toi32_i32$1 = 0;
    $0_1 = HEAP32[$0_1 >> 2];
    $4_1 = global$0 - 128;
    global$0 = $4_1;
    label$1: {
      label$2: {
        label$3: {
          label$4: {
            $2_1 = HEAP32[$1_1 >> 2];
            if(!($2_1 & 16)) {
              if($2_1 & 32) {
                break label$4
              }
              i64toi32_i32$1 = 0;
              $0_1 = $13(HEAPU8[$0_1 >> 0], i64toi32_i32$1, $1_1);
              break label$1;
            }
            $2_1 = HEAPU8[$0_1 >> 0];
            $0_1 = 0;
            label$6: while(1) {
              $3_1 = $2_1 & 0xf;
              HEAP8[(($0_1 + $4_1) + 127) >> 0] = ($3_1 >>> 0 < 10 >>> 0 ? 48 : 87) + $3_1;
              $0_1 = $0_1 - 1;
              $3_1 = $2_1 & 0xff;
              $2_1 = $3_1 >>> 4;
              if($3_1 >>> 0 > 15 >>> 0) {
                continue label$6
              }
              break label$6;
            };
            $2_1 = $0_1 + 128;
            if($2_1 >>> 0 >= 129 >>> 0) {
              break label$3
            }
            $0_1 = $3($1_1, 1049709, 2, ($0_1 + $4_1) + 128, 0 - $0_1);
            break label$1;
          }
          $2_1 = HEAPU8[$0_1 >> 0];
          $0_1 = 0;
          label$7: while(1) {
            $3_1 = $2_1 & 0xf;
            HEAP8[(($0_1 + $4_1) + 127) >> 0] = ($3_1 >>> 0 < 10 >>> 0 ? 48 : 55) + $3_1;
            $0_1 = $0_1 - 1;
            $3_1 = $2_1 & 0xff;
            $2_1 = $3_1 >>> 4;
            if($3_1 >>> 0 > 15 >>> 0) {
              continue label$7
            }
            break label$7;
          };
          $2_1 = $0_1 + 128;
          if($2_1 >>> 0 >= 129 >>> 0) {
            break label$2
          }
          $0_1 = $3($1_1, 1049709, 2, ($0_1 + $4_1) + 128, 0 - $0_1);
          break label$1;
        }
        $67($2_1, 128);
        abort();
      }
      $67($2_1, 128);
      abort();
    }
    global$0 = $4_1 + 128;
    return $0_1;
  }

  /**
   * @param {*} $0_1 new_ptr
   * @param {*} $1_1 old_ptr
   * @param {*} $2_1 len
   * @returns new_ptr
   */
  function memcpy($0_1, $1_1, $2_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    $2_1 = $2_1;
    var $3_1 = 0,
      $4_1 = 0,
      $5_1 = 0,
      $6_1 = 0,
      $7_1 = 0,
      $8_1 = 0,
      $9_1 = 0,
      $10_1 = 0;
    label$1: {
      $6_1 = $2_1;
      if($2_1 >>> 0 <= 15 >>> 0) {
        $2_1 = $0_1;
        break label$1;
      }
      $4_1 = (0 - $0_1) & 3;
      $5_1 = $4_1 + $0_1;
      if($4_1) {
        $2_1 = $0_1;
        $3_1 = $1_1;
        label$4: while(1) {
          HEAP8[$2_1 >> 0] = HEAPU8[$3_1 >> 0];
          $3_1 = $3_1 + 1;
          $2_1 = $2_1 + 1;
          if($5_1 >>> 0 > $2_1 >>> 0) {
            continue label$4
          }
          break label$4;
        };
      }
      $6_1 = $6_1 - $4_1;
      $7_1 = $6_1 & -4;
      $2_1 = $7_1 + $5_1;
      label$5: {
        $4_1 = $1_1 + $4_1;
        if($4_1 & 3) {
          if(($7_1) < (1)) {
            break label$5
          }
          $3_1 = $4_1 << 3;
          $9_1 = $3_1 & 24;
          $8_1 = $4_1 & -4;
          $1_1 = $8_1 + 4;
          $10_1 = (0 - $3_1) & 24;
          $3_1 = HEAP32[$8_1 >> 2];
          label$7: while(1) {
            $8_1 = $3_1 >>> $9_1;
            $3_1 = HEAP32[$1_1 >> 2];
            HEAP32[$5_1 >> 2] = $8_1 | ($3_1 << $10_1);
            $1_1 = $1_1 + 4;
            $5_1 = $5_1 + 4;
            if($5_1 >>> 0 < $2_1 >>> 0) {
              continue label$7
            }
            break label$7;
          };
          break label$5;
        }
        if(($7_1) < (1)) {
          break label$5
        }
        $1_1 = $4_1;
        label$8: while(1) {
          HEAP32[$5_1 >> 2] = HEAP32[$1_1 >> 2];
          $1_1 = $1_1 + 4;
          $5_1 = $5_1 + 4;
          if($5_1 >>> 0 < $2_1 >>> 0) {
            continue label$8
          }
          break label$8;
        };
      }
      $6_1 = $6_1 & 3;
      $1_1 = $4_1 + $7_1;
    }
    if($6_1) {
      $3_1 = $2_1 + $6_1;
      label$10: while(1) {
        HEAP8[$2_1 >> 0] = HEAPU8[$1_1 >> 0];
        $1_1 = $1_1 + 1;
        $2_1 = $2_1 + 1;
        if($3_1 >>> 0 > $2_1 >>> 0) {
          continue label$10
        }
        break label$10;
      };
    }
    return $0_1;
  }

  /**
   * Sets memory given to 0
   * @param {*} $0_1 ptr
   * @param {*} $1_1 len
   * @returns ptr
   */
  function memzero($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    var $2_1 = 0,
      $4_1 = 0,
      $3_1 = 0;
    label$1: {
      $2_1 = $1_1;
      if($1_1 >>> 0 <= 15 >>> 0) {
        $1_1 = $0_1;
        break label$1;
      }
      $4_1 = (0 - $0_1) & 3;
      $3_1 = $4_1 + $0_1;
      if($4_1) {
        $1_1 = $0_1;
        label$4: while(1) {
          HEAP8[$1_1 >> 0] = 0;
          $1_1 = $1_1 + 1;
          if($3_1 >>> 0 > $1_1 >>> 0) {
            continue label$4
          }
          break label$4;
        };
      }
      $2_1 = $2_1 - $4_1;
      $4_1 = $2_1 & -4;
      $1_1 = $4_1 + $3_1;
      if(($4_1) >= (1)) {
        label$6: while(1) {
          HEAP32[$3_1 >> 2] = 0;
          $3_1 = $3_1 + 4;
          if($3_1 >>> 0 < $1_1 >>> 0) {
            continue label$6
          }
          break label$6;
        }
      }
      $2_1 = $2_1 & 3;
    }
    if($2_1) {
      $2_1 = $1_1 + $2_1;
      label$8: while(1) {
        HEAP8[$1_1 >> 0] = 0;
        $1_1 = $1_1 + 1;
        if($2_1 >>> 0 > $1_1 >>> 0) {
          continue label$8
        }
        break label$8;
      };
    }
    return $0_1;
  }

  function $74($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return 512;
  }

  function $75($0_1) {
    $0_1 = $0_1;
    return 1;
  }

  function $76($0_1, $1_1) {
    $0_1 = $0_1;
    $1_1 = $1_1;
    return $1_1;
  }

  function $77($0_1) {
    $0_1 = $0_1;
    return 0;
  }

  function $78($0_1) {
    $0_1 = $0_1;
    i64toi32_i32$HIGH_BITS = -1820318255;
    return 1642278902;
  }

  function $79($0_1) {
    $0_1 = $0_1;
    i64toi32_i32$HIGH_BITS = -1196540473;
    return 582611467;
  }

  function $80($0_1) {
    $0_1 = $0_1;
    i64toi32_i32$HIGH_BITS = 1345917478;
    return 1188114697;
  }

  function $81($0_1) {
    $0_1 = $0_1;
  }

  function _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE(var$0, var$0$hi, var$1, var$1$hi) {
    var$0 = var$0;
    var$0$hi = var$0$hi;
    var$1 = var$1;
    var$1$hi = var$1$hi;
    var i64toi32_i32$4 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0,
      var$2 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$3 = 0,
      var$3 = 0,
      var$4 = 0,
      var$5 = 0,
      $21_1 = 0,
      $22_1 = 0,
      var$6 = 0,
      $24_1 = 0,
      $17_1 = 0,
      $18_1 = 0,
      $23_1 = 0,
      $29_1 = 0,
      $45_1 = 0,
      $56$hi = 0,
      $62$hi = 0;
    i64toi32_i32$0 = var$1$hi;
    var$2 = var$1;
    var$4 = var$2 >>> 16;
    i64toi32_i32$0 = var$0$hi;
    var$3 = var$0;
    var$5 = var$3 >>> 16;
    $17_1 = Math_imul(var$4, var$5);
    $18_1 = var$2;
    i64toi32_i32$2 = var$3;
    i64toi32_i32$1 = 0;
    i64toi32_i32$3 = 32;
    i64toi32_i32$4 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$1 = 0;
      $21_1 = i64toi32_i32$0 >>> i64toi32_i32$4;
    } else {
      i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4;
      $21_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$0) << (32 - i64toi32_i32$4) | (i64toi32_i32$2 >>> i64toi32_i32$4);
    }
    $23_1 = $17_1 + Math_imul($18_1, $21_1);
    i64toi32_i32$1 = var$1$hi;
    i64toi32_i32$0 = var$1;
    i64toi32_i32$2 = 0;
    i64toi32_i32$3 = 32;
    i64toi32_i32$4 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$2 = 0;
      $22_1 = i64toi32_i32$1 >>> i64toi32_i32$4;
    } else {
      i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4;
      $22_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$1) << (32 - i64toi32_i32$4) | (i64toi32_i32$0 >>> i64toi32_i32$4);
    }
    $29_1 = $23_1 + Math_imul($22_1, var$3);
    var$2 = var$2 & 0xffff;
    var$3 = var$3 & 0xffff;
    var$6 = Math_imul(var$2, var$3);
    var$2 = (var$6 >>> 16) + Math_imul(var$2, var$5);
    $45_1 = $29_1 + (var$2 >>> 16);
    var$2 = (var$2 & 0xffff) + Math_imul(var$4, var$3);
    i64toi32_i32$2 = 0;
    i64toi32_i32$1 = $45_1 + (var$2 >>> 16);
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = 32;
    i64toi32_i32$4 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$0 = i64toi32_i32$1 << i64toi32_i32$4;
      $24_1 = 0;
    } else {
      i64toi32_i32$0 = ((1 << i64toi32_i32$4) - 1) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4)) | (i64toi32_i32$2 << i64toi32_i32$4);
      $24_1 = i64toi32_i32$1 << i64toi32_i32$4;
    }
    $56$hi = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    $62$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $56$hi;
    i64toi32_i32$2 = $24_1;
    i64toi32_i32$1 = $62$hi;
    i64toi32_i32$3 = var$2 << 16 | (var$6 & 0xffff);
    i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1;
    i64toi32_i32$2 = i64toi32_i32$2 | i64toi32_i32$3;
    i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
    return i64toi32_i32$2;
  }

  function _ZN17compiler_builtins3int4udiv10divmod_u6417h6026910b5ed08e40E(var$0, var$0$hi, var$1, var$1$hi) {
    var$0 = var$0;
    var$0$hi = var$0$hi;
    var$1 = var$1;
    var$1$hi = var$1$hi;
    var i64toi32_i32$2 = 0,
      i64toi32_i32$3 = 0,
      i64toi32_i32$4 = 0,
      i64toi32_i32$1 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$5 = 0,
      var$2 = 0,
      var$3 = 0,
      var$4 = 0,
      var$5 = 0,
      var$5$hi = 0,
      var$6 = 0,
      var$6$hi = 0,
      i64toi32_i32$6 = 0,
      $37_1 = 0,
      $38_1 = 0,
      $39_1 = 0,
      $40_1 = 0,
      $41_1 = 0,
      $42_1 = 0,
      $43_1 = 0,
      $44_1 = 0,
      var$8$hi = 0,
      $45_1 = 0,
      $46_1 = 0,
      $47_1 = 0,
      $48_1 = 0,
      var$7$hi = 0,
      $49_1 = 0,
      $63$hi = 0,
      $65_1 = 0,
      $65$hi = 0,
      $120$hi = 0,
      $129$hi = 0,
      $134$hi = 0,
      var$8 = 0,
      $140 = 0,
      $140$hi = 0,
      $142$hi = 0,
      $144 = 0,
      $144$hi = 0,
      $151 = 0,
      $151$hi = 0,
      $154$hi = 0,
      var$7 = 0,
      $165$hi = 0;
    label$1: {
      label$2: {
        label$3: {
          label$4: {
            label$5: {
              label$6: {
                label$7: {
                  label$8: {
                    label$9: {
                      label$10: {
                        label$11: {
                          i64toi32_i32$0 = var$0$hi;
                          i64toi32_i32$2 = var$0;
                          i64toi32_i32$1 = 0;
                          i64toi32_i32$3 = 32;
                          i64toi32_i32$4 = i64toi32_i32$3 & 31;
                          if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
                            i64toi32_i32$1 = 0;
                            $37_1 = i64toi32_i32$0 >>> i64toi32_i32$4;
                          } else {
                            i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4;
                            $37_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$0) << (32 - i64toi32_i32$4) | (i64toi32_i32$2 >>> i64toi32_i32$4);
                          }
                          var$2 = $37_1;
                          if(var$2) {
                            block: {
                              i64toi32_i32$1 = var$1$hi;
                              var$3 = var$1;
                              if(!var$3) {
                                break label$11
                              }
                              i64toi32_i32$1 = var$1$hi;
                              i64toi32_i32$0 = var$1;
                              i64toi32_i32$2 = 0;
                              i64toi32_i32$3 = 32;
                              i64toi32_i32$4 = i64toi32_i32$3 & 31;
                              if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
                                i64toi32_i32$2 = 0;
                                $38_1 = i64toi32_i32$1 >>> i64toi32_i32$4;
                              } else {
                                i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4;
                                $38_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$1) << (32 - i64toi32_i32$4) | (i64toi32_i32$0 >>> i64toi32_i32$4);
                              }
                              var$4 = $38_1;
                              if(!var$4) {
                                break label$9
                              }
                              var$2 = Math_clz32(var$4) - Math_clz32(var$2);
                              if(var$2 >>> 0 <= 31 >>> 0) {
                                break label$8
                              }
                              break label$2;
                            }
                          }
                          i64toi32_i32$2 = var$1$hi;
                          i64toi32_i32$1 = var$1;
                          i64toi32_i32$0 = 1;
                          i64toi32_i32$3 = 0;
                          if(i64toi32_i32$2 >>> 0 > i64toi32_i32$0 >>> 0 | ((i64toi32_i32$2) == (i64toi32_i32$0) & i64toi32_i32$1 >>> 0 >= i64toi32_i32$3 >>> 0)) {
                            break label$2
                          }
                          i64toi32_i32$1 = var$0$hi;
                          var$2 = var$0;
                          i64toi32_i32$1 = var$1$hi;
                          var$3 = var$1;
                          var$2 = (var$2 >>> 0) / (var$3 >>> 0);
                          i64toi32_i32$1 = 0;
                          __wasm_intrinsics_temp_i64 = var$0 - Math_imul(var$2, var$3);
                          __wasm_intrinsics_temp_i64$hi = i64toi32_i32$1;
                          i64toi32_i32$1 = 0;
                          i64toi32_i32$2 = var$2;
                          i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
                          return i64toi32_i32$2;
                        }
                        i64toi32_i32$2 = var$1$hi;
                        i64toi32_i32$3 = var$1;
                        i64toi32_i32$1 = 0;
                        i64toi32_i32$0 = 32;
                        i64toi32_i32$4 = i64toi32_i32$0 & 31;
                        if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
                          i64toi32_i32$1 = 0;
                          $39_1 = i64toi32_i32$2 >>> i64toi32_i32$4;
                        } else {
                          i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4;
                          $39_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$2) << (32 - i64toi32_i32$4) | (i64toi32_i32$3 >>> i64toi32_i32$4);
                        }
                        var$3 = $39_1;
                        i64toi32_i32$1 = var$0$hi;
                        if(!var$0) {
                          break label$7
                        }
                        if(!var$3) {
                          break label$6
                        }
                        var$4 = var$3 + -1;
                        if(var$4 & var$3) {
                          break label$6
                        }
                        i64toi32_i32$1 = 0;
                        i64toi32_i32$2 = var$4 & var$2;
                        i64toi32_i32$3 = 0;
                        i64toi32_i32$0 = 32;
                        i64toi32_i32$4 = i64toi32_i32$0 & 31;
                        if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
                          i64toi32_i32$3 = i64toi32_i32$2 << i64toi32_i32$4;
                          $40_1 = 0;
                        } else {
                          i64toi32_i32$3 = ((1 << i64toi32_i32$4) - 1) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4)) | (i64toi32_i32$1 << i64toi32_i32$4);
                          $40_1 = i64toi32_i32$2 << i64toi32_i32$4;
                        }
                        $63$hi = i64toi32_i32$3;
                        i64toi32_i32$3 = var$0$hi;
                        i64toi32_i32$1 = var$0;
                        i64toi32_i32$2 = 0;
                        i64toi32_i32$0 = -1;
                        i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$2;
                        $65_1 = i64toi32_i32$1 & i64toi32_i32$0;
                        $65$hi = i64toi32_i32$2;
                        i64toi32_i32$2 = $63$hi;
                        i64toi32_i32$3 = $40_1;
                        i64toi32_i32$1 = $65$hi;
                        i64toi32_i32$0 = $65_1;
                        i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1;
                        __wasm_intrinsics_temp_i64 = i64toi32_i32$3 | i64toi32_i32$0;
                        __wasm_intrinsics_temp_i64$hi = i64toi32_i32$1;
                        i64toi32_i32$1 = 0;
                        i64toi32_i32$3 = var$2 >>> ((__wasm_ctz_i32(var$3)) & 31);
                        i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
                        return i64toi32_i32$3;
                      }
                    }
                    var$4 = var$3 + -1;
                    if(!(var$4 & var$3)) {
                      break label$5
                    }
                    var$2 = (Math_clz32(var$3) + 33) - Math_clz32(var$2);
                    var$3 = 0 - var$2;
                    break label$3;
                  }
                  var$3 = 63 - var$2;
                  var$2 = var$2 + 1;
                  break label$3;
                }
                var$4 = (var$2 >>> 0) / (var$3 >>> 0);
                i64toi32_i32$3 = 0;
                i64toi32_i32$2 = var$2 - Math_imul(var$4, var$3);
                i64toi32_i32$1 = 0;
                i64toi32_i32$0 = 32;
                i64toi32_i32$4 = i64toi32_i32$0 & 31;
                if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
                  i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4;
                  $41_1 = 0;
                } else {
                  i64toi32_i32$1 = ((1 << i64toi32_i32$4) - 1) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4)) | (i64toi32_i32$3 << i64toi32_i32$4);
                  $41_1 = i64toi32_i32$2 << i64toi32_i32$4;
                }
                __wasm_intrinsics_temp_i64 = $41_1;
                __wasm_intrinsics_temp_i64$hi = i64toi32_i32$1;
                i64toi32_i32$1 = 0;
                i64toi32_i32$2 = var$4;
                i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
                return i64toi32_i32$2;
              }
              var$2 = Math_clz32(var$3) - Math_clz32(var$2);
              if(var$2 >>> 0 < 31 >>> 0) {
                break label$4
              }
              break label$2;
            }
            i64toi32_i32$2 = var$0$hi;
            i64toi32_i32$2 = 0;
            __wasm_intrinsics_temp_i64 = var$4 & var$0;
            __wasm_intrinsics_temp_i64$hi = i64toi32_i32$2;
            if((var$3) == (1)) {
              break label$1
            }
            i64toi32_i32$2 = var$0$hi;
            i64toi32_i32$2 = 0;
            $120$hi = i64toi32_i32$2;
            i64toi32_i32$2 = var$0$hi;
            i64toi32_i32$3 = var$0;
            i64toi32_i32$1 = $120$hi;
            i64toi32_i32$0 = __wasm_ctz_i32(var$3);
            i64toi32_i32$4 = i64toi32_i32$0 & 31;
            if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
              i64toi32_i32$1 = 0;
              $42_1 = i64toi32_i32$2 >>> i64toi32_i32$4;
            } else {
              i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4;
              $42_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$2) << (32 - i64toi32_i32$4) | (i64toi32_i32$3 >>> i64toi32_i32$4);
            }
            i64toi32_i32$3 = $42_1;
            i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
            return i64toi32_i32$3;
          }
          var$3 = 63 - var$2;
          var$2 = var$2 + 1;
        }
        i64toi32_i32$3 = var$0$hi;
        i64toi32_i32$3 = 0;
        $129$hi = i64toi32_i32$3;
        i64toi32_i32$3 = var$0$hi;
        i64toi32_i32$2 = var$0;
        i64toi32_i32$1 = $129$hi;
        i64toi32_i32$0 = var$2 & 63;
        i64toi32_i32$4 = i64toi32_i32$0 & 31;
        if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
          i64toi32_i32$1 = 0;
          $43_1 = i64toi32_i32$3 >>> i64toi32_i32$4;
        } else {
          i64toi32_i32$1 = i64toi32_i32$3 >>> i64toi32_i32$4;
          $43_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$3) << (32 - i64toi32_i32$4) | (i64toi32_i32$2 >>> i64toi32_i32$4);
        }
        var$5 = $43_1;
        var$5$hi = i64toi32_i32$1;
        i64toi32_i32$1 = var$0$hi;
        i64toi32_i32$1 = 0;
        $134$hi = i64toi32_i32$1;
        i64toi32_i32$1 = var$0$hi;
        i64toi32_i32$3 = var$0;
        i64toi32_i32$2 = $134$hi;
        i64toi32_i32$0 = var$3 & 63;
        i64toi32_i32$4 = i64toi32_i32$0 & 31;
        if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
          i64toi32_i32$2 = i64toi32_i32$3 << i64toi32_i32$4;
          $44_1 = 0;
        } else {
          i64toi32_i32$2 = ((1 << i64toi32_i32$4) - 1) & (i64toi32_i32$3 >>> (32 - i64toi32_i32$4)) | (i64toi32_i32$1 << i64toi32_i32$4);
          $44_1 = i64toi32_i32$3 << i64toi32_i32$4;
        }
        var$0 = $44_1;
        var$0$hi = i64toi32_i32$2;
        label$13: {
          if(var$2) {
            block3: {
              i64toi32_i32$2 = var$1$hi;
              i64toi32_i32$1 = var$1;
              i64toi32_i32$3 = -1;
              i64toi32_i32$0 = -1;
              i64toi32_i32$4 = i64toi32_i32$1 + i64toi32_i32$0;
              i64toi32_i32$5 = i64toi32_i32$2 + i64toi32_i32$3;
              if(i64toi32_i32$4 >>> 0 < i64toi32_i32$0 >>> 0) {
                i64toi32_i32$5 = i64toi32_i32$5 + 1
              }
              var$8 = i64toi32_i32$4;
              var$8$hi = i64toi32_i32$5;
              label$15: while(1) {
                i64toi32_i32$5 = var$5$hi;
                i64toi32_i32$2 = var$5;
                i64toi32_i32$1 = 0;
                i64toi32_i32$0 = 1;
                i64toi32_i32$3 = i64toi32_i32$0 & 31;
                if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
                  i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$3;
                  $45_1 = 0;
                } else {
                  i64toi32_i32$1 = ((1 << i64toi32_i32$3) - 1) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$3)) | (i64toi32_i32$5 << i64toi32_i32$3);
                  $45_1 = i64toi32_i32$2 << i64toi32_i32$3;
                }
                $140 = $45_1;
                $140$hi = i64toi32_i32$1;
                i64toi32_i32$1 = var$0$hi;
                i64toi32_i32$5 = var$0;
                i64toi32_i32$2 = 0;
                i64toi32_i32$0 = 63;
                i64toi32_i32$3 = i64toi32_i32$0 & 31;
                if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
                  i64toi32_i32$2 = 0;
                  $46_1 = i64toi32_i32$1 >>> i64toi32_i32$3;
                } else {
                  i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$3;
                  $46_1 = (((1 << i64toi32_i32$3) - 1) & i64toi32_i32$1) << (32 - i64toi32_i32$3) | (i64toi32_i32$5 >>> i64toi32_i32$3);
                }
                $142$hi = i64toi32_i32$2;
                i64toi32_i32$2 = $140$hi;
                i64toi32_i32$1 = $140;
                i64toi32_i32$5 = $142$hi;
                i64toi32_i32$0 = $46_1;
                i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$5;
                var$5 = i64toi32_i32$1 | i64toi32_i32$0;
                var$5$hi = i64toi32_i32$5;
                $144 = var$5;
                $144$hi = i64toi32_i32$5;
                i64toi32_i32$5 = var$8$hi;
                i64toi32_i32$5 = var$5$hi;
                i64toi32_i32$5 = var$8$hi;
                i64toi32_i32$2 = var$8;
                i64toi32_i32$1 = var$5$hi;
                i64toi32_i32$0 = var$5;
                i64toi32_i32$3 = i64toi32_i32$2 - i64toi32_i32$0;
                i64toi32_i32$6 = i64toi32_i32$2 >>> 0 < i64toi32_i32$0 >>> 0;
                i64toi32_i32$4 = i64toi32_i32$6 + i64toi32_i32$1;
                i64toi32_i32$4 = i64toi32_i32$5 - i64toi32_i32$4;
                i64toi32_i32$5 = i64toi32_i32$3;
                i64toi32_i32$2 = 0;
                i64toi32_i32$0 = 63;
                i64toi32_i32$1 = i64toi32_i32$0 & 31;
                if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
                  i64toi32_i32$2 = i64toi32_i32$4 >> 31;
                  $47_1 = i64toi32_i32$4 >> i64toi32_i32$1;
                } else {
                  i64toi32_i32$2 = i64toi32_i32$4 >> i64toi32_i32$1;
                  $47_1 = (((1 << i64toi32_i32$1) - 1) & i64toi32_i32$4) << (32 - i64toi32_i32$1) | (i64toi32_i32$5 >>> i64toi32_i32$1);
                }
                var$6 = $47_1;
                var$6$hi = i64toi32_i32$2;
                i64toi32_i32$2 = var$1$hi;
                i64toi32_i32$2 = var$6$hi;
                i64toi32_i32$4 = var$6;
                i64toi32_i32$5 = var$1$hi;
                i64toi32_i32$0 = var$1;
                i64toi32_i32$5 = i64toi32_i32$2 & i64toi32_i32$5;
                $151 = i64toi32_i32$4 & i64toi32_i32$0;
                $151$hi = i64toi32_i32$5;
                i64toi32_i32$5 = $144$hi;
                i64toi32_i32$2 = $144;
                i64toi32_i32$4 = $151$hi;
                i64toi32_i32$0 = $151;
                i64toi32_i32$1 = i64toi32_i32$2 - i64toi32_i32$0;
                i64toi32_i32$6 = i64toi32_i32$2 >>> 0 < i64toi32_i32$0 >>> 0;
                i64toi32_i32$3 = i64toi32_i32$6 + i64toi32_i32$4;
                i64toi32_i32$3 = i64toi32_i32$5 - i64toi32_i32$3;
                var$5 = i64toi32_i32$1;
                var$5$hi = i64toi32_i32$3;
                i64toi32_i32$3 = var$0$hi;
                i64toi32_i32$5 = var$0;
                i64toi32_i32$2 = 0;
                i64toi32_i32$0 = 1;
                i64toi32_i32$4 = i64toi32_i32$0 & 31;
                if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
                  i64toi32_i32$2 = i64toi32_i32$5 << i64toi32_i32$4;
                  $48_1 = 0;
                } else {
                  i64toi32_i32$2 = ((1 << i64toi32_i32$4) - 1) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$4)) | (i64toi32_i32$3 << i64toi32_i32$4);
                  $48_1 = i64toi32_i32$5 << i64toi32_i32$4;
                }
                $154$hi = i64toi32_i32$2;
                i64toi32_i32$2 = var$7$hi;
                i64toi32_i32$2 = $154$hi;
                i64toi32_i32$3 = $48_1;
                i64toi32_i32$5 = var$7$hi;
                i64toi32_i32$0 = var$7;
                i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$5;
                var$0 = i64toi32_i32$3 | i64toi32_i32$0;
                var$0$hi = i64toi32_i32$5;
                i64toi32_i32$5 = var$6$hi;
                i64toi32_i32$2 = var$6;
                i64toi32_i32$3 = 0;
                i64toi32_i32$0 = 1;
                i64toi32_i32$3 = i64toi32_i32$5 & i64toi32_i32$3;
                var$6 = i64toi32_i32$2 & i64toi32_i32$0;
                var$6$hi = i64toi32_i32$3;
                var$7 = var$6;
                var$7$hi = i64toi32_i32$3;
                var$2 = var$2 + -1;
                if(var$2) {
                  continue label$15
                }
                break label$15;
              };
              break label$13;
            }
          }
        }
        i64toi32_i32$3 = var$5$hi;
        __wasm_intrinsics_temp_i64 = var$5;
        __wasm_intrinsics_temp_i64$hi = i64toi32_i32$3;
        i64toi32_i32$3 = var$0$hi;
        i64toi32_i32$5 = var$0;
        i64toi32_i32$2 = 0;
        i64toi32_i32$0 = 1;
        i64toi32_i32$4 = i64toi32_i32$0 & 31;
        if(32 >>> 0 <= (i64toi32_i32$0 & 63) >>> 0) {
          i64toi32_i32$2 = i64toi32_i32$5 << i64toi32_i32$4;
          $49_1 = 0;
        } else {
          i64toi32_i32$2 = ((1 << i64toi32_i32$4) - 1) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$4)) | (i64toi32_i32$3 << i64toi32_i32$4);
          $49_1 = i64toi32_i32$5 << i64toi32_i32$4;
        }
        $165$hi = i64toi32_i32$2;
        i64toi32_i32$2 = var$6$hi;
        i64toi32_i32$2 = $165$hi;
        i64toi32_i32$3 = $49_1;
        i64toi32_i32$5 = var$6$hi;
        i64toi32_i32$0 = var$6;
        i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$5;
        i64toi32_i32$3 = i64toi32_i32$3 | i64toi32_i32$0;
        i64toi32_i32$HIGH_BITS = i64toi32_i32$5;
        return i64toi32_i32$3;
      }
      i64toi32_i32$3 = var$0$hi;
      __wasm_intrinsics_temp_i64 = var$0;
      __wasm_intrinsics_temp_i64$hi = i64toi32_i32$3;
      i64toi32_i32$3 = 0;
      var$0 = 0;
      var$0$hi = i64toi32_i32$3;
    }
    i64toi32_i32$3 = var$0$hi;
    i64toi32_i32$5 = var$0;
    i64toi32_i32$HIGH_BITS = i64toi32_i32$3;
    return i64toi32_i32$5;
  }

  function __wasm_i64_mul(var$0, var$0$hi, var$1, var$1$hi) {
    var$0 = var$0;
    var$0$hi = var$0$hi;
    var$1 = var$1;
    var$1$hi = var$1$hi;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0;
    i64toi32_i32$0 = var$0$hi;
    i64toi32_i32$0 = var$1$hi;
    i64toi32_i32$0 = var$0$hi;
    i64toi32_i32$1 = var$1$hi;
    i64toi32_i32$1 = _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE(var$0, i64toi32_i32$0, var$1, i64toi32_i32$1);
    i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
    i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
    return i64toi32_i32$1;
  }

  function __wasm_i64_udiv(var$0, var$0$hi, var$1, var$1$hi) {
    var$0 = var$0;
    var$0$hi = var$0$hi;
    var$1 = var$1;
    var$1$hi = var$1$hi;
    var i64toi32_i32$0 = 0,
      i64toi32_i32$1 = 0;
    i64toi32_i32$0 = var$0$hi;
    i64toi32_i32$0 = var$1$hi;
    i64toi32_i32$0 = var$0$hi;
    i64toi32_i32$1 = var$1$hi;
    i64toi32_i32$1 = _ZN17compiler_builtins3int4udiv10divmod_u6417h6026910b5ed08e40E(var$0, i64toi32_i32$0, var$1, i64toi32_i32$1);
    i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
    i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
    return i64toi32_i32$1;
  }

  function __wasm_rotl_i32(var$0, var$1) {
    var$0 = var$0;
    var$1 = var$1;
    var var$2 = 0;
    var$2 = var$1 & 31;
    var$1 = (0 - var$1) & 31;
    return ((-1 >>> var$2) & var$0) << var$2 | (((-1 << var$1) & var$0) >>> var$1);
  }

  function __wasm_rotl_i64(var$0, var$0$hi, var$1, var$1$hi) {
    var$0 = var$0;
    var$0$hi = var$0$hi;
    var$1 = var$1;
    var$1$hi = var$1$hi;
    var i64toi32_i32$1 = 0,
      i64toi32_i32$0 = 0,
      i64toi32_i32$2 = 0,
      i64toi32_i32$3 = 0,
      i64toi32_i32$5 = 0,
      i64toi32_i32$4 = 0,
      var$2$hi = 0,
      var$2 = 0,
      $19_1 = 0,
      $20_1 = 0,
      $21_1 = 0,
      $22_1 = 0,
      $6$hi = 0,
      $8$hi = 0,
      $10_1 = 0,
      $10$hi = 0,
      $15$hi = 0,
      $17$hi = 0,
      $19$hi = 0;
    i64toi32_i32$0 = var$1$hi;
    i64toi32_i32$2 = var$1;
    i64toi32_i32$1 = 0;
    i64toi32_i32$3 = 63;
    i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$1;
    var$2 = i64toi32_i32$2 & i64toi32_i32$3;
    var$2$hi = i64toi32_i32$1;
    i64toi32_i32$1 = -1;
    i64toi32_i32$0 = -1;
    i64toi32_i32$2 = var$2$hi;
    i64toi32_i32$3 = var$2;
    i64toi32_i32$4 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$2 = 0;
      $19_1 = i64toi32_i32$1 >>> i64toi32_i32$4;
    } else {
      i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4;
      $19_1 = (((1 << i64toi32_i32$4) - 1) & i64toi32_i32$1) << (32 - i64toi32_i32$4) | (i64toi32_i32$0 >>> i64toi32_i32$4);
    }
    $6$hi = i64toi32_i32$2;
    i64toi32_i32$2 = var$0$hi;
    i64toi32_i32$2 = $6$hi;
    i64toi32_i32$1 = $19_1;
    i64toi32_i32$0 = var$0$hi;
    i64toi32_i32$3 = var$0;
    i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$0;
    $8$hi = i64toi32_i32$0;
    i64toi32_i32$0 = var$2$hi;
    i64toi32_i32$0 = $8$hi;
    i64toi32_i32$2 = i64toi32_i32$1 & i64toi32_i32$3;
    i64toi32_i32$1 = var$2$hi;
    i64toi32_i32$3 = var$2;
    i64toi32_i32$4 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4;
      $20_1 = 0;
    } else {
      i64toi32_i32$1 = ((1 << i64toi32_i32$4) - 1) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4)) | (i64toi32_i32$0 << i64toi32_i32$4);
      $20_1 = i64toi32_i32$2 << i64toi32_i32$4;
    }
    $10_1 = $20_1;
    $10$hi = i64toi32_i32$1;
    i64toi32_i32$1 = var$1$hi;
    i64toi32_i32$1 = 0;
    i64toi32_i32$0 = 0;
    i64toi32_i32$2 = var$1$hi;
    i64toi32_i32$3 = var$1;
    i64toi32_i32$4 = i64toi32_i32$0 - i64toi32_i32$3;
    i64toi32_i32$5 = (i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0) + i64toi32_i32$2;
    i64toi32_i32$5 = i64toi32_i32$1 - i64toi32_i32$5;
    i64toi32_i32$1 = i64toi32_i32$4;
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = 63;
    i64toi32_i32$0 = i64toi32_i32$5 & i64toi32_i32$0;
    var$1 = i64toi32_i32$1 & i64toi32_i32$3;
    var$1$hi = i64toi32_i32$0;
    i64toi32_i32$0 = -1;
    i64toi32_i32$5 = -1;
    i64toi32_i32$1 = var$1$hi;
    i64toi32_i32$3 = var$1;
    i64toi32_i32$2 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$1 = i64toi32_i32$5 << i64toi32_i32$2;
      $21_1 = 0;
    } else {
      i64toi32_i32$1 = ((1 << i64toi32_i32$2) - 1) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$2)) | (i64toi32_i32$0 << i64toi32_i32$2);
      $21_1 = i64toi32_i32$5 << i64toi32_i32$2;
    }
    $15$hi = i64toi32_i32$1;
    i64toi32_i32$1 = var$0$hi;
    i64toi32_i32$1 = $15$hi;
    i64toi32_i32$0 = $21_1;
    i64toi32_i32$5 = var$0$hi;
    i64toi32_i32$3 = var$0;
    i64toi32_i32$5 = i64toi32_i32$1 & i64toi32_i32$5;
    $17$hi = i64toi32_i32$5;
    i64toi32_i32$5 = var$1$hi;
    i64toi32_i32$5 = $17$hi;
    i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$3;
    i64toi32_i32$0 = var$1$hi;
    i64toi32_i32$3 = var$1;
    i64toi32_i32$2 = i64toi32_i32$3 & 31;
    if(32 >>> 0 <= (i64toi32_i32$3 & 63) >>> 0) {
      i64toi32_i32$0 = 0;
      $22_1 = i64toi32_i32$5 >>> i64toi32_i32$2;
    } else {
      i64toi32_i32$0 = i64toi32_i32$5 >>> i64toi32_i32$2;
      $22_1 = (((1 << i64toi32_i32$2) - 1) & i64toi32_i32$5) << (32 - i64toi32_i32$2) | (i64toi32_i32$1 >>> i64toi32_i32$2);
    }
    $19$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $10$hi;
    i64toi32_i32$5 = $10_1;
    i64toi32_i32$1 = $19$hi;
    i64toi32_i32$3 = $22_1;
    i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1;
    i64toi32_i32$5 = i64toi32_i32$5 | i64toi32_i32$3;
    i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
    return i64toi32_i32$5;
  }

  function __wasm_ctz_i32(var$0) {
    var$0 = var$0;
    if(var$0) {
      return 31 - Math_clz32((var$0 + -1) ^ var$0)
    }
    return 32;
  }

  bufferView = HEAPU8;
  initActiveSegments(env);
  var FUNCTION_TABLE = [null, $54, $62, $49, $37, $81, $27, $74, $75, $20, $76, $77, $81, $33, $81, $38, $56, $32, $49, $78, $79, $47, $16, $24, $41, $57, $81, $38, $60, $34, $45, $50, $30, $66, $58, $29, $9, $61, $53, $81, $80, $4, $19, $36, $71, $63, $18, $35, $70, $17];

  function __wasm_memory_size() {
    return buffer.byteLength / 65536;
  }

  function __wasm_memory_grow(pagesToAdd) {
    pagesToAdd = pagesToAdd;
    var oldPages = __wasm_memory_size();
    var newPages = oldPages + pagesToAdd;
    if((oldPages < newPages) && (newPages < 65536)) {
      var newBuffer = new ArrayBuffer(Math_imul(newPages, 65536));
      var newHEAP8 = new Int8Array(newBuffer);
      newHEAP8.set(HEAP8);
      HEAP8 = new Int8Array(newBuffer);
      HEAP16 = new Int16Array(newBuffer);
      HEAP32 = new Int32Array(newBuffer);
      HEAPU8 = new Uint8Array(newBuffer);
      HEAPU16 = new Uint16Array(newBuffer);
      HEAPU32 = new Uint32Array(newBuffer);
      HEAPF32 = new Float32Array(newBuffer);
      HEAPF64 = new Float64Array(newBuffer);
      buffer = newBuffer;
      bufferView = HEAPU8;
    }
    return oldPages;
  }

  return {
    "memory": Object.create(Object.prototype, {
      "grow": {
        "value": __wasm_memory_grow
      },
      "buffer": {
        "get": function() {
          return buffer;
        }

      }
    }),
    "solve": solve,
    "solve_with_iter": solve_with_iter,
    "__wbindgen_add_to_stack_pointer": add_to_stack_pointer,
    "__wbindgen_malloc": malloc,
    "__wbindgen_realloc": realloc,
    "__wbindgen_free": free
  };
}

var retasmFunc = asmFunc({
  abort: function() {
    throw new Error('abort');
  }
});
export var memory = retasmFunc.memory;
export var solve = retasmFunc.solve;
export var solve_with_iter = retasmFunc.solve_with_iter;
export var __wbindgen_add_to_stack_pointer = retasmFunc.__wbindgen_add_to_stack_pointer;
export var __wbindgen_malloc = retasmFunc.__wbindgen_malloc;
export var __wbindgen_realloc = retasmFunc.__wbindgen_realloc;
export var __wbindgen_free = retasmFunc.__wbindgen_free;
