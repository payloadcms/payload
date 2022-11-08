import prompts from 'prompts'
import slugify from '@sindresorhus/slugify'
import type { CliArgs } from '../types'

export async function getDatabaseConnection(
  args: CliArgs,
  projectName: string,
): Promise<string> {
  if (args['--db']) return args['--db']

  const response = await prompts(
    {
      type: 'text',
      name: 'value',
      message: 'Enter MongoDB connection',
      initial: `mongodb://localhost/${
        projectName === '.'
          ? `payload-${getRandomDigitSuffix()}`
          : slugify(projectName)
      }`,
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

function getRandomDigitSuffix(): string {
  return (Math.random() * Math.pow(10, 6)).toFixed(0)
}
