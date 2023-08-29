/* eslint-disable @typescript-eslint/no-var-requires */
import swcRegister from '@swc/register';
import { getTsconfig as getTSconfig } from 'get-tsconfig';
import minimist from 'minimist';
import path from 'path';

import { build } from "./build.js";
import { generateGraphQLSchema } from './generateGraphQLSchema.js';
import { generateTypes } from './generateTypes.js';
import { migrate } from './migrate.js';

const tsConfig = getTSconfig();

const swcOptions_cjs = {
  ignore: [
    /.*\/node_modules\/.*/, // parse everything besides files within node_modules
  ],
  jsc: {
    baseUrl: path.resolve(),
    parser: {
      dts: true,
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

const swcOptions_esm = {
  ignore: [
    /.*\/node_modules\/.*/, // parse everything besides files within node_modules
  ],
  jsc: {
    baseUrl: path.resolve(),
    experimental: {
      keepImportAssertions: true,
    },
    parser: {
      dts: true,
      importAssertions: true,
      syntax: 'typescript',
      tsx: true,
    },
    paths: undefined,
  },
  module: {
    type: 'es6',
  },
  sourceMaps: 'inline',
};

if (tsConfig?.config?.compilerOptions?.paths) {
  swcOptions_esm.jsc.paths = tsConfig.config.compilerOptions.paths;
  swcOptions_cjs.jsc.paths = tsConfig.config.compilerOptions.paths;

  if (tsConfig?.config?.compilerOptions?.baseUrl) {
    swcOptions_esm.jsc.baseUrl = path.resolve(
      tsConfig.config.compilerOptions.baseUrl,
    );
    swcOptions_cjs.jsc.baseUrl = path.resolve(
      tsConfig.config.compilerOptions.baseUrl,
    );
  }
}



const args = minimist(process.argv.slice(2));

if (args._.includes('--cjs')) {
  // @ts-expect-error - bad @swc/register types
  swcRegister(swcOptions_cjs);
} else {
  // @ts-expect-error - bad @swc/register types
  swcRegister(swcOptions_esm);
}

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
