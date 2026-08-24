/* eslint-disable no-console */
import type { Command } from 'commander'

import { Cron } from 'croner'

import type { CLICommand, CLICommandResult, CLIHelp, CLIRuntime } from '../../config/types.js'

import { CLICommandError, getCLIErrorOutput, isJSONOutput, writeCLIJSON } from './output.js'
import { readCommandInput } from './readCommandInput.js'
import { redirectOutputToStderr } from './redirectOutputToStderr.js'

/**
 * Runs a command through Payload's shared CLI behavior.
 *
 * For example, `payload jobs:run --limit 2 --json` goes through these steps:
 *
 * - reads arguments and options, or the complete JSON value passed through `--input`
 * - validates the input and includes the schema when reporting validation errors
 * - passes the validated `args` and runtime helpers to the command handler
 * - sends logs to stderr and writes a consistent JSON response to stdout in JSON mode
 * - normalizes handler results, errors, and exit codes
 * - runs the handler on a schedule when using `--cron`
 *
 * Binding the handler directly to `command.action()` would skip this shared behavior.
 */
export const invokeCLICommand = async ({
  command,
  definition,
  help,
  runtime,
}: {
  command: Command
  definition: CLICommand
  help: CLIHelp
  runtime: CLIRuntime
}): Promise<void> => {
  const rawInput = await readCommandInput({ command })
  const validation = await definition.input['~standard'].validate(rawInput)

  if (validation.issues) {
    const issues = validation.issues.map((issue) => ({
      message: issue.message,
      path: issue.path?.map((part) => String(typeof part === 'object' ? part.key : part)).join('.'),
    }))

    throw new CLICommandError({
      code: 'INVALID_INPUT',
      command: command.name(),
      inputSchema: definition.schema,
      issues,
      message: `Invalid command input:\n${issues
        .map((issue) => `- ${issue.path ? `${issue.path}: ` : ''}${issue.message}`)
        .join('\n')}`,
    })
  }

  const callHandler = async (): Promise<void> => {
    const isJSON = isJSONOutput(command)
    const previousJSONSetting = process.env.PAYLOAD_CLI_JSON
    const restoreOutput = isJSON ? redirectOutputToStderr() : undefined
    let handlerResult: CLICommandResult | number | void

    if (isJSON) {
      process.env.PAYLOAD_CLI_JSON = '1'
    }

    try {
      handlerResult = await definition.handler({
        args: validation.value,
        getConfig: runtime.getConfig,
        getPayload: runtime.getPayload,
        help,
        isJSON,
      })
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
      restoreOutput?.()

      if (previousJSONSetting === undefined) {
        delete process.env.PAYLOAD_CLI_JSON
      } else {
        process.env.PAYLOAD_CLI_JSON = previousJSONSetting
      }
    }

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
  }

  const { cron } = command.optsWithGlobals<{ cron?: string }>()

  if (!cron) {
    await callHandler()
    return
  }

  runtime.markScheduled()
  new Cron(
    cron,
    async () => {
      try {
        await callHandler()
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

const normalizeHandlerResult = (
  handlerResult: CLICommandResult | number | void,
): CLICommandResult =>
  typeof handlerResult === 'number' ? { exitCode: handlerResult } : (handlerResult ?? {})
