module.exports = (cssOptions, preProcessor) => {
  const loaders = [
    'isomorphic-style-loader',
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env'),
        ],
      },
    },
  ];
  if (preProcessor) {
    loaders.push(require.resolve(preProcessor));
  }
  return loaders;
};
