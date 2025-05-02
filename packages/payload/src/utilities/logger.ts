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

export const getLogger = (name = 'payload', logger?: Config['logger']): PayloadLogger => {
  if (!logger) {
    return pino(defaultLoggerOptions)
  }

  // Synchronous logger used by bin scripts
  if (logger === 'sync') {
    return pino(prettySyncLoggerDestination)
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

    return pino(options, destination)
  } else {
    // Instantiated logger
    return logger
  }
}
