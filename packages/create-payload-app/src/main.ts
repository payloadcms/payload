/* eslint-disable no-console */
import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import commandExists from 'command-exists'

import type { CliArgs, PackageManager } from './types.js'

import { createProject } from './lib/create-project.js'
import { generateSecret } from './lib/generate-secret.js'
import { initNext } from './lib/init-next.js'
import { parseProjectName } from './lib/parse-project-name.js'
import { parseTemplate } from './lib/parse-template.js'
import { selectDb } from './lib/select-db.js'
import { getValidTemplates, validateTemplate } from './lib/templates.js'
import { writeEnvFile } from './lib/write-env-file.js'
import { error, success } from './utils/log.js'
import { helpMessage, successMessage, welcomeMessage } from './utils/messages.js'

export class Main {
  args: CliArgs

  constructor() {
    // @ts-expect-error bad typings
    this.args = arg(
      {
        '--db': String,
        '--help': Boolean,
        '--name': String,
        '--secret': String,
        '--template': String,

        // Next.js
        '--init-next': Boolean,

        // Package manager
        '--no-deps': Boolean,
        '--use-npm': Boolean,
        '--use-pnpm': Boolean,
        '--use-yarn': Boolean,

        // Flags
        '--beta': Boolean,
        '--debug': Boolean,
        '--dry-run': Boolean,

        // Aliases
        '-d': '--db',
        '-h': '--help',
        '-n': '--name',
        '-t': '--template',
      },
      { permissive: true },
    )
  }

  async init(): Promise<void> {
    try {
      if (this.args['--help']) {
        console.log(helpMessage())
        process.exit(0)
      }

      if (this.args['--init-next']) {
        const result = await initNext(this.args)
        if (!result.success) {
          error(result.reason || 'Failed to initialize Payload app in Next.js project')
        } else {
          success('Payload app successfully initialized in Next.js project')
        }
        process.exit(result.success ? 0 : 1)
      }

      const templateArg = this.args['--template']
      if (templateArg) {
        const valid = validateTemplate(templateArg)
        if (!valid) {
          console.log(helpMessage())
          process.exit(1)
        }
      }

      console.log(welcomeMessage)
      const projectName = await parseProjectName(this.args)
      const validTemplates = getValidTemplates()
      const template = await parseTemplate(this.args, validTemplates)

      const projectDir = projectName === '.' ? process.cwd() : `./${slugify(projectName)}`
      const packageManager = await getPackageManager(this.args)

      if (template.type !== 'plugin') {
        const dbDetails = await selectDb(this.args, projectName)
        const payloadSecret = generateSecret()
        if (!this.args['--dry-run']) {
          await createProject({
            cliArgs: this.args,
            dbDetails,
            packageManager,
            projectDir,
            projectName,
            template,
          })
          await writeEnvFile({
            databaseUri: dbDetails.dbUri,
            payloadSecret,
            projectDir,
            template,
          })
        }
      } else {
        if (!this.args['--dry-run']) {
          await createProject({
            cliArgs: this.args,
            packageManager,
            projectDir,
            projectName,
            template,
          })
        }
      }

      success('Payload project successfully created')
      console.log(successMessage(projectDir, packageManager))
    } catch (error: unknown) {
      console.log(error)
    }
  }
}

async function getPackageManager(args: CliArgs): Promise<PackageManager> {
  let packageManager: PackageManager = 'npm'

  if (args['--use-npm']) {
    packageManager = 'npm'
  } else if (args['--use-yarn']) {
    packageManager = 'yarn'
  } else if (args['--use-pnpm']) {
    packageManager = 'pnpm'
  } else {
    try {
      if (await commandExists('yarn')) {
        packageManager = 'yarn'
      } else if (await commandExists('pnpm')) {
        packageManager = 'pnpm'
      }
    } catch (error: unknown) {
      packageManager = 'npm'
    }
  }
  return packageManager
}
