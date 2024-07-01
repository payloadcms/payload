import pinoImport from 'pino'
import pinoPrettyImport from 'pino-pretty'

const pino = (pinoImport.default || pinoImport) as unknown as typeof pinoImport.default
const pinoPretty = (pinoPrettyImport.default ||
  pinoPrettyImport) as unknown as typeof pinoPrettyImport.default

export type PayloadLogger = pinoImport.default.Logger

const prettyOptions: pinoPrettyImport.PrettyOptions = {
  colorize: true,
  ignore: 'pid,hostname',
  translateTime: 'SYS:HH:MM:ss',
}

export const defaultLoggerOptions: pinoImport.default.LoggerOptions = {
  transport: {
    options: prettyOptions,
    target: 'pino-pretty',
  },
}

export const prettySyncLoggerDestination = pinoPretty({
  ...prettyOptions,
  destination: 1, // stdout
  sync: true,
})

const getLogger = (
  name = 'payload',
  options?: pinoImport.default.LoggerOptions,
  destination?: pinoImport.default.DestinationStream,
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

export default getLogger
