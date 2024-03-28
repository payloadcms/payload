import prompts from 'prompts'

import type { CliArgs } from '../types.js'

export async function parseProjectName(args: CliArgs): Promise<string> {
  if (args['--init-next']) return '.'
  if (args['--name']) return args['--name']
  if (args._[0]) return args._[0]

  const response = await prompts(
    {
      name: 'value',
      type: 'text',
      message: 'Project name?',
      validate: (value: string) => !!value.length,
    },
    {
      onCancel: () => {
        process.exit(0)
      },
    },
  )

  return response.value
}
