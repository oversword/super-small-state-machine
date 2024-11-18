import D, { readme, Q } from "./index.js";
import fs  from 'node:fs';

export default async description => {
  const readmeDescription = D('Super Small State Machine',
    Q(description, ['Language']),
    Q(description, ['Instance']),
    Q(description, ['Chain']),
    Q(description, ['Core']),
    Q(description, ['Default Nodes']),
    Q(description, ['Errors']),
  )
  const output = await readme(readmeDescription)
  fs.writeFile('./README.md', output, err => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
}


// D('Chaining Config, and Configuring Chains',
//   'These are effectively config "setters", it is reccomended to use these, especially is using typescript as there is type inferece when executed in the correct order.',
//   'All of these will create a new instance, and as such will create a chainable set of modifications, much like promises.',
// ),
