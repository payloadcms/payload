const babelConfig = require('./babel.config');

require('@babel/register')({
  ...babelConfig,
  ignore: [
    /node_modules[\\/](?!@payloadcms[\\/]payload[\\/]src[\\/]admin|@payloadcms[\\/]payload[\\/]components|@payloadcms[\\/]payload[\\/]hooks).*/,
  ],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
});

const payload = require('./payload.ts');

module.exports = payload;
