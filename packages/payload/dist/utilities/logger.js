import { pino } from 'pino';
import { build } from 'pino-pretty';
const prettyOptions = {
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'SYS:HH:MM:ss'
};
export const prettySyncLoggerDestination = build({
    ...prettyOptions,
    destination: 1,
    sync: true
});
export const defaultLoggerOptions = build(prettyOptions);
export const getLogger = (name = 'payload', logger)=>{
    if (!logger) {
        return pino(defaultLoggerOptions);
    }
    // Synchronous logger used by bin scripts
    if (logger === 'sync') {
        return pino(prettySyncLoggerDestination);
    }
    // Check if logger is an object
    if ('options' in logger) {
        const { destination, options } = logger;
        if (!options.name) {
            options.name = name;
        }
        if (!options.enabled) {
            options.enabled = process.env.DISABLE_LOGGING !== 'true';
        }
        return pino(options, destination);
    } else {
        // Instantiated logger
        return logger;
    }
};

//# sourceMappingURL=logger.js.map