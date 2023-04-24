/* eslint-disable @typescript-eslint/no-var-requires */
import minimist from 'minimist';
import swcRegister from '@swc/register';
import { getTsconfig as getTSconfig } from 'get-tsconfig';
import { generateTypes } from './generateTypes';
import { generateGraphQLSchema } from './generateGraphQLSchema';

const tsConfig = getTSconfig();

const swcOptions = {
  sourceMaps: 'inline',
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    paths: undefined,
    baseUrl: undefined,
  },
  module: {
    type: 'commonjs',
  },
  ignore: [
    /.*\/node_modules\/.*/, // parse everything besides files within node_modules
  ],
};

if (tsConfig?.config?.compilerOptions?.paths) {
  swcOptions.jsc.paths = tsConfig?.config?.compilerOptions?.paths;

  if (tsConfig?.config?.compilerOptions?.baseUrl) {
    swcOptions.jsc.baseUrl = tsConfig?.config?.compilerOptions?.baseUrl;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - bad @swc/register types
swcRegister(swcOptions);

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
