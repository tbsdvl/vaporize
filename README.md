# vaporize

A package for removing unused JavaScript modules.

```javascript
import vaporize from "vaporize";

vaporize("./index.js");
```

## **DISCLAIMER**
This project is a work in progress and is not yet available in the `npm` registry. Please clone the repository and use it with caution if you would like to try out `vaporize`.

## Table of Contents
- <a href="#installation">Installation</a>
- <a href="#description">Description</a>
- <a href="#example">Example</a>
- <a href="#limitations">Limitations</a>
- <a href="#dependencies">Dependencies</a>
- <a href="#credits">Credits</a>
- <a href="#license">License</a>


## Installation

<!--
Can install vaporize using npm.
vaporize uses the typescript compiler to make a temporary build of your ES6 JavaScript and TypeScript files.
--->
<!--
Initalize a new `npm` project.
```bash
npm init -y
```

Install `vaporize`.
```bash
npm i typescript vaporize
```
-->

Install with `git clone`
```bash
git clone https://github.com/tbsdvl/vaporize.git
```

`vaporize` uses the TypeScript compiler to make a temporary build of JavaScript files from your code. You will need `npm` and install `typescript`.
```bash
npm i typescript
```

## Description
`vaporize` will scan a TypeScript or JavaScript file that uses ESM syntax and find references to imported modules. Each file is copied into a temporary directory excluding unused modules if any are found. The temporary directory is used as a safety net to compile a build of JavaScript files using `tsc`. Files are only overwritten with text from the copies if the temporary directory successfully created a build without any errors at compile time. The temporary directory is deleted once the build completes or if any errors occur during compilation.

## Example


https://github.com/tbsdvl/vaporize/assets/76135007/81f4722a-4833-4174-9686-bc99801d451c



## Limitations

<!-- vaporize cannot be required using CommonJS syntax. --->
- `vaporize` cannot be `required` in a JavaScript file using CommonJS syntax.
- `vaporize` will not recognize differently named imports using `as`:
  ```javascript
  import { myModule as myNewName } from "/modules/my-module.js";
  ```

## Dependencies

`vaporize` currently includes the following dependencies.

- precinct: 10.0.1 <a href="https://github.com/dependents/node-precinct">https://github.com/dependents/node-precinct</a>
- jest: 29.5.0 <a href="https://github.com/jestjs/jest">https://github.com/jestjs/jest</a>
- ts-jest: 29.1.0 <a href="https://github.com/kulshekhar/ts-jest">https://github.com/kulshekhar/ts-jest</a>
- ts-node: 10.9.1 <a href="https://github.com/TypeStrong/ts-node">https://github.com/TypeStrong/ts-node</a>
- typescript: 17.0.2 <a href="https://www.typescriptlang.org">https://www.typescriptlang.org</a>

## Credits
`vaporize` is built by Triston Burns.

## License
`vaporize` is open source software licensed as MIT.
