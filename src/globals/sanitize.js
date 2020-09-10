const { MissingGlobalLabel } = require('../errors');
const sanitizeFields = require('../fields/sanitize');

const sanitizeGlobals = (collections, globals) => {
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

    if (!sanitizedGlobal.hooks.beforeValidate) sanitizedGlobal.hooks.beforeValidate = [];
    if (!sanitizedGlobal.hooks.beforeChange) sanitizedGlobal.hooks.beforeChange = [];
    if (!sanitizedGlobal.hooks.afterChange) sanitizedGlobal.hooks.afterChange = [];
    if (!sanitizedGlobal.hooks.beforeRead) sanitizedGlobal.hooks.beforeRead = [];
    if (!sanitizedGlobal.hooks.afterRead) sanitizedGlobal.hooks.afterRead = [];

    // /////////////////////////////////
    // Sanitize fields
    // /////////////////////////////////

    const validRelationships = collections.map((c) => c.slug);
    sanitizedGlobal.fields = sanitizeFields(validRelationships, global.fields);

    return sanitizedGlobal;
  });

  return sanitizedGlobals;
};

module.exports = sanitizeGlobals;
