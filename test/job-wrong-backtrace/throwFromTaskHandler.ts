import type { TaskConfig } from 'payload'

/**
 * Distinct filename used as the stack-trace marker for the task-handler reproduction.
 */
export function throwFromTaskHandler(): never {
  throw new Error('unique-marker-task-handler-failure')
}

export const throwFromTaskHandlerTask: TaskConfig<any> = {
  retries: 0,
  slug: 'throwFromTaskHandler',
  inputSchema: [],
  outputSchema: [],
  handler: () => {
    throwFromTaskHandler()
  },
}
