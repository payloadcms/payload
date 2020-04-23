const { MissingCollectionLabel } = require('../errors');
const sanitizeFields = require('../fields/sanitize');

const sanitizeUserCollection = (userConfig) => {
  // /////////////////////////////////
  // Ensure config is valid
  // /////////////////////////////////

  if (!userConfig.labels.singular) {
    throw new MissingCollectionLabel(userConfig);
  }

  // /////////////////////////////////
  // Make copy of user config
  // /////////////////////////////////

  const sanitizedUserConfig = { ...userConfig };

  // /////////////////////////////////
  // Ensure that user has required object structure
  // /////////////////////////////////

  if (!sanitizedUserConfig.hooks) sanitizedUserConfig.hooks = {};
  if (!sanitizedUserConfig.policies) sanitizedUserConfig.policies = {};

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  sanitizedUserConfig.fields = sanitizeFields(userConfig.fields);

  // /////////////////////////////////
  // Hidden fields
  // /////////////////////////////////

  const hiddenFields = Array.isArray(sanitizedUserConfig.hidden) ? sanitizedUserConfig.hidden : [];
  sanitizedUserConfig.hidden = [
    ...hiddenFields,
    'resetPasswordToken',
    'resetPasswordExpiration',
  ];

  return sanitizedUserConfig;
};

module.exports = sanitizeUserCollection;
