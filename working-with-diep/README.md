Diep.io might seem like a very complex game at first glance, but it isn't once you learn more about it and means of protecting itself it is using.

Primarily, diep.io seems like a horrible game to work with, because not many people are yet aware of WebAssembly, which might seem like a horror compared to the high-level easy JavaScript. WebAssembly is very specific and will be a breeze to understand for people who know about how nowadays CPUs work. Here is a short history of JavaScript:

Once, there was JavaScript (JS). Once, people began understanding it is a very slow language - no wonder, since it is so high-level and has so much abstraction. So ***asm.js*** was created at first - a **subset** of JS that in fact is JS, but has more rules, restrictions, that make it faster to some degree (because rules are what makes software fast). The rules were - asm.js can mostly only be used in calculations. But asm.js was very difficult to read and people eventually wanted even faster web applications in JS, so ***WebAssembly (WASM or WA)*** emerged, which was used to be around twice as fast as plain JS (nowadays the speed is constantly improving). WebAssembly has even more rules than asm.js - it can ONLY be used to calculate things. If you want to do any JS-specific shenanigans in WASM, you need to import JS functions and call then from within WASM.

In JS, when we do the following:
```js
function add(a, b) {
  return a + b;
}
```
We don't actually realise how complex this might be under the hood. In WASM the same could be done with the following:
```webassembly
(func $add (export "add") (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    get_local $p1
    get_local $p0
    i32.add)
```
And more complex calculations can take up huge amounts of space, literally **thousands** of lines of code in WASM, compared to perhaps hundreds in JS. A `console.log()` implementation in WASM takes about 1.8k lines of WASM code.

How come? Well, there is no time to explain how CPU instructions work, or how Assembly works. The idea of WebAssembly goes something like this:
1. There are no variables - instead, there is a **stack**, which is like an array that you add elements to and can pop them (from the end, never from the beginning).
2. There is raw memory (UintxArray) which you can store your data in.
3. There are only simple instructions which operate either on the raw memory or the stack - an `add` function adds the last number from the stack to the one before last and stores it in the one before last. Most simple instructions (subtraction, multiplication, etc) work exactly like this.
4. Functions and global variables (visible from every function) are a thing.
5. Compile-time constant memory is a thing - if you have a few strings in your code, they are absolutely not in the functions they are required in. Instead, they sit in memory, and are loaded into their functions whenever needed.
6. Types are required. Signed 32bit, signed 64bit, float 32bit and float 64bit are the only ones. In JS types are opaque, so this might be very new to you.

