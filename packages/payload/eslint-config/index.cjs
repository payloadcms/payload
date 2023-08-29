module.exports = {
  extends: [
    './configs/base/index.cjs',
    './configs/jest/index.cjs',
    './configs/react/index.cjs',
    './configs/prettier.cjs',
  ].map(require.resolve),
  rules: {},
};
