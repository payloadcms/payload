import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { CLIRuntime, SanitizedConfig } from '../../config/types.js'
import type { Payload } from '../../index.js'

import { findConfig } from '../../config/find.js'
import { getPayload } from '../../index.js'

/**
 * Creates the shared resources used by the CLI.
 *
 * The config is loaded once, and any Payload instance opened by a command is tracked
 * so the CLI can close it before exiting.
 */
export const createCLIRuntime = (): CLIRuntime => {
  let activePayload: Payload | undefined
  let configPromise: Promise<SanitizedConfig> | undefined
  let isScheduled = false
  const configPath = findConfig()

  const getConfig = (): Promise<SanitizedConfig> => {
    configPromise ??= (async () => {
      const importedConfig = await import(pathToFileURL(configPath).toString())
      const config = importedConfig.default ? await importedConfig.default : importedConfig

      return config as SanitizedConfig
    })()

    return configPromise
  }

  const runtime: CLIRuntime = {
    configDir: path.dirname(configPath),
    async destroy() {
      if (!activePayload) {
        return
      }

      const payload = activePayload

      activePayload = undefined
      await payload.destroy()
    },
    getConfig,
    async getPayload(options = {}) {
      const config = await getConfig()
      const configuredLogger = config.logger
      const shouldRedirectLogger = process.env.PAYLOAD_CLI_JSON !== undefined

      if (shouldRedirectLogger) {
        config.logger = getJSONLogger(configuredLogger)
      }

      try {
        activePayload = await getPayload({
          config,
          ...options,
        })
      } finally {
        if (shouldRedirectLogger) {
          config.logger = configuredLogger
        }
      }

      return activePayload
    },
    get isScheduled() {
      return isScheduled
    },
    markScheduled() {
      isScheduled = true
    },
  }

  return runtime
}

/** Redirects configurable stdout loggers while preserving opaque logger instances. */
const getJSONLogger = (configuredLogger: SanitizedConfig['logger']): SanitizedConfig['logger'] => {
  if (!configuredLogger || configuredLogger === 'sync') {
    return { destination: process.stderr, options: {} }
  }

  if (!('options' in configuredLogger)) {
    return configuredLogger
  }

  if (
    configuredLogger.options.transport ||
    (configuredLogger.destination && configuredLogger.destination !== process.stdout)
  ) {
    return configuredLogger
  }

  return { ...configuredLogger, destination: process.stderr }
}
