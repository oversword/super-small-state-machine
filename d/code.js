import { code } from "./index.js";
import fs  from 'node:fs';

export default async description => {
  const JSoutput = await code(description, 'javascript')
  const TSoutput = await code(description, 'typescript')
  fs.writeFile('./index.ts', TSoutput, err => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
  fs.writeFile('./index.js', JSoutput, err => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
}

