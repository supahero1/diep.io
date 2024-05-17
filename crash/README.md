# 2023-2024 crashes

I'm gonna be describing how bad rivet is in this blog post so buckle up. I hope you abuse it hard so that it gets fixed the next day.

## The issue

Let's first talk events before the last diep update (05/05/2024). Here's the basic outline of how the crash commends, after that I will explain more:

1. Create a connection to a given server
2. Send the init packet with any player token you want (can be invalid chill)
3. Go back to step 1 (don't even close the connection, diep will disconnect it by itself)

You repeat the above in the hundreds, if the server is tough it could take thousands, but that's still chill. You just do multiple connections in parallel and it takes mostly a couple seconds.

For peanut brains saying this is a DDoS attack, it is NOT. You only need one machine to do this, and you absolutely do not overwhelm the server with anything. At most it's a DoS lol. And kind of a light one because the server restarts right after.

## How

So now, you might wonder how the hell does that bullshit work. Well let me tell you - NO CLUE man. But what I can say is that it's not a diep issue itself; it's a RIVET issue. When rivet is overwhelmed with invalid token checks it shits itself. That's it. You may want to check out their git repo for details if you manage to find the exact place of this retardness.

## New situation

So after the latest patch, the situation has changed dramatically. Mr ABC the negative IQ developer behind this update has changed it so that diep servers make a player token checking request to rivet only AFTER the client sends back pow and eval packet responses. This of course does not fix the crashing issue - it only delays it, makes it harder. For people out there who have puppetter or automated packet stuff you may still abuse it to your liking.

Anyway. From one tragedy to another. Because when you initially connect to a diep server, it actually assigns a whole lobby spot just for you after you send the init packet. Before the update if you sent some bullshit like not a valid player token (and also note that not valid also means REUSED, meaning it's already been used or is being used) the server would swiftly disconnect you before even a SECOND passed. But now? Now that diep does not check anything before you send back pow and eval packet, you can just send init, and guess what, you get the lobby spot, and the server AFK disconnects you after... FIVE. FUCKING. MINUTES dude. 5min to disconnect you once you've taken the lobby spot for yourself.

So, this was actually very slightly an issue before, or a side effect, because during crashing the server would be generally unjoinable, but now it's just like 10 times worse isn't it. It used to be unjoinable because I kept doing the connections fast, but now you can just chill out do them slow like a normal slow loris attack. You just create one connection every ~4 seconds and boom after 5min you will have 80 connections idling on the server preventing anybody from joining. Also note that there is a possibility of joining, just like in a normal slow loris attack. Simply what you have to do is get lucky and connect just as one of the idling connections disconnect, and you are in. It's rare, but it can happen and has happened.

## Sources

I've included py+js and pure js solutions in this folder implementing this bug __in its crash form__. I've explained how to do the slow loris attack so you can just... do it lol (if you're using nodejs, set websocket's `origin` to `https://diep.io` and you're good to go, that's all you need). For the crashing part, if anybody is interested or wants to modify it to have the slor loris thing working from the browser, lurk in the scripts.

Generally the python script is favourable since it's much faster and efficient, later on i made the userscript version but it's ass in comparison. also note that the python script requires some input to work - you get that input from the `crash_info()` function. you call it once you're in the lobby, get the output, paste it into the commandline like `python3 crash.py <the thing here>`.

Oh yea also, you need the `websocket-client` py package for the py script to work. And also note that you are supposed to manually stop it. I generally set it to an infinite loop, both js' `crash()` and py. The meaning behind that is not to keep fucking the server up, it's to let the user decide when to cut it out.

# Just go out there and abuse the fuck out of this so that it gets patched immediately :pray: :pray: :pray:
