const { MissingGlobalLabel } = require('../errors');
const sanitizeFields = require('../fields/sanitize');

const sanitizeGlobals = (globals) => {
  // /////////////////////////////////
  // Ensure globals are valid
  // /////////////////////////////////

  globals.forEach((globalConfig) => {
    if (!globalConfig.label) {
      throw new MissingGlobalLabel(globalConfig);
    }
  });

  const sanitizedGlobals = globals.map((global) => {
    const sanitizedGlobal = { ...global };

    // /////////////////////////////////
    // Ensure that collection has required object structure
    // /////////////////////////////////

    if (!sanitizedGlobal.hooks) sanitizedGlobal.hooks = {};
    if (!sanitizedGlobal.policies) sanitizedGlobal.policies = {};

    // /////////////////////////////////
    // Sanitize fields
    // /////////////////////////////////

    sanitizedGlobal.fields = sanitizeFields(global.fields);

    return sanitizedGlobal;
  });

  return sanitizedGlobals;
};

module.exports = sanitizeGlobals;
