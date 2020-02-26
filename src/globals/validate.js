const { MissingGlobalLabel, DuplicateGlobalLabel } = require('../errors');

module.exports = function validateGlobal(globalConfigs, Globals) {
  if (globalConfigs) {
    Object.values(globalConfigs).forEach((config) => {
      if (!config.label) {
        throw new MissingGlobalLabel(config);
      }
      if (Globals && Globals[config.label]) {
        throw new DuplicateGlobalLabel(config);
      }
    });
  }
};
