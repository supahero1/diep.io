# Outdated

Don't use this code. Instead, to prevent safety checks in any JavaScript code, employ proxies.

To override a function, instead of:
```js
const func = Function;
Function = function(){};
```
, do the following:
```js
Function = new Proxy(Function, {
  apply: function(to, what, args) {
      // do anything you want before
      const res = to.apply(what, args);
      // do anything you want after, or if you don't have anything to do here, just return the previous line
      return res;
  }
});
```

And to get to objects you shouldn't get to, you can also use setters. The following example covers a complex solution that you should use if the property is accessed afterwards and not just set once:
```js
let prop_value = undefined;

Object.defineProperty(Object.prototype, "some_property_name", {
  set: function(to) {
    console.log("WHOOPSIE LMAOO, WE WANT TO SET SOME PROPERTY NAME ON " + this + " TO " + to);
    prop_value = to;
  },
  get: function() {
    return prop_value;
  },
  configurable: true // to be able to delete the prop above, otherwise don't include this
  // , enumerable: true      might be helpful too
});

///////////////////

let h = {};
h.some_property_name = 5;
// WHOOPSIE LMAOO, WE WANT TO SET SOME PROPERTY NAME ON [object Object] TO 5
// prop_value is now 5
```
