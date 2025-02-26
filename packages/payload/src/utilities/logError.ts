// @ts-strict-ignore
import type pino from 'pino'

import type { Payload } from '../types/index.js'

export const logError = ({ err, payload }: { err: unknown; payload: Payload }): void => {
  let level: false | pino.Level = 'error'

  if (
    err &&
    typeof err === 'object' &&
    'name' in err &&
    typeof err.name === 'string' &&
    typeof payload.config.loggingLevels[err.name] !== 'undefined'
  ) {
    level = payload.config.loggingLevels[err.name]
  }

  if (level) {
    const logObject: { err?: unknown; msg?: unknown } = {}

    if (level === 'info') {
      logObject.msg = typeof err === 'object' && 'message' in err ? err.message : 'Error'
    } else {
      logObject.err = err
    }

    payload.logger[level](logObject)
  }
}
