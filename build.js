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

  const { default: newDescription } = await import('./description.js')
  await test(newDescription)

  const readmeDescription = D('Super Small State Machine',
    Q(newDescription, ['Language']),
    Q(newDescription, ['Tutorial']),
    Q(newDescription, ['Instance']),
    Q(newDescription, ['Chain']),
    Q(newDescription, ['Core']),
    Q(newDescription, ['Default Nodes']),
    Q(newDescription, ['Errors']),
  )
  const output = await readme(readmeDescription)
  fs.writeFile('./README.md', output, handleFileError);

} catch (error) {
  fs.rename('./index.orig.ts', './index.ts', handleFileError)
  fs.rename('./index.orig.js', './index.js', handleFileError)
  throw error
}