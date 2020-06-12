const path = require('path');
const fs = require('fs');

const findConfig = () => {
  let configPath = path.resolve(__dirname, '../../../payload.config.js');

  if (!fs.existsSync(configPath)) {
    if (typeof process.env.PAYLOAD_CONFIG_PATH !== 'string') {
      throw new Error('Error: cannot find Payload config. Please create a configuration file located at the root of your project called "payload.config.js".');
    }

    if (fs.existsSync(process.env.PAYLOAD_CONFIG_PATH)) {
      configPath = process.env.PAYLOAD_CONFIG_PATH;
    }
  }

  return configPath;
};

module.exports = findConfig;
