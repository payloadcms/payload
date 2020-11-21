const babelConfig = require('./babel.config')({
  env: () => false,
});

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line global-require
  require('@babel/register')({
    ...babelConfig,
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
}

const payload = require('./index.ts');

module.exports = payload;
