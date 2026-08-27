import { Argument, Command, Option } from 'commander'

import type { CLICommand, CLIFieldOverride, CLIHelp, CLIRuntime } from '../../config/types.js'

import { toKebabCase } from '../../utilities/toKebabCase.js'
import { invokeCLICommand } from '../runtime/invokeCommand.js'

export const registerCLICommand = ({
  name,
  cli,
  definition,
  help,
  runtime,
}: {
  cli: Command
  definition: CLICommand
  help: CLIHelp
  name: string
  runtime: CLIRuntime
}): void => {
  const command = new Command(name)
    .description(definition.description)
    .aliases(definition.aliases ?? [])
    .allowUnknownOption(definition.allowUnknownOption)

  if (definition.helpGroup) {
    command.helpGroup(definition.helpGroup)
  }

  addCommandInput({ command, definition })

  command.action(() => invokeCLICommand({ command, definition, help, runtime }))

  // Let our runtime format the error and clean up Payload instead of exiting immediately.
  command.exitOverride()

  // Register the completed command with the root CLI.
  cli.addCommand(command)
}

/**
 * Turns a command definition's schema and CLI overrides into Commander inputs.
 *
 * For example:
 *
 * ```ts
 * defineCLICommand({
 *   description: 'Import a file.',
 *   input: z.object({
 *     file: z.string(),
 *     force: z.optional(z.boolean()),
 *   }),
 *   cli: { file: 'argument' },
 *   handler: ({ args }) => importFile(args),
 * })
 * ```
 *
 * registers `<file>` and `--force`. This helper also:
 *
 * - infers parsers, descriptions, and choices from the schema
 * - applies overrides such as positional arguments and custom flags
 * - keeps required and optional positional arguments in sync with the schema
 */
const addCommandInput = ({
  command,
  definition,
}: {
  command: Command
  definition: CLICommand
}): void => {
  const properties = (definition.schema.properties ?? {}) as Record<string, Record<string, unknown>>
  const requiredFields = new Set(
    Array.isArray(definition.schema.required) ? definition.schema.required : [],
  )
  const overrides = definition.cli === false ? {} : definition.cli

  if (definition.cli !== false) {
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
      const isRequired = requiredFields.has(field)
      const argument = new Argument(
        argumentOverride?.syntax ??
          `${isRequired ? '<' : '['}${field}${isArray ? '...' : ''}${isRequired ? '>' : ']'}`,
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
}

/**
 * Checks whether a CLI override makes a schema field positional.
 *
 * For example, both `'argument'` and `{ type: 'argument', position: 1 }` return
 * `true`, while an option override or `undefined` returns `false`.
 */
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
