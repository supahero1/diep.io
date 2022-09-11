#include <cassert>
#include <cstring>
#include <cstdint>
#include <cstdlib>

#include <node_api.h>
#include <openssl/sha.h>

using namespace std;

namespace diep {
  char LUT[] =
    "0123456789abcdef"
    "ghijklmnopqrstuv"
    "wxyzABCDEFGHIJKL"
    "MNOPQRSTUVWXYZ01"
    "23456789abcdefgh"
    "ijklmnopqrstuvwx"
    "yzABCDEFGHIJKLMN"
    "OPQRSTUVWXYZ0123"
    "456789abcdefghij"
    "klmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOP"
    "QRSTUVWXYZ012345"
    "6789abcdefghijkl"
    "mnopqrstuvwxyzAB"
    "CDEFGHIJKLMNOPQR"
    "STUVWXYZ01234567";
  
  #define NAPI_CALL(env, call)                                    \
  do {                                                            \
    napi_status status = (call);                                  \
    if(status != napi_ok) {                                       \
      const napi_extended_error_info* error_info = NULL;          \
      napi_get_last_error_info((env), &error_info);               \
      bool is_pending;                                            \
      napi_is_exception_pending((env), &is_pending);              \
      if(!is_pending) {                                           \
        const char* message = (error_info->error_message == NULL) \
            ? "empty error message"                               \
            : error_info->error_message;                          \
        napi_throw_error((env), NULL, message);                   \
        return NULL;                                              \
      }                                                           \
    }                                                             \
  } while(0)
  
  static napi_value solve_pow(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));
    if(argc < 2) {
      napi_throw_type_error(env, NULL, "Wrong number of arguments");
      return NULL;
    }
    
    uint32_t difficulty;
    NAPI_CALL(env, napi_get_value_uint32(env, args[0], &difficulty));
    
    size_t len;
    uint8_t* hash;
    NAPI_CALL(env, napi_get_arraybuffer_info(env, args[1], (void**)&hash, &len));
    
    uint8_t result[20];
    uint8_t* input = (uint8_t*) malloc(len * 3);
    assert(input);

    for(uint8_t i = 0; i < len; ++i) {
      input[i] = hash[i];
      input[(len << 1) + i] = hash[i];
      result[i] = hash[i];
    }
    while(1) {
      start:;
      for(size_t i = 0; i < len; ++i) {
        input[len + i] = LUT[result[i]];
      }
      (void) SHA1(input, len * 3, result);
      result[2] ^= 0xf3;
      uint8_t i = 0;
      for(; i < difficulty >> 2U; ++i) {
        if(result[i / 2U] & ((i & 1U) ? 0x0f : 0xf0)) goto start;
      }
      const uint8_t n = difficulty & 3U;
      if(n == 0) break;
      const uint8_t odd = i & 1U;
      const uint8_t mask = (1U << n) - 1U;
      const uint8_t nibble = (result[i / 2U] & (odd ? 0x0f : 0xf0)) >> ((odd ^ 1U) << 2U);
      if(((nibble ^ 4) & mask) == mask) break;
    }
    napi_value ret;
    NAPI_CALL(env, napi_create_string_utf8(env, (char*) input + len, len, &ret));
    return ret;
  }
  NAPI_MODULE_INIT() {
    napi_value result;
    napi_value exported_function;
    
    NAPI_CALL(env, napi_create_object(env, &result));
    NAPI_CALL(env, napi_create_function(env, "solve_pow", NAPI_AUTO_LENGTH, solve_pow, NULL, &exported_function));
    NAPI_CALL(env, napi_set_named_property(env, result, "solve_pow", exported_function));
    return result;
  }
}