/* eslint-disable no-console */
import path from 'path'
import terminalLink from 'terminal-link'

import type { PackageManager, ProjectTemplate } from '../types.js'

import { getValidTemplates } from '../lib/templates.js'
import { miniChalk } from './miniChalk.js'

const header = (message: string): string => miniChalk.bold(message)

export const welcomeMessage = `
  ${miniChalk.green("Welcome to Payload. Let's create a project! ")}
`

const spacer = ' '.repeat(8)

export function helpMessage(): void {
  const validTemplates = getValidTemplates()
  console.log(`
  ${miniChalk.bold('USAGE')}

      ${miniChalk.dim('Inside of an existing Next.js project')}

      ${miniChalk.dim('$')} ${miniChalk.bold('npx create-payload-app')}

      ${miniChalk.dim('Create a new project from scratch')}

      ${miniChalk.dim('$')} ${miniChalk.bold('npx create-payload-app')}
      ${miniChalk.dim('$')} ${miniChalk.bold('npx create-payload-app')} my-project
      ${miniChalk.dim('$')} ${miniChalk.bold('npx create-payload-app')} -n my-project -t template-name

  ${miniChalk.bold('OPTIONS')}

      -n     ${miniChalk.underline('my-payload-app')}         Set project name
      -t     ${miniChalk.underline('template_name')}          Choose specific template
      -e     ${miniChalk.underline('example_name')}           Choose specific example

        ${miniChalk.dim(`Available templates: ${formatTemplates(validTemplates)}`)}

      --use-npm                     Use npm to install dependencies
      --use-yarn                    Use yarn to install dependencies
      --use-pnpm                    Use pnpm to install dependencies
      --use-bun                     Use bun to install dependencies (experimental)
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
  - ${packageManager === 'npm' ? 'npm run' : packageManager} dev or follow directions in README.md

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
  const relativeAppDir = path.relative(process.cwd(), args.nextAppDir)
  return `
${header('Next Steps:')}

Payload does not support a top-level layout.tsx file in the app directory.

${miniChalk.bold('To continue:')}

- Create a new directory in ./${relativeAppDir} such as ./${relativeAppDir}/${miniChalk.bold('(app)')}
- Move all files from ./${relativeAppDir} into that directory

It is recommended to do this from your IDE if your app has existing file references.

Once moved, rerun the create-payload-app command again.
`
}

export function feedbackOutro(): string {
  return `${miniChalk.bgCyan(miniChalk.black(' Have feedback? '))} Visit us on ${createTerminalLink('GitHub', 'https://github.com/payloadcms/payload')}.`
}

// Create terminalLink with fallback for unsupported terminals
function createTerminalLink(text: string, url: string) {
  return terminalLink(text, url, {
    fallback: (text, url) => `${text}: ${url}`,
  })
}
