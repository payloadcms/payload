import { Command, CommanderError, Option } from 'commander'
import { z } from 'zod'

export type CLIOption<TSchema extends z.ZodType = z.ZodType> = {
  flags?: string
  isRepeatable?: boolean
  schema: TSchema
  valueName?: string
}

type CLIOptionInput<TSchema extends z.ZodType> = {
  description: string
} & CLIOption<TSchema>

export type CLIOptions = Record<string, CLIOption>

type OptionSchemas<TOptions extends CLIOptions> = {
  [TKey in keyof TOptions]: TOptions[TKey]['schema']
}

export type ParsedCLIOptions<TOptions extends CLIOptions> = z.output<
  z.ZodObject<OptionSchemas<TOptions>>
>

export type CLICommandDefinition<TOptions extends CLIOptions = CLIOptions> = {
  description: string
  name: string
  options: TOptions
  summary: string
  superRefine?: (
    options: ParsedCLIOptions<TOptions>,
    context: z.core.$RefinementCtx<ParsedCLIOptions<TOptions>>,
  ) => Promise<void> | void
}

export const defineCLIOption = <TSchema extends z.ZodType>(
  input: CLIOptionInput<TSchema>,
): CLIOption<TSchema> => {
  const { description, ...option } = input

  return {
    ...option,
    schema: option.schema.describe(description),
  }
}

export const getCLICommandHelp = <TOptions extends CLIOptions>({
  definition,
}: {
  definition: CLICommandDefinition<TOptions>
}): string => createCommanderCommand({ definition }).helpInformation()

export const createCLICommand = <TOptions extends CLIOptions>({
  action,
  definition,
}: {
  action: ({
    command,
    options,
  }: {
    command: Command
    options: ParsedCLIOptions<TOptions>
  }) => Promise<void>
  definition: CLICommandDefinition<TOptions>
}): Command => {
  const command = createCommanderCommand({ definition })

  command.action(async () => {
    const options = await parseCLIOptions({ command, definition })

    await action({ command, options })
  })

  return command
}

export const parseCLICommand = async <TOptions extends CLIOptions>({
  args,
  definition,
}: {
  args: string[]
  definition: CLICommandDefinition<TOptions>
}): Promise<ParsedCLIOptions<TOptions>> => {
  const command = createCommanderCommand({ definition })
  let commanderError = ''

  command.exitOverride().configureOutput({
    writeErr: (message) => {
      commanderError += message
    },
  })

  try {
    await command.parseAsync(['node', 'payload', ...args])
  } catch (error) {
    if (error instanceof CommanderError) {
      throw new Error(commanderError.trim() || error.message)
    }

    throw error
  }

  return parseCLIOptions({ command, definition })
}

const createCommanderCommand = <TOptions extends CLIOptions>({
  definition,
}: {
  definition: CLICommandDefinition<TOptions>
}): Command => {
  const command = new Command(definition.name)
    .description(definition.description)
    .summary(definition.summary)
    .allowExcessArguments(false)

  for (const [name, definitionOption] of Object.entries(definition.options)) {
    const longFlag = `--${toKebabCase(name)}`
    const flags =
      definitionOption.flags ??
      (definitionOption.valueName ? `${longFlag} <${definitionOption.valueName}>` : longFlag)
    const option = new Option(flags, definitionOption.schema.description)
    const undefinedResult = definitionOption.schema.safeParse(undefined)

    if (definitionOption.isRepeatable) {
      option.argParser((value: string, previous?: string[]) =>
        previous ? [...previous, value] : [value],
      )
    }

    if (undefinedResult.success && undefinedResult.data !== undefined) {
      option.default(undefinedResult.data)
    }

    if (definitionOption.valueName && !undefinedResult.success) {
      option.makeOptionMandatory()
    }

    command.addOption(option)
  }

  return command
}

const parseCLIOptions = async <TOptions extends CLIOptions>({
  command,
  definition,
}: {
  command: Command
  definition: CLICommandDefinition<TOptions>
}): Promise<ParsedCLIOptions<TOptions>> => {
  const rawOptions = command.opts<Record<string, unknown>>()
  const shape = Object.fromEntries(
    Object.entries(definition.options).map(([name, option]) => [name, option.schema]),
  ) as OptionSchemas<TOptions>
  const schema = definition.superRefine
    ? z.strictObject(shape).superRefine(definition.superRefine)
    : z.strictObject(shape)
  const result = await schema.safeParseAsync(rawOptions)

  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }

  return result.data
}

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)
