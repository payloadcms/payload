import type { Command } from 'commander'

import * as z from 'zod/mini'

import { defineCLICommand, getCLICommandInputSchema } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'

type CommandDescription = {
  aliases?: string[]
  description: string
  inputSchema: NonNullable<ReturnType<typeof getCLICommandInputSchema>>
  name: string
}

export const createHelpCommand = defineCLICommand({
  name: 'help',
  cli: {
    command: 'argument',
  },
  description: 'Display help for Payload commands.',
  handler: ({ args, command }) => {
    const program = command.parent

    if (!program) {
      throw new Error('Could not find the Payload CLI program.')
    }

    const selectedCommand = args.command
      ? findCommand({ commandName: args.command, program })
      : undefined

    if (args.command && !selectedCommand) {
      command.error(`error: unknown command '${args.command}'`)
    }

    if (!args.json) {
      ;(selectedCommand ?? program).outputHelp()
      return
    }

    const output = selectedCommand
      ? {
          command: describeCommand({ command: selectedCommand }),
          version: 1,
        }
      : {
          commands: program.commands.map((registeredCommand) =>
            describeCommand({ command: registeredCommand }),
          ),
          version: 1,
        }

    const outputConfiguration = command.configureOutput()
    const jsonOutput = `${JSON.stringify(output)}\n`

    if (outputConfiguration.writeOut) {
      outputConfiguration.writeOut(jsonOutput)
    } else {
      process.stdout.write(jsonOutput)
    }
  },
  helpGroup: 'Core commands',
  input: strictObject({
    command: z.optional(z.string()).check(z.describe('Command to describe.')),
    json: z
      ._default(z.boolean(), false)
      .check(z.describe('Return machine-readable command metadata.')),
  }),
})

const describeCommand = ({ command }: { command: Command }): CommandDescription => {
  const inputSchema = getCLICommandInputSchema(command)
  const aliases = command.aliases()

  if (!inputSchema) {
    throw new Error(`CLI command '${command.name()}' does not define an input schema.`)
  }

  return {
    name: command.name(),
    ...(aliases.length > 0 ? { aliases } : {}),
    description: command.description(),
    inputSchema,
  }
}

const findCommand = ({
  commandName,
  program,
}: {
  commandName: string
  program: Command
}): Command | undefined =>
  program.commands.find(
    (registeredCommand) =>
      registeredCommand.name() === commandName || registeredCommand.aliases().includes(commandName),
  )
