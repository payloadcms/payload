import slugify from '@sindresorhus/slugify'
import arg from 'arg'

import type { CliArgs, PackageManager } from './types'

import { createProject } from './lib/create-project'
import { generateSecret } from './lib/generate-secret'
import { parseProjectName } from './lib/parse-project-name'
import { parseTemplate } from './lib/parse-template'
import { selectDb } from './lib/select-db'
import { getValidTemplates, validateTemplate } from './lib/templates'
import { writeEnvFile } from './lib/write-env-file'
import { success } from './utils/log'
import { helpMessage, successMessage, welcomeMessage } from './utils/messages'

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

        // Package manager
        '--no-deps': Boolean,
        '--use-npm': Boolean,
        '--use-pnpm': Boolean,
        '--use-yarn': Boolean,

        // Flags
        '--beta': Boolean,
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
      const packageManager = getPackageManager(this.args)

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

function getPackageManager(args: CliArgs): PackageManager {
  let packageManager: PackageManager = 'npm'

  if (args['--use-npm']) {
    packageManager = 'npm'
  } else if (args['--use-yarn']) {
    packageManager = 'yarn'
  } else if (args['--use-pnpm']) {
    packageManager = 'pnpm'
  } else {
    packageManager = getEnvironmentPackageManager()
  }

  return packageManager
}

function getEnvironmentPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || ''

  if (userAgent.startsWith('yarn')) {
    return 'yarn'
  }

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm'
  }

  return 'npm'
}
