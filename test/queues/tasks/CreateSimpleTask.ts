import type { TaskConfig } from 'payload'

export const CreateSimpleTask: TaskConfig<'CreateSimple'> = {
  retries: 3,
  slug: 'CreateSimple',
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
