import type { WorkflowControlFlow } from 'payload'

export const externalWorkflowControlFlow: WorkflowControlFlow<'externalWorkflow'> = async ({
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
