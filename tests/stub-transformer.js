module.exports = {
  process() {
    return 'module.exports = {};';
  },
  getCacheKey() {
    return 'stub-transformer';
  },
};
