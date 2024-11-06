import { readme } from "../d.js";
import description from "./description.js";
import fs  from 'node:fs';
const output = await readme(description)
fs.writeFile('./README.md', output, err => {
  if (err) {
    console.error(err);
  } else {
    // file written successfully
  }
});


// D('Chaining Config, and Configuring Chains',
//   'These are effectively config "setters", it is reccomended to use these, especially is using typescript as there is type inferece when executed in the correct order.',
//   'All of these will create a new instance, and as such will create a chainable set of modifications, much like promises.',
// ),
