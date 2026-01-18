import { type Logger } from 'pino';
import { type PinoPretty } from 'pino-pretty';
import type { Config } from '../config/types.js';
/**
 * Payload internal logger. Uses Pino.
 * This allows you to bring your own logger instance and let payload use it
 */
export type PayloadLogger = Logger;
export declare const prettySyncLoggerDestination: PinoPretty.PrettyStream;
export declare const defaultLoggerOptions: PinoPretty.PrettyStream;
export declare const getLogger: (name?: string, logger?: Config["logger"]) => PayloadLogger;
//# sourceMappingURL=logger.d.ts.map