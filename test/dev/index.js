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

const [testConfigDir] = process.argv.slice(2);

const configPath = path.resolve(__dirname, '../', testConfigDir, 'config.ts');
console.log(configPath);
process.env.PAYLOAD_CONFIG_PATH = configPath;

require('./server');
