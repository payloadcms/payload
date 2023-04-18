import pino from 'pino';
export type PayloadLogger = pino.Logger;
declare const getLogger: (name?: string, options?: pino.LoggerOptions) => PayloadLogger;
export default getLogger;
