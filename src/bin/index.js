#!/usr/bin/env node

const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'test',
);

const script = scriptIndex === -1 ? args[0] : args[scriptIndex];

switch (script) {
  case 'build': {
    console.log('building');
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
