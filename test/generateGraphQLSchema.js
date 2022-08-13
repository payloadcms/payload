const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const babelConfig = require('../babel.config');

require('@babel/register')({
  ...babelConfig,
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  env: {
    development: {
      sourceMaps: 'inline',
      retainLines: true,
    },
  },
});

const { generateGraphQLSchema } = require('../src/bin/generateGraphQLSchema');

const [testConfigDir] = process.argv.slice(2);

let testDir;
if (testConfigDir) {
  testDir = path.resolve(__dirname, testConfigDir);
  setPaths(testDir);
  generateGraphQLSchema();
} else {
  // Generate graphQL Schema for entire directory
  testDir = __dirname;

  fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name);
      setPaths(suiteDir);
      // executes this file again, once for each test suite found and throws an error if any fail
      execFile('node', [path.resolve(testDir, 'generateGraphQLSchema.js'), dir.name], (error, stdout) => {
        if (error) {
          throw error;
        }
        // eslint-disable-next-line no-console
        console.log(stdout);
      });
    });
}

// Set config path and TS output path using test dir
function setPaths(dir) {
  const configPath = path.resolve(dir, 'config.ts');
  const outputPath = path.resolve(dir, 'graphql.schema');
  if (fs.existsSync(configPath)) {
    process.env.PAYLOAD_CONFIG_PATH = configPath;
    process.env.PAYLOAD_GQL_OUTPUT_PATH = outputPath;
    return true;
  }
  return false;
}
