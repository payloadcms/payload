/* eslint-disable no-console */
import type { Command } from 'commander'

import { Cron } from 'croner'

import type { CLICommand, CLIHelp, CLIRuntime } from '../../config/types.js'

import { readCommandInput } from './readCommandInput.js'

/**
 * Runs a command through Payload's shared CLI behavior.
 *
 * For example, `payload jobs:run --limit 2` goes through these steps:
 *
 * - reads the command arguments and options
 * - validates the input with the command schema
 * - passes the validated `args` and runtime helpers to the command handler
 * - applies the handler's exit code
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
  const validation = await definition.input['~standard'].validate(readCommandInput({ command }))

  if (validation.issues) {
    throw new Error(
      `Invalid command input:\n${validation.issues
        .map((issue) => {
          const path = issue.path
            ?.map((part) => String(typeof part === 'object' ? part.key : part))
            .join('.')

          return `- ${path ? `${path}: ` : ''}${issue.message}`
        })
        .join('\n')}`,
    )
  }

  const callHandler = async (): Promise<void> => {
    const exitCode = await definition.handler({
      args: validation.value,
      getConfig: runtime.getConfig,
      getPayload: runtime.getPayload,
      help,
    })

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
        console.error(error)
      }
    },
    { protect: true },
  )
  process.stdin.resume()
}
