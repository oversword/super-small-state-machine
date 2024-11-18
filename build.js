import description from "./description.js";
import code from "./d/code.js";
import tests from "./d/tests.js";
import readme from "./d/readme.js";

await code(description)
await tests(description)
await readme(description)