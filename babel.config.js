module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        modules: 'cjs',
        targets: [
          'defaults',
          'not IE 11',
          'not IE_Mob 11',
        ],
      },
    ],
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-optional-chaining'),
    require.resolve('babel-plugin-add-module-exports'),
  ],
};
