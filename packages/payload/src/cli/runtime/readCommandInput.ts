import type { Command } from 'commander'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const readCommandInput = async ({ command }: { command: Command }): Promise<unknown> => {
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
