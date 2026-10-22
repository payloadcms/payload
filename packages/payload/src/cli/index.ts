import { Command, Option } from 'commander'
import { config as configureZod } from 'zod/mini'
import en from 'zod/v4/locales/en.js'

import type { CLIRuntime } from '../config/types.js'

import { createCLIHelp } from './program/createHelp.js'
import { loadCLICommands, validateCLICommandNames } from './program/loadCommands.js'
import { normalizeHelpArguments } from './program/normalizeHelpArguments.js'
import { registerCLICommand } from './program/registerCommand.js'
import { createCLIRuntime } from './runtime/createRuntime.js'
import { loadEnv } from './runtime/loadEnv.js'
import { isJSONOutput, withCLIOutputMode, withErrorHandling } from './runtime/output.js'
import { writeToCLIStdout } from './runtime/redirectOutputToStderr.js'

export const bin = withErrorHandling(async (): Promise<void> => {
  // /////////////////////////////////////
  // Setup environment
  // /////////////////////////////////////
  loadEnv()
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const isJSON = isJSONOutput()
  const shouldExit = await withCLIOutputMode({
    isJSON,
    run: () => runCLI({ isJSON }),
  })

  if (shouldExit) {
    process.exit(process.exitCode ?? 0)
  }
})

const runCLI = async ({ isJSON }: { isJSON: boolean }): Promise<boolean> => {
  const runtime = createCLIRuntime()

  // /////////////////////////////////////
  // Create and register commands
  // /////////////////////////////////////
  const cli = await createCLI(runtime, { isJSON })

  // /////////////////////////////////////
  // Output help if no command was provided
  // /////////////////////////////////////
  if (process.argv.length === 2) {
    writeToCLIStdout({ output: cli.helpInformation() })
    return false
  }

  // /////////////////////////////////////
  // Run the CLI with the provided arguments
  // /////////////////////////////////////
  await cli.parseAsync(normalizeHelpArguments({ args: process.argv, cli })).finally(async () => {
    // Cleanup runtime
    if (!runtime.isScheduled) {
      await runtime.destroy()
    }
  })

  return !runtime.isScheduled
}

export const createCLI = async (
  runtime: CLIRuntime,
  { isJSON = isJSONOutput() }: { isJSON?: boolean } = {},
): Promise<Command> => {
  configureZod(en())

  const jsonOption = new Option(
    '--json',
    'Write one JSON response to stdout; send logs to stderr (do not use 2>&1).',
  )
  const noJSONOption = new Option(
    '--no-json',
    'Use human-readable output even when PAYLOAD_CLI_JSON is set.',
  )

  if (isJSON) {
    jsonOption.hideHelp()
  } else {
    noJSONOption.hideHelp()
  }

  const cli = new Command()
    .name('payload')
    .description('Manage and operate a local Payload project.')
    .exitOverride()
    .showHelpAfterError()
    .showSuggestionAfterError()
    .option('--cron <expression>', 'Run the command on a cron schedule.')
    .addOption(jsonOption)
    .addOption(noJSONOption)

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
