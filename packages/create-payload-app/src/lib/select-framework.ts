import * as p from '@clack/prompts'

import type { CliArgs, FrameworkType, ProjectTemplate } from '../types.js'

type FrameworkChoice = {
  description: string
  title: string
  value: FrameworkType
}

export const frameworkChoiceRecord: Record<FrameworkType, FrameworkChoice> = {
  next: {
    description: 'Next.js App Router (recommended)',
    title: 'Next.js',
    value: 'next',
  },
  'tanstack-start': {
    description: 'TanStack Start (experimental)',
    title: 'TanStack Start',
    value: 'tanstack-start',
  },
}

const validFrameworks = Object.keys(frameworkChoiceRecord) as FrameworkType[]

export async function selectFramework(
  args: CliArgs,
  template?: ProjectTemplate,
): Promise<FrameworkType> {
  if (args['--framework']) {
    const value = args['--framework'] as FrameworkType
    if (!validFrameworks.includes(value)) {
      throw new Error(`Invalid framework given. Valid values are: ${validFrameworks.join(', ')}`)
    }
    return value
  }

  if (template?.frameworkType) {
    return template.frameworkType
  }

  const framework = await p.select<{ label: string; value: FrameworkType }[], FrameworkType>({
    initialValue: 'next',
    message: `Select a framework`,
    options: Object.values(frameworkChoiceRecord).map((choice) => ({
      hint: choice.description,
      label: choice.title,
      value: choice.value,
    })),
  })

  if (p.isCancel(framework)) {
    process.exit(0)
  }

  return framework
}
