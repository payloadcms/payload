import type { StandardSchemaV1 } from '@standard-schema/spec'

import type {
  CLICommand,
  CLICommandResult,
  CLIFieldOverride,
  CLIHelp,
  CLIInputSchema,
  CLIRuntime,
} from '../config/types.js'

type CLICommandDefinition<TInput extends CLIInputSchema> = {
  aliases?: string[]
  allowUnknownOption?: boolean
  cli?:
    | false
    | Partial<Record<Extract<keyof StandardSchemaV1.InferInput<TInput>, string>, CLIFieldOverride>>
  description: string
  /**
   * Runs after Payload validates the command input. `args` contains the validated values.
   *
   * - Return nothing when the command succeeds without a result.
   * - Return a number to set the process exit code.
   * - Return `{ result }` to include data in JSON output.
   * - Return `{ exitCode, result }` when the command needs both.
   *
   * Use `isJSON` to avoid printing human-readable output when Payload is producing JSON.
   */
  handler: (
    context: {
      args: StandardSchemaV1.InferOutput<TInput>
      help: CLIHelp
      isJSON: boolean
    } & Pick<CLIRuntime, 'getConfig' | 'getPayload'>,
  ) => CLICommandResult | number | Promise<CLICommandResult | number | void> | void
  helpGroup?: string
  input: TInput
}

/** Defines a CLI command from its input schema, shell input, and handler. */
export const defineCLICommand = <TInput extends CLIInputSchema>(
  definition: CLICommandDefinition<TInput>,
): CLICommand => {
  const { cli, input } = definition
  const schema = input['~standard'].jsonSchema.input({ target: 'draft-2020-12' })

  if (schema.type !== 'object') {
    throw new Error('CLI command input schema must describe an object.')
  }

  const properties = (schema.properties ?? {}) as Record<string, unknown>
  const overrides = cli === false ? {} : (cli ?? {})

  for (const field of Object.keys(overrides)) {
    if (!(field in properties)) {
      throw new Error(`CLI command configures unknown input '${field}'.`)
    }
  }

  return {
    ...definition,
    allowUnknownOption: definition.allowUnknownOption ?? false,
    cli: cli === false ? false : overrides,
    handler: definition.handler as CLICommand['handler'],
    input: input as CLIInputSchema,
    schema,
  }
}
