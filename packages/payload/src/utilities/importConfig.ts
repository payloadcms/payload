import path from 'node:path'

import type { SanitizedConfig } from '../config/types.js'

import { importWithoutClientFiles } from './importWithoutClientFiles.js'

/**
 * Resolve and load Payload config from either a relative or absolute path
 */
export const importConfig = async (configPath: string) => {
  const isAbsolutePath = path.isAbsolute(configPath)
  if (isAbsolutePath) {
    const config = await importWithoutClientFiles<{ default: Promise<SanitizedConfig> }>(configPath)
    return await config.default
  }

  const callerDir = path.dirname(getCallerInfo()[1].getFileName()).replace('file://', '')
  const fullConfigPath = path.resolve(callerDir, configPath)

  const config = await importWithoutClientFiles<{ default: Promise<SanitizedConfig> }>(
    fullConfigPath,
  )
  return await config.default
}

const getCallerInfo = () => {
  const _prepareStackTrace = Error.prepareStackTrace
  try {
    let result = []
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1)
      result = callSitesWithoutCurrent
      return callSitesWithoutCurrent
    }

    new Error().stack
    return result
  } finally {
    Error.prepareStackTrace = _prepareStackTrace
  }
}
