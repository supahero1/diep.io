const solve = require("./build/Release/pow_solver.node");
const crypto = require("crypto");
function pow(difficulty=17, string="") {
  if(string.length == 0) {
    for(let i = 0; i < 16; ++i) {
      string += "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 62)];
    }
  }
  console.log(`solving string '${string}' difficulty '${difficulty}'`);
  const res = solve.solve_pow(difficulty, new TextEncoder().encode(string).buffer);
  console.log(`solved: '${res}', check: ${string}${res}${string}`);
  const hash = crypto.createHash("sha1").update(string + res + string).digest("hex");
  let char;
  for(let i = 0; i < hash.length; ++i) {
    if(hash[i] != '0') {
      char = hash[i];
      if(i == 4) {
        char = (parseInt(`0x${char}`, 16) ^ 0xf).toString(16);
      }
      break;
    }
  }
  console.log(`hash: ${hash} 0b${(parseInt(`0x${char}`, 16) ^ 4).toString(2).padStart(4, "0")}`);
  return res;
}

const express = require("express"); /* see pow.user.js */
const app = express();

app.use(express.json());

app.post("/", function(req, res) {
  const { string, difficulty } = req.body;
  const str = pow(difficulty, string);
  res.status(200).send(str);
});

app.listen(16384, function() {
  console.log("listening");
});
