import { type Logger, pino } from 'pino'
import { build, type PinoPretty, type PrettyOptions } from 'pino-pretty'

import type { Config } from '../config/types.js'

/**
 * Payload internal logger. Uses Pino.
 * This allows you to bring your own logger instance and let payload use it
 */
export type PayloadLogger = Logger

const prettyOptions: PrettyOptions = {
  colorize: true,
  ignore: 'pid,hostname',
  translateTime: 'SYS:HH:MM:ss',
}

export const prettySyncLoggerDestination: PinoPretty.PrettyStream = build({
  ...prettyOptions,
  destination: 1, // stdout
  sync: true,
})

export const defaultLoggerOptions: PinoPretty.PrettyStream = build(prettyOptions)

let stderrLoggerDestination: PinoPretty.PrettyStream | undefined
let stderrSyncLoggerDestination: PinoPretty.PrettyStream | undefined

export const getLogger = (name = 'payload', logger?: Config['logger']): PayloadLogger => {
  if (process.env.DISABLE_LOGGING === 'true') {
    return pino({ enabled: false })
  }

  const isJSONOutput = process.env.PAYLOAD_CLI_JSON !== undefined

  if (!logger) {
    return pino(isJSONOutput ? getStderrLoggerDestination({ isSync: false }) : defaultLoggerOptions)
  }

  // Synchronous logger used by bin scripts
  if (logger === 'sync') {
    return pino(
      isJSONOutput ? getStderrLoggerDestination({ isSync: true }) : prettySyncLoggerDestination,
    )
  }

  // Check if logger is an object
  if ('options' in logger) {
    const { destination, options } = logger

    if (!options.name) {
      options.name = name
    }

    if (!options.enabled) {
      options.enabled = process.env.DISABLE_LOGGING !== 'true'
    }

    return pino(options, isJSONOutput ? process.stderr : destination)
  } else {
    // Instantiated logger
    return logger
  }
}

const getStderrLoggerDestination = ({ isSync }: { isSync: boolean }): PinoPretty.PrettyStream => {
  if (isSync) {
    stderrSyncLoggerDestination ??= build({
      ...prettyOptions,
      destination: process.stderr,
      sync: true,
    })

    return stderrSyncLoggerDestination
  }

  stderrLoggerDestination ??= build({
    ...prettyOptions,
    destination: process.stderr,
  })

  return stderrLoggerDestination
}
