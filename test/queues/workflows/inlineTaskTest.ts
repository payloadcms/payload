import type { WorkflowConfig } from 'payload'

export const inlineTaskTestWorkflow: WorkflowConfig<'inlineTaskTest'> = {
  slug: 'inlineTaskTest',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ job, inlineTask }) => {
    await inlineTask('1', {
      task: async ({ input, req }) => {
        const newSimple = await req.payload.create({
          collection: 'simple',
          req,
          data: {
            title: input.message,
          },
        })
        return {
          output: {
            simpleID: newSimple.id,
          },
        }
      },
      input: {
        message: job.input.message,
      },
    })
  },
}
