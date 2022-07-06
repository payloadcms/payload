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

const [testConfigDir] = process.argv.slice(2);

process.env.PAYLOAD_CONFIG_PATH = path.resolve(__dirname, '../src', testConfigDir, 'payload.config.ts');

require('./server');
