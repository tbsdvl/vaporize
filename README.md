# vaporize

A package for removing unused JavaScript modules.

```javascript
import vaporize from "vaporize";

(async () => {
    await vaporize("index.js");
})();
```

## **DISCLAIMER**
This project is a work in progress and is not yet available in the `npm` registry. Please clone the repository and use it with caution if you would like to try out `vaporize`.

## Table of Contents
- <a href="#installation">Installation</a>
- <a href="#description">Description</a>
- <a href="#example">Example</a>
- <a href="#limitations">Limitations</a>


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

## Description
`vaporize` will scan a TypeScript or JavaScript file that uses ESM syntax and find references to imported modules. Each file is copied into a temporary directory excluding unused modules if any are found. The temporary directory of copied files is used as a safety net to compile a build using `tsc`. Files are only overwritten with text from the copies if the temporary directory successfully created a build without any errors at compile time. The temporary directory is deleted once the build completes or if any errors occur during compilation.

## Example

<!--
Will put a gif here of a project showing installation, unused dependencies, running vaporize, and showing the effects.
--->

## Limitations

<!-- vaporize cannot be required using CommonJS syntax. --->
- `vaporize` cannot be `required` in a JavaScript file using CommonJS syntax.
