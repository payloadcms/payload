/* eslint-disable no-console */
import { Argument, Command, Option } from 'commander'
import { Cron } from 'croner'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type {
  CLICommand,
  CLICommandResult,
  CLIFieldOverride,
  CLIHelp,
  CLIRuntime,
} from '../config/types.js'

import { toKebabCase } from '../utilities/toKebabCase.js'
import { CLICommandError, getCLIErrorOutput, isJSONOutput, writeCLIJSON } from './output.js'

export const registerCLICommand = ({
  name,
  commandDefinition,
  help,
  runtime,
}: {
  commandDefinition: CLICommand
  help: CLIHelp
  name: string
  runtime: CLIRuntime
}): Command => {
  const command = new Command(name)
    .description(commandDefinition.description)
    .aliases(commandDefinition.aliases ?? [])
    .allowUnknownOption(commandDefinition.allowUnknownOption)

  if (commandDefinition.helpGroup) {
    command.helpGroup(commandDefinition.helpGroup)
  }

  addCommandInput({ command, commandDefinition })
  command.action(() => handleCLICommand({ command, commandDefinition, help, runtime }))

  return command
}

const addCommandInput = ({
  command,
  commandDefinition,
}: {
  command: Command
  commandDefinition: CLICommand
}): void => {
  const properties = (commandDefinition.schema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >
  const overrides = commandDefinition.cli === false ? {} : commandDefinition.cli

  if (commandDefinition.cli !== false) {
    const argumentOverrides = Object.entries(overrides)
      .filter(([, override]) => isArgumentOverride(override))
      .sort(([, first], [, second]) => {
        const firstPosition = getArgumentPosition(first)
        const secondPosition = getArgumentPosition(second)

        return (
          (firstPosition ?? Number.MAX_SAFE_INTEGER) - (secondPosition ?? Number.MAX_SAFE_INTEGER)
        )
      })

    for (const [field, override] of argumentOverrides) {
      const argumentOverride =
        typeof override === 'object' && override.type === 'argument' ? override : undefined
      const property = properties[field]!
      const isArray = property.type === 'array'
      const argument = new Argument(
        argumentOverride?.syntax ?? `[${field}${isArray ? '...' : ''}]`,
        typeof property.description === 'string' ? property.description : '',
      )
      const parser = argumentOverride?.parse ?? getInferredParser({ property })

      if (parser) {
        argument.argParser(parser)
      }

      addChoices({ argument, property })
      command.addArgument(argument)
    }

    for (const [field, property] of Object.entries(properties)) {
      const override = overrides[field]

      if (override === false || isArgumentOverride(override)) {
        continue
      }

      const optionOverride = typeof override === 'object' ? override : undefined
      const flags = optionOverride?.flags ?? getInferredOptionFlags({ field, property })
      const option = new Option(
        flags,
        typeof property.description === 'string' ? property.description : '',
      )
      const parser = optionOverride?.parse ?? getInferredParser({ property })

      if (parser) {
        option.argParser(parser)
      }

      addChoices({ argument: option, property })
      command.addOption(option)
    }
  }

  const reservedOption = command.options.find((option) =>
    ['input', 'json'].includes(option.attributeName()),
  )

  if (reservedOption) {
    throw new Error(
      `CLI command '${command.name()}' cannot register the reserved '--${reservedOption.attributeName()}' option.`,
    )
  }

  for (const argument of command.registeredArguments) {
    argument.argOptional()
  }

  command.addOption(
    new Option(
      '--input <json|@file|->',
      'Pass the complete command input as JSON, from a file, or from stdin.',
    ),
  )
}

const handleCLICommand = async ({
  command,
  commandDefinition,
  help,
  runtime,
}: {
  command: Command
  commandDefinition: CLICommand
  help: CLIHelp
  runtime: CLIRuntime
}): Promise<void> => {
  const rawInput = await readCommandInput({ command })
  const validation = await commandDefinition.input['~standard'].validate(rawInput)

  if (validation.issues) {
    const issues = validation.issues.map((issue) => ({
      message: issue.message,
      path: issue.path?.map((part) => String(typeof part === 'object' ? part.key : part)).join('.'),
    }))

    throw new CLICommandError({
      code: 'INVALID_INPUT',
      command: command.name(),
      inputSchema: commandDefinition.schema,
      issues,
      message: `Invalid command input:\n${issues
        .map((issue) => `- ${issue.path ? `${issue.path}: ` : ''}${issue.message}`)
        .join('\n')}`,
    })
  }

  const invokeHandler = async (): Promise<void> => {
    const isJSON = isJSONOutput(command)
    const previousDisableLogging = process.env.DISABLE_LOGGING

    if (isJSON) {
      process.env.DISABLE_LOGGING = 'true'
    }

    try {
      const handlerResult = await commandDefinition.handler({
        args: validation.value,
        getConfig: runtime.getConfig,
        getPayload: runtime.getPayload,
        help,
        isJSON,
      })
      const { exitCode, result } = normalizeHandlerResult(handlerResult)

      if (isJSON) {
        writeCLIJSON({
          command,
          value: {
            command: command.name(),
            ...(exitCode ? { exitCode } : {}),
            ...(result !== undefined ? { result } : {}),
            success: !exitCode,
          },
        })
      }

      if (typeof exitCode === 'number') {
        process.exitCode = exitCode
      }
    } catch (error) {
      if (error instanceof CLICommandError) {
        throw error
      }

      throw new CLICommandError({
        cause: error,
        code:
          error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
            ? error.code
            : undefined,
        command: command.name(),
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      if (previousDisableLogging === undefined) {
        delete process.env.DISABLE_LOGGING
      } else {
        process.env.DISABLE_LOGGING = previousDisableLogging
      }
    }
  }

  const { cron } = command.optsWithGlobals<{ cron?: string }>()

  if (!cron) {
    await invokeHandler()
    return
  }

  runtime.markScheduled()
  new Cron(
    cron,
    async () => {
      try {
        await invokeHandler()
      } catch (error) {
        if (isJSONOutput(command)) {
          writeCLIJSON({ command, value: getCLIErrorOutput({ error }) })
        } else {
          console.error(error)
        }
      }
    },
    { protect: true },
  )
  process.stdin.resume()
}

const readCommandInput = async ({ command }: { command: Command }): Promise<unknown> => {
  const cliOptions = command.options.filter(
    (option) => !['input', 'json'].includes(option.attributeName()),
  )

  if (command.getOptionValueSource('input') === 'cli') {
    const hasOtherInput =
      command.processedArgs.some(
        (value) => value !== undefined && (!Array.isArray(value) || value.length > 0),
      ) ||
      cliOptions.some((option) => command.getOptionValueSource(option.attributeName()) === 'cli')

    if (hasOtherInput) {
      command.error('error: --input cannot be combined with command arguments or options')
    }

    return parseInput(command.getOptionValue('input') as string)
  }

  const values: Record<string, unknown> = {}

  for (const [position, argument] of command.registeredArguments.entries()) {
    const value = command.processedArgs[position]

    if (value !== undefined) {
      values[argument.name()] = value
    }
  }

  for (const option of cliOptions) {
    const optionName = option.attributeName()
    const value = command.getOptionValue(optionName)

    if (value !== undefined) {
      values[optionName] = value
    }
  }

  return values
}

const normalizeHandlerResult = (
  handlerResult: CLICommandResult | number | void,
): CLICommandResult =>
  typeof handlerResult === 'number' ? { exitCode: handlerResult } : (handlerResult ?? {})

const isArgumentOverride = (
  override: CLIFieldOverride | undefined,
): override is
  | 'argument'
  | {
      parse?: (value: string) => unknown
      position?: number
      syntax?: string
      type: 'argument'
    } =>
  override === 'argument' ||
  (typeof override === 'object' && override !== null && override.type === 'argument')

const getArgumentPosition = (override: CLIFieldOverride | undefined): number | undefined =>
  typeof override === 'object' && override !== null && override.type === 'argument'
    ? override.position
    : undefined

const addChoices = ({
  argument,
  property,
}: {
  argument: Argument | Option
  property: Record<string, unknown>
}): void => {
  const choices = property.enum

  if (
    Array.isArray(choices) &&
    choices.every((choice): choice is string => typeof choice === 'string')
  ) {
    argument.choices(choices)
  }
}

const getInferredOptionFlags = ({
  field,
  property,
}: {
  field: string
  property: Record<string, unknown>
}): string => {
  const flag = toKebabCase(field) ?? field

  if (property.type === 'boolean') {
    return property.default === true ? `--no-${flag}` : `--${flag}`
  }

  if (property.type === 'array') {
    const items = property.items as Record<string, unknown> | undefined

    if (items?.type === 'integer' || items?.type === 'number' || items?.type === 'string') {
      return `--${flag} <${field}...>`
    }
  }

  if (property.type === 'integer' || property.type === 'number') {
    return `--${flag} <number>`
  }

  if (property.type === 'string') {
    return `--${flag} <${field}>`
  }

  throw new Error(
    `Cannot infer a CLI option for input '${field}'. Configure its flags and parser, or set it to false.`,
  )
}

const getInferredParser = ({
  property,
}: {
  property: Record<string, unknown>
}): ((value: string) => unknown) | undefined => {
  if (property.type === 'integer' || property.type === 'number') {
    return Number
  }

  if (property.type === 'array') {
    const items = property.items as Record<string, unknown> | undefined

    if (items?.type === 'integer' || items?.type === 'number') {
      return Number
    }
  }
}

const parseInput = async (value: string): Promise<unknown> => {
  let json = value

  if (value === '-') {
    json = ''
    for await (const chunk of process.stdin) {
      json += chunk.toString()
    }
  } else if (value.startsWith('@')) {
    json = await readFile(path.resolve(process.cwd(), value.slice(1)), 'utf8')
  }

  try {
    return JSON.parse(json) as unknown
  } catch (error) {
    throw new Error(
      `Could not parse --input as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
