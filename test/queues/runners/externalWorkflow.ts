import type { WorkflowHandler } from 'payload'

export const externalWorkflowHandler: WorkflowHandler<'externalWorkflow'> = async ({
  job,
  runTask,
}) => {
  await runTask({
    id: '1',
    task: 'ExternalTask',
    input: {
      message: job.input.message,
    },
  })
}
