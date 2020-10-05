#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const build = require('./build');

const scriptIndex = args._.findIndex(
  (x) => x === 'build',
);

const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex];

switch (script) {
  case 'build': {
    build(args);
    break;
  }

  default:
    console.log(`Unknown script "${script}".`);
    break;
}
