/* eslint-disable no-console */
import { Command, CommanderError } from 'commander'
import path from 'node:path'
import { config as configureZod } from 'zod/mini'
import en from 'zod/v4/locales/en.js'

import type {
  CLIArgs,
  CLICommand,
  CLICommandEntry,
} from '../config/types.js'

import { dynamicImport } from '../utilities/dynamicImport.js'
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
import { parsePayloadComponent } from './generateImportMap/utilities/parsePayloadComponent.js'
import { loadEnv } from './loadEnv.js'

configureZod(en())

const commands: Record<string, CLICommand> = {
  build: createBuildCommand,
  'generate:db-schema': createGenerateDBSchemaCommand,
  'generate:importmap': createGenerateImportMapCommand,
  'generate:types': createGenerateTypesCommand,
  help: createHelpCommand,
  info: createInfoCommand,
  'jobs:handle-schedules': createJobsHandleSchedulesCommand,
  'jobs:run': createJobsRunCommand,
  migrate: createMigrateCommand,
  'migrate:create': createMigrateCreateCommand,
  'migrate:down': createMigrateDownCommand,
  'migrate:fresh': createMigrateFreshCommand,
  'migrate:refresh': createMigrateRefreshCommand,
  'migrate:reset': createMigrateResetCommand,
  'migrate:status': createMigrateStatusCommand,
  run: createRunCommand,
}

export const createProgram = async (args: CLIArgs): Promise<Command> => {
  const program = new Command()
    .name('payload')
    .description('Manage and operate a local Payload project.')
    .exitOverride()
    .showHelpAfterError()
    .showSuggestionAfterError()
    .option('--cron <expression>', 'Run the command on a cron schedule.')
  const config = await args.getConfig()
  const commandEntries =
    config.cli === false ? {} : { ...commands, ...(config.cli?.commands ?? {}) }
  const registeredNames = new Map<string, string>()

  for (const [name, entry] of Object.entries(commandEntries)) {
    if (entry === false) {
      continue
    }

    const cliCommand = await resolveCLICommand({ name, configDir: args.configDir, entry })
    const command = cliCommand.command({ name, cliArgs: args })

    for (const registeredName of [name, ...command.aliases()]) {
      const existingCommand = registeredNames.get(registeredName)

      if (existingCommand) {
        throw new Error(
          `CLI command '${name}' conflicts with '${existingCommand}' through name or alias '${registeredName}'.`,
        )
      }

      registeredNames.set(registeredName, name)
    }

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

const resolveCLICommand = async ({
  name,
  configDir,
  entry,
}: {
  configDir: string
  entry: CLICommandEntry
  name: string
}): Promise<CLICommand> => {
  if (isCLICommand(entry)) {
    return entry
  }

  const { exportName, path: commandPath } = parsePayloadComponent(entry)
  const importPath = commandPath.startsWith('.')
    ? path.resolve(configDir, commandPath)
    : commandPath
  const reference = `${commandPath}${exportName === 'default' ? '' : `#${exportName}`}`
  let commandModule: Record<string, unknown>

  try {
    commandModule = await dynamicImport<Record<string, unknown>>(importPath)
  } catch (error) {
    throw new Error(
      `Could not load CLI command '${name}' from '${reference}': ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }

  const command = commandModule[exportName]

  if (command === undefined) {
    throw new Error(
      `Could not load CLI command '${name}' from '${reference}': the module does not export '${exportName}'.`,
    )
  }

  if (!isCLICommand(command)) {
    throw new Error(
      `Could not load CLI command '${name}' from '${reference}': the export was not created with defineCLICommand.`,
    )
  }

  return command
}

const isCLICommand = (value: unknown): value is CLICommand =>
  typeof value === 'object' &&
  value !== null &&
  'command' in value &&
  typeof value.command === 'function' &&
  'schema' in value &&
  typeof value.schema === 'object' &&
  value.schema !== null

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
