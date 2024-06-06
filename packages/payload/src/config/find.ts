import { findUpSync, pathExistsSync } from 'find-up'
import fs from 'fs'
import path from 'path'

/**
 * Returns the source and output paths from the nearest tsconfig.json file.
 * If no tsconfig.json file is found, returns the current working directory.
 * @returns An object containing the source and output paths.
 */
const getTSConfigPaths = (): {
  configPath?: string
  outPath?: string
  rootPath?: string
  srcPath?: string
} => {
  const tsConfigPath = findUpSync('tsconfig.json')

  if (!tsConfigPath) {
    return {
      rootPath: process.cwd(),
    }
  }

  try {
    // Read the file as a string and remove trailing commas
    const rawTsConfig = fs
      .readFileSync(tsConfigPath, 'utf-8')
      .replace(/,\s*\]/g, ']')
      .replace(/,\s*\}/g, '}')

    const tsConfig = JSON.parse(rawTsConfig)

    const rootPath = process.cwd()
    const srcPath = tsConfig.compilerOptions?.rootDir || path.resolve(process.cwd(), 'src')
    const outPath = tsConfig.compilerOptions?.outDir || path.resolve(process.cwd(), 'dist')
    const tsConfigDir = path.dirname(tsConfigPath)
    let configPath = tsConfig.compilerOptions?.paths?.['@payload-config']?.[0]
    if (configPath) {
      configPath = path.resolve(tsConfigDir, configPath)
    }
    return {
      configPath,
      outPath,
      rootPath,
      srcPath,
    }
  } catch (error) {
    console.error(`Error parsing tsconfig.json: ${error}`) // Do not throw the error, as we can still continue with the other config path finding methods
    return {
      rootPath: process.cwd(),
    }
  }
}

/**
 * Searches for a Payload configuration file.
 * @returns The absolute path to the Payload configuration file.
 * @throws An error if no configuration file is found.
 */
export const findConfig = (): string => {
  // If the developer has specified a config path,
  // format it if relative and use it directly if absolute
  if (process.env.PAYLOAD_CONFIG_PATH) {
    if (path.isAbsolute(process.env.PAYLOAD_CONFIG_PATH)) {
      return process.env.PAYLOAD_CONFIG_PATH
    }

    return path.resolve(process.cwd(), process.env.PAYLOAD_CONFIG_PATH)
  }

  const { configPath, outPath, rootPath, srcPath } = getTSConfigPaths()

  const searchPaths =
    process.env.NODE_ENV === 'production'
      ? [configPath, outPath, srcPath, rootPath]
      : [configPath, srcPath, rootPath]

  // eslint-disable-next-line no-restricted-syntax
  for (const searchPath of searchPaths) {
    if (!searchPath) continue

    const configPath = findUpSync(
      (dir) => {
        const tsPath = path.join(dir, 'payload.config.ts')
        const hasTS = pathExistsSync(tsPath)

        if (hasTS) {
          return tsPath
        }

        const jsPath = path.join(dir, 'payload.config.js')
        const hasJS = pathExistsSync(jsPath)

        if (hasJS) {
          return jsPath
        }

        return undefined
      },
      { cwd: searchPath },
    )

    if (configPath) {
      return configPath
    }
  }

  // If no config file is found in the directories defined by tsconfig.json,
  // try searching in the 'src' and 'dist' directory as a last resort, as they are most commonly used
  if (process.env.NODE_ENV === 'production') {
    const distConfigPath = findUpSync(['payload.config.js', 'payload.config.ts'], {
      cwd: path.resolve(process.cwd(), 'dist'),
    })

    if (distConfigPath) return distConfigPath
  } else {
    const srcConfigPath = findUpSync(['payload.config.js', 'payload.config.ts'], {
      cwd: path.resolve(process.cwd(), 'src'),
    })

    if (srcConfigPath) return srcConfigPath
  }

  throw new Error(
    'Error: cannot find Payload config. Please create a configuration file located at the root of your current working directory called "payload.config.js" or "payload.config.ts".',
  )
}
