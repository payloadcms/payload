import type { Command } from 'commander'

import type { CLIArgs } from '../../../config/types.js'
import type { Payload } from '../../../index.js'
import type { CLICommandDefinition, CLIOptions, ParsedCLIOptions } from '../../zodCommand.js'

import { createCLICommand } from '../../zodCommand.js'

type DataCommandDefinition<TOptions extends CLIOptions> = {
  handler: ({
    options,
    payload,
  }: {
    options: ParsedCLIOptions<TOptions>
    payload: Payload
  }) => Promise<{ exitCode?: number }>
} & CLICommandDefinition<TOptions>

export const createDataCommand = <const TOptions extends CLIOptions>({
  args,
  definition,
}: {
  args: CLIArgs
  definition: DataCommandDefinition<TOptions>
}): Command => {
  const { handler, ...cliDefinition } = definition

  return createCLICommand({
    action: ({ command, options }) =>
      args.run({
        command,
        handler: async () => {
          const result = await handler({ options, payload: await args.getPayload() })

          return result.exitCode
        },
      }),
    definition: cliDefinition,
  })
    .helpGroup('Data commands')
    .addHelpText(
      'after',
      '\nThis command loads the local Payload config and always bypasses access control.\nJSON arguments accept inline JSON or @path/to/file.json.\n',
    )
}
