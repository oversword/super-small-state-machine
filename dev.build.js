import description from "./description.js";
import D, {  test, code, readme, Q, commentedCode } from "./d/index.js";
import fs  from 'node:fs';
import {exec} from 'child_process'

const handleFileError = err => {
  if (err) throw err
}

fs.rename('./index.build.ts', './index.orig.ts', handleFileError)
fs.rename('./index.build.js', './index.orig.js', handleFileError)
try {
  const JSoutput = await code(description, 'javascript')
  const TSoutput = await code(description, 'typescript')

  fs.writeFile('./index.build.ts', TSoutput, handleFileError);
  fs.writeFile('./index.build.js', JSoutput, handleFileError);

} catch (error) {
  fs.rename('./index.orig.ts', './index.build.ts', handleFileError)
  fs.rename('./index.orig.js', './index.build.js', handleFileError)
  throw error
}