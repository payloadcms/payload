import pino from 'pino';
import memoize from 'micro-memoize';

export type PayloadLogger = pino.Logger;

export default memoize(
  (name = 'payload', options?: pino.LoggerOptions) => pino({
    name,
    enabled: process.env.DISABLE_LOGGING !== 'true',
    ...(options
      ? { options }
      : {
        prettyPrint: {
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss',
        },
      }),
  }) as PayloadLogger,
);
