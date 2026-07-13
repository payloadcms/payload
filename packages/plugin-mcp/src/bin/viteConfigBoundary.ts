/// <reference types="vite/client" />

import type { SanitizedConfig } from 'payload'

/* eslint-disable no-console */
// @ts-expect-error - The Vite initializer resolves this ID to the Payload config.
import * as configModule from 'payload-mcp:config'

type ConfigListener = (config: SanitizedConfig) => Promise<void> | void

let listener: ConfigListener | undefined
let configQueue = Promise.resolve()

const resolveConfig = async (module: unknown): Promise<SanitizedConfig> => {
  const config = module as { default?: unknown }

  return (await (config.default ?? module)) as SanitizedConfig
}

let config = await resolveConfig(configModule)

export const getConfig = (): SanitizedConfig => config

export const subscribe = (nextListener: ConfigListener): void => {
  listener = nextListener
}

import.meta.hot?.accept('payload-mcp:config', (nextModule) => {
  if (!nextModule) {
    return
  }

  configQueue = configQueue
    .then(async () => {
      config = await resolveConfig(nextModule)
      await listener?.(config)
    })
    .catch((error) => console.error('[payload-mcp] config reload failed:', error))
})
