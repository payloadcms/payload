import { JobCancelledError, type WorkflowConfig } from 'payload'

export const selfCancelWorkflow: WorkflowConfig<'selfCancel'> = {
  slug: 'selfCancel',
  inputSchema: [
    {
      name: 'shouldCancel',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  // Set to 4, to test that this job is not retried despite the workflow level retries being set to 4
  retries: 4,
  handler: ({ job }) => {
    if (job.input.shouldCancel) {
      throw new JobCancelledError('Job was cancelled')
    }
    throw new Error('Failed, not cancelled')
  },
}
