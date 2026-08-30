import type { WorkflowConfig } from 'payload'

/**
 * Distinct filename used as the stack-trace marker for the workflow-handler reproduction.
 */
export function throwFromWorkflowHandler(): never {
  throw new Error('unique-marker-workflow-handler-failure')
}

export const throwFromWorkflowHandlerWorkflow: WorkflowConfig<any> = {
  slug: 'throwFromWorkflowHandler',
  inputSchema: [],
  retries: 0,
  handler: () => {
    throwFromWorkflowHandler()
  },
}
