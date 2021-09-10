import prompts from 'prompts'
import type { CliArgs } from '../types'

export async function getPayloadSecret(args: CliArgs): Promise<string> {
  if (args['--secret']) return args['--secret']

  const response = await prompts(
    {
      type: 'password',
      name: 'value',
      message: 'Enter a long, complex string for Payload’s encryption key',
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
