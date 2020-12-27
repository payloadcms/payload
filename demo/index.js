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

require('./server.ts');
