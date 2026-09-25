import type { WorkflowConfig } from 'payload'

export const throwsInHandlerNoRetriesWorkflow: WorkflowConfig<'throwsInHandlerNoRetries'> = {
  slug: 'throwsInHandlerNoRetries',
  inputSchema: [],
  // Intentionally no `retries` set — exercises the default no-retries-on-workflow-error behavior
  handler: () => {
    throw new Error('This workflow throws in its handler')
  },
}
