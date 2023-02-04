import pino from 'pino';

export type PayloadLogger = pino.Logger;

const defaultLoggerOptions = {
  prettyPrint: {
    ignore: 'pid,hostname',
    translateTime: 'HH:MM:ss',
  },
};

const getLogger = (name = 'payload', options?: pino.LoggerOptions): PayloadLogger => pino({
  name: options?.name || name,
  enabled: process.env.DISABLE_LOGGING !== 'true',
  ...(options || defaultLoggerOptions),
});

export default getLogger;
