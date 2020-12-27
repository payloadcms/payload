import path from 'path';
import findUp from 'find-up';

const findConfig = (): string => {
  // If the developer has specified a config path,
  // format it if relative and use it directly if absolute
  if (process.env.PAYLOAD_CONFIG_PATH) {
    if (path.isAbsolute(process.env.PAYLOAD_CONFIG_PATH)) {
      return process.env.PAYLOAD_CONFIG_PATH;
    }

    return path.resolve(process.cwd(), process.env.PAYLOAD_CONFIG_PATH);
  }

  const configPath = findUp.sync((dir) => {
    const tsPath = path.join(dir, 'payload.config.ts');
    const hasTS = findUp.sync.exists(tsPath);

    if (hasTS) return tsPath;

    const jsPath = path.join(dir, 'payload.config.js');
    const hasJS = findUp.sync.exists(jsPath);

    if (hasJS) return jsPath;

    return undefined;
  });

  if (configPath) return configPath;

  throw new Error('Error: cannot find Payload config. Please create a configuration file located at the root of your current working directory called "payload.config.js" or "payload.config.ts".');
};

export default findConfig;
