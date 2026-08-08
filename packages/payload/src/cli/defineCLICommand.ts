import type { StandardJSONSchemaV1, StandardSchemaV1 } from '@standard-schema/spec'

import { Argument, Command, Option } from 'commander'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { CLIArgs, CLICommand } from '../config/types.js'

import { toKebabCase } from '../utilities/toKebabCase.js'

export type CLIInputSchema<
  Input extends Record<string, unknown> = Record<string, unknown>,
  Output extends Record<string, unknown> = Input,
> = StandardJSONSchemaV1<Input, Output> & StandardSchemaV1<Input, Output>

type CLIFieldOverride =
  | 'argument'
  | {
      flags?: string
      parse?: (value: string) => unknown
      type?: 'option'
    }
  | {
      parse?: (value: string) => unknown
      position?: number
      syntax?: string
      type: 'argument'
    }
  | false

type CLICommandDefinition<TInput extends CLIInputSchema> = {
  aliases?: string[]
  allowUnknownOption?: boolean
  cli?:
    | false
    | Partial<Record<Extract<keyof StandardSchemaV1.InferInput<TInput>, string>, CLIFieldOverride>>
  description: string
  handler: (
    context: {
      args: StandardSchemaV1.InferOutput<TInput>
      command: Command
    } & Pick<CLIArgs, 'getConfig' | 'getPayload'>,
  ) => number | Promise<number | void> | void
  helpGroup?: string
  input: TInput
  name: string
}

/** Defines a CLI command from a semantic input schema and Commander configuration. */
export const defineCLICommand = <TInput extends CLIInputSchema>({
  name,
  aliases,
  allowUnknownOption = false,
  cli,
  description,
  handler,
  helpGroup,
  input,
}: CLICommandDefinition<TInput>): CLICommand => {
  const schema = input['~standard'].jsonSchema.input({ target: 'draft-2020-12' })

  if (schema.type !== 'object') {
    throw new Error(`CLI command '${name}' input schema must describe an object.`)
  }

  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>
  const overrides: Partial<Record<string, CLIFieldOverride>> = cli === false ? {} : (cli ?? {})

  for (const field of Object.keys(overrides)) {
    if (!(field in properties)) {
      throw new Error(`CLI command '${name}' configures unknown input '${field}'.`)
    }
  }

  return {
    command: (cliArgs) => {
      const command = new Command(name)
        .description(description)
        .aliases(aliases ?? [])
        .allowUnknownOption(allowUnknownOption)

      if (helpGroup) {
        command.helpGroup(helpGroup)
      }

      if (cli !== false) {
        const argumentOverrides = Object.entries(overrides)
          .filter(
            ([, override]) =>
              override === 'argument' ||
              (typeof override === 'object' && override !== null && override.type === 'argument'),
          )
          .sort(([, a], [, b]) => {
            const aPosition =
              typeof a === 'object' && a !== null && a.type === 'argument' ? a.position : undefined
            const bPosition =
              typeof b === 'object' && b !== null && b.type === 'argument' ? b.position : undefined

            return (aPosition ?? Number.MAX_SAFE_INTEGER) - (bPosition ?? Number.MAX_SAFE_INTEGER)
          })

        for (const [field, override] of argumentOverrides) {
          const argumentOverride =
            typeof override === 'object' && override !== null && override.type === 'argument'
              ? override
              : undefined

          if (override !== 'argument' && !argumentOverride) {
            continue
          }

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

          const choices = property.enum

          if (
            Array.isArray(choices) &&
            choices.every((choice): choice is string => typeof choice === 'string')
          ) {
            argument.choices(choices)
          }

          command.addArgument(argument)
        }

        for (const [field, property] of Object.entries(properties)) {
          const override = overrides[field]
          const isArgument =
            override === 'argument' ||
            (typeof override === 'object' && override !== null && override.type === 'argument')

          if (override === false || isArgument) {
            continue
          }

          const optionOverride =
            typeof override === 'object' && override !== null && override.type !== 'argument'
              ? override
              : undefined

          const flags = optionOverride?.flags
            ? optionOverride.flags
            : getInferredOptionFlags({ field, property })
          const option = new Option(
            flags,
            typeof property.description === 'string' ? property.description : '',
          )
          const parser = optionOverride?.parse ?? getInferredParser({ property })

          if (parser) {
            option.argParser(parser)
          }

          const choices = property.enum

          if (
            Array.isArray(choices) &&
            choices.every((choice): choice is string => typeof choice === 'string')
          ) {
            option.choices(choices)
          }

          command.addOption(option)
        }
      }

      const cliArguments = [...command.registeredArguments]
      const cliOptions = [...command.options]

      if (cliOptions.some((option) => option.attributeName() === 'input')) {
        throw new Error(`CLI command '${name}' cannot register the reserved '--input' option.`)
      }

      for (const argument of cliArguments) {
        argument.argOptional()
      }

      command.addOption(
        new Option(
          '--input <json|@file|->',
          'Pass the complete command input as JSON, from a file, or from stdin.',
        ),
      )
      command.action(async () => {
        let rawInput: unknown

        if (command.getOptionValueSource('input') === 'cli') {
          const hasOtherInput =
            command.processedArgs.some(
              (value) => value !== undefined && (!Array.isArray(value) || value.length > 0),
            ) ||
            cliOptions.some(
              (option) => command.getOptionValueSource(option.attributeName()) === 'cli',
            )

          if (hasOtherInput) {
            command.error('error: --input cannot be combined with command arguments or options')
          }
          rawInput = await parseInput(command.getOptionValue('input') as string)
        } else {
          const values: Record<string, unknown> = {}

          for (const [position, argument] of cliArguments.entries()) {
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
          rawInput = values
        }

        const result = await input['~standard'].validate(rawInput)

        if (result.issues) {
          const issues = result.issues.map((issue) => {
            const issuePath = issue.path
              ?.map((part) => String(typeof part === 'object' ? part.key : part))
              .join('.')

            return `- ${issuePath ? `${issuePath}: ` : ''}${issue.message}`
          })

          throw new Error(`Invalid command input:\n${issues.join('\n')}`)
        }

        await cliArgs.run({
          command,
          handler: async () =>
            handler({
              args: result.value,
              command,
              getConfig: cliArgs.getConfig,
              getPayload: cliArgs.getPayload,
            }),
        })
      })

      return command
    },
    schema,
  }
}

export const getCLICommandInputSchema = (command: Command): Record<string, unknown> | undefined =>
  (command as { inputSchema?: Record<string, unknown> } & Command).inputSchema

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