This is really all the knowledge you need to begin working with WASM. If you want to learn more, visit [the official WASM website](https://webassembly.github.io/spec/core/index.html).

# Security

Well, lads. Now that WASM is out of our way, let's talk about security diep.io employs to not fall victim to bots and scripts.

First of all, the source code of diep.io can be found in its HTML code. Simply go to diep.io and press `CTRL + U` to open the source code of the HTML page (or you can use other browser-dependent tools to do so, probably in the top right corner, if `CTRL + U` doesn't work). There you can see the following (warning: might not be up to date):

![diep_source](https://user-images.githubusercontent.com/47268949/121800643-697b0380-cc33-11eb-8bce-99f3e9edee1f.png)

First part is not very interesting. We can notice one thing already though - the base URL is `static.diep.io`, which means resources the game is using can be found in there somewhere, and not in `diep.io/here`.

![diep_source](https://user-images.githubusercontent.com/47268949/121800702-a810be00-cc33-11eb-8eea-9f86608daf16.png)

Ads, tracking, font, canvas, some other elements. Not interesting. But, at least we know that the canvas has the `canvas` ID, so in game we can do `document.getElementById("canvas")` to modify it.

![diep_source](https://user-images.githubusercontent.com/47268949/121800740-e312f180-cc33-11eb-9c20-d7cb7c9c2e0b.png)

Finally some good stuff at the very end. 3 files are always the same and are automatically loaded, while the other, last one, is fetched by the game after the document is loaded and then attached to it to be executed. The file also has some kind of a hash in its name (build_xxxxxx.wasm.js). The hash's length is 40.

`c.js` controls input, scaling, window resizing. `a.js` is for ads. `pow.js` is for Proof of Work (explained later on). The core of the game though is the `build` file, which contains the whole code the game needs.

Diep.io was used to have 2 versions of the game - asm.js and WASM. It was like that, because WASM wasn't as popular 5 years ago as it is nowadays, and so for compability reasons, Zeach decided to add asm.js too. Besides, it takes nothing else than simply changing one flag when compiling the game using emscripten. Eventually, after Zeach noticed the asm.js version is being abused to create scripts and bots, he deleted it and only left the WASM version.

WASM is loaded through the `build_.wasm.js` file. We can read the build file by simply copying the file name (`build_81043a4e0d7341b8da86d629acb1a149d1954528.wasm.js`), then joining it with the base URL (`static.diep.io`), and whallah, we have the link: `https://static.diep.io/build_81043a4e0d7341b8da86d629acb1a149d1954528.wasm.js`.

The build hash (40 long string of hexadecimals after `build_`) has multiple purposes - seeding the game with (pseudo)random values (since the hash itself is (pseudo)random, and the game is using it in the code), verifying to the server that the client is up to date, and preventing caching.

Now, back to security. In the JS build file we can see a lot of code, most of which isn't really important and is only here to simulate file system (read more about [emscripten](https://emscripten.org/)). What is interesting though are custom functions created by Zeach. There is a whole array of them. For instance, we can find out what the WASM file internally checks for to detect extensions:

![build_js](https://user-images.githubusercontent.com/47268949/121801085-cd9ec700-cc35-11eb-9a9b-382b7b4fd4b0.png)

Don't mind the yellow selection. We can see a few things that diep.io does here:
1. Check if `WebSocket._send` is defined (often, scripts hooking to the game's websockets are employing a `_send` function to hold the real `WebSocket.send`)
2. Check if multiple functions haven't been tampered with by checking their code (`function.toString()`)

And many more.

With this knowledge, scripting becomes easier, as we won't see the alert box saying the game is modified if we modify it propertly. For instance, if you wish to modify functions the game checks code of, do not modify them directly - apply a proxy. The game's code can also be modified in such a way that these checks always succeed so that they don't trigger anything.

If you want to work with WASM, take a look at [how to convert WASM to JS with binaryen](https://github.com/WebAssembly/binaryen) and [how to edit WASM in browser with Wail](https://github.com/Qwokka/WAIL).

# Protocol security measures

The biggest problem Zeach needed to get over were bots. It all started lightly - mass lagbot attack was prevented to some degree by drastically reducing the time for a tank to die when it disconnects, and automatic ban system was employed to ban an IP if it was detected that it was sending invalid packets. It certainly wasn't enough though, and so Zeach moved onto much heavier things to protect the game.

## 1. Eval packet

Zeach eventually came up with an idea to send a highly obfuscated code that is sent by the server to the client and is evaled. It checks multiple things and if it detects nothing wrong, it returns a number that the client sends back to the server which then verifies that the number is correct and allows the client to play the game. Otherwise, if it detects anything wrong, it still returns a number, but not a correct one. The client is not aware of it, since it doesn't know which number is correct, so it sends it back to the server. The server then detects the number is not the right one.

A tutorial on how to deobfuscate eval packets [here](https://github.com/supahero1/diep.io/tree/master/eval_packet).

I have also created a userscript that uses regexpes to remove most of eval packets' code - code that would otherwise take a lot of time to be compiled by the browser, freezing the game briefly, and which would do checks. It can be used by bot creators to completely bypass the packet - the correct number will be instantly returned from the stripped-down code, or it might be used by players to avoid the game freeze upon connecting to a game server. You can find it [here](https://greasyfork.org/en/scripts/418966-eval-packet-overrider).

## 2. Proof of Work (PoW)

You might have heard about it if you are into cryptography or cryptocurrencies. It is used to prove, using cryptographic hash functions, that the peer really has done the work we asked it to do. In cryptocurrencies it is used to sign ledgers and the worker which finds the right hash wins the price.

It is commonly done with the SHA-1 function, even though it is nowadays not considered cryptographic, because collisions have been found. Anyways, diep.io is using SHA-1 to do it.

The idea is - you need to keep hashing data until you receive a hash that has a number of leading zeroes (in bits). Since output of a cryptographic hash alrogithm is considered random, there is no shortcut and you really need to spend time doing it. You can be more or less lucky with it, since it's random, so it can take random amount of time. You can read more about proof of work [here](https://en.wikipedia.org/wiki/Proof_of_work).

In diep.io, PoW is done in the following way:

1. When the client connects to the server, it is asked to solve a PoW with difficulty 19 (at the moment of writing this). The server sends a random string to the client, which the client needs to add a random string to, in order to hash it and check the amount of leading bits.
2. Once the client is done, it sends back the resulting string to the server. The server then checks if the hash really has 19 leading bit zeroes. If it is the case, it allows the client to continue.
3. From then on, the server will keep sending a PoW of difficulty 17 whenever the client sends back a result to the previous PoW.

Zeach has estimated that the maximum allowed time for solving a PoW should be 10 seconds. He has allowed some error margin though, creating a so-called "time bank", which has below a minute worth of seconds in it. If the client takes more than 10 seconds to send back a result to a PoW, the server removes time from the time bank. If the time bank's time hits 0, the client is disconnected by the server.

However, this implementation of PoW is highly problematic - it does not allow any breathing room for the client, causing it to be very overloaded, and so decreases FPS dramatically. I have created a userscript to counter that. After the client solves a PoW, the script delays sending back the result until `10 seconds - round-trip-time * 3`, thus allowing the client to calm down for a while. You can find it [here](https://greasyfork.org/en/scripts/420008-unlag). Note that the script works the worse the more ping you have.

## 3. Packet encoding

While it might be tempting to say it is **packet encryption** and not **encoding**, it must not be confused with **encryption**, which needs to be safe. When client connects to a server, a man-in-the-middle attack can reveal the current build hash, and thus reveal correct packet headers, or maybe even their whole contents, given the magic number is generated from the build hash just like the jump tables for header indexes are.

Packet encoding in diep.io consists of 2 parts - header index encoding and packet data encoding.

### Terminology:

Magic number - a pseudorandom number within the client. It affects the encoding and decoding. There are 2 magic numbers - one for encoding and one for decoding.

Jump table - a table of numbers from 0 to 127 generated for encoding and decoding when the game launches, to be used for header encoding and decoding. No number can be repeated within the table. The creation of a jump table is complex and not important here. Jump tables are scattered across 4 memory regions to be harder to find.

Whenever a new packet has to be encoded or decoded, the respective magic number is shuffled to form a new pseudorandom number and to change future encodings and decodings.

### Header index encoding

Suppose a jump table: `[1, 5, 4, 2, 7, 3, 6, 0]`

Whenever we need to encode a header, we need to grab the lower 4 bits of the encoding magic number in order to get a pseudorandom number from 0 to 15. After we have it, we can begin the encoding by doing the following:
```js
var i = 0;
var a = header_idx;
while(1) {
  a = encoding_jump_table[a];
  if(i++ == (encoding_magic_number & 15)) {
    break;
  }
}
```
Let's imagine the lower 4 bits of the encoding magic number form a number `4`, and the header is 2. Then:

* 1st jump - `a` is the third element from the jump table (4)
* 2nd jump - `a` is the fifth element from the jump table (7)
* 3rd jump - `a` is the eighth element from the jump table (0)
* 4th jump - `a` is the first element from the jump table (1)
* 5th jump - `a` is the second element from the jump table (5)

The encoded header index is 5.

Part of creation of a jump table in JS converted from WASM:

![jump_table_c](https://user-images.githubusercontent.com/47268949/121802767-72bd9d80-cc3e-11eb-8629-ae83447133ef.png)

Very visible where the 4 parts of the jump table are.

Jump table jumping to encode a header index:

![jump_jumping](https://user-images.githubusercontent.com/47268949/121802852-df389c80-cc3e-11eb-9a2d-62cebee69a01.png)

We can see it picks which jump table's part to access based on the header index.

### Packet data encoding

Whenever we need to encode a packet's data (excluding the header, since it's already been encoded), we need the magic number. Then, X times, we save the lower 8 bits of the magic number (which normally has 32 bits), we shuffle the magic number, and repeat. This way, we get X pseudorandom numbers that we put in an array. Then, we can encode the packet by doing the following:
```js
for(var i = 1; i < packet_length; ++i) {
  packet[i] ^= encode_table[i % encode_table.length];
}
```
Basically, we XOR contents of the packet with the pseudorandom numbers we've gotten. If we are out of numbers, we loop around.

The X (amount of pseudorandom numbers) is random and changes each time diep.io updates.

Part of creating X pseudorandom numbers and shuffling the magic number afterwards:

![encode_table](https://user-images.githubusercontent.com/47268949/121802928-3e96ac80-cc3f-11eb-83da-ecb3d673ef19.png)

First we store the magic number in an array (really only the lower 8 bits, because HEAP8) and then shuffle the magic number with 3 operations.

Packet encoding:

![packet_encoding](https://user-images.githubusercontent.com/47268949/121802967-7a317680-cc3f-11eb-9509-8f841441aab7.png)

In this case, length of the array of pseudorandom bytes is 24. We can also see that there is a check for packets smaller than 2 bytes. That is, if there is no data besides header index, don't encode. Quite natural, but redundant, because the loops are `do { ... } while(x)` instead of `while(x) { ... }`.

# Ways of defeating diep.io security

Client security is not a problem at all so I am not going to talk about it. What I'm going to talk about is how to bypass packet encoding.

There are primarily 3 days of doing so:

1. Be like [Cazka](https://github.com/Cazka) and take out huge chunks of code from the JS (converted from WASM) to let it do the work and not worry about logic yourself,
2. Spend time studying the (converted) JS code and write a packet encoder / decoder yourself,
3. If you only need to parse some packets at the beginning and not every single one (like me), you can copy values of magic numbers, jump tables and encoding/decoding tables from the game to then use them (until the next update, since then they will change).

I am going to talk about the third way now, as I have been doing it since months. Feel free to do the second one if you have much time to spare.

Currently, the leaderboard bot I am hosting works by storing the required information about encoding/decoding packets for X first outcoming/incoming packets, so that it can get the scoreboard (which is in the very first update packet sent by the server, read more about packets [here](https://github.com/ABCxFF/diepindepth)). I am getting the required information using Wail (props to [ABC](https://github.com/ABCxFF) for teaching me how to use it) and Binaryen, both of which I mentioned earlier. I will explain in detail how to do the same, so that hopefully more people get interested in diep.io.

### Step 1 - convert the current build.wasm file to JS using binaryen

1. Install [binaryen](https://github.com/WebAssembly/binaryen) if you haven't already. After the installation, inside the `bin` folder, there will be an executable called `wasm2js`.
2. Get the current build.wasm file. You can either do that by executing `go get build` command if you have access to the lb bot on [discord](https://shadam.xyz), or you can follow the steps I mentioned (e.g. press `CTRL + U`, get the file link, go to `https://static.diep.io/build_hash.wasm.js`, and then swap the last `.js` with `.wasm` and download it).
3. Use `wasm2js` tool to convert the WASM file to JS.

Example of downloading the file:

https://user-images.githubusercontent.com/47268949/121803498-46a41b80-cc42-11eb-96fb-3b6b012a6746.mp4

Example of converting WASM to JS:

https://user-images.githubusercontent.com/47268949/121803585-aa2e4900-cc42-11eb-9a97-3c041a160f12.mp4

### Step 2 - Find required constants in the JS file

#### Filling in trivial information

To do this and the next steps you need [this userscript](https://raw.githubusercontent.com/supahero1/diep.io/master/working-with-diep/dig.userscript.js). Keep the userscript DISABLED - do NOT use it in diep.io unless stated otherwise below.

Open the JS file in a text editor like [Atom](https://atom.io/) which can search through text using regexpes. Then open the JS file, press `CTRl + F` to initiate a search. It should look like this:

![atom_look](https://user-images.githubusercontent.com/47268949/121804085-f4b0c500-cc44-11eb-953e-1b90d768e810.png)

To turn on regexp search, you need to click on one of the 4 icons in bottom right corner which says `.*`:

![regexp_search](https://user-images.githubusercontent.com/47268949/121804119-1e69ec00-cc45-11eb-9f93-7e86d9e6c3dd.png)

Then you are ready to go to fetch most of required components.

There are 2 places you will need to search for them - encoding and decoding functions. To get to these functions, search the following with the regexp search: `\^.*?%`. There are only 2 such places in the code, which have both `^` and `%` in the same line, and these places encode and decode packet data. Once you search using enter or by clicking the button, you should be warped to the first result:

![first_result](https://user-images.githubusercontent.com/47268949/121804238-a64ff600-cc45-11eb-998a-d4ed0dfad6ff.png)

We need to know if we are inside an encoding or decoding function. For that, scroll up until you see the function's declaration:

https://user-images.githubusercontent.com/47268949/121804275-d4cdd100-cc45-11eb-9468-219bdd028d18.mp4

If the function has 3 arguments, it is an encoding function. Otherwise, it is decoding. Usually, encoding function is before decoding, and thus comes up first in the search result.

Now scroll back down to the search result. Then, open the userscript from above called "Diep.io Information Gatherer". At the top you should see the following variables:

![us_variables](https://user-images.githubusercontent.com/47268949/121804376-5e7d9e80-cc46-11eb-8a00-146ae4d7404c.png)

We will need to fill in ALL of the zeroes. NEVER change anything else in the userscript, unless stated otherwise below. NEVER change the zeroes based on your instict or such, or you will fill them in wrong. Follow the steps mentioned here.

Unless you want to host my leaderboard bot by yourself, you do NOT need to fill in the **BUILD** and **LAST_MODIFIED** fields.

Fill **BUILD** with the current build hash. For instance, if the file name you needed to download was `build_81043a4e0d7341b8da86d629acb1a149d1954528.wasm.wasm`, the hash is `81043a4e0d7341b8da86d629acb1a149d1954528`. Replace the zeroes (NOT the apostrophes) with the hash.

Alternatively, to fill in **BUILD**, you can execute the `go get build` command with the bot.

***NOTE:*** If you don't have access to the bot elsewhere, and don't yet have the values filled in, the version of the bot in the `renewed_shadbot` folder will work. You MUST NOT use commands like `go get leaders` or `go get scoreboard` that strictly rely on the information you are gathering right now. You can only use it for `go get build` and `go get update`, which are crucial to complete these steps. DO NOT copy any information from the userscript to the bot's code unless stated otherwise below.

Fill **LAST_MODIFIED** with the result of the `go get update` command. Using `document.lastModifed` will FAIL and you MUST NOT fill it with its value.

Fill **SAMPLES** with the maximum amount of packets you want to encode/decode. You MUST NOT use values above 1024, or it will take a considerable amount of time to gather the information. You CANNOT use this method of encoding/decoding packets to encode/decode them for an infinite amount of time. If you want to host the lb bot, the value MUST be 32.

Right now, the userscript should look something alike the following:

![userscript1](https://user-images.githubusercontent.com/47268949/121804667-dd270b80-cc47-11eb-9526-ce60e1a8f2e2.png)

#### Filling in advanced information from the JS file

Now, go back to the JS file, to the first search. In our example, the first search is in the encoding function, and we have deduced it by the fact that the function had 3 arguments (3 values between the curly brackets after the `function` keyword). Now, we will begin filling the following part of the userscript:

![userscript2](https://user-images.githubusercontent.com/47268949/121804748-34c57700-cc48-11eb-835f-c797dd085591.png)

If the function had other number of arguments than 3, it would be a decoding function, and we would need to fill in variables starting with `DECODE_`, not `ENCODE_`.

In the same line as the search points to, we can gather 2 pieces of information:

![js1](https://user-images.githubusercontent.com/47268949/121804826-8ff76980-cc48-11eb-8f7f-30aeb2b6ed3f.png)

Put the first number after the search highlight begins (256) in **ENCODE_OFFSET_TABLE_LOCATION**.

Put the number right after the **%** sign (19) in **ENCODE_OFFSET_TABLE_LENGTH**.

Scroll up to the first occurence of `& 15`. In this case, it is:

![js2](https://user-images.githubusercontent.com/47268949/121804925-2461cc00-cc49-11eb-8919-db0eabe2fff2.png)

Put the number right before `& 15` and after the `$` (17) in **ENCODE_OFFSET_MAGIC_NUMBER_VAR**.

Put the number right after `HEAP32[` in the next line (107016) in **ENCODE_OFFSET_JUMP_TABLE**.

At this point, the userscript should look alike the following:

![userscript3](https://user-images.githubusercontent.com/47268949/121805029-94705200-cc49-11eb-92d1-b4d0f45045bd.png)

Now we will fill in this section of the userscript:

![userscript4](https://user-images.githubusercontent.com/47268949/121805049-b10c8a00-cc49-11eb-9cc4-2b7215ad9325.png)

Back to the JS file. Below the information we gathered, there are 3 `if` statements. We look at the first one:

![js3](https://user-images.githubusercontent.com/47268949/121805096-e5804600-cc49-11eb-9b44-de3df4f47cad.png)

Put the number after `<=` (27) sign in **JUMP_TABLE_LIM1**.

Put the number in `Math_imul` a line below (5) in **JUMP_TABLE_MUL**. ***NOTE:*** It might be from time to time that there will be no `Math_imul()` function in the `if` statements:
1. If there is a multiplication (the `*` sign), put the number after the multiplication in **JUMP_TABLE_MUL**,
2. If there is a bitshift (the `<<` sign), take the number after the bitshift sign and bring `2` to the power of it. For instance, if there is the following:
```js
if ($3_1 >>> 0 <= 27 >>> 0) {
 $679_1 = ($6_1 + ($3_1 << 3) | 0) + 1455 | 0;
 break label$29;
}
```
, you must do `2 ^ 3`, which gives 8, and put it in **JUMP_TABLE_MUL**.

***NOTE:*** The numbers below MIGHT happen to have a minus sign in front of them. COPY THE MINUS WITH THEM, NOT ONLY THE NUMBER.

Put the number at the end of the line (1455) in **JUMP_TABLE_VAL1**.

Repeat the same for the 2 other `if` statements and for the line after them:

Put 3580 in **JUMP_TABLE_VAL2**.

Put 49 in **JUMP_TABLE_LIM2**.

Put 2510 in **JUMP_TABLE_VAL3**.

Put 79 in **JUMP_TABLE_LIM3**.

Put 765 in **JUMP_TABLE_VAL4**.

A line below the `}` character, there is a line with a XOR at the end of it (XOR is the `^` sign). Put the number after the XOR (80) in **JUMP_TABLE_XOR**.

Earlier in the same line, there is `HEAPU8[something + number | 0]`. Put `number` (4) in **JUMP_TABLE_ADD**.

** **

***WARNING!!!:*** It has already happened that 2 limits (**JUMP_TABLE_LIMx**) were 1 from each other (one was x, second one was x + 1), which caused emscripten to optimise it and thus change the code. It then looks like the following:

![optimised_jump_table](https://user-images.githubusercontent.com/47268949/121812774-86cac480-cc69-11eb-9c71-785f7d9fc930.png)

The difference is in between the first 2 `if` statements - it says `$1231 = $3_1;`, which is completely legal and correct, but which drives away from what I have shown above. Therefore, here is how to deal with it:

1. Find the place where `$3_1` is defined. Here, it is equivalent to `$6_1 + 1736 | 0;` (look at the top of the picture),
2. Swap `$3_1` with its definition (so that it becomes `$1231 = $6_1 + 1736 | 0;`),
3. Look at other `if` statements to see what the line should really look like (it should be `$1231 = ($6_1 + (31 << 1 | 0) | 0) + X | 0;`),
4. Using math, solve X (in the equation `$6_1 + 1736 = $6_1 + (31 << 1) + X`, which then becomes `1736 - ($6_1 << 1) = X`, which means `X = 1674`)

** **

The userscript should look alike the following:

![userscript5](https://user-images.githubusercontent.com/47268949/121805391-61c75900-cc4b-11eb-8aa8-bc781a56401f.png)

We are done with 2/3 of the work in the JS file. Now, we do the search for `\^.*?%` again to warp to the other function (currently we were doing encoding, so we will go to decoding). We will then repeat the first part of what we have done here (without the *JUMP_TABLE* part).

![js4](https://user-images.githubusercontent.com/47268949/121805454-b1a62000-cc4b-11eb-9c49-60b3c3f7c6cb.png)

Put 320 in **DECODE_OFFSET_TABLE_LOCATION**.

Put 18 in **DECODE_OFFSET_TABLE_LENGTH**.

Scroll up:

![js5](https://user-images.githubusercontent.com/47268949/121805509-d7cbc000-cc4b-11eb-9a11-6e0664d4550c.png)

Put 26 in **DECODE_OFFSET_MAGIC_NUMBER_VAR**.

Put 181752 in **DECODE_OFFSET_JUMP_TABLE**.

We are done with the JS file. In total, the userscript should look like this:

![userscript6](https://user-images.githubusercontent.com/47268949/121805552-05b10480-cc4c-11eb-99a0-0bafaaf73b27.png)

You can compare values you have gotten with the ones in the picture. Across updates, they should be comparable, aside from the *JUMP_TABLE* ones, which might change chaotically.

#### Filling in advanced information from the game

To get the 6 missing pieces of information we need to make our userscript complete and to gather information about encoding and decoding packets in diep.io, we need to go to the game's WASM code.

***NOTE:*** Some browsers have better, some have worse support for WebAssembly debugging. It is recommended to use any chromium-based browser, such as Opera, Chrome, or Brave.

***NOTE:*** Diep.io will keep triggering `debugger` when you open the Developer Tools and if you don't have my [Eval Packet Overrider](https://greasyfork.org/en/scripts/418966-eval-packet-overrider) or any other mean of disabling `debugger`.

Steps to set up for gathering the information:
1. Go to https://diep.io, any gamemode, any region, you don't even need to join the game
2. Open Developer Tools using `F12`, `Ctrl + Shift + I`, `Ctrl + Shift + J`, or using browser's top-right menu
3. Select the `Sources` tab at the top of Developer Tools
4. Click on the WASM file to open it inside of the Developer Tools

https://user-images.githubusercontent.com/47268949/121806434-25e2c280-cc50-11eb-9c8e-7141e3bf3627.mp4

Next, you need to find the encoding and decoding functions, but in WASM. I will present a universal method of getting their indexes:

1. Copy the entire WASM code and paste it into a new file (might take a considerable amount of time, might even freeze or crash your code editor or browser)
2. Search for the following regexp: `local\.get \$var\d+\s+i32\.const 15\s+i32\.and\s+local\.set`. It will yield 2 results - in encoding and decoding function.
3. Scroll up until `func $funcX`, where `X` is the function's number. Get the number for both encoding and decoding. You will know which is encoding, because to the right of the `X` there will be 3 words `param` inside curly brackets just like so:

![js6](https://user-images.githubusercontent.com/47268949/121807169-5bd57600-cc53-11eb-8bd6-d3c3addef79a.png)

After you get both indexes (for the update at the time I'm writing this, they are 107 for encoding and 484 for decoding), put them in **ENCODE_FUNC** and **DECODE_FUNC** variables.

Now go back to the Developer Tools you have opened in diep.io and to the WASM code. Initiate a search with `CTRL + F` and search for the encoding function by typing in `func $funcX ` (if you get weird results, delete and retype the space at the end), where X is **ENCODE_FUNC**.

***NOTE***: When you repeat this for decoding function, DO NOT include the space at the end (`func $funcY`).

You should see the beginning of the encoding function:

![wasm1](https://user-images.githubusercontent.com/47268949/121808272-ee781400-cc57-11eb-8362-2fd838af65c6.png)

You now must copy address of the first instruction in the function. That is, the address right below the faded grey addresses on the left side. In this example, it is 0x009fff.

Then, scroll down until you find this sequence of instructions in the exact same order (this is true for both encoding and decoding functions):
```webassembly
end $labelA
local.get $varB
i32.const 15
i32.and
local.set $varC
```
A, B and C are numbers. It does not matter what numbers.

![wasm2](https://user-images.githubusercontent.com/47268949/121808403-9857a080-cc58-11eb-9c37-b8b5871e30ab.png)

With practise, it will become considerably easier to find this and the other place I will mention below, because across updates it stays in almost the same place, +/- a few hundreds of lines. And besides, the places you need to find are very characteristic - this one you can find by simply looking for code with less indentation - in the picture you can see adjacent code has more space in front of it.

You are looking for the address of a line which is right below `local.get $varB`, but within 4 lines from it. For instance `i32.const 15`, with address 0x00a918. We save the address for the future.

Next, scroll down until you find this sequence of instructions in the exact same order (this is true for both encoding and decoding functions):
```webassembly
end
i32.const 1
local.set $varA
local.get $varB
i32.const 1
```
A, B, C and D are numbers. It does not matter what numbers.

![wasma](https://user-images.githubusercontent.com/47268949/121809014-65fb7280-cc5b-11eb-979c-b3208ff467ad.png)

We care about address of a line after `end`, doesn't really matter which one it will be, but it must be within 4 lines from it. For instance `i32.const 1`, with address 0x00ac72. Save the address somewhere.

Now you are done with the encoding function. You should have 3 addresses:
1. Beginning of the function - 0x009fff
2. First sequence of instructions - 0x00a918
3. Second sequence of instructions - 0x00ac72

Now you need to calculate the difference between 2 and 1, and 3 and 1. To do that, we simply do: `0x00a918 - 0x009fff` and `0x00ac72 - 0x009fff`.

The first result is 2329, put it in **ENCODE_OFFSET_MAGIC_NUMBER**.

The second result is 3187, put it in **ENCODE_OFFSET_TABLE**.

Do the same exact thing for decoding function:

![wa1](https://user-images.githubusercontent.com/47268949/121808682-03ee3d80-cc5a-11eb-8b2d-89663e41778a.png)

![wa2](https://user-images.githubusercontent.com/47268949/121808714-1ec0b200-cc5a-11eb-9cae-eb5470b92d59.png)

![wa3](https://user-images.githubusercontent.com/47268949/121808740-3d26ad80-cc5a-11eb-885e-f3d957d0bb47.png)

1. Beginning of the function - 0x04a7ca
2. First sequence of instructions - 0x04ba9f
3. Second sequence of instructions - 0x04bd55

Put `0x04ba9f - 0x04a7ca` 4821 in **DECODE_OFFSET_MAGIC_NUMBER**.

Put `0x04bd55 - 0x04a7ca` 5515 in **DECODE_OFFSET_TABLE**.

The userscript is complete. It should look like this:

![userscripto](https://user-images.githubusercontent.com/47268949/121809083-b83c9380-cc5b-11eb-83fb-0051ec003404.png)

**Turn on the userscript** and go to diep.io. If you have messed something up, 2 things can happen:
1. Your game won't go past the loading screen and in the console you will find a WebAssembly error saying that there is a trailing code after a function, or
2. You will be a victim to [undefined behavior](https://en.wikipedia.org/wiki/Undefined_behavior) - the userscript might malfunction, the data you gather might not be correct.

How to check if your data is correct? Check everything twice. If the data or the userscript doesn't work, and you think everything you've done is correct, it might be that the methods I have showed above are outdated.

If you have succeeded with everything, open the console in Developer Tools once you go to diep.io. You should see a lot of mess at the beginning, and then once it will stop. Type in: `stringify_bundle()` to save the data the script has gathered (do it ONLY after spam in the console has ceased). It should output a string with random numbers, like this:

![stringify_bundle](https://user-images.githubusercontent.com/47268949/121809368-d060e280-cc5c-11eb-8df6-ce622e204290.png)

What seems like random junk is what will allow you to decode and encode diep.io packets (up to **SAMPLES** times).

if you want to make sure the data isn't corrupted in any way (for instance, because you gave the userscript wrong data from the JS file or from the WASM code), you can use the code at the end of the userscript to do that:
1. Copy the top part of the userscript with all the variables you have been filling in,
2. Copy the output from the console, open a new tab, open console in it and paste the data inside, press enter,
3. Scroll down in the userscript. You should see a comment saying "PACKET ENCODING/DECODING". Copy all the code below it, until the end of the userscript, and paste it in the new tab you pasted the data in,
4. To check integrity of the first big packet you have at the top of your diep.io console, use the first part of the commented code at the end of the userscript. For any further packets, use the second part (after the whitespace).

A video showcasing how to do it:

https://user-images.githubusercontent.com/47268949/121809834-bb854e80-cc5e-11eb-99ba-bc90e078d54f.mp4

If you want to verify data, paste packets **in the order they were received** - first, process `got 0` (using the first part of the code, as visible in the video) packet, then `got 1` (using the second part) and packets after. To make sure your data is correct, parse at least 7 packets.

If you don't provide packets in the order they were received, your data will seem incorrect.

You can only verify data if you know how correct packets look like. If you don't know anything about byte representation of packets, you will not be able to distinguish between correct and incorrect ones.

You MUST NOT check data that does not have `got X` in front of them in console. The other ones are **sent** packets, not **received**. You can only test received ones. It can be implemented in the userscript to check data automatically for both receiving and sending, but I didn't and I'm not planning to do so.

You can use the parser with the data on your own. If you want to use it with the bot, you need to copy and paste the data at line 135 (delete the old contents of the lines 135-141) of renewed_shadbot's bot.js. You also need to update it with BUILD and LAST_MODIFIED at lines 13 and 14 respectively (take those out of the userscript).

Getting the data and verifying it's intact is the hardest part about updating the lb bot, but it is not the only part. To make the bot work you also need **TICK_XOR** (line 133), **SAMPLES** (line 131, copy paste from the userscript), and know the structure of scoreboard for the build.

To get **TICK_XOR**:
1. Set **TICK_XOR** to 0,
2. Do `go get servers sbx` and get 1 link to a sandbox (prefer the closest to the bot's location for low latency),
3. Do `go get uptime LINK -e`, replace LINK with the sandbox link,
4. Calculate what `number ^ 2` is, where `number` is the resulting number from the `go get uptime` command. You can do this calculation with `go eval number ^ 2` if you own the bot (Config.owner is your discord user ID or you sent Config.hash in DMs with the bot). Then put the result in **TICK_XOR**.

The above won't work if **TICK_XOR** is not 0.

To get scoreboard structure:
1. Host the bot,
2. On Discord, do: `go get servers tag` and pick 1 link (prefer the closest to the bot's location for low latency),
3. Do `go get scoreboard link`, where `link` is the link you picked above,
4. Observe the console you ran the bot in. A lot of hexadecimal numbers should appear - this is the first update packet containing the scoreboard that you need. Copy the packet and save it somewhere.

An example packet should look like this:

![example_first_update_packet](https://user-images.githubusercontent.com/47268949/121810885-bde9a780-cc62-11eb-83e7-7433885f179d.png)

"Should look like" means "should have 0 at the beginning, 5th number should be lower than 0x80, it should have `00 01 09 06 01` somewhere at the beginning". Do not think that your packet should be exactly the same as the packet in the picture.

We want to copy everything in between `00 01 09 06 01` and `01 01 0e 01`. These hexadecimals stay the same regardless of update. The resulting chunk of the packet looks like this:

![scoreboard_unprocessed](https://user-images.githubusercontent.com/47268949/121811004-33ee0e80-cc63-11eb-865f-c497dc5eaf8f.png)

This is what holds data about scoreboard in every server, here we have a tag server specifically. Now we need to know where 6 things in the packet are:
1. Amount of places displayed (in tag: 4)
2. Player name
3. Player tank
4. Player score
5. Player color
6. Player name suffix (in tag: " players")

The bot needs to know where these are. The scoreboard's structure stays the same across servers, but differs across updates, just as every other number you have collected in the userscript.

Information about every of these:
1. Will just be a plain number `04`,
2. Will consists of semi-random hexadecimals, but will ALWAYS be ended with a null-terminating byte (a `00` hexadecimal),
3. Will be a number between 0 and 120-ish,
4. Will be a sequence of 4 numbers forming a [Float32](https://en.wikipedia.org/wiki/Single-precision_floating-point_format). To know whether a sequence of 4 numbers is a float, you need to be familiar with floats and know their characteristics. For this packet, I will explain what is what, so no worries,
5. Will be a number between 0 and `0x0d`, but always either 0, 3, 4, 5, 6, or 13,
6. Will literally just be `20 70 6c 61 79 65 72 73 00` (" players" string, but represented with hexadecimals).

I asked you to pick tag mode for getting the scoreboard, because it is the easiest to get the fields right.

Additionally, even if there are only 4 used places on the scoreboard, there will still be 10 names, 10 tanks, 10 scores, etc. The unused places will have their values set to 0.

Now, let's take a look at the packet in the picture from before:

```
04 06 05 03 00 00 00 00 00 00 20 70 6c 61 79 65 72 73 00 20 70 6c 61 79 65 72 73 00 20 70 6c 61 79 65 72 73 00 20 70 6c 61 79 65 72 73 00 00 00 00 00 00 00 00 00 48 0a 46 01 01 01 01 00 00 00 00 00 00 0c 0c 52 45 44 00 47 52 45 45 4e 00 50 55 52 50 4c 45 00 42 4c 55 45 00 00 00 00 00 00 00 00 54 48 c6 00 48 0a 46 00 48 0a c6 00 00 00 00 00 00 f8 41 00 00 e0 40 00 00 80 40 00 00 80 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 04 00 00 48 0a c6 00 00 00 00 01
```

We can instantly notice the lone `04` at the end, which is most probably our scoreboard count. We will get back to it later.

First 4 values seem oddly familiar - they are either 0, 3, 4, 5, or 6. They are player's color.

After each discovery you make, **format the packet** so that it is easier to read:

```
04 06 05 03 00 00 00 00 00 00 // player color (10 of them)

20 70 6c 61 79 65 72 73 00 20 70 6c 61 79 65 72 73 00 20 70 6c 61 79 65 72 73 00 20 70 6c 61 79 65 72 73 00 00 00 00 00 00 00 00 00 48 0a 46 01 01 01 01 00 00 00 00 00 00 0c 0c 52 45 44 00 47 52 45 45 4e 00 50 55 52 50 4c 45 00 42 4c 55 45 00 00 00 00 00 00 00 00 54 48 c6 00 48 0a 46 00 48 0a c6 00 00 00 00 00 00 f8 41 00 00 e0 40 00 00 80 40 00 00 80 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 04 00 00 48 0a c6 00 00 00 00 01
```

Another oddly familiar piece of information after the colors. Player name suffix. Format the packet:

```
04 06 05 03 00 00 00 00 00 00 // player color

20 70 6c 61 79 65 72 73 00 // player name suffix (10 of them, as always)
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
00
00
00
00
00
00

00 00 48 0a 46 01 01 01 01 00 00 00 00 00 00 0c 0c 52 45 44 00 47 52 45 45 4e 00 50 55 52 50 4c 45 00 42 4c 55 45 00 00 00 00 00 00 00 00 54 48 c6 00 48 0a 46 00 48 0a c6 00 00 00 00 00 00 f8 41 00 00 e0 40 00 00 80 40 00 00 80 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 04 00 00 48 0a c6 00 00 00 00 01
```

There is nothing within the next 5 bytes, but there is a float in there, which I will mark when formatting it:

```
04 06 05 03 00 00 00 00 00 00 // player color

20 70 6c 61 79 65 72 73 00 // player name suffix
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
00
00
00
00
00
00

00
00 48 0a 46 // the float, ending with 46, which is a very characteristic number for floats

01 01 01 01 00 00 00 00 00 00 0c 0c 52 45 44 00 47 52 45 45 4e 00 50 55 52 50 4c 45 00 42 4c 55 45 00 00 00 00 00 00 00 00 54 48 c6 00 48 0a 46 00 48 0a c6 00 00 00 00 00 00 f8 41 00 00 e0 40 00 00 80 40 00 00 80 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 04 00 00 48 0a c6 00 00 00 00 01
```

Next, we have 4 ones, and a bunch of zeroes. What you don't know and I do is that in tag mode, there are no tanks on the scoreboard. 1 means no tank, so these are player tanks.

```
04 06 05 03 00 00 00 00 00 00 // player color

20 70 6c 61 79 65 72 73 00 // player name suffix
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
00
00
00
00
00
00

00
00 48 0a 46

01 01 01 01 00 00 00 00 00 00 // player tank

0c 0c 52 45 44 00 47 52 45 45 4e 00 50 55 52 50 4c 45 00 42 4c 55 45 00 00 00 00 00 00 00 00 54 48 c6 00 48 0a 46 00 48 0a c6 00 00 00 00 00 00 f8 41 00 00 e0 40 00 00 80 40 00 00 80 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 04 00 00 48 0a c6 00 00 00 00 01
```

Next we have 2 random bytes and player names after them. I ama lready trained to see letters in bunch of numbers, but if you need confirmation, open your JS console and type in the following: `String.fromCharCode(..."000".split(' ').map(r => parseInt(r, 16)))`, then replace `000` with whatever bytes you want to translate into a readable string. The output for the bytes is `"RED\u0000GREEN\u0000PURPLE\u0000BLUE\u0000"`. The zeroes (0 or `\u0000` formatted) means end of a string. You now can clearly see the player color, or rather, player team color if you wish. Formatting:

```
04 06 05 03 00 00 00 00 00 00 // player color

20 70 6c 61 79 65 72 73 00 // player name suffix
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
00
00
00
00
00
00

00
00 48 0a 46

01 01 01 01 00 00 00 00 00 00 // player tank

0c 0c

52 45 44 00 // player name
47 52 45 45 4e 00
50 55 52 50 4c 45 00
42 4c 55 45 00
00
00
00
00
00
00

00 54 48 c6 00 48 0a 46 00 48 0a c6 00 00 00 00 00 00 f8 41 00 00 e0 40 00 00 80 40 00 00 80 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 04 00 00 48 0a c6 00 00 00 00 01
```

Next there is a float (`c6` means a negative value of it, `46` meant positive), and another float with a `46` ending, and another one with another `c6` ending, and a bunch of zeroes. Let's format and see what we can do with the zeroes (there might be useless zeroes which literally just do nothing):

```
04 06 05 03 00 00 00 00 00 00 // player color

20 70 6c 61 79 65 72 73 00 // player name suffix
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
00
00
00
00
00
00

00
00 48 0a 46

01 01 01 01 00 00 00 00 00 00 // player tank

0c 0c

52 45 44 00 // player name
47 52 45 45 4e 00
50 55 52 50 4c 45 00
42 4c 55 45 00
00
00
00
00
00
00

00 54 48 c6
00 48 0a 46
00 48 0a c6
00 00 00 00

00 00 f8 41 00 00 e0 40 00 00 80 40 00 00 80 3f 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 04 00 00 48 0a c6 00 00 00 00 01
```

There appear to be 4 floats with very meaningful values, proceeded by 6 floats of value 0, and some other data and the end. We can try converting the floats to see what their value is, using the following code:
```js
var buf = new ArrayBuffer(4);
var u8 = new Uint8Array(buf);
var f32 = new Float32Array(buf);
function getFloat(string) {
    u8.set(string.split(" ").map(r => parseInt(r, 16)));
    return f32[0];
}
```
You can copy paste it into your console and then do the following:
```js
getFloat("00 00 f8 41")
getFloat("00 00 e0 40")
getFloat("00 00 80 40")
getFloat("00 00 80 3f")
```
To see that the values are actually 31, 7, 4, and 1. These are the player score, or, in case of tag, team score, or player amount.

We have got everything we wanted, besides the scoreboard count, which I said at the beginning looks like is at the end of the scoreboard. Let's format for the last time:

```
04 06 05 03 00 00 00 00 00 00 // player color

20 70 6c 61 79 65 72 73 00 // player name suffix
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
20 70 6c 61 79 65 72 73 00
00
00
00
00
00
00

00 // useless
00 48 0a 46

01 01 01 01 00 00 00 00 00 00 // player tank

0c 0c // useless

52 45 44 00 // player name
47 52 45 45 4e 00
50 55 52 50 4c 45 00
42 4c 55 45 00
00
00
00
00
00
00

00 54 48 c6 // useless floats
00 48 0a 46
00 48 0a c6
00 00 00 00

00 00 f8 41 // player score
00 00 e0 40
00 00 80 40
00 00 80 3f
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00

00 00 00 00
00 00 00 00
04 // scoreboard count
00
00 48 0a c6
00 00 00 00
01
```

Now we have all 6 ingredients we need. Go back to `bot.js` and go to line 316 - comment it out (put `//` in front of it). Go to line 1115 - remove it's comment (remove the `//` in front of it). Go to line 341 and delete it. Now, your job is to put all the information together and actually **code** it. Starting from line 352, I left a few tools to use for gathering the data the bot needs. You will need to get over the useless floats and bytes by adjusting the `at` variable. Let's do it:

First, we have player color (look formatted scoreboard above). To collect this information, copy the loop with the word `color` in it.

Capture player suffix by copy pasting the loop with the word `suffix` in it.

Afterwards, we have 5 useless bytes. We can skip them by writing `this.at += 5;`.

Then, player tank. Copy the loop with the word `tank` in it and paste after `this.at += 5;`.

Get over the 2 useless bytes using `this.at += 2;`.

Gather player name by using the loop with the word `name` in it. 

Skip the 4 floats by doing `this.at += 4 * 4;` (float has 4 bytes, and there are 4 floats, thus `4 * 4`).

Copy the loop with the word `score` in it to get player scores.

Lastly, get over 2 floats and capture the scoreboard count. For that, do `this.at += 2 * 4;` and then copy paste the line right before `return scoreboard;` after all the loops.

If you haven't yet, delete the code you have been copying and only leave the one you wrote.

The code should look like this:

![finished_scoreboard_code](https://user-images.githubusercontent.com/47268949/121812482-2b4c0700-cc68-11eb-8991-843ada6b7287.png)

Save the code and restart the bot. Check if it works. If scoreboards aren't correct, either your data is corrupted or scoreboard layout is wrong.

** **

Have fun working with diep.io!
