module.exports = {
  extends: [
    './configs/base',
    './configs/jest',
    './configs/react',
  ].map(require.resolve),
  rules: {},
};
