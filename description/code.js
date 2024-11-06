import { code } from "../d.js";
import description from "./description.js";
import fs  from 'node:fs';
const output = await code(description)
fs.writeFile('./index.js', output, err => {
  if (err) {
    console.error(err);
  } else {
    // file written successfully
  }
});


