const babelConfig = require('../babel.config');

require('@babel/register')({
  ...babelConfig,
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
});

require('./server.ts');
