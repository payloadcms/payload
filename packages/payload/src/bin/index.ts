/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
import minimist from 'minimist';
import swcRegister from '@swc/register';
import { getTsconfig as getTSconfig } from 'get-tsconfig';
import { generateTypes } from './generateTypes.js';
import { generateGraphQLSchema } from './generateGraphQLSchema.js';
import { migrate } from './migrate.js';
import { build } from "./build.js";

const tsConfig = getTSconfig();

const swcOptions_cjs = {
  sourceMaps: 'inline',
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
      dts: true,
    },
    paths: undefined,
    baseUrl: path.resolve(),
  },
  module: {
    type: 'commonjs',
  },
  ignore: [
    /.*\/node_modules\/.*/, // parse everything besides files within node_modules
  ],
};

const swcOptions_esm = {
  sourceMaps: 'inline',
  jsc: {
    experimental: {
      keepImportAssertions: true,
    },
    parser: {
      syntax: 'typescript',
      tsx: true,
      dts: true,
      importAssertions: true,
    },
    paths: undefined,
    baseUrl: path.resolve(),
  },
  module: {
    type: 'es6',
  },
  ignore: [
    /.*\/node_modules\/.*/, // parse everything besides files within node_modules
  ],
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - bad @swc/register types
  swcRegister(swcOptions_cjs);
} else {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - bad @swc/register types
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
