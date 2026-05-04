import type { EvalCase } from '../../types.js'

export type { EvalCase }

export const conventionsQADataset: EvalCase[] = [
  {
    input: 'When passing an error to payload.logger.error, what is the correct format?',
    expected:
      'use an object with msg and err keys, like payload.logger.error({ msg: "message", err: error }); do not pass the error as a second argument',
    category: 'coding',
  },
]
