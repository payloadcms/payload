import type pino from 'pino'

import { createRequire } from 'module'
import path from 'path'

import type { SanitizedConfig } from './types.js'

import { CLIENT_EXTENSIONS } from '../bin/register/clientExtensions.js'
import Logger from '../utilities/logger.js'
import { findConfig } from './find.js'
import validate from './validate.js'

const require = createRequire(import.meta.url)

const loadConfig = async (logger?: pino.Logger): Promise<SanitizedConfig> => {
  const localLogger = logger ?? Logger()

  const configPath = findConfig()

  CLIENT_EXTENSIONS.forEach((ext) => {
    require.extensions[ext] = () => null
  })

  const configPromise = await import(configPath)

  let config = await configPromise

  if ('default' in config) config = await config.default

  if (process.env.NODE_ENV !== 'production') {
    config = await validate(config, localLogger)
  }

  return {
    ...config,
    paths: {
      config: configPath,
      configDir: path.dirname(configPath),
      rawConfig: configPath,
    },
  }
}

export default loadConfig
