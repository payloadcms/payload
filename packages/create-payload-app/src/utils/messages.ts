/* eslint-disable no-console */
import chalk from 'chalk'
import path from 'path'
import terminalLink from 'terminal-link'

import type { ProjectTemplate } from '../types.js'
import type { PackageManager } from '../types.js'

import { getValidTemplates } from '../lib/templates.js'

const header = (message: string): string => chalk.bold(message)

export const welcomeMessage = chalk`
  {green Welcome to Payload. Let's create a project! }
`

const spacer = ' '.repeat(8)

export function helpMessage(): void {
  const validTemplates = getValidTemplates()
  console.log(chalk`
  {bold USAGE}

      {dim $} {bold npx create-payload-app}
      {dim $} {bold npx create-payload-app} my-project
      {dim $} {bold npx create-payload-app} -n my-project -t template-name

  {bold OPTIONS}

      -n     {underline my-payload-app}         Set project name
      -t     {underline template_name}          Choose specific template

        {dim Available templates: ${formatTemplates(validTemplates)}}

      --use-npm                     Use npm to install dependencies
      --use-yarn                    Use yarn to install dependencies
      --use-pnpm                    Use pnpm to install dependencies
      --no-deps                     Do not install any dependencies
      -h                            Show help
`)
}

function formatTemplates(templates: ProjectTemplate[]) {
  return `\n\n${spacer}${templates
    .map((t) => `${t.name}${' '.repeat(28 - t.name.length)}${t.description}`)
    .join(`\n${spacer}`)}`
}

export function successMessage(projectDir: string, packageManager: PackageManager): string {
  const relativePath = path.relative(process.cwd(), projectDir)
  return `
${header('Launch Application:')}

  - cd ./${relativePath}
  - ${
    packageManager === 'npm' ? 'npm run' : packageManager
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

export function successfulNextInit(): string {
  return `- ${createTerminalLink(
    'Getting Started',
    'https://payloadcms.com/docs/getting-started/what-is-payload',
  )}
- ${createTerminalLink('Configuration', 'https://payloadcms.com/docs/configuration/overview')}
`
}

export function moveMessage(args: { nextAppDir: string; projectDir: string }): string {
  const relativePath = path.relative(process.cwd(), args.nextAppDir)
  return `
${header('Next Steps:')}

Payload does not support a top-level layout.tsx file in your Next.js app directory.

${chalk.bold('To continue:')}

Move all files from ./${relativePath} to a named directory such as ${chalk.bold('(app)')}

Once moved, rerun the create-payload-app command again.
`
}

export function feedbackOutro(): string {
  return `${chalk.bgCyan(chalk.black(' Have feedback? '))} Visit ${createTerminalLink('GitHub', 'https://github.com/payloadcms/payload')}`
}

// Create terminalLink with fallback for unsupported terminals
function createTerminalLink(text: string, url: string) {
  return terminalLink(text, url, {
    fallback: (text, url) => `${text}: ${url}`,
  })
}
