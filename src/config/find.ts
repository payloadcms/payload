import path from 'path';
import findUp from 'find-up';
import fs from 'fs';

/**
* Returns the source and output paths from the nearest tsconfig.json file.
* If no tsconfig.json file is found, returns the current working directory.
* @returns An object containing the source and output paths.
*/
const getTSConfigPaths = (): { srcPath: string, outPath: string } => {
  const tsConfigPath = findUp.sync('tsconfig.json');

  if (!tsConfigPath) {
    return { srcPath: process.cwd(), outPath: process.cwd() };
  }

  try {
    // Read the file as a string and remove trailing commas
    const rawTsConfig = fs.readFileSync(tsConfigPath, 'utf-8')
      .replace(/,\s*]/g, ']')
      .replace(/,\s*}/g, '}');

    const tsConfig = JSON.parse(rawTsConfig);

    const srcPath = tsConfig.compilerOptions?.rootDir || process.cwd();
    const outPath = tsConfig.compilerOptions?.outDir || process.cwd();

    return { srcPath, outPath };
  } catch (error) {
    console.error(`Error parsing tsconfig.json: ${error}`); // Do not throw the error, as we can still continue with the other config path finding methods
    return { srcPath: process.cwd(), outPath: process.cwd() };
  }
};


/**
 * Searches for a Payload configuration file.
 * @returns The absolute path to the Payload configuration file.
 * @throws An error if no configuration file is found.
 */
const findConfig = (): string => {
  // If the developer has specified a config path,
  // format it if relative and use it directly if absolute
  if (process.env.PAYLOAD_CONFIG_PATH) {
    if (path.isAbsolute(process.env.PAYLOAD_CONFIG_PATH)) {
      return process.env.PAYLOAD_CONFIG_PATH;
    }

    return path.resolve(process.cwd(), process.env.PAYLOAD_CONFIG_PATH);
  }

  const { srcPath, outPath } = getTSConfigPaths();

  const searchPaths = process.env.NODE_ENV === 'production' ? [outPath, srcPath] : [srcPath];

  // eslint-disable-next-line no-restricted-syntax
  for (const searchPath of searchPaths) {
    const configPath = findUp.sync((dir) => {
      const tsPath = path.join(dir, 'payload.config.ts');
      const hasTS = findUp.sync.exists(tsPath);

      if (hasTS) {
        return tsPath;
      }

      const jsPath = path.join(dir, 'payload.config.js');
      const hasJS = findUp.sync.exists(jsPath);

      if (hasJS) {
        return jsPath;
      }

      return undefined;
    }, { cwd: searchPath });

    if (configPath) {
      return configPath;
    }
  }

  // If no config file is found in the directories defined by tsconfig.json,
  // try searching in the 'src' and 'dist' directory as a last resort, as they are most commonly used
  if (process.env.NODE_ENV === 'production') {
    const distConfigPath = findUp.sync(['payload.config.js', 'payload.config.ts'], { cwd: path.resolve(process.cwd(), 'dist') });

    if (distConfigPath) return distConfigPath;
  } else {
    const srcConfigPath = findUp.sync(['payload.config.js', 'payload.config.ts'], { cwd: path.resolve(process.cwd(), 'src') });

    if (srcConfigPath) return srcConfigPath;
  }

  throw new Error('Error: cannot find Payload config. Please create a configuration file located at the root of your current working directory called "payload.config.js" or "payload.config.ts".');
};

export default findConfig;
