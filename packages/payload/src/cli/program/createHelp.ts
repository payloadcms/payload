import type { Command } from 'commander'

import type { CLIHelp } from '../../config/types.js'
import type { ResolvedCLICommand } from './loadCommands.js'

export const createCLIHelp = ({
  cli,
  commands,
}: {
  cli: Command
  commands: ResolvedCLICommand[]
}): CLIHelp => ({
  commands: commands.map(({ name, definition }) => ({
    name,
    ...(definition.aliases?.length ? { aliases: definition.aliases } : {}),
    description: definition.description,
    inputSchema: definition.schema,
  })),
  output: ({ command: commandName } = {}) => {
    const selectedCommand = commandName
      ? cli.commands.find(
          (command) => command.name() === commandName || command.aliases().includes(commandName),
        )
      : cli

    if (!selectedCommand) {
      throw new Error(`Unknown command '${commandName}'.`)
    }

    selectedCommand.outputHelp()
  },
})
