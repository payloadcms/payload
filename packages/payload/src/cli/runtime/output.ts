import { type Command, CommanderError } from 'commander'

import type { CLIRuntime } from '../../config/types.js'

export type CLIErrorIssue = {
  message: string
  path?: string
}

export class CLICommandError extends Error {
  code: string
  command?: string
  inputSchema?: Record<string, unknown>
  issues?: CLIErrorIssue[]

  constructor({
    cause,
    code = 'COMMAND_FAILED',
    command,
    inputSchema,
    issues,
    message,
  }: {
    cause?: unknown
    code?: string
    command?: string
    inputSchema?: Record<string, unknown>
    issues?: CLIErrorIssue[]
    message: string
  }) {
    super(message, { cause })
    this.name = 'CLICommandError'
    this.code = code
    this.command = command
    this.inputSchema = inputSchema
    this.issues = issues
  }
}

export const isJSONOutput = (command: Command): boolean =>
  Boolean(command.optsWithGlobals<{ json?: boolean }>().json)

export const writeCLIJSON = ({ command, value }: { command?: Command; value: unknown }): void => {
  const output = `${JSON.stringify(value, (_key, item) =>
    typeof item === 'bigint' ? item.toString() : item,
  )}\n`
  const outputConfiguration = command?.configureOutput()

  if (outputConfiguration?.writeOut) {
    outputConfiguration.writeOut(output)
  } else {
    process.stdout.write(output)
  }
}

export const getCLIErrorOutput = ({
  command,
  error,
}: {
  command?: string
  error: unknown
}): Record<string, unknown> => {
  if (error instanceof CLICommandError) {
    return {
      command: error.command ?? command,
      error: {
        code: error.code,
        message: error.message,
        ...(error.issues ? { issues: error.issues } : {}),
        ...(error.inputSchema ? { inputSchema: error.inputSchema } : {}),
      },
      success: false,
    }
  }

  const errorWithDetails = error as { code?: unknown; message?: unknown }

  return {
    ...(command ? { command } : {}),
    error: {
      code: typeof errorWithDetails?.code === 'string' ? errorWithDetails.code : 'COMMAND_FAILED',
      message:
        typeof errorWithDetails?.message === 'string'
          ? errorWithDetails.message
          : typeof error === 'string'
            ? error
            : 'Unknown error',
    },
    success: false,
  }
}

export const handleCLIError = ({ error, program }: { error: unknown; program?: Command }): void => {
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
}

/** Runs CLI work, formats failures, and closes Payload when the command finishes. */
export const withErrorHandling = ({
  run,
  runtime,
}: {
  run: () => Promise<void>
  runtime: CLIRuntime
}): Promise<void> =>
  run()
    .catch((error) => {
      handleCLIError({ error })
    })
    .finally(async () => {
      if (!runtime.isScheduled) {
        await runtime.destroy()
      }
    })
