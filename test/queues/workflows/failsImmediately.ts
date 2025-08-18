import type { WorkflowConfig } from 'payload'

export const failsImmediatelyWorkflow: WorkflowConfig<'failsImmediately'> = {
  slug: 'failsImmediately',
  inputSchema: [],
  retries: 0,
  handler: () => {
    throw new Error('This workflow fails immediately')
  },
}
