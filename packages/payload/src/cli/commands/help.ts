import * as z from 'zod/mini'

import { defineCLICommand } from '../defineCLICommand.js'
import { CLICommandError } from '../runtime/output.js'
import { strictObject } from '../zod.js'

export const createHelpCommand = defineCLICommand({
  cli: {
    command: 'argument',
  },
  description: 'Display help for Payload commands.',
  handler: ({ args, help, isJSON }) => {
    const selectedCommand = args.command
      ? help.commands.find(
          (command) =>
            command.name === args.command || command.aliases?.includes(args.command as string),
        )
      : undefined

    if (args.command && !selectedCommand) {
      throw new CLICommandError({
        code: 'UNKNOWN_COMMAND',
        command: 'help',
        message: `Unknown command '${args.command}'.`,
      })
    }

    if (!isJSON) {
      help.output({ command: args.command })
      return
    }

    const output = selectedCommand
      ? {
          command: selectedCommand,
          version: 1,
        }
      : {
          commands: help.commands,
          version: 1,
        }

    return { result: output }
  },
  helpGroup: 'Core commands',
  input: strictObject({
    command: z.optional(z.string()).check(z.describe('Command to describe.')),
  }),
})
