const fs = require('fs');
const path = require('path');
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

const [testSuiteDir] = process.argv.slice(2);

const configPath = path.resolve(__dirname, testSuiteDir, 'config.ts');

if (!fs.existsSync(configPath)) {
  console.error('ERROR: You must pass a valid directory under test/ that contains a config.ts');
  process.exit(1);
}

process.env.PAYLOAD_CONFIG_PATH = configPath;
process.env.PAYLOAD_DROP_DATABASE = 'true';

require('./devServer');
