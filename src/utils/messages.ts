import chalk from 'chalk'
import figures from 'figures'
import terminalLink from 'terminal-link'
import { getValidTemplates } from '../lib/templates'

const header = (message: string) =>
  chalk.yellow(figures.star) + ' ' + chalk.bold(message)

export const welcomeMessage = chalk`
  {green Welcome to Payload. Let's create a project! }
`

export async function helpMessage(): Promise<string> {
  const validTemplates = await getValidTemplates()
  return chalk`
  {bold USAGE}

      {dim $} {bold npx create-payload-app}

  {bold OPTIONS}

      --name {underline my-payload-app}              Set project name
      --template {underline template_name}           Choose specific template

        {dim Available templates: ${validTemplates.join(', ')}}

      --use-npm                          Use npm to install dependencies
      --no-deps                          Do not install any dependencies
      --help                             Show help
`
}

export function successMessage(projectDir: string, packageManager: string): string {
  return `
  ${header('Launch Application:')}

    - cd ${projectDir}
    - ${packageManager === 'yarn' ? 'yarn' : 'npm run'} dev

  ${header('Documentation:')}

    - ${terminalLink(
      'Getting Started',
      'https://payloadcms.com/docs/getting-started/what-is-payload',
    )}
    - ${terminalLink(
      'Configuration',
      'https://payloadcms.com/docs/configuration/overview',
    )}

`
}
