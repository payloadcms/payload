import { Command } from 'commander'
import { config as configureZod } from 'zod/mini'
import en from 'zod/v4/locales/en.js'

import type { CLIRuntime } from '../config/types.js'

import { createCLIHelp } from './program/createHelp.js'
import { loadCLICommands, validateCLICommandNames } from './program/loadCommands.js'
import { registerCLICommand } from './program/registerCommand.js'
import { createCLIRuntime } from './runtime/createRuntime.js'
import { loadEnv } from './runtime/loadEnv.js'
import { withErrorHandling } from './runtime/output.js'

configureZod(en())

export const bin = withErrorHandling(async (): Promise<void> => {
  // /////////////////////////////////////
  // Setup environment
  // /////////////////////////////////////
  loadEnv()
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const runtime = createCLIRuntime()

  // /////////////////////////////////////
  // Create and register commands
  // /////////////////////////////////////
  const cli = await createCLI(runtime)

  // /////////////////////////////////////
  // Output help if requested
  // /////////////////////////////////////
  if (process.argv.length === 2) {
    cli.outputHelp()
    return
  }

  // /////////////////////////////////////
  // Run the CLI with the provided arguments
  // /////////////////////////////////////
  await cli.parseAsync(process.argv).finally(async () => {
    // Cleanup runtime
    if (!runtime.isScheduled) {
      await runtime.destroy()
    }
  })
})

export const createCLI = async (runtime: CLIRuntime): Promise<Command> => {
  const cli = new Command()
    .name('payload')
    .description('Manage and operate a local Payload project.')
    .exitOverride()
    .showHelpAfterError()
    .showSuggestionAfterError()
    .option('--cron <expression>', 'Run the command on a cron schedule.')
    .option('--json', 'Return machine-readable JSON output.')

  // /////////////////////////////////////
  // Load, validate and register commands
  // /////////////////////////////////////

  const commands = await loadCLICommands({ runtime })

  validateCLICommandNames({ commands })

  const help = createCLIHelp({ cli, commands })

  for (const { name, definition } of commands) {
    registerCLICommand({
      name,
      cli,
      definition,
      help,
      runtime,
    })
  }

  return cli
}
