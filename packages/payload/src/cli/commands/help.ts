import * as z from 'zod/mini'

import { defineCLICommand } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'

export const createHelpCommand = defineCLICommand({
  cli: {
    command: 'argument',
  },
  description: 'Display help for Payload commands.',
  handler: ({ args, help }) => {
    help.output({ command: args.command })
  },
  helpGroup: 'Core commands',
  input: strictObject({
    command: z.optional(z.string()).check(z.describe('Command to describe.')),
  }),
})
