module.exports = {
  presets: [
    require.resolve('@babel/preset-typescript'),
    [
      require.resolve('@babel/preset-env'),
      {
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
    require.resolve('@babel/plugin-transform-runtime'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
  ],
};
