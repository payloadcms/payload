const sanitizeConfig = require('../utilities/sanitizeConfig');
const secureConfig = require('../utilities/secureConfig');

function convertToText(obj) {
  const string = [];

  if (obj === undefined || obj === null) {
    return String(obj);
  } if (typeof (obj) === 'object' && !Array.isArray(obj)) {
    Object.keys(obj).forEach((prop) => {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) string.push(`${prop}: ${convertToText(obj[prop])}`);
    });

    return `{${string.join(',')}}`;
  } if (Array.isArray(obj)) {
    Object.keys(obj).forEach((prop) => {
      string.push(convertToText(obj[prop]));
    });

    return `[${string.join(',')}]`;
  } if (typeof (obj) === 'function') {
    string.push(obj.toString());
  } else {
    string.push(JSON.stringify(obj));
  }

  return string.join(',');
}

module.exports = (config) => {
  const sanitizedConfig = sanitizeConfig(config);
  const securedConfig = secureConfig(sanitizedConfig);
  const stringifiedConfig = convertToText(securedConfig);

  return {
    code: `
    module.exports = ${stringifiedConfig}`,
  };
};
