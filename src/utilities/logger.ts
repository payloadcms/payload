import pino from 'pino';
import memoize from 'micro-memoize';

export type PayloadLogger = pino.Logger;

const defaultLoggerOptions = {
  prettyPrint: {
    ignore: 'pid,hostname',
    translateTime: 'HH:MM:ss',
  },
};

export default memoize(
  (name = 'payload', options?: pino.LoggerOptions) => pino({
    name: options?.name || name,
    enabled: process.env.DISABLE_LOGGING !== 'true',
    ...(options || defaultLoggerOptions),
  }) as PayloadLogger,
);
