# 1. Getting started

The script only runs in Tampermonkey. Any browser, any operating system. Retina displays supported.

Get the script from the `mbox.user.js` file in this directory.

# 2. Improving performance

To not lag in game (both FPS and ping-wise), it is **strongly recommended** that you use [this](https://greasyfork.org/en/scripts/420008-unlag).

It is worth mentioning diep.io certainly runs best on Chrome (or similar chromium-based browsers like Opera or Brave) and on Windows. You will have the most pleasant experience with a good browser and a good system. It is **NOT** the script's fault that you experience low frame rates or high ping.

On most browsers, there is also a super neat trick to improve performance - reduce size of every window besides the master window (the one you will play with) (even down to 1 pixel height, the smaller the better). That means if you die you will first need to make the windows bigger so that's a little bit of a risk, but it should greatly increase FPS.

![Screenshot from 2021-06-05 11-11-41](https://user-images.githubusercontent.com/47268949/120886550-dfa5b780-c5ee-11eb-8247-ad95b04c1d7f.png)


# 3. Using the multibox

After launching the game, nothing abnormal is going to happen, no tutorial or anything. The multibox's menu will be closed by default. To open it, press the \` key, aka the **master key** (on most keyboards - to the left of 1, directly above TAB). If you do not have the key or wish to use other one, please open the userscript in your Tampermonkey and edit the 23rd line:

![Screenshot from 2021-06-04 20-28-29](https://user-images.githubusercontent.com/47268949/120847212-746acf80-c573-11eb-8a84-05524d7f2ddc.png)

Delete the \` character in between the apostrophes and enter your own one, then **save the userscript** (by `Ctrl + S` or manually). Changes will take effect after you refresh your `diep.io` page.

After pressing the master key, you should see a menu open on the left side of the screen which looks exactly like this:

![Screenshot from 2021-06-04 20-31-02](https://user-images.githubusercontent.com/47268949/120847527-e5aa8280-c573-11eb-9b73-9f5ec9156f70.png)

This is the heart of the multibox. Here you control everything that it does.

You can click on the text to change or trigger the option (these are buttons below the text).

The question marks are basically tips explaining what the given option does, so if you press on them, it should display text in the middle of your screen describing the feature.

The minus signs are placeholders for **keybinds** - assign a key to an option to be able to change it without explicitly clicking on the button. Keybinds last between diep.io sessions (they are persistent), can be changed anytime in game, can be reset too to not activate the option anymore. You need to click on the minus signs to be able to assign a key. Clicking on them will also display a little bit of helpful information.

You can hide the menu anytime by once again pressing the master key. The master key will be locked for use in any keybinds to not create a mess.

### Bypassing the tab limit

To not get the `already in game` message on subsequent windows opening the same server, you can do 2 things:

1. Get a userscript that deletes the `rivet:token` localStorage value upon going in game, which will reset your rivet account, or

2. Open a new window, open the browser devtools (`F12` or `CTRL + SHIFT + I`), go to the desired diep link. After you notice that the game stops on "debugger", wait 5 seconds, then close the devtools.

The second method is preferable as it allows you to use the same account for all of your tabs. Once you become quick enough with it, you can also just "duplicate" your current diep.io tab to open the same link (if you joined via a link), and quickly open the console. This shaves off some time by not opening an empty tab first.

# 4. Features
### 1. Pick AFK location:

![Screenshot from 2021-06-04 20-37-00](https://user-images.githubusercontent.com/47268949/120848119-adf00a80-c574-11eb-8a01-a07091446e54.png)

This option allows you to pick a place on the whole map that your tank will stick to if you turn on AFK. It also allows you to reset your AFK position. Why? Explained below.

### 2. Turn AFK on and off:

If you have not previously set an AFK location using the feature above, turning on AFK will cause you to stick to the location you currently are at. That's why reseting AFK position is important - it allows you to stick to right where you are, without needing to have a perfect pixel-wide mouse aiming skills to do it on the minimap.

### 3. Multiboxing

The multibox is a very advanced system aiming to make the gameplay of the user as pleasant as possible. The main features are:

1. Flexibility - you can switch between 3 mouse modes and 3 movement modes, along with other options, allowing you to truly customize your experience and shape it to fit your needs,

2. Reliability - the script has been tested throughout months and numerous bugs have been found and fixed. The most notable achievement is making the script fully compatible with retina displays, so MacBook users are not excluded from the fun,

3. Comfort - throughout time, movement of the multiboxed tabs has been evolving to allow for a much better experience. For instance, tabs will try to move out of your way when you are moving, and will try their best to always stick to you, without falling behind.

### but...

To be able to multibox tanks, you need to be aware of 2 things:

**1.** If you are on Windows and are using Chrome, you first need to edit a browser flag to be able to multibox. Go to **chrome://flags/#calculate-native-win-occlusion** (need to copy paste it into the URL bar) and if at the top there is a setting called "calculate native window occlusion", change its state to **disabled**. If you are using Chrome Canary or the newest versions of Chrome which have that flag removed, you need to create a shortcut to the browser, then go to Properties and add `--disable-backgrounding-occluded-windows` after the path to the file, so that the end of the path looks something like `chrome.exe" --disable-backgrounding-occluded-windows` (note the space after the "). Then save and use the shortcut instead to launch your browser.

**2.** To multibox at all, your tabs need to not actually be tabs. They need to be **windows**. The same was true for Bela's multibox - you need to take out individual tabs out of your window so that each of them has their own window. **BEHOLD!!:** If your AFK is on and you switch to other tab in the same window, **your diep.io tank might die, because it is not updated** (that's why it's so important to use **windows** and not **browser tabs**).

Additionally, if you are AFK and multibox is on, **AFK is the stronger one.** So if you change tabs, the AFK tab will still be AFK. It will not follow.

# 5. Ending

Knowing all of the above, I guess you are all set to conquer the world with this multibox! There are a few more options, but they are rather understandable, and most of all, you can test them out yourself. They also have a help page once you click the question mark next to them.

I am absolutely **NOT** open for suggestions. If there are bugs, you can submit an issue, but I might as well not fix it.
