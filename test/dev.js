const fs = require('fs');
const path = require('path');
const { register } = require('esbuild-register/dist/node');

const [testSuiteDir] = process.argv.slice(2);

if (!testSuiteDir) {
  console.error('ERROR: You must provide an argument for "testSuiteDir"');
  process.exit(1);
}

const configPath = path.resolve(__dirname, testSuiteDir, 'config.ts');

if (!fs.existsSync(configPath)) {
  console.error('ERROR: You must pass a valid directory under test/ that contains a config.ts');
  process.exit(1);
}

process.env.PAYLOAD_CONFIG_PATH = configPath;

process.env.PAYLOAD_DROP_DATABASE = 'true';

register({
  platform: 'node',
});

require('./devServer');
