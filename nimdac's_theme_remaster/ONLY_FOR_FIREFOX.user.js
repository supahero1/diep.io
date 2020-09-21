// ==UserScript==
// @name         Shädeus' theme
// @version      1.0
// @description  Disables extension check, optimises a few things, reimplements Nimdac's theme. Based on Nimdac's theme.
// @author       Shädeus
// @match        https://diep.io/
// @grant        none
// @run-at       document-start
// ==/UserScript==
'use strict';
if(localStorage.no_wasm != 'true') {
  localStorage.setItem('no_wasm', true); // having problems with no-wasm mode? open browser's console in diep.io, type in 'localStorage.setItem('no_wasm', false)' (without the outside quotes), press enter, refresh page.
  window.location.reload(true);
}

const LAYERS = 3; // NUMBER OF BLURS TO APPLY (EACH LAYER HAS STRONGER BLUR, UP TO MAX_BLUR + 0.1).
const MAX_BLUR = 1.0; // HOW STRONG BLUR SHOULD BE. VALUES BELOW 0.1 ARE COUNTED AS 0 (NO BLUR).
const MODE = 'dark'; // 'dark' OR 'light'. NO OTHER OPTIONS! FEEL FREE TO USE DIEP STYLE, BUT BE AWARE THAT YOU CAN'T EDIT A FEW THINGS, LIKE HP BAR FILL COLOR OR HP BAR BACKGROUND COLOR!
const HIDE_BARRELS_INSIDE_TANKS = true; // false OR true. DOES NOT WORK WITH FACTORY, MOTHERSHIP, AND NECROMANCER. DO NOT MODIFY TANKS' COLOR IN ANY GAMEMODE FOR THIS TO WORK.
const SHOW_HP_BACKGROUND = true; // false OR true.

const layers = new Array(LAYERS);
const canvases = new Array(LAYERS);

var co1 = [];
var co2 = '';
var co3 = '';
var co4 = '';
var co5 = '';
var co6 = '';
var ui = '';
if(MODE != 'light' && MODE != 'dark') {
  MODE = 'dark';
}
if(MODE == 'dark') {
  co1 = ['#fffffe', '#adadad', '#f3f1a9'];
  co2 = ['#cccccb', '#bdbdbd', '#f5f3ba', '#c2c087', '#8a8a8a'];
  co3 = '#ffffff';
  co4 = '#0050ff';
  co5 = '#ffffff';
  co6 = '#888888';
  ui = '#fffffe';
} else {
  co1 = ['#adadad', '#f3f1a9'];
  co2 = ['#848484', '#bdbdbd', '#8a8a8a', '#c2c087', '#515151', '#f5f3ba'];
  co3 = '#ffffff';
  co4 = '#000077';
  co5 = '#ffffff';
  co6 = '#888888';
  ui = '#000001';
}

const theme = [
  {
    a: 'ren_background_color',
    dark: '0x000000',
    light: '0x222221'
  },
  {
    a: 'ren_grid_base_alpha',
    dark: '0',
    light: '0'
  },
  {
    a: 'ren_fps',
    dark: 'true',
    light: 'true'
  },
  {
    a: 'net_replace_color 2',
    dark: '0x0050ff',
    light: '0x000077'
  },
  {
    a: 'ren_minimap_border_color',
    dark: '0x222222',
    light: '0x888888'
  },
  {
    a: 'ren_minimap_background_color',
    dark: '0x000000',
    light: '0x222222'
  },
  {
    a: 'net_replace_color 12',
    dark: '0xffff00',
    light: '0xffff00'
  },
  {
    a: 'net_replace_color 8',
    dark: '0xffff44',
    light: '0xaaaa11'
  },
  {
    a: 'ren_stroke_soft_color_intensity',
    dark: '0',
    light: '0'
  },
  {
    a: 'ren_border_color',
    dark: '0x333333',
    light: '0x666666'
  },
  {
    a: 'ren_health_fill_color',
    dark: '0xffffff',
    light: '0x000001'
  },
  {
    a: 'ren_health_background_color',
    dark: '0x333333',
    light: '0xcccccc'
  },
  {
    a: 'net_replace_color 15',
    dark: '0xff0000',
    light: '0xff0000'
  },
  {
    a: 'net_replace_color 9',
    dark: '0xff006e',
    light: '0xff006e'
  },
  {
    a: 'net_replace_color 10',
    dark: '0x0051ff',
    light: '0x000077'
  },
  {
    a: 'ui_replace_colors',
    dark: '0xfffffe 0xfffffe 0xfffffe 0xfffffe 0xfffffe 0xfffffe 0xfffffe 0xfffffe',
    light: '0x000001 0x000001 0x000001 0x000001 0x000001 0x000001 0x000001 0x000001'
  },
  {
    a: 'net_replace_color 3',
    dark: '0x0050ff',
    light: '0x000077'
  },
  {
    a: 'net_replace_color 4',
    dark: '0xff0000',
    light: '0xff0000'
  },
  {
    a: 'net_replace_color 5',
    dark: '0x8800ff',
    light: '0x8800ff'
  },
  {
    a: 'net_replace_color 6',
    dark: '0x00ff00',
    light: '0x00ff00'
  },
  {
    a: 'net_replace_color 7',
    dark: '0x00ff00',
    light: '0x00ff00'
  },
  {
    a: 'net_replace_color 11',
    dark: '0xff00ff',
    light: '0xff00ff'
  },
  {
    a: 'ren_background',
    dark: 'false',
    light: 'true'
  },
  {
    a: 'net_replace_color 1',
    dark: '0x999999',
    light: '0xffffff'
  }
];

