const { MissingGlobalLabel, DuplicateGlobalLabel } = require('../errors');

module.exports = function validateGlobal(globalConfigs, Globals) {
  Object.values(globalConfigs).forEach((config) => {
    if (!config.label) {
      throw new MissingGlobalLabel(config);
    }
    if (Globals && Globals[config.label]) {
      throw new DuplicateGlobalLabel(config);
    }
  });
};
