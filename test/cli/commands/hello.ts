import { defineCLICommand, strictObject, z } from 'payload/cli'

export const createHelloCommand = defineCLICommand({
  description: 'Return a greeting.',
  handler: ({ args, isJSON }) => {
    const message = `Hello, ${args.name}!`

    if (!isJSON) {
      console.log(message)
    }

    return { result: { message } }
  },
  input: strictObject({
    name: z.string(),
  }),
})