const text = ['Game mode',
              'You were killed by:',
              'Score:',
              'Level:',
              'Time Alive:',
              /\(they seem to prefer to keep an air of mystery about them\)/.source,
              /\(press enter to spawn\)/.source,
              'You will spawn at level ',
              'Last updated:'];

window.launchTheme = function() {
  WebSocket = class extends WebSocket {
    constructor(ip) {
      super(ip);
      Object.defineProperty(this, 'onmessage', {
        set: function(a) {
          delete this.onmessage;
          this.onmessage = a;
          const gamemode = localStorage.getItem('gamemode');
          if(gamemode != 'sandbox' && gamemode != 'teams' && gamemode != '4teams') {
            this.onmessage({ data: new Uint8Array([6]).buffer });
          }
        },
        configurable: true,
        enumerable: true
      });
    }
  }
  const e = window.input.execute;
  const background = document.getElementById('background');
  const input = document.getElementById('textInput');
  input.style.color = co5;
  document.getElementById('loading').style.color = co6;
  const canvas = document.getElementById('canvas');
  for(var i = 0; i < theme.length; i++) {
    e(theme[i].a + ' ' + theme[i][MODE]);
  }
  let j = null;
  for(i = 0; i < LAYERS; i++) {
    j = document.createElement('canvas');
    canvases[i] = j;
    j.style = `position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;cursor:default;border:0;margin:0;padding:0;filter:blur(${(0.15 + (i * (Math.max(MAX_BLUR - 0.15, 0))) / LAYERS).toFixed(1)}vw);z-index:-1;mix-blend-mode:screen;`;
    layers[i] = j.getContext('2d');
    document.body.appendChild(j);
  }
  function res() {
    for(let i = 0; i < layers.length; i++) {
      canvases[i].width = window.innerWidth * window.devicePixelRatio;
      canvases[i].height = window.innerHeight * window.devicePixelRatio;
    }
  }
  window.addEventListener('resize', res);
  res();
  function d2(x, xx, y, yy) {
    return Math.sqrt(Math.pow(x - xx, 2) + Math.pow(y - yy, 2));
  };
  const c = CanvasRenderingContext2D.prototype;
  c.strokeText = function() {};
  const ft = c.fillText;
  c.fillText = function(...args) {
    this.fillStyle = co5;
    for(let i = 0; i < text.length; i++) {
      if(args[0].match(text[i]) != null) {
        this.fillStyle = co6;
      }
    }
    return ft.apply(this, args);
  };
  const di = c.drawImage;
  c.drawImage = function(...args) {
    if(args[0].src == null || args[0].src.match(/static.diep.io/) == null) {
      return di.apply(this, args);
    }
  };
  let origin = { x: 0, y: 0 };
  let second = { x: 0, y: 0 };
  let length = { x: 0, y: 0 };
  let angle = 0;
  let count = 0;
  let last = { x: 0, y: 0, r: 0 };
  let transformation = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  c._1setTransform = c.setTransform;
  c.setTransform = function(a, b, c, d, e, f) {
    this._1setTransform(a, b, c, d, e, f);
    transformation = { a, b, c, d, e, f };
  };
  c._1fill = c.fill;
  c._1stroke = c.stroke;
  c._1moveTo = c.moveTo;
  c.moveTo = function(x, y) {
    this.fill = this._1fill;
    this.stroke = this._1stroke;
    origin = { x, y };
    count = 1;
    this._1moveTo(x, y);
  };
  c._1lineTo = c.lineTo;
  c.lineTo = function(x, y) {
    switch(count) {
      case 1: {
        length = d2(x, origin.x, y, origin.y);
        second = { x, y };
        angle = Math.atan2(y - origin.y, x - origin.x);
        count++;
        this.stroke = function() {
          if(this.strokeStyle == '#ffffff' || (this.strokeStyle == '#333333' && SHOW_HP_BACKGROUND == true) || this.strokeStyle == '#000001' || (this.strokeStyle == '#cccccc' && SHOW_HP_BACKGROUND == true)) {
            this._1stroke();
          } else if(this.strokeStyle == '#0050ff' || this.strokeStyle == '#ff0000' || this.strokeStyle == '#8800ff' || this.strokeStyle == '#00ff00' || this.strokeStyle == '#000077') {
            if(MODE == 'dark') {
              this.strokeStyle = this.strokeStyle + '77';
            } else {
              this.strokeStyle = this.strokeStyle + '44';
            }
            this.lineWidth *= 0.9;
            this._1stroke();
          }
          this.stroke = this._1stroke;
        };
        break;
      }
      case 2: {
        if(d2(second.x + Math.cos(angle + 2/3 * Math.PI) * length, x, second.y + Math.sin(angle + 2/3 * Math.PI) * length, y) < 1e-2 ||
           d2(second.x + Math.cos(angle + 0.5 * Math.PI) * length, x, second.y + Math.sin(angle + 0.5 * Math.PI) * length, y) < 1e-2 ||
           d2(second.x + Math.cos(angle + 0.4 * Math.PI) * length, x, second.y + Math.sin(angle + 0.4 * Math.PI) * length, y) < 1e-2) {
          this.fill = function() {
            this.fill = this._1fill;
          };
          this.stroke = function() {
            this._1stroke();
          };
        } else {
          if(d2(origin.x, second.x, origin.y, second.y) < 7) {
            this.fillStyle = '#ffffff';
            this.fill = this._1fill;
          } else {
            this.fill = function() {
              this.fill = this._1fill;
            }
          }
          this.stroke = this._1stroke;
        }
        count = 0;
        break;
      }
    }
    this._1lineTo(x, y);
  };
  c._1rect = c.rect;
  c.rect = function(...args) {
    this._1rect(...args);
    this.fill = function() {
      this.fill = this._1fill;
      this.strokeStyle = this.fillStyle;
      this.lineWidth = Math.sqrt(Math.sqrt((Math.abs(transformation.a) + Math.abs(transformation.b)) * 0.1 + (Math.abs(transformation.c) + Math.abs(transformation.d)) * 0.1) * 6);
      this._1stroke();
    };
    this.stroke = function() {
      this.stroke = this._1stroke;
    };
  };
  const fr = c.fillRect;
  c.fillRect = function(...args) {
    for(var i = 0; i < co1.length; i++) {
      if(this.fillStyle == co1[i]) {
        this.strokeStyle = co3;
        this.lineWidth = 0.03;
        return this.strokeRect(...args);
      }
    }
    for(i = 0; i < co2.length; i++) {
      if(this.fillStyle == co2[i]) {
        this.strokeStyle = co4;
        this.lineWidth = 0.05;
        return this.strokeRect(...args);
      }
    }
    fr.apply(this, args);
  };
  c._1arc = c.arc;
  c.arc = function(...args) {
    this.fill = function() {
      this.fill = this._1fill;
    };
    this._1arc(...args);
    if((transformation.e == last.x && transformation.f == last.y && transformation.a < last.r) || this.fillStyle == ui) {
      this.fill = function() {
        this.lineWidth = transformation.a / 6 + 1;
        this.strokeStyle = this.fillStyle;
        this._1stroke();
        this.fill = this._1fill;
        if(HIDE_BARRELS_INSIDE_TANKS == true) {
          if(MODE == 'dark') {
            this.fillStyle = '#000000';
          } else {
            this.fillStyle = '#222222';
          }
          this.beginPath();
          this.save();
          this._1setTransform(transformation.a * 0.92, transformation.b, transformation.c, transformation.d * 0.92, transformation.e, transformation.f);
          this._1arc(...args);
          this._1fill();
          this.restore();
        }
      };
      last = { x: 0, y: 0, r: 0 };
    } else {
      last = { x: transformation.e, y: transformation.f, r: transformation.a };
    }
  };
  function l() {
    for(let i = 0; i < layers.length; i++) {
      layers[i].drawImage(canvas, 0, 0);
    }
    requestAnimationFrame(l);
  }
  requestAnimationFrame(l);
};

