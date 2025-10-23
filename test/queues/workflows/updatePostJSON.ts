import type { WorkflowConfig } from 'payload'

export const updatePostJSONWorkflow: WorkflowConfig<'updatePostJSONWorkflow'> = {
  slug: 'updatePostJSONWorkflow',
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
  handler: [
    {
      task: 'UpdatePost',
      id: '1',
      input: ({ job }) => ({
        post: job.input.post,
        message: job.input.message,
      }),
    },
    {
      task: 'UpdatePostStep2',
      id: '2',
      input: ({ job }) => ({
        post: job.taskStatus.UpdatePost['1'].input.post,
        messageTwice: job.taskStatus.UpdatePost['1'].output.messageTwice,
      }),
      condition({ job }) {
        return !!job?.taskStatus?.UpdatePost?.['1']?.complete
      },
      completesJob: true,
    },
  ],
}
