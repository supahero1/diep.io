## Rivet's Proof of Work writte in Rust

The `build` folder contains a C++ solver with a nodejs compability.

`original.js` is what the original PoW solver looks like when run through `wasm2js`.

`annotated.js` is the same file, except heavily modified by me and annotated to understand how it works. I stopped working on it at some point, so not everything is annotated, and things that I found obvious were not annotated too, sorry not sorry.

If these files don't make you realise it already, this PoW is literally the same as before, except with 2 new XORs. The timings are the same too - 10 seconds to send back, 30 second time bank for any delays.

`build/pow.user.js` also additionally contains the new eval packet overrider, feel free to use it just to speed up your game connecting to servers a little bit, to disable debugger, or to produce bots.
