import pino from 'pino';

export type PayloadLogger = pino.Logger;

const defaultLoggerOptions: pino.LoggerOptions = {
  transport: {
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
    },
    target: 'pino-pretty',
  },
};

const getLogger = (name = 'payload', options?: pino.LoggerOptions, destination?: pino.DestinationStream): PayloadLogger => pino({
  enabled: process.env.DISABLE_LOGGING !== 'true',
  name: options?.name || name,
  ...(options || defaultLoggerOptions),
}, destination);

export default getLogger;
