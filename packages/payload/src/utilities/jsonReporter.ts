import type PinoPretty from 'pino-pretty'

import { build } from 'pino-pretty'

/**
 * Logger destination that writes to stderr instead of stdout.
 * Used when --json flag is active so logger output doesn't
 * pollute the JSON response on stdout.
 */
export const stderrSyncLoggerDestination: PinoPretty.PrettyStream = build({
  colorize: true,
  destination: 2, // stderr
  ignore: 'pid,hostname',
  sync: true,
  translateTime: 'SYS:HH:MM:ss',
})

/**
 * Write a JSON result object to stdout. Used by migration CLI
 * when --json flag is active.
 */
export const writeJsonResult = (result: Record<string, unknown>): void => {
  process.stdout.write(JSON.stringify(result) + '\n')
}
