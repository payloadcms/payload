import prompts from 'prompts'
import type { CliArgs, ProjectTemplate } from '../types'

export async function parseTemplate(
  args: CliArgs,
  validTemplates: ProjectTemplate[],
  language: string,
): Promise<ProjectTemplate> {
  if (args['--template']) {
    const templateName = args['--template']
    const template = validTemplates.find(t => t.name === templateName)
    if (!template) throw new Error('Invalid template given')
    return template
  }

  const filteredTemplates = validTemplates
    .filter(d => d.name.startsWith(language))
    .map(t => t.name.replace(`${language}-`, ''))

  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Choose project template',
      choices: filteredTemplates.map(p => {
        return { title: p, value: `${language}-${p}` }
      }),
      validate: (value: string) => value.length,
    },
    {
      onCancel: () => {
        process.exit(0)
      },
    },
  )

  // const template = `${language}-${response.value}`
  const template = validTemplates.find(t => t.name === response.value)
  if (!template) throw new Error('Template is undefined')

  return template
}
