#include <node_api.h>
#include <cstdint>

using namespace std;

namespace diep {
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
  
  static napi_value decompress(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    NAPI_CALL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));
    if(argc < 1) {
      napi_throw_type_error(env, NULL, "Wrong number of arguments");
      return NULL;
    }
    
    size_t len;
    uint8_t* packet;
    void* retre;
    NAPI_CALL(env, napi_get_arraybuffer_info(env, args[0], &retre, &len));
    packet = (uint8_t*) retre;
    const size_t total_size = (packet[4] << 24) | (packet[3] << 16) | (packet[2] << 8) | packet[1];
    
    napi_value ret;
    uint8_t* output;
    NAPI_CALL(env, napi_create_arraybuffer(env, total_size, &retre, &ret));
    output = (uint8_t*) retre;
    
    size_t at = 5;
    size_t aat = 0;
    while(1) {
      const size_t token = packet[at++];
      size_t literalLength = token >> 4;
      if(literalLength == 0xf) {
        do {
          literalLength += packet[at];
        } while(packet[at++] == 0xff);
      }
      for(size_t i = at; i < at + literalLength; i++) {
        output[aat++] = packet[i];
      }
      at += literalLength;
      if(at >= len - 1) {
        break;
      }
      const size_t copyStart = aat - ((packet[at + 1] << 8) | packet[at]);
      at += 2;
      size_t copyLength = token & 0xf;
      if(copyLength == 0xf) {
        do {
          copyLength += packet[at];
        } while(packet[at++] == 0xff);
      }
      copyLength += 4;
      if(copyStart + copyLength <= aat) {
        for(size_t i = copyStart; i < copyStart + copyLength; i++) {
          output[aat++] = output[i];
        }
      } else {
        const size_t oldLength = aat;
        for(size_t i = copyStart; i < oldLength; i++) {
          output[aat++] = output[i];
        }
        for(size_t i = 0; i < copyStart + copyLength - oldLength; i++) {
          output[aat++] = output[oldLength + i];
        }
      }
    }
    
    return ret;
  }
  NAPI_MODULE_INIT() {
    napi_value result;
    napi_value exported_function;
    
    NAPI_CALL(env, napi_create_object(env, &result));
    NAPI_CALL(env, napi_create_function(env, "decompress", NAPI_AUTO_LENGTH, decompress, NULL, &exported_function));
    NAPI_CALL(env, napi_set_named_property(env, result, "decompress", exported_function));
    return result;
  }
}