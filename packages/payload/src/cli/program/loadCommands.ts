import path from 'node:path'

import type { CLICommand, CLICommandEntry, CLIRuntime } from '../../config/types.js'

import { dynamicImport } from '../../utilities/dynamicImport.js'
import { parsePayloadComponent } from '../commands/generateImportMap/utilities/parsePayloadComponent.js'

export type ResolvedCLICommand = {
  definition: CLICommand
  name: string
}

export const loadCLICommands = async ({
  runtime,
}: {
  runtime: CLIRuntime
}): Promise<ResolvedCLICommand[]> => {
  const config = await runtime.getConfig()
  const commandEntries = config.cli === false ? [] : Object.entries(config.cli.commands)
  const moduleImports = new Map<string, Promise<Record<string, unknown>>>()

  return Promise.all(
    commandEntries
      .filter(([, entry]) => entry !== false)
      .map(async ([name, entry]) => ({
        name,
        definition: await resolveCLICommand({
          name,
          configDir: runtime.configDir,
          entry,
          moduleImports,
        }),
      })),
  )
}

export const validateCLICommandNames = ({ commands }: { commands: ResolvedCLICommand[] }): void => {
  const registeredNames = new Map<string, string>()

  for (const { name, definition } of commands) {
    for (const registeredName of [name, ...(definition.aliases ?? [])]) {
      const existingCommand = registeredNames.get(registeredName)

      if (existingCommand) {
        throw new Error(
          `CLI command '${name}' conflicts with '${existingCommand}' through name or alias '${registeredName}'.`,
        )
      }

      registeredNames.set(registeredName, name)
    }
  }
}

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
