#include <node.h>
#include <iostream>

using namespace v8;
using namespace std;

namespace demo {
  void decompress(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    unsigned char packet[655350];
    unsigned char output[655350];
    Local<Array> input = Local<Array>::Cast(args[0]);
    auto len = input->Length();
    for(unsigned long i = 0; i < len; ++i) {
      MaybeLocal<Value> val1 = input->Get(context, i);
      Local<Value> val2;
      val1.ToLocal(&val2);
      packet[i] = val2->Uint32Value(context).FromJust();
    }
    /* BEGINNING */
    unsigned long total_size = (packet[4] << 24) | (packet[3] << 16) | (packet[2] << 8) | packet[1];
    unsigned long at = 5;
    unsigned long aat = 0;
    while(true) {
      unsigned long token = packet[at++];
      unsigned long literalLength = token >> 4;
      if(literalLength == 0xf) {
        do {
          literalLength += packet[at];
        } while(packet[at++] == 0xff);
      }
      for(unsigned long i = at; i < at + literalLength; i++) {
        output[aat++] = packet[i];
      }
      at += literalLength;
      if(at >= len - 1) {
        break;
      }
      unsigned long copyStart = aat - ((packet[++at] << 8) | packet[at++ - 1]);
      unsigned long copyLength = token & 0xf;
      if(copyLength == 0xf) {
        do {
          copyLength += packet[at];
        } while(packet[at++] == 0xff);
      }
      copyLength += 4;
      if(copyStart + copyLength <= aat) {
        for(unsigned long i = copyStart; i < copyStart + copyLength; i++) {
          output[aat++] = output[i];
        }
      } else {
        unsigned long oldLength = aat;
        for(unsigned long i = copyStart; i < oldLength; i++) {
          output[aat++] = output[i];
        }
        for(unsigned long i = 0; i < copyStart + copyLength - oldLength; i++) {
          output[aat++] = output[oldLength + i];
        }
      }
    }
    /* ENDING */
    Local<Array> return_output = Array::New(isolate);
    for(unsigned long i = 0; i < total_size; ++i) {
      return_output->Set(context, i, Number::New(isolate, (double) output[i]));
    }
    args.GetReturnValue().Set(return_output);
  }
  void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "decompress", decompress);
  }
  NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
}