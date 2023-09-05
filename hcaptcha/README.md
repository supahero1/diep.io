This directory represents the fruit of my work of the last 6 days or so:

1. Automatic hcaptcha solver,

2. Automatic player token fetcher,

3. Automatic WASM emscripten imports,

4. Automatic WASM diep.io imports,

5. Automatic sending function discovery,

6. Automatic entity create/delete function discovery.

Documentation follows.

# Automatic hcaptcha solver & player token fetcher

This is powered by [hcaptcha-challenger](https://github.com/QIN2DIM/hcaptcha-challenger), which is a project that automatically fetches the required image classifying ONNX models to solve a captcha, along other solutions. It's very easy to use, updated daily, open source, with examples.

To use this (it's obviously not included in this directory), you will need to `git clone` the repo (link above). Then, somehow make it so that files from this directory are in the same directory as the root of `hcaptcha-challenger/YOU_WANNA_BE_HERE`. You can also install it via pip: `pip install hcaptcha-challenger`.

After that, simply run `python3 diep.py` and copy-paste the lobbyID of the server you want to get player tokens for. I personally set `headless` to `False` in the script so that if the solver gets stuck I can help it out. You can set it back to `True` to have a truly headless background hcaptcha solver.

Since the repo gets updated daily, new hcaptcha-solving solutions are added, existing ones are modified, and old solutions are removed. For this reason, it's recommended to frequently update your installation, which sadly might sometimes come with ABI-breaking changes. If the script breaks (it was based on hash `d50e49dc77073ddbedda1393a10de0d9badfdb46`), just look at `examples/demo_undetected_playwright.py` (since that's what `diep.py` is based on).

Note that you are limited to 15 player tokens per server. All proxies (if detected to be a proxy) are limited to 15 too. You might find success using proxies AND your personal IP to get 30 tokens, and in fact I used proxies in the past. It's easy to build them in as you just pass `proxies={http:"",https:""}` to `request.post()`.

# Automated bots

## 1. Goals

I was slightly pissed at the polish prince rbest and his clan of inbreds so I started making this, although I've since lost my motivation. My ultimate goal was to make some self-playing bots since I couldn't really care less about filling up servers with bunch of dead bodies.

You can also see the beginning of what I meant to be inter-PC communication in `server.c`. I meant for all bots as well as players to be able to connect to my pc via `ngrok`, which would also act as a huge security gateway since if you don't have the correct IP, well, you ain't getting any bots or shit. Also it provides free HTTPS (WSS in this case). To display stuff in the browser and seed your in-game player data too alongside entities provided by the bots, or to let you play a bot (to auto farm or something), you would be running a simple userscript that would get some offsets from `diep.mjs` to read entities, and after that, some mouse positions, clicks, key presses, etc., to play the game. You could also do something fun like display position of enemies on the minimap to be warned of potential orgies or just to see where players are. There's a lot of room for imagination.

## 2. The sussy choice of running WASM on my own

Headful bots are awfully slow. But parsing packets is awful too. So I decided to do something in between. To not be susceptible to countless layers of encoding of the protocol, but at the same time be pretty fast, I decided to lowkey "hotwire" the WASM. I would run it barebone in the nodejs environment, and give it my OWN imports that I deemed fit to be able to barely run it. You can see all of that in the first 464 lines of code of `diep.mjs` - all the automation in the form of function signatures to be able to correctly match the functions (since their order and naming would change across updates).

I didn't really have any clue that `embind` and `emval` existed before this point, or what the WASM imports actually were. Turns out, 2 of the imports are actually game-related. These are, always the "a" import (it NEVER changes), and some other import that is quite literally a copy paste of the "a" import (it does the same thing, but its name is randomized). And the rest of the imports is just `embind` and `emval`. Now, these 2 are just parts of emscripten, so they goddamn NEVER change. Their order changes, at most their names will, but the core functionality stays the same. They are essentially used to transfer data from and to WASM, and to execute JS functions from WASM.

So, silly me, I opened the source code for `embind` and `emval`, and legit retyped EVERYTHING there (or, well, all of it that was relevant and actually used by the game). We are talking about 700 goddamn lines of code here. But now it's neatly integrated into the existing code I had, and I'm never gonna need to change that code even one bit. And you won't need to, too.

## 3. Lack of drawing

So after providing the hacky imports and checking everything works, there was an "un problema" lurking around. See, silly me thought, that in diep.io, the game loop function that is executed every frame is only for drawing purposes. That it doesn't do anything else. But I was proven wrong the hard way, after successfully connecting a WebSocket through the WASM to a server of my choice. Because first of all, the connection would be closed BY THE WASM the next time I called the ~~drawing~~ *cough* **game updating** function, and then, after I stopped drawing thinking I'm the next *mado scientisto sonuvabitch*, it turned out I can't send anything over the connection anymore for some reason, after queuing up the messages.

So, in conclusion, it's not a *drawing* function. It's a whole ass *game updating* function that checks all of the states and websockets and EVERYTHING. And it actually sends out the packets you queue up. It encrypts them. It does so many unnecessary things under the hood.

But that did not stop me. Because see, I didn't give a shit about all of this. I was NOT gonna call that function again no matter what. So, as the next exercise, I found a signature for the function that actually encrypts packets and sends them right away. Then I learned what the inputs to it are, and after a little bit of testing, `Bot.send(bytes)` was born. And they all lived happily ever after.

## 4. Gathering entities

So the next step, was to NOT parse the packets. So, if there's no packets, and no drawing, then the only thing left for me to do to get entity data, was to step down to hell and peek into the abyss, aka ***the WASM memory***.

So there's a bit of terminology to be known here. Diep.io is a game built on a system called the **E**ntity **C**omponent **S**ystem, ECS for short. And this system is kind of stupid. There is no "entity type", there is "components" that an entity may possess. So for instance you can have the "health" component to magically be able to have health and max health, and be able to get damaged, and die due to lack of health, and so on. The problem is, you have to find these components, understand them, and then find the fields within these components that correspond to what you are looking for (eg. health and max health). Luckily for us winners, components are never really shuffled in diep.io, so there's that. But fields are, and it goes HARD. You can see in [`../dma/dma.user.js`](../dma/dma.user.js). Some components can be as big as over 500 bytes. Now good luck finding the correct field offsets for what you are interested in.

The perfect solution honestly is to automate that too. You can do it 2 ways. Either you find the function that draws some field, like if you can pinpoint where the health bar is drawn at, you can probably automate the offsets for health and max health in the health component. Or, you make a script and every new update you go into sandbox. Then, that script automatically scans the component memory to find what you are looking for. So as you play around in the sandbox, shooting bullets, destroying shapes, gaining score, picking tanks... the script goes around looking for your current level, your tank, entity size field, etc, in the component memory.

There's also the third way out, which is to find all the fields by hand. And that's what I did :ajit:, but I don't recommend it since it takes way too long.

I also added some entity creation/deletion automation to `diep.mjs`. There's no hooks in place, but there's function indexes, so you can setup the hooks by yourself. Just note that the first argument, the first local variable, is the pointer to the [AbstractEntity](https://github.com/ABCxFF/diepindepth/blob/main/memory/structs/AbstractEntity.h) that contains all the components you need (and you can see how to extract the fields you want by looking at [`../dma/dma.user.js`](../dma/dma.user.js)). I added these functions, because I wanted to be notified when I spawn and die, by just comparing the entity ID of my player with the ID of the created/deleted entity.

Last time I checked, given the right links (at the top of the file), I could spawn some 14 bots (excluding me) in a sandbox. So, proof of concept is already done. However, do note that there is a `return` statement on the 435th line in the file. You will need to remove it if you want to run the "bots" part of the script.
