const babelConfig = require('./babel.config');

require('@babel/register')({
  ...babelConfig,
  ignore: [
    /node_modules[\\/](?!@payloadcms[\\/]payload[\\/]src[\\/]admin|@payloadcms[\\/]payload[\\/]components|@payloadcms[\\/]payload[\\/]hooks).*/,
  ],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  plugins: [
    [
      'babel-plugin-ignore-html-and-css-imports',
      {
        removeExtensions: ['.svg', '.css', '.scss', '.png', '.jpg'],
      },
    ],
    ...babelConfig.plugins,
  ],
});

const payload = require('./index.ts');

module.exports = payload;
