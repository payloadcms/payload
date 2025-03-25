import type { WorkflowConfig } from 'payload'

export const subTaskFailsWorkflow: WorkflowConfig<'subTaskFails'> = {
  slug: 'subTaskFails',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  retries: 3,
  handler: async ({ job, inlineTask }) => {
    await inlineTask('create two docs', {
      task: async ({ input, inlineTask }) => {
        const { newSimple } = await inlineTask('create doc 1 - succeeds', {
          task: async ({ req }) => {
            const newSimple = await req.payload.create({
              collection: 'simple',
              req,
              data: {
                title: input.message,
              },
            })

            const updatedJob = await req.payload.update({
              collection: 'payload-jobs',
              data: {
                input: {
                  ...job.input,
                  amountTask1Retried:
                    // @ts-expect-error amountRetried is new arbitrary data and not in the type
                    job.input.amountTask1Retried !== undefined
                      ? // @ts-expect-error
                        job.input.amountTask1Retried + 1
                      : 0,
                },
              },
              id: job.id,
            })
            job.input = updatedJob.input as any

            return {
              output: {
                newSimple,
              },
            }
          },
        })

        await inlineTask('create doc 2 - fails', {
          task: async ({ req }) => {
            const updatedJob = await req.payload.update({
              collection: 'payload-jobs',
              data: {
                input: {
                  ...job.input,
                  amountTask2Retried:
                    // @ts-expect-error amountRetried is new arbitrary data and not in the type
                    job.input.amountTask2Retried !== undefined
                      ? // @ts-expect-error
                        job.input.amountTask2Retried + 1
                      : 0,
                },
              },
              id: job.id,
            })
            job.input = updatedJob.input as any

            throw new Error('Failed on purpose')
          },
        })
        return {
          output: {
            simpleID1: newSimple.id,
          },
        }
      },
      input: {
        message: job.input.message,
      },
    })
  },
}
