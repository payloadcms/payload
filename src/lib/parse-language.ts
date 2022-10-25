import prompts from 'prompts'
import type { CliArgs } from '../types'

export async function parseLanguage(args: CliArgs): Promise<string> {
  if (args['--template']) return args['--template']

  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Choose language',
      choices: [
        {
          title: 'javascript',
          value: 'js',
        },
        {
          title: 'typescript',
          value: 'ts',
        },
      ],
      validate: (value: string) => value.length,
    },
    {
      onCancel: () => {
        process.exit(0)
      },
    },
  )

  return response.value
}
