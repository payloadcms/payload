import type { WorkflowConfig } from 'payload'

export const subTaskWorkflow: WorkflowConfig<'subTask'> = {
  slug: 'subTask',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ job, inlineTask }) => {
    await inlineTask('create two docs', {
      task: async ({ input, inlineTask }) => {
        const { newSimple } = await inlineTask('create doc 1', {
          task: async ({ req }) => {
            const newSimple = await req.payload.create({
              collection: 'simple',
              req,
              data: {
                title: input.message,
              },
            })
            return {
              output: {
                newSimple,
              },
            }
          },
        })

        const { newSimple2 } = await inlineTask('create doc 2', {
          task: async ({ req }) => {
            const newSimple2 = await req.payload.create({
              collection: 'simple',
              req,
              data: {
                title: input.message,
              },
            })
            return {
              output: {
                newSimple2,
              },
            }
          },
        })
        return {
          output: {
            simpleID1: newSimple.id,
            simpleID2: newSimple2.id,
          },
        }
      },
      input: {
        message: job.input.message,
      },
    })
  },
}
