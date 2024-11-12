import type { WorkflowHandler } from 'payload'

export const externalWorkflowHandler: WorkflowHandler<'externalWorkflow'> = async ({
  job,
  tasks,
}) => {
  await tasks.ExternalTask('1', {
    input: {
      message: job.input.message,
    },
  })
}
