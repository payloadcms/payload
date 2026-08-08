/* eslint-disable no-console */
import { Cron } from 'croner'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { CLIArgs, SanitizedConfig } from '../config/types.js'
import type { Payload } from '../index.js'

import { findConfig } from '../config/find.js'
import { getPayload } from '../index.js'

type CLIRuntime = {
  destroy: () => Promise<void>
  readonly isScheduled: boolean
} & CLIArgs

/**
 * Creates the shared runtime used by all CLI commands.
 *
 * It loads the Payload config once, tracks the active Payload instance so it can be
 * shut down cleanly, and runs commands immediately or on a `--cron` schedule. Keeping
 * this work here lets each command focus only on what that command needs to do.
 */
export const createCLIArgs = (): CLIRuntime => {
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

  const args: CLIRuntime = {
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
      activePayload = await getPayload({
        config: await getConfig(),
        ...options,
      })

      return activePayload
    },
    get isScheduled() {
      return isScheduled
    },
    async run({ command, handler }) {
      const execute = async (): Promise<void> => {
        const exitCode = await handler()

        if (typeof exitCode === 'number') {
          process.exitCode = exitCode
        }
      }
      const { cron } = command.optsWithGlobals<{ cron?: string }>()

      if (!cron) {
        await execute()
        return
      }

      isScheduled = true
      new Cron(
        cron,
        async () => {
          try {
            await execute()
          } catch (error) {
            console.error(error)
          }
        },
        { protect: true },
      )

      process.stdin.resume()
    },
  }

  return args
}
