import prompts from 'prompts'
import type { CliArgs, ProjectTemplate } from '../types'
import { setTags } from '../utils/usage'

export async function parseTemplate(
  args: CliArgs,
  validTemplates: ProjectTemplate[],
  language: string,
): Promise<ProjectTemplate> {
  if (args['--template']) {
    const templateName = args['--template']
    const template = validTemplates.find(template => template.name === templateName)
    if (!template) throw new Error('Invalid template given')
    setTags({ template: template.name })
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
  setTags({ template: template.name })

  return template
}
