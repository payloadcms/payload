const sanitizeConfig = require('../../utilities/sanitizeConfig');
const secureConfig = require('../../utilities/secureConfig');

module.exports = (config) => {
  const sanitizedConfig = sanitizeConfig(config);
  const securedConfig = secureConfig(sanitizedConfig);

  return {
    code: `
    module.exports = ${JSON.stringify(securedConfig)}`,
  };
};
