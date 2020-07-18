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
    if (!sanitizedGlobal.access) sanitizedGlobal.access = {};
    if (!sanitizedGlobal.admin) sanitizedGlobal.admin = {};

    if (!sanitizedGlobal.hooks.beforeUpdate) sanitizedGlobal.hooks.beforeUpdate = [];
    if (!sanitizedGlobal.hooks.afterUpdate) sanitizedGlobal.hooks.afterUpdate = [];
    if (!sanitizedGlobal.hooks.beforeRead) sanitizedGlobal.hooks.beforeRead = [];
    if (!sanitizedGlobal.hooks.afterRead) sanitizedGlobal.hooks.afterRead = [];

    // /////////////////////////////////
    // Sanitize fields
    // /////////////////////////////////

    sanitizedGlobal.fields = sanitizeFields(global.fields);

    return sanitizedGlobal;
  });

  return sanitizedGlobals;
};

module.exports = sanitizeGlobals;
