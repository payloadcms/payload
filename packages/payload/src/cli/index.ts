/* eslint-disable no-console */
import { Command, CommanderError } from 'commander'
import { config as configureZod } from 'zod/mini'
import en from 'zod/v4/locales/en.js'

import type { CLIArgs, CLICommand } from '../config/types.js'

import { createCLIArgs } from './args.js'
import { createBuildCommand } from './commands/build/index.js'
import { createGenerateDBSchemaCommand } from './commands/generateDBSchema.js'
import { createGenerateImportMapCommand } from './commands/generateImportMap.js'
import { createGenerateTypesCommand } from './commands/generateTypes.js'
import { createHelpCommand } from './commands/help.js'
import { createInfoCommand } from './commands/info.js'
import { createJobsHandleSchedulesCommand } from './commands/jobs/handleSchedules.js'
import { createJobsRunCommand } from './commands/jobs/run.js'
import { createMigrateCreateCommand } from './commands/migrate/create.js'
import { createMigrateDownCommand } from './commands/migrate/down.js'
import { createMigrateFreshCommand } from './commands/migrate/fresh.js'
import { createMigrateRefreshCommand } from './commands/migrate/refresh.js'
import { createMigrateResetCommand } from './commands/migrate/reset.js'
import { createMigrateCommand } from './commands/migrate/run.js'
import { createMigrateStatusCommand } from './commands/migrate/status.js'
import { createRunCommand } from './commands/run.js'
import { loadEnv } from './loadEnv.js'

configureZod(en())

const commands: CLICommand[] = [
  createInfoCommand,
  createRunCommand,
  createBuildCommand,
  createGenerateTypesCommand,
  createGenerateImportMapCommand,
  createGenerateDBSchemaCommand,
  createJobsRunCommand,
  createJobsHandleSchedulesCommand,
  createHelpCommand,
  createMigrateCommand,
  createMigrateDownCommand,
  createMigrateFreshCommand,
  createMigrateRefreshCommand,
  createMigrateResetCommand,
  createMigrateStatusCommand,
  createMigrateCreateCommand,
]

export const createProgram = async (args: CLIArgs): Promise<Command> => {
  const program = new Command()
    .name('payload')
    .description('Manage and operate a local Payload project.')
    .exitOverride()
    .showHelpAfterError()
    .showSuggestionAfterError()
    .option('--cron <expression>', 'Run the command on a cron schedule.')
  const config = await args.getConfig()

  for (const cliCommand of [...commands, ...(config.cli?.commands ?? [])]) {
    const command = cliCommand.command(args)

    Object.defineProperty(command, 'inputSchema', {
      configurable: true,
      enumerable: false,
      value: cliCommand.schema,
    })

    program.addCommand(command)
  }

  for (const command of program.commands) {
    command.exitOverride()
  }

  return program
}

export const bin = async (): Promise<void> => {
  loadEnv()
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const args = createCLIArgs()

  try {
    const program = await createProgram(args)

    if (process.argv.length === 2) {
      program.outputHelp()
    } else {
      await program.parseAsync(process.argv)
    }
  } catch (error) {
    if (error instanceof CommanderError) {
      process.exitCode = error.exitCode
    } else {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  } finally {
    if (!args.isScheduled) {
      await args.destroy()
    }
  }
}
