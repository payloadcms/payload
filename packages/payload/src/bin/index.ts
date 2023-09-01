/* eslint-disable @typescript-eslint/no-var-requires */
import swcRegister from '@swc/register';
import { getTsconfig as getTSconfig } from 'get-tsconfig';
import minimist from 'minimist';
import path from 'path';

import { generateGraphQLSchema } from './generateGraphQLSchema';
import { generateTypes } from './generateTypes';
import { migrate } from './migrate';

const tsConfig = getTSconfig();

const swcOptions = {
  ignore: [
    /.*\/node_modules\/.*/, // parse everything besides files within node_modules
  ],
  jsc: {
    baseUrl: path.resolve(),
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    paths: undefined,
  },
  module: {
    type: 'commonjs',
  },
  sourceMaps: 'inline',
};

if (tsConfig?.config?.compilerOptions?.paths) {
  swcOptions.jsc.paths = tsConfig.config.compilerOptions.paths;

  if (tsConfig?.config?.compilerOptions?.baseUrl) {
    swcOptions.jsc.baseUrl = path.resolve(
      tsConfig.config.compilerOptions.baseUrl,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - bad @swc/register types
swcRegister(swcOptions);

const { build } = require('./build');

const args = minimist(process.argv.slice(2));

const scriptIndex = args._.findIndex((x) => x === 'build');

const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex];

if (script.startsWith('migrate')) {
  migrate(args._).then(() => process.exit(0));
} else {
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
}
