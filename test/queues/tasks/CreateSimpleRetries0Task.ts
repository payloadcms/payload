import type { TaskConfig } from 'payload'

export const CreateSimpleRetries0Task: TaskConfig<'CreateSimpleRetries0'> = {
  slug: 'CreateSimpleRetries0',
  retries: 0,
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'shouldFail',
      type: 'checkbox',
    },
  ],
  outputSchema: [
    {
      name: 'simpleID',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ input, req }) => {
    if (input.shouldFail) {
      throw new Error('Failed on purpose')
    }
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
}
