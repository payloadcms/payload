/* eslint-disable @typescript-eslint/no-var-requires */
import minimist from 'minimist';
import swcRegister from '@swc/register';
import { generateTypes } from './generateTypes';
import { generateGraphQLSchema } from './generateGraphQLSchema';

swcRegister({
  sourceMaps: 'inline',
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
  },
  module: {
    type: 'commonjs',
  },
});

const { build } = require('./build');

const args = minimist(process.argv.slice(2));

const scriptIndex = args._.findIndex(
  (x) => x === 'build',
);

const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex];

switch (script.toLowerCase()) {
  case 'build': {
    build();
    break;
  }

  case 'generate:types': {
    generateTypes();
    break;
  }

  case 'generate:graphqlschema': {
    generateGraphQLSchema();
    break;
  }

  default:
    console.log(`Unknown script "${script}".`);
    break;
}
