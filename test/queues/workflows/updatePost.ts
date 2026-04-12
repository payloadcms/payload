import type { WorkflowConfig } from 'payload'

export const updatePostWorkflow: WorkflowConfig<'updatePost'> = {
  slug: 'updatePost',
  interfaceName: 'MyUpdatePostWorkflowType',
  inputSchema: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      maxDepth: 0,
      required: true,
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ job, tasks }) => {
    await tasks.UpdatePost('1', {
      input: {
        post: job.input.post,
        message: job.input.message,
      },
    })

    await tasks.UpdatePostStep2('2', {
      input: {
        // @ts-expect-error
        post: job.taskStatus.UpdatePost['1'].input.post,
        // @ts-expect-error
        messageTwice: job.taskStatus.UpdatePost['1'].output.messageTwice,
      },
    })
  },
}
