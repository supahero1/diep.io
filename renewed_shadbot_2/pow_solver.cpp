#include <node.h>
#include <ctime>
#include <string>
#include <openssl/sha.h>

using namespace v8;
using namespace std;

unsigned char hex[] = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

namespace demo {
  void solve_pow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    if(args.Length() < 17) {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
      return;
    }
    unsigned char result[SHA_DIGEST_LENGTH];
    unsigned char input[48];
    for(int i = 0; i < 16; ++i) {
      input[i] = (unsigned long) args[i].As<Number>()->Value();
      input[32 + i] = input[i];
    }
    unsigned long difficulty = (unsigned long) args[16].As<Number>()->Value();
    srand(1);
    SHA_CTX ctx;
    while(1) {
      start:;
      SHA1_Init(&ctx);
      for(unsigned long j = 0; j < 16; ++j) {
        input[16 + j] = '0' + (rand() % 10);
      }
      SHA1_Update(&ctx, input, 48);
      SHA1_Final(result, &ctx);
      unsigned long i = 0;
      for(; i < difficulty / 4U; ++i) {
        if(result[i / 2U] & (i & 1U ? 0x0f : 0xf0)) goto start;
      }
      unsigned long n = difficulty % 4U;
      unsigned long nibble = (result[i / 2U] & (i & 1U ? 0x0f : 0xf0)) >> ((i & 1U) ? 0U : 4U);
      if(n && (nibble & ((1U << n) - 1U)) != (1U << n) - 1U) goto start;
      break;
    }
    string hash;
    hash.resize(16);
    for(unsigned long i = 0; i < 16; ++i) {
      hash[i] = input[16 + i];
    }
    hash.resize(17, '\0');
    args.GetReturnValue().Set(String::NewFromUtf8(isolate, hash.c_str()).ToLocalChecked());
  }
  void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "solve_pow", solve_pow);
  }
  NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
}