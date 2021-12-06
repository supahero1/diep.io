# Automatic diep.io scoreboard fetching
With some flaws*, DO NOT use in production unless you address the issues. The code might also ban you from all diep.io servers.

It's using puppeteer only to fetch the basic info to decode packets and send some (PoW and eval). It's also using a TCP API connection to send multiple HTTP requests over one long-lived connection (Cloudflare shuts it down after 17 minutes, after which it simply restarts).

You can control how much CPU it's using by tweaking the `connect_delay` value. The bigger it is, the less CPU the code will use, but also the slower will it fetch the scoreboards.

It saves player count status to a file called `players`. Some of the values are already in it. It will push new player counts at the end of the array.

Compatible with `../website/`.

You can (and maybe even SHOULD) take out `fetch.mjs` and merge it with `renewed_shadbot_2`. No need to update the code manually every week then, and the shadbot2's code is known to be running very well, with only very minor issues with freezing sometimes (as in not discovering new scoreboards). Just note that the fetcher isn't taking incoming packet OP codes into account, so you'd need to tweak shadbot for that, or copy that part of code from `scanner.js`.
