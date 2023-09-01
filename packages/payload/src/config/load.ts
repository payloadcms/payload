/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import type pino from 'pino'

// eslint-disable-next-line import/no-extraneous-dependencies
import path from 'path'

import type { SanitizedConfig } from './types'

import Logger from '../utilities/logger'
import { clientFiles } from './clientFiles'
import findConfig from './find'
import validate from './validate'

const loadConfig = async (logger?: pino.Logger): Promise<SanitizedConfig> => {
  const localLogger = logger ?? Logger()

  const configPath = findConfig()

  clientFiles.forEach((ext) => {
    require.extensions[ext] = () => null
  })

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const configPromise = require(configPath)

  let config = await configPromise

  if (config.default) config = await config.default

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
