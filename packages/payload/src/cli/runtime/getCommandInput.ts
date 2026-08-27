import type { Command } from 'commander'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Returns the raw value that the command schema will validate.
 *
 * For example, both commands return `{ migrationName: 'add-users' }`:
 *
 * ```sh
 * payload migrate:create add-users
 * payload migrate:create --input '{"migrationName":"add-users"}'
 * ```
 */
export const getCommandInput = async (command: Command): Promise<unknown> => {
  const input = command.getOptionValue('input') as string | undefined
  const shellInput = getShellInput(command)

  if (input === undefined) {
    return shellInput
  }

  if (Object.keys(shellInput).length > 0) {
    command.error('error: --input cannot be combined with command arguments or options')
  }

  return parseJSONInput(input)
}

/**
 * Combines Commander's parsed positional arguments and explicitly passed options.
 *
 * For example, `payload migrate:create add-users --skip-empty` returns:
 *
 * ```ts
 * { migrationName: 'add-users', skipEmpty: true }
 * ```
 */
const getShellInput = (command: Command): Record<string, unknown> => {
  const input: Record<string, unknown> = {}

  for (const [position, argument] of command.registeredArguments.entries()) {
    const value = command.processedArgs[position]

    if (value !== undefined && (!Array.isArray(value) || value.length > 0)) {
      input[argument.name()] = value
    }
  }

  for (const option of command.options) {
    const name = option.attributeName()

    // The schema applies defaults later, so only include options the user passed.
    if (name !== 'input' && name !== 'json' && command.getOptionValueSource(name) === 'cli') {
      input[name] = command.getOptionValue(name)
    }
  }

  return input
}

/**
 * Reads and parses the value passed to `--input`.
 *
 * For example, `'{}'` is parsed directly, `@input.json` reads the JSON from that file,
 * and `-` reads it from stdin. An input of `'{"force":true}'` returns `{ force: true }`.
 */
const parseJSONInput = async (input: string): Promise<unknown> => {
  let json = input

  switch (input) {
    case '-': {
      json = ''
      for await (const chunk of process.stdin) {
        json += chunk.toString()
      }
      break
    }

    default: {
      if (input.startsWith('@')) {
        json = await readFile(path.resolve(process.cwd(), input.slice(1)), 'utf8')
      }
    }
  }

  try {
    return JSON.parse(json) as unknown
  } catch (error) {
    throw new Error(
      `Could not parse --input as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
