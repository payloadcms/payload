import type { WorkflowConfig } from 'payload'

export const retriesRollbackTestWorkflow: WorkflowConfig<'retriesRollbackTest'> = {
  slug: 'retriesRollbackTest',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ job, inlineTask, req }) => {
    await req.payload.update({
      collection: 'payload-jobs',
      data: {
        input: {
          ...job.input,
          amountRetried:
            // @ts-expect-error amountRetried is new arbitrary data and not in the type
            job.input.amountRetried !== undefined ? job.input.amountRetried + 1 : 0,
        },
      },
      id: job.id,
    })

    await inlineTask('1', {
      task: async ({ req }) => {
        const newSimple = await req.payload.create({
          collection: 'simple',
          req,
          data: {
            title: job.input.message,
          },
        })
        return {
          output: {
            simpleID: newSimple.id,
          },
        }
      },
    })

    await inlineTask('2', {
      task: async ({ req }) => {
        await req.payload.create({
          collection: 'simple',
          req,
          data: {
            title: 'should not exist',
          },
        })
        // Fail afterwards, so that we can also test that transactions work (i.e. the job is rolled back)

        throw new Error('Failed on purpose')
      },
      retries: {
        attempts: 4,
      },
    })
  },
}
