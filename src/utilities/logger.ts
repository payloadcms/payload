import pino from 'pino';

export type PayloadLogger = pino.Logger;

const defaultLoggerOptions = {
  prettyPrint: {
    ignore: 'pid,hostname',
    translateTime: 'HH:MM:ss',
  },
};

const getLogger = (
  name = 'payload',
  options?: pino.LoggerOptions,
  destination?: pino.DestinationStream,
): PayloadLogger => pino(
  {
    name: options?.name || name,
    enabled: process.env.DISABLE_LOGGING !== 'true',
    ...(options || process.env.NODE_ENV !== 'production'
      ? defaultLoggerOptions
      : {}),
  },
  destination,
);

export default getLogger;
