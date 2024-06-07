import { register } from 'node:module'
import { URL, fileURLToPath, pathToFileURL } from 'node:url'
import path from 'path'

import type { SanitizedConfig } from '../config/types.js'

import { loadEnv } from '../bin/loadEnv.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const importWithoutClientFiles = async <T = unknown>(filePath: string) => {
  const { href: filePathUrl } = pathToFileURL(filePath)
  const { href: loaderUrl } = pathToFileURL(path.resolve(dirname, '../../dist/bin/loader/index.js'))

  register(loaderUrl, filePathUrl)
  const result = await import(filePath)
  return result as T
}

/**
 * Resolve and load Payload config from either a relative or absolute path
 */
export const importConfig = async (configPath: string) => {
  loadEnv() // loadConfig would usually be run outside of next. This means they will not get next's automatic env loading here. In order to not force them to install dotenv and set it up manually, we can load the env for them here
  const isAbsolutePath = path.isAbsolute(configPath)
  if (isAbsolutePath) {
    const config = await importWithoutClientFiles<{ default: Promise<SanitizedConfig> }>(configPath)
    return await config.default
  }

  const callerFilename = getCallerInfo()[1].getFileName()

  const url = new URL(callerFilename)

  const callerDir = path.dirname(fileURLToPath(url))

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