function injection(s) {
  console.log('Running for real now...');
  delete window.input;
  Object.defineProperty(window, 'input', {
    set: function(a) {
      delete window.input;
      window.input = a;
      window.launchTheme();
    },
    configurable: true,
    enumerable: true
  });
  return s.replace(/if\(b\&255\)/g, 'if(false)').replace('5085:function($0,$1,$2){', '5085:function(){return;').replace('6507:function($0,$1){', '6507:function(){return;');
}
document.open();
document.write(`
<!DOCTYPE html>
<html>
<head>
<base href="//static.diep.io/">
<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAACxMAAAsTAQCanBgAAAJ5UExURUxpcVhVVFRSUYyMjFRUVFhYWFhVVFhYWFRaXFVSUVdUU2dnZ1hYWFVRT21tbVdUU19fX1VXWGhoaFFgZFpaWlhVVGRkZFhYWF9fX2lpaWxsbGBfX1BiZ15cXFdXV1dVVWBgYFpaWlBlbGRjY2dnZ1VVVVdXV1hYWF1cXF1cW1JeY2VlZV1dXV1dXVpWVWJiYltbW15eXlNYWmhoaKWnqF1cW1VXWFVXV2JiYVRYWl5cXFZUVIaHh1ZWVlhWVlpXVltXVldWVVpYWFhYV1dXV1dWVlZXV2hnZ1hWVWdnZ1VXV2FgYIGBgWJhYVFiaFNfYl9eXVdWVl9dXGVkZF9dXVtYV19dXFRbXVpXVldWVmFhYWdnZ2lqaltYV1FiZ19fXlhXV15eXltbW1pXV2FhYWNjY1hXVlJeYV5eXldVVVxYV2VlZVxbW1dXV1pXVlpaWlhVU2BgYFpaWlVXWFdXV1VTUlVVVW1tbWhoaFtbW15bWlhYWHFzc2NjY1VVVT+03z+14Zqamj+14Jubm5mZmT+24T+z3kiDl0t4h5eXl21tbWtra0GlyT+04E9pc4qKikGjxj+w2UCt1T+y3EKdvkiEmXh4eGFhYUWUsJGRkUGpz0Gny2hoaHd3d0t7jJCQkECq0USauUSWtEiClkObu0SXtUCt1ECu1k5tej+v2IWFhUGmykp9j0SWs05sd09ock9qdUCpz1ZeYEeGm0t6i2ZlZUSXtEKevk5ve01ve2lpaUeIn01ue0WOqZaWlm5ublBlbEGnzVBkaoODg3NxcUaNplpYV09nb1RdYEh8jk1xfm9tbUOYtlFgZYmJiU1yf5iYmIKCgoaGhqP2+3cAAAB/dFJOUwCdqgECAmXv7KqkEtpCHkL+3yH3c0AdlYAGDR33L9UfF1X+Dhu9078nJvYOc/53D/c/4REBHuDfCOY3sQG7xXCDxErUpc3dGqIF4RkCM/34RMp7JENYTPKFyAwGCJ/+KM0tP70aMMH4VauXFi2wkEqXBvTjuPKnDgr4e0ECBaVZu9wrAAABa0lEQVQ4y2NgGDJAQR+/vIq6qqI2PgU6ut0GthnlIKaNlLS8qbEPqryY2tyW/v2VJfkVNTkOdoJGZq5ZITHICkQE5jc3t5zrKsrNK+5rn7Fw7e4d4bHBCHkhuWmNQNDccvjY2aOTmlobWhsmblsfmQhXIDF9ZjNIxYUjh6Y0NdWDQcPBnWkpUHk+nq5OkILmiyfONNTDQEPPgQgTiAJucfY5q4BK9m092VaPAA17zTWhRkgaurDvutTSv2lKA5KCpgVKbHBXRCfVsXefPj6pF0lBfVsHI5JPC6vLSk9NRpavb2jnZEUOjNqC82gKpjKxoIRn1YaVKArq53ExoygI85+A7Mje5X16qDHi7ry5CdmGpRxWaHEaFIdkRNOyFR6eaAqyk/dshKlomLjGzRcjWaQmrNve1trU1NTQtLrDywlLwonPTN+yqGfW7CWL/QIDsCatqFBrSy0ZYQ5He29cqc9CQ5SXX1aZYWgBACuktLIZoXRVAAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC" sizes="32x32">
<link rel="icon" type="image/png" href="data:image/png;base64,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" sizes="96x96">
<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAEjUExURUxpcV1NRkqCloA9JV9TT0x8jFxTUGlAM1ZOSlNkakiIn1VgZFBteGBUT2gzHlJob2BRS1VdX103KEaRrFpNSVRfY0aTr2U2I2FEOU9uekx4h0WVslBrdk9xfU91gldXV2RLQUx9j35TQ1tKQkuAklpbW2BLQ1BxfU17i2tENmRRSkiJoFJnb1xWVEaQrFpWVVJSUl1dXVhYWFxcXFhYWFdWVmNjY1FRUV5eXlVVVWNjY3R0dFFRUV9fX3x8fHt5eVB0gV1dXWdmZm9vb2JiYlpaWj+03z+14T+24T+14D+04D+y3ECr0kCt1ESauUCx2kCu10GozT+z3kGq0D614EKixUCnzE2HnJCQkJiXloSEhJycnIyMjIKCgpeXl2V6gZubm7e4KPAAAABGdFJOUwAd5wEX3BwDL4/ud7UTBqMPZw37J3T9CAq0yP61ustCEOYBH+FKGMTZBBLznDz+YAsDDRcekrkMBTKY5x6K9v78eLLXvlFXocKGAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAlklEQVQY02NgIAIYmaPyDW3NXA0YNNWUFZghApbWEXZO+joaKnLcvCC+hVVMdEKsQ6h3UIAYvwBQwNglKi4yPszDzc3LXVgQpMTE0dk+PMQNCDx9JPnAptiY6nmABNz8pYQg5upqu4P4Xr6y4hABLfVgkIiHtCjMLaqKgW6e3n4yLDABJXkeJi5WTjYk90qIcDCyMxAFAEylGRnf5AqTAAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC" sizes="16x16">
<link rel="mask-icon" href="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMjYwLjAwMDAwMHB0IiBoZWlnaHQ9IjI2MC4wMDAwMDBwdCIgdmlld0JveD0iMCAwIDI2MC4wMDAwMDAgMjYwLjAwMDAwMCIKIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgo8bWV0YWRhdGE+CkNyZWF0ZWQgYnkgcG90cmFjZSAxLjExLCB3cml0dGVuIGJ5IFBldGVyIFNlbGluZ2VyIDIwMDEtMjAxMwo8L21ldGFkYXRhPgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCwyNjAuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNNDMzIDIwOTggYy0yNCAtMjggLTI4MyAtNTMyIC0yODMgLTU1MiAwIC0yNSA1NSAtNTggMjcwIC0xNjYgMTEzCi01NyAyMzcgLTExOSAyNzUgLTEzOSBsNzAgLTM2IDcgLTc1IGMyNCAtMjg0IDIxMiAtNTE5IDQ5OCAtNjI1IDY1IC0yNSA5MwotMjkgMjE2IC0zMyAxNjYgLTUgMjQ1IDEyIDM3OCA4MCAxMTYgNjAgMjQ4IDE5MiAzMDUgMzA1IDYzIDEyNiA4MSAyMDUgODEKMzU0IDAgMTM2IC0xNSAyMDcgLTY2IDMxOCAtNjggMTQ3IC0xOTEgMjczIC0zMzcgMzQ1IC0xMTkgNTkgLTE5NCA3NiAtMzM3IDc2Ci0xNDMgMCAtMjA0IC0xNSAtMzM2IC04MCBsLTEwMSAtNTEgLTI5NSAxNTEgYy0xNjIgODIgLTMwMiAxNTAgLTMxMCAxNTAgLTggMAotMjQgLTEwIC0zNSAtMjJ6Ii8+CjwvZz4KPC9zdmc+Cg==" color="#5bbad5">
<title>diep.io</title>
<meta name="description" content="Survive and shoot at others while trying to keep your own tank alive!">
<style>
body {
background-color: #000000;
}
html, body, #canvas {
border: 0;
margin: 0;
padding: 0;
overflow: hidden;
}
#loading {
color: #FFFFFF;
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
font-size: 48pt;
font-family: sans-serif;
font-weight: bold;
cursor: default;
}
#canvas {
position: absolute;
top: 0;
left: 0;
right: 0;
bottom: 0;
width: 100%;
height: 100%;
cursor: default;
mix-blend-mode: screen;
}
#textInputContainer {
display: none;
position: absolute;
}
#textInput {
background-color: transparent;
font-family: 'Ubuntu';
padding: 0;
border: 0;
outline: none;
}
#a {
position: absolute;
bottom: 0px;
left: 50%;
pointer-events: none;
}
.aa {
background-color: transparent;
margin: 24px auto;
border-radius: 5px;
overflow: hidden;
}
.aa-tall {
width: 300px;
height: 250px;
}
.aa-wide {
width: 728px;
height: 90px;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjvWyNL4U.woff2) format('woff2');
unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjtGyNL4U.woff2) format('woff2');
unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjvGyNL4U.woff2) format('woff2');
unicode-range: U+1F00-1FFF;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjs2yNL4U.woff2) format('woff2');
unicode-range: U+0370-03FF;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjvmyNL4U.woff2) format('woff2');
unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
font-family: 'Ubuntu';
font-style: normal;
font-weight: 700;
font-display: swap;
src: local('Ubuntu Bold'), local('Ubuntu-Bold'), url(https://fonts.gstatic.com/s/ubuntu/v14/4iCv6KVjbNBYlgoCxCvjsGyN.woff2) format('woff2');
unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
</style>
</head>
<body>
<span id="loading">Loading...</span>
<canvas id="canvas"></canvas>
<div id="a">
<div style="position: relative; left: -50%; pointer-events: auto;">
<div id="a1" class="aa"><div id="ac1"></div></div>
<div id="a2" class="aa" style="display:none"><div id="ac2"></div></div>
<div id="a3" class="aa" style="display:none"><div id="ac3"></div></div>
</div>
</div>
<div id="empty-container"></div>
<div style="position: absolute; width: 640px; height: 360px; top: 50%; left: 50%; margin-left: -320px; margin-top: -180px; display: none;">
<div id="player" style="width: 100%; height: 100%;"></div>
</div>
<div style="font-family:'Ubuntu'">&nbsp;</div>
<div id="textInputContainer"><input id="textInput" /></div>
<script>
m28n=function(n){var e="https://api.n.m28.io",r="http:"!=n.location.protocol;function t(n,r,t){"function"==typeof r?(t=r,r={}):r=r||{};var o=r.version;i(e+"/endpoint/"+n+"/findEach/"+(o?"?version="+o:""),t)}function o(n,e,o){"function"==typeof e&&(o=e,e={}),(e=e||{}).points=5,e.timeout=5e3,t("latency",null,function(t,i){if(t)return o(t);var s,u={},f=[];for(var a in i.servers)!function(t){if(-1!=n.indexOf(t)){var o=i.servers[t],s=r?o.id+".s.m28n.net":o.ipv4||"["+o.ipv6+"]",a=new WebSocket((r?"wss:":"ws:")+"//"+s);f.push(a),a.binaryType="arraybuffer",a.onopen=function(){var n=new Uint8Array(1);n[0]=0,a.send(n.buffer)},a.onmessage=function(n){if(0==new Uint8Array(n.data)[0]){if(u[t]=(u[t]||0)+1,u[t]>=e.points)return l();a.send(n.data)}},a.onerror=function(n){console.warn(n)},a.onclose=function(){var n=f.indexOf(a);-1!=n&&(f.splice(n,1),0==f.length&&l())}}}(a);if(0==f.length)return o("No latency servers in selected regions");var l=function(){l=function(){},clearTimeout(s);for(var n=0;n<f.length;++n)try{var e=f[n];e.onopen=null,e.onmessage=null,e.onerror=null,e.onclose=null,e.close()}catch(n){}var r=[];for(var t in u)r.push({region:t,points:u[t]});r.sort(function(n,e){return e.points-n.points});var i=r.map(function(n){return n.region});if(0==i.length)return o("Latency testing failed, no servers replied to probes in time");o(null,i)};s=setTimeout(l,e.timeout)})}function i(n,e){s(n,"GET",null,e)}function s(n,e,r,t){var o=new XMLHttpRequest;o.open(e,n,!0),o.onerror=function(n){t&&t(n),t=null},o.onreadystatechange=function(){if(4==o.readyState){var n;try{n=JSON.parse(o.responseText)}catch(n){return t&&t('Failed to parse body. Error: "'+(n.message||n).toString()+'". Content: '+o.responseText),void(t=null)}o.status>=200&&o.status<=299&&!n.error?t&&t(null,n):t&&t(n.error||"Non 2xx status code"),t=null}},o.send(r)}return{findServers:t,findRegionPreference:o,findServerPreference:function(n,e,r){"function"==typeof e&&(r=e,e={}),t(n,e,function(n,t){if(n)return r(n);if(!t)return r("Unknown error");if(!t.servers)return r("Invalid response");var i=[];for(var s in t.servers)i.push(s);if(0!=i.length){if(1==i.length)for(var s in t.servers)return void r(null,[t.servers[s]]);o(i,e,function(n,e){if(n)return r(n);var o=e.map(function(n){return t.servers[n]});r(null,o)})}else r("Couldn't find any servers in any region")})},findServerByID:function(n,r){if("string"!=typeof n)throw new Error("ID must be a string");/^[0-9a-zA-Z]+$/.test(n)?i(e+"/server/"+n,r):setTimeout(function(){r("Invalid server ID")},0)},setBaseURL:function(n){e=n}}}(window);
window.ads=false;
var worker = new Worker(window.URL.createObjectURL(new Blob([\`window = self;
!function(){function r(r,n){for(var t=0;t<~~(n/4);++t)if("0"!=r[t])return!1;for(t=4*~~(n/4);t<n;++t){if(!(e(r[~~(t/4)])&1<<(3&t)))return!1}return!0}function e(r){switch(r.toLowerCase()){case"0":return 0;case"1":return 1;case"2":return 2;case"3":return 3;case"4":return 4;case"5":return 5;case"6":return 6;case"7":return 7;case"8":return 8;case"9":return 9;case"a":return 10;case"b":return 11;case"c":return 12;case"d":return 13;case"e":return 14;case"f":return 15;default:return 0}}function n(r){for(var e="",n="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",t=0;t<r;++t)e+=n[~~(Math.random()*n.length)];return e}onmessage=function(e){var t=e.data,a=t[0],u=t[1],c=function(r){return function(){postMessage([r].concat(Array.prototype.slice.apply(arguments)))}}(a);"solve"==u&&c(function(e,t){for(;;){var a=n(16);if(r(sha1(e+a+e),t))return a}}(t[2],t[3]))}}();
!function(){"use strict";function t(t){t?(f[0]=f[16]=f[1]=f[2]=f[3]=f[4]=f[5]=f[6]=f[7]=f[8]=f[9]=f[10]=f[11]=f[12]=f[13]=f[14]=f[15]=0,this.blocks=f):this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],this.h0=1732584193,this.h1=4023233417,this.h2=2562383102,this.h3=271733878,this.h4=3285377520,this.block=this.start=this.bytes=this.hBytes=0,this.finalized=this.hashed=!1,this.first=!0}var h="object"==typeof window?window:{},s=!h.JS_SHA1_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node;s&&(h=global);var i=!h.JS_SHA1_NO_COMMON_JS&&"object"==typeof module&&module.exports,e="function"==typeof define&&define.amd,r="0123456789abcdef".split(""),o=[-2147483648,8388608,32768,128],n=[24,16,8,0],a=["hex","array","digest","arrayBuffer"],f=[],u=function(h){return function(s){return new t(!0).update(s)[h]()}},c=function(){var h=u("hex");s&&(h=p(h)),h.create=function(){return new t},h.update=function(t){return h.create().update(t)};for(var i=0;i<a.length;++i){var e=a[i];h[e]=u(e)}return h},p=function(t){var h=eval("require('crypto')"),s=eval("require('buffer').Buffer"),i=function(i){if("string"==typeof i)return h.createHash("sha1").update(i,"utf8").digest("hex");if(i.constructor===ArrayBuffer)i=new Uint8Array(i);else if(void 0===i.length)return t(i);return h.createHash("sha1").update(new s(i)).digest("hex")};return i};t.prototype.update=function(t){if(!this.finalized){var s="string"!=typeof t;s&&t.constructor===h.ArrayBuffer&&(t=new Uint8Array(t));for(var i,e,r=0,o=t.length||0,a=this.blocks;r<o;){if(this.hashed&&(this.hashed=!1,a[0]=this.block,a[16]=a[1]=a[2]=a[3]=a[4]=a[5]=a[6]=a[7]=a[8]=a[9]=a[10]=a[11]=a[12]=a[13]=a[14]=a[15]=0),s)for(e=this.start;r<o&&e<64;++r)a[e>>2]|=t[r]<<n[3&e++];else for(e=this.start;r<o&&e<64;++r)(i=t.charCodeAt(r))<128?a[e>>2]|=i<<n[3&e++]:i<2048?(a[e>>2]|=(192|i>>6)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]):i<55296||i>=57344?(a[e>>2]|=(224|i>>12)<<n[3&e++],a[e>>2]|=(128|i>>6&63)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]):(i=65536+((1023&i)<<10|1023&t.charCodeAt(++r)),a[e>>2]|=(240|i>>18)<<n[3&e++],a[e>>2]|=(128|i>>12&63)<<n[3&e++],a[e>>2]|=(128|i>>6&63)<<n[3&e++],a[e>>2]|=(128|63&i)<<n[3&e++]);this.lastByteIndex=e,this.bytes+=e-this.start,e>=64?(this.block=a[16],this.start=e-64,this.hash(),this.hashed=!0):this.start=e}return this.bytes>4294967295&&(this.hBytes+=this.bytes/4294967296<<0,this.bytes=this.bytes%4294967296),this}},t.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var t=this.blocks,h=this.lastByteIndex;t[16]=this.block,t[h>>2]|=o[3&h],this.block=t[16],h>=56&&(this.hashed||this.hash(),t[0]=this.block,t[16]=t[1]=t[2]=t[3]=t[4]=t[5]=t[6]=t[7]=t[8]=t[9]=t[10]=t[11]=t[12]=t[13]=t[14]=t[15]=0),t[14]=this.hBytes<<3|this.bytes>>>29,t[15]=this.bytes<<3,this.hash()}},t.prototype.hash=function(){var t,h,s=this.h0,i=this.h1,e=this.h2,r=this.h3,o=this.h4,n=this.blocks;for(t=16;t<80;++t)h=n[t-3]^n[t-8]^n[t-14]^n[t-16],n[t]=h<<1|h>>>31;for(t=0;t<20;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i&e|~i&r)+o+1518500249+n[t]<<0)<<5|o>>>27)+(s&(i=i<<30|i>>>2)|~s&e)+r+1518500249+n[t+1]<<0)<<5|r>>>27)+(o&(s=s<<30|s>>>2)|~o&i)+e+1518500249+n[t+2]<<0)<<5|e>>>27)+(r&(o=o<<30|o>>>2)|~r&s)+i+1518500249+n[t+3]<<0)<<5|i>>>27)+(e&(r=r<<30|r>>>2)|~e&o)+s+1518500249+n[t+4]<<0,e=e<<30|e>>>2;for(;t<40;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i^e^r)+o+1859775393+n[t]<<0)<<5|o>>>27)+(s^(i=i<<30|i>>>2)^e)+r+1859775393+n[t+1]<<0)<<5|r>>>27)+(o^(s=s<<30|s>>>2)^i)+e+1859775393+n[t+2]<<0)<<5|e>>>27)+(r^(o=o<<30|o>>>2)^s)+i+1859775393+n[t+3]<<0)<<5|i>>>27)+(e^(r=r<<30|r>>>2)^o)+s+1859775393+n[t+4]<<0,e=e<<30|e>>>2;for(;t<60;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i&e|i&r|e&r)+o-1894007588+n[t]<<0)<<5|o>>>27)+(s&(i=i<<30|i>>>2)|s&e|i&e)+r-1894007588+n[t+1]<<0)<<5|r>>>27)+(o&(s=s<<30|s>>>2)|o&i|s&i)+e-1894007588+n[t+2]<<0)<<5|e>>>27)+(r&(o=o<<30|o>>>2)|r&s|o&s)+i-1894007588+n[t+3]<<0)<<5|i>>>27)+(e&(r=r<<30|r>>>2)|e&o|r&o)+s-1894007588+n[t+4]<<0,e=e<<30|e>>>2;for(;t<80;t+=5)s=(h=(i=(h=(e=(h=(r=(h=(o=(h=s<<5|s>>>27)+(i^e^r)+o-899497514+n[t]<<0)<<5|o>>>27)+(s^(i=i<<30|i>>>2)^e)+r-899497514+n[t+1]<<0)<<5|r>>>27)+(o^(s=s<<30|s>>>2)^i)+e-899497514+n[t+2]<<0)<<5|e>>>27)+(r^(o=o<<30|o>>>2)^s)+i-899497514+n[t+3]<<0)<<5|i>>>27)+(e^(r=r<<30|r>>>2)^o)+s-899497514+n[t+4]<<0,e=e<<30|e>>>2;this.h0=this.h0+s<<0,this.h1=this.h1+i<<0,this.h2=this.h2+e<<0,this.h3=this.h3+r<<0,this.h4=this.h4+o<<0},t.prototype.hex=function(){this.finalize();var t=this.h0,h=this.h1,s=this.h2,i=this.h3,e=this.h4;return r[t>>28&15]+r[t>>24&15]+r[t>>20&15]+r[t>>16&15]+r[t>>12&15]+r[t>>8&15]+r[t>>4&15]+r[15&t]+r[h>>28&15]+r[h>>24&15]+r[h>>20&15]+r[h>>16&15]+r[h>>12&15]+r[h>>8&15]+r[h>>4&15]+r[15&h]+r[s>>28&15]+r[s>>24&15]+r[s>>20&15]+r[s>>16&15]+r[s>>12&15]+r[s>>8&15]+r[s>>4&15]+r[15&s]+r[i>>28&15]+r[i>>24&15]+r[i>>20&15]+r[i>>16&15]+r[i>>12&15]+r[i>>8&15]+r[i>>4&15]+r[15&i]+r[e>>28&15]+r[e>>24&15]+r[e>>20&15]+r[e>>16&15]+r[e>>12&15]+r[e>>8&15]+r[e>>4&15]+r[15&e]},t.prototype.toString=t.prototype.hex,t.prototype.digest=function(){this.finalize();var t=this.h0,h=this.h1,s=this.h2,i=this.h3,e=this.h4;return[t>>24&255,t>>16&255,t>>8&255,255&t,h>>24&255,h>>16&255,h>>8&255,255&h,s>>24&255,s>>16&255,s>>8&255,255&s,i>>24&255,i>>16&255,i>>8&255,255&i,e>>24&255,e>>16&255,e>>8&255,255&e]},t.prototype.array=t.prototype.digest,t.prototype.arrayBuffer=function(){this.finalize();var t=new ArrayBuffer(20),h=new DataView(t);return h.setUint32(0,this.h0),h.setUint32(4,this.h1),h.setUint32(8,this.h2),h.setUint32(12,this.h3),h.setUint32(16,this.h4),t};var y=c();i?module.exports=y:(h.sha1=y,e&&define(function(){return y}))}();\`],{type:"text/javascript"}))),
nextJobID=0,workerCallbacks = {};
function solve(t,r,e){worker.postMessage([nextJobID,"solve",t,r]),workerCallbacks[nextJobID++]=e}
worker.onmessage=function(t){workerCallbacks[t.data[0]].apply(null,t.data.slice(1))},window.m28=window.m28||{},window.m28.pow={solve};
!function(){var n=window.localStorage.no_retina?1:window.devicePixelRatio,t=document.getElementById("canvas"),i=!1;function o(n){n.preventDefault&&n.preventDefault()}function d(){window.input&&window.input.flushInputHooks&&window.input.flushInputHooks()}function u(){t.width=window.innerWidth*n,t.height=window.innerHeight*n}t.addEventListener("wheel",function(n){n.preventDefault();if(!window.input)return;window.input.wheel(Math.sign(n.deltaY))}),t.addEventListener("mousemove",function(e){window.input&&window.input.mouse(e.clientX*n,e.clientY*n)}),t.addEventListener("mousedown",function(n){d(),window.input&&(o(n),n.which||void 0===n.button||(n.which=1&n.button?1:2&n.button?3:4&n.button?2:0),n.which>=1&&n.which<=3&&window.input.keyDown(n.which))}),t.addEventListener("mouseup",function(n){d(),window.input&&(o(n),n.which||void 0===n.button||(n.which=1&n.button?1:2&n.button?3:4&n.button?2:0),n.which>=1&&n.which<=3&&window.input.keyUp(n.which))}),document.addEventListener("keydown",function(n){d(),window.input&&(n.keyCode>=112&&n.keyCode<=130&&113!=n.keyCode||(window.input.keyDown(n.keyCode),9==n.keyCode&&o(n),i||n.ctrlKey||n.metaKey||o(n)))}),document.addEventListener("keyup",function(n){d(),window.input&&(n.keyCode>=112&&n.keyCode<=130&&113!=n.keyCode||(window.input.keyUp(n.keyCode),9==n.keyCode&&o(n),i||n.ctrlKey||n.metaKey||o(n)))}),t.addEventListener("click",function(n){n.stopPropagation(),d()}),t.addEventListener("dragstart",function(n){o(n)}),document.addEventListener("blur",function(){window.input&&window.input.blur()}),t.addEventListener("contextmenu",function(n){window.input&&window.input.prevent_right_click&&!window.input.prevent_right_click()||o(n)}),window.setLoadingStatus=function(n){document.getElementById("loading").innerText=n},window.setTyping=function(n){i=n},window.unscale=function(e){return e/n},window.onerror=function(n,t,i,o,d){window.onerror=null,console.log("Uncaught error: "+n)},window.onbeforeunload=function(n){window.input&&window.input.should_prevent_unload&&window.input.should_prevent_unload()&&(n.preventDefault(),n.returnValue="")},window.addEventListener("gamepadconnected",function(n){console.log("Gamepad connected: "+n.id)}),window.onresize=u,u()}();
fetch('https://diep.io').then(async (a) => {
a = await a.text();
fetch('https://static.diep.io/build_' + a.match(/build_(.*)" \\+ \\(window\\.WebAssembly/)[1] + '.js').then(async (s) => {
s = await s.text();
window.eval((${injection.toString()})(s));
}).catch(err => {console.error(err);return;});
}).catch(err => {console.error(err);return;});
</script>
</body>
</html>
`);
document.close();
