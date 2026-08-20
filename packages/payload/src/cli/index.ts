/* eslint-disable no-console */
import { Command, CommanderError } from 'commander'
import path from 'node:path'
import { config as configureZod } from 'zod/mini'
import en from 'zod/v4/locales/en.js'

import type {
  CLICommand,
  CLICommandDescription,
  CLICommandEntry,
  CLIHelp,
  CLIRuntime,
} from '../config/types.js'

import { dynamicImport } from '../utilities/dynamicImport.js'
import { parsePayloadComponent } from './commands/generateImportMap/utilities/parsePayloadComponent.js'
import { loadEnv } from './loadEnv.js'
import { getCLIErrorOutput, isJSONOutput, writeCLIJSON } from './output.js'
import { registerCLICommand } from './registerCLICommand.js'
import { createCLIRuntime } from './runtime.js'

configureZod(en())

export const createProgram = async (runtime: CLIRuntime): Promise<Command> => {
  const program = new Command()
    .name('payload')
    .description('Manage and operate a local Payload project.')
    .exitOverride()
    .showHelpAfterError()
    .showSuggestionAfterError()
    .option('--cron <expression>', 'Run the command on a cron schedule.')
    .option('--json', 'Return machine-readable JSON output.')
  const config = await runtime.getConfig()
  const commandEntries = config.cli === false ? [] : Object.entries(config.cli.commands)
  const moduleImports = new Map<string, Promise<Record<string, unknown>>>()
  const resolvedCommands = await Promise.all(
    commandEntries
      .filter(([, entry]) => entry !== false)
      .map(async ([name, entry]) => ({
        name,
        cliCommand: await resolveCLICommand({
          name,
          configDir: runtime.configDir,
          entry,
          moduleImports,
        }),
      })),
  )

  const registeredNames = new Map<string, string>()
  const help = createCLIHelp({
    commands: resolvedCommands.map(({ name, cliCommand }) => ({
      name,
      ...(cliCommand.aliases?.length ? { aliases: cliCommand.aliases } : {}),
      description: cliCommand.description,
      inputSchema: cliCommand.schema,
    })),
    program,
  })

  for (const { name, cliCommand } of resolvedCommands) {
    const command = registerCLICommand({
      name,
      commandDefinition: cliCommand,
      help,
      runtime,
    })

    for (const registeredName of [name, ...command.aliases()]) {
      const existingCommand = registeredNames.get(registeredName)

      if (existingCommand) {
        throw new Error(
          `CLI command '${name}' conflicts with '${existingCommand}' through name or alias '${registeredName}'.`,
        )
      }

      registeredNames.set(registeredName, name)
    }

    program.addCommand(command)
  }

  for (const command of program.commands) {
    command.exitOverride()
  }

  return program
}

const createCLIHelp = ({
  commands,
  program,
}: {
  commands: CLICommandDescription[]
  program: Command
}): CLIHelp => ({
  commands,
  output: ({ command: commandName } = {}) => {
    const selectedCommand = commandName
      ? program.commands.find(
          (command) => command.name() === commandName || command.aliases().includes(commandName),
        )
      : program

    if (!selectedCommand) {
      throw new Error(`Unknown command '${commandName}'.`)
    }

    selectedCommand.outputHelp()
  },
})

const resolveCLICommand = async ({
  name,
  configDir,
  entry,
  moduleImports,
}: {
  configDir: string
  entry: CLICommandEntry
  moduleImports: Map<string, Promise<Record<string, unknown>>>
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
    let moduleImport = moduleImports.get(importPath)

    if (!moduleImport) {
      moduleImport = dynamicImport<Record<string, unknown>>(importPath)
      moduleImports.set(importPath, moduleImport)
    }

    commandModule = await moduleImport
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
  'description' in value &&
  typeof value.description === 'string' &&
  'handler' in value &&
  typeof value.handler === 'function' &&
  'input' in value &&
  typeof value.input === 'object' &&
  value.input !== null &&
  'schema' in value &&
  typeof value.schema === 'object' &&
  value.schema !== null

export const bin = async (): Promise<void> => {
  loadEnv()
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const runtime = createCLIRuntime()
  let program: Command | undefined

  try {
    program = await createProgram(runtime)

    if (process.argv.length === 2) {
      program.outputHelp()
    } else {
      await program.parseAsync(process.argv)
    }
  } catch (error) {
    const exitCode = error instanceof CommanderError ? error.exitCode : 1
    const shouldOutputJSON = program ? isJSONOutput(program) : process.argv.includes('--json')

    if (shouldOutputJSON && exitCode !== 0) {
      writeCLIJSON({
        command: program,
        value: getCLIErrorOutput({ command: program?.args[0], error }),
      })
    } else if (!(error instanceof CommanderError)) {
      console.error(error instanceof Error ? error.message : error)
    }

    process.exitCode = exitCode
  } finally {
    if (!runtime.isScheduled) {
      await runtime.destroy()
    }
  }
}
