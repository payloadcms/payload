import { type DestinationStream, type Logger, type LoggerOptions, pino } from 'pino'
import { build, type PrettyOptions } from 'pino-pretty'

export type PayloadLogger = Logger

const prettyOptions: PrettyOptions = {
  colorize: true,
  ignore: 'pid,hostname',
  translateTime: 'SYS:HH:MM:ss',
}

export const defaultLoggerOptions: LoggerOptions = {
  transport: {
    options: prettyOptions,
    target: 'pino-pretty',
  },
}

export const prettySyncLoggerDestination = build({
  ...prettyOptions,
  destination: 1, // stdout
  sync: true,
})

export const getLogger = (
  name = 'payload',
  options?: LoggerOptions,
  destination?: DestinationStream,
): PayloadLogger => {
  if (options) {
    return pino(
      {
        name: options?.name || name,
        enabled: process.env.DISABLE_LOGGING !== 'true',
        ...(options || defaultLoggerOptions),
      },
      destination,
    )
  }

  return pino(prettySyncLoggerDestination)
}
