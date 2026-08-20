import { Command } from 'commander'

export const createRootProgram = (): Command =>
  new Command()
    .name('payload')
    .description('Manage and operate a local Payload project.')
    .exitOverride()
    .showHelpAfterError()
    .showSuggestionAfterError()
    .option('--cron <expression>', 'Run the command on a cron schedule.')
    .option('--json', 'Return machine-readable JSON output.')
