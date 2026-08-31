import { type Command, CommanderError } from 'commander'

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

export const isJSONOutput = (command?: Command): boolean =>
  process.env.PAYLOAD_CLI_JSON !== undefined ||
  (command
    ? Boolean(command.optsWithGlobals<{ json?: boolean }>().json)
    : process.argv.includes('--json'))

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

/**
 * Formats a CLI failure and sets its exit code.
 *
 * Commander prints its own human-readable errors before throwing a `CommanderError`, so they
 * are not printed again. Other errors are printed in full in human-readable mode to preserve
 * their stack trace.
 */
export const handleCLIError = ({ cli, error }: { cli?: Command; error: unknown }): void => {
  const exitCode = error instanceof CommanderError ? error.exitCode : 1
  const shouldOutputJSON = isJSONOutput(cli)

  if (shouldOutputJSON && exitCode !== 0) {
    writeCLIJSON({
      command: cli,
      value: getCLIErrorOutput({ command: cli?.args[0], error }),
    })
  } else if (!(error instanceof CommanderError)) {
    // eslint-disable-next-line no-console
    console.error(error)
  }

  process.exitCode = exitCode
}

/** Wraps the CLI entry point so every failure uses the same output and exits cleanly. */
export const withErrorHandling =
  (run: () => Promise<void>): (() => Promise<void>) =>
  async () => {
    try {
      await run()
    } catch (error) {
      handleCLIError({ error })
      process.exit(process.exitCode ?? 1)
    }
  }
