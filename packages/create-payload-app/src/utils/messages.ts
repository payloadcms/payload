import chalk from 'chalk'
import figures from 'figures'
import path from 'path'
import terminalLink from 'terminal-link'

import type { ProjectTemplate } from '../types'

import { getValidTemplates } from '../lib/templates'

const header = (message: string): string => `${chalk.yellow(figures.star)} ${chalk.bold(message)}`

export const welcomeMessage = chalk`
  {green Welcome to Payload. Let's create a project! }
`

const spacer = ' '.repeat(8)

export function helpMessage(): string {
  const validTemplates = getValidTemplates()
  return chalk`
  {bold USAGE}

      {dim $} {bold npx create-payload-app}
      {dim $} {bold npx create-payload-app} my-project
      {dim $} {bold npx create-payload-app} -n my-project -t blog

  {bold OPTIONS}

      -n     {underline my-payload-app}         Set project name
      -t     {underline template_name}          Choose specific template

        {dim Available templates: ${formatTemplates(validTemplates)}}

      --use-npm                     Use npm to install dependencies
      --use-yarn                    Use yarn to install dependencies
      --use-pnpm                    Use pnpm to install dependencies
      --use-bun                     Use bun to install dependencies
      --no-deps                     Do not install any dependencies
      -h                            Show help
`
}

function formatTemplates(templates: ProjectTemplate[]) {
  return `\n\n${spacer}${templates
    .map((t) => `${t.name}${' '.repeat(28 - t.name.length)}${t.description}`)
    .join(`\n${spacer}`)}`
}

export function successMessage(projectDir: string, packageManager: string): string {
  return `
  ${header('Launch Application:')}

    - cd ${projectDir}
    - ${
      packageManager === 'yarn' ? 'yarn' : 'npm run'
    } dev or follow directions in ${createTerminalLink(
      'README.md',
      `file://${path.resolve(projectDir, 'README.md')}`,
    )}

  ${header('Documentation:')}

    - ${createTerminalLink(
      'Getting Started',
      'https://payloadcms.com/docs/getting-started/what-is-payload',
    )}
    - ${createTerminalLink('Configuration', 'https://payloadcms.com/docs/configuration/overview')}

`
}

// Create terminalLink with fallback for unsupported terminals
function createTerminalLink(text: string, url: string) {
  return terminalLink(text, url, {
    fallback: (text, url) => `${text}: ${url}`,
  })
}
