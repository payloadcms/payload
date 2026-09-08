import * as z from 'zod/mini'

import { strictObject } from '../../utilities/zod.js'
import { defineCLICommand } from '../defineCLICommand.js'
import { CLICommandError } from '../runtime/output.js'

export const createHelpCommand = defineCLICommand({
  cli: {
    command: 'argument',
  },
  description: 'Display help for Payload commands.',
  handler: ({ args, help, isJSON }) => {
    const commandName = args.command
    const selectedCommand = commandName
      ? help.commands.find(
          (command) => command.name === commandName || command.aliases?.includes(commandName),
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

    return {
      result: selectedCommand
        ? { command: selectedCommand, globalOptions: help.globalOptions }
        : { commands: help.commands, globalOptions: help.globalOptions },
    }
  },
  helpGroup: 'Core commands',
  input: strictObject({
    command: z.optional(z.string()).check(z.describe('Command to describe.')),
  }),
})
