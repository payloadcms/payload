#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const build = require('./build');

const scriptIndex = args._.findIndex(
  (x) => x === 'build' || x === 'test',
);

const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex];

switch (script) {
  case 'build': {
    build(args);
    break;
  }

  case 'test': {
    console.log('testing');
    break;
  }
  default:
    console.log(`Unknown script "${script}".`);
    break;
}
