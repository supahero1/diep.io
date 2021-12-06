const fs = require("fs");

try {
  if(fs.existsSync("success") && fs.existsSync("data.json")) {
    fs.unlinkSync("success");
    process.exit(0);
  } else {
    process.exit(-1);
  }
} catch(err) {
  try {
    fs.unlinkSync("success");
  } catch(e) {
    process.exit(-1);
  }
  process.exit(-1);
}