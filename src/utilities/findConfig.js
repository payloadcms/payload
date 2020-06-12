const path = require('path');
const fs = require('fs');

const findConfig = () => {
  let configPath = path.resolve(__dirname, '../../../payload.config.js');

  if (!fs.existsSync(configPath)) {
    if (typeof process.env.PAYLOAD_CONFIG_PATH !== 'string') {
      throw new Error('Error: cannot find Payload config. Please create a configuration file located at the root of your project called "payload.config.js".');
    }

    const pathFromENV = path.resolve(process.cwd(), process.env.PAYLOAD_CONFIG_PATH);

    if (fs.existsSync(pathFromENV)) {
      configPath = pathFromENV;
    }
  }

  return configPath;
};

module.exports = findConfig;
