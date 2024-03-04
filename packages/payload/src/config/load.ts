/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

import type { SanitizedConfig } from './types'

import { clientFiles } from './clientFiles'
import findConfig from './find'

const loadConfig = async (): Promise<SanitizedConfig> => {
  const configPath = findConfig()

  clientFiles.forEach((ext) => {
    require.extensions[ext] = () => null
  })

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const configPromise = require(configPath)

  let config = await configPromise

  if (config.default) config = await config.default

  return config
}

export default loadConfig
