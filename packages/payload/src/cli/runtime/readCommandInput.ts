import type { Command } from 'commander'

export const readCommandInput = ({ command }: { command: Command }): Record<string, unknown> => {
  const values: Record<string, unknown> = {}

  for (const [position, argument] of command.registeredArguments.entries()) {
    const value = command.processedArgs[position]

    if (value !== undefined) {
      values[argument.name()] = value
    }
  }

  for (const option of command.options) {
    const optionName = option.attributeName()
    const value = command.getOptionValue(optionName)

    if (value !== undefined) {
      values[optionName] = value
    }
  }

  return values
}
