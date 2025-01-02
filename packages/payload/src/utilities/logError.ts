import type pino from 'pino'

import type { Payload } from '../types/index.js'

export const logError = ({ err, payload }: { err: unknown; payload: Payload }): void => {
  let level: pino.Level = 'error'

  if (
    err &&
    typeof err === 'object' &&
    'name' in err &&
    typeof err.name === 'string' &&
    payload.config.loggingLevels[err.name]
  ) {
    level = payload.config.loggingLevels[err.name]
  }

  if (level) {
    payload.logger[level](
      level === 'info'
        ? { msg: typeof err === 'object' && 'message' in err ? err.message : 'Error' }
        : { err },
    )
  }
}
