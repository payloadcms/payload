/* eslint-disable @typescript-eslint/no-var-requires */
import minimist from 'minimist';
import { generateTypes } from './generateTypes';
import babelConfig from '../babel.config';

require('@babel/register')({
  ...babelConfig,
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
});

const { build } = require('./build');

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

  case 'generate:types': {
    generateTypes();
    break;
  }


  default:
    console.log(`Unknown script "${script}".`);
    break;
}
