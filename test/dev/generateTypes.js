const path = require('path');
const fs = require('fs');
const babelConfig = require('../../babel.config');

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

const { generateTypes } = require('../../src/bin/generateTypes');

const [testConfigDir] = process.argv.slice(2);
const testDir = path.resolve(__dirname, '../', testConfigDir);

// Generate types for entire directory
if (testConfigDir === 'int' || testConfigDir === 'e2e') {
  fs.readdirSync(testDir, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name);
      setPaths(suiteDir);
      generateTypes();
    });
  return;
}

// Generate for specific test suite directory
setPaths(testDir);
generateTypes();

// Set config path and TS output path using test dir
function setPaths(dir) {
  const configPath = path.resolve(dir, 'config.ts');
  process.env.PAYLOAD_CONFIG_PATH = configPath;
  process.env.PAYLOAD_TS_OUTPUT_PATH = path.resolve(dir, 'payload-types.ts');
}
