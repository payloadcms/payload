import path from 'path';
import fs from 'fs';

const findConfig = (): string => {
  // If the developer has specified a config path,
  // format it if relative and use it directly if absolute
  if (process.env.PAYLOAD_CONFIG_PATH) {
    if (path.isAbsolute(process.env.PAYLOAD_CONFIG_PATH)) {
      return process.env.PAYLOAD_CONFIG_PATH;
    }

    return path.resolve(process.cwd(), process.env.PAYLOAD_CONFIG_PATH);
  }

  // By default, Payload is installed as a node_module.
  // Traverse up three levels and check for config
  const defaultPath = path.resolve(__dirname, '../../../payload.config.js');

  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }

  const defaultTSPath = path.resolve(__dirname, '../../../payload.config.ts');

  if (fs.existsSync(defaultTSPath)) {
    return defaultTSPath;
  }

  // Check for config in current working directory
  const cwdJSPath = path.resolve(process.cwd(), 'payload.config.js');
  if (fs.existsSync(cwdJSPath)) {
    return cwdJSPath;
  }

  const cwdTSPath = path.resolve(process.cwd(), 'payload.config.ts');
  if (fs.existsSync(cwdTSPath)) {
    return cwdTSPath;
  }

  throw new Error('Error: cannot find Payload config. Please create a configuration file located at the root of your current working directory called "payload.config.js" or "payload.config.ts".');
};

export default findConfig;
