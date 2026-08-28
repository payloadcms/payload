import type { Command } from 'commander'

import type { CLIHelp } from '../../config/types.js'

export const createCLIHelp = ({ cli }: { cli: Command }): CLIHelp => ({
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
