import * as p from '@clack/prompts'

import type { CliArgs, ProjectTemplate } from '../types.js'

export async function parseTemplate(
  args: CliArgs,
  validTemplates: ProjectTemplate[],
): Promise<ProjectTemplate | undefined> {
  if (args['--template']) {
    const templateName = args['--template']
    const template = validTemplates.find((t) => t.name === templateName)
    if (!template) {
      throw new Error('Invalid template given')
    }
    return template
  }

  const response = await p.select<{ label: string; value: string }[], string>({
    message: 'Choose project template',
    options: validTemplates.map((p) => {
      return {
        label: p.name,
        value: p.name,
      }
    }),
  })
  if (p.isCancel(response)) {
    process.exit(0)
  }

  const template = validTemplates.find((t) => t.name === response)

  return template
}
