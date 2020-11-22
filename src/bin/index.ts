#!/usr/bin/env node

import minimist from 'minimist';
import build from './build';

const args = minimist(process.argv.slice(2));

const scriptIndex = args._.findIndex(
  (x) => x === 'build',
);

const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex];

switch (script) {
  case 'build': {
    build();
    break;
  }

  default:
    console.log(`Unknown script "${script}".`);
    break;
}
