The second version of Renewed Shädbot features the following updates over the first version:

1. Improved speed of finding scoreboards up to 5 times
2. Tweaks to commands
3. New command - `go find`

# Installation

You need to compile `decompressor.cpp` and `pow_solver.cpp` into usable native node.js modules. You do it the following way:

1. Download the files
2. Execute `npm install -g node-gyp`
3. Execute `node-gyp configure` (you might need `sudo` too)
4. Execute `node-gyp build`

Now everything should work. Don't forget you need to launch `dworker.js` and `worker.js` before `bot.js`, or else the bot will quit, since it detected the necessary services are not available.
