import description from "./description.js";
import D, {  test, code, readme, Q, commentedCode } from "./d/index.js";
import fs  from 'node:fs';

const handleFileError = err => {
  if (err) throw err
}

fs.rename('./index.ts', './index.orig.ts', handleFileError)
fs.rename('./index.js', './index.orig.js', handleFileError)
try {
  const JSoutput = await code(description, 'javascript')
  const TSoutput = await code(description, 'typescript')

  fs.writeFile('./index.ts', TSoutput, handleFileError);
  fs.writeFile('./index.js', JSoutput, handleFileError);

  const JSoutputCommented = await commentedCode(description, 'javascript')

  fs.writeFile('./index.readme.js', JSoutputCommented, handleFileError);

  await test(description)

  const readmeDescription = D('Super Small State Machine',
    Q(description, ['Language']),
    Q(description, ['Instance']),
    Q(description, ['Chain']),
    Q(description, ['Core']),
    Q(description, ['Default Nodes']),
    Q(description, ['Errors']),
  )
  const output = await readme(readmeDescription)
  fs.writeFile('./README.md', output, handleFileError);

} catch (error) {
  fs.rename('./index.orig.ts', './index.ts', handleFileError)
  fs.rename('./index.orig.js', './index.js', handleFileError)
  throw error
}
/*

// D('Chaining Config, and Configuring Chains',
//   'These are effectively config "setters", it is reccomended to use these, especially is using typescript as there is type inferece when executed in the correct order.',
//   'All of these will create a new instance, and as such will create a chainable set of modifications, much like promises.',
// ),
*/