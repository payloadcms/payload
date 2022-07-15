const path = require('path');
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

const [testSuiteDir] = process.argv.slice(2);

const configPath = path.resolve(__dirname, '../', testSuiteDir, 'config.ts');
process.env.PAYLOAD_CONFIG_PATH = configPath;
process.env.PAYLOAD_DROP_DATABASE = 'true';

require('./server');
