import type { WorkflowConfig } from 'payload'

export const inlineTaskTestDelayedWorkflow: WorkflowConfig<'inlineTaskTestDelayed'> = {
  slug: 'inlineTaskTestDelayed',
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
        // Wait 100ms
        await new Promise((resolve) => setTimeout(resolve, 100))

        const newSimple = await req.payload.create({
          collection: 'simple',
          req,
          data: {
            title: input.message,
          },
        })
        await new Promise((resolve) => setTimeout(resolve, 100))

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
