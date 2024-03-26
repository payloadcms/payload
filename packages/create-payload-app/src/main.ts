/* eslint-disable no-console */
import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import { detect } from 'detect-package-manager'
import path from 'path'

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
        '--template-branch': String,

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

      const projectName = await parseProjectName(this.args)
      const projectDir =
        projectName === '.' || this.args['--init-next']
          ? path.basename(process.cwd())
          : `./${slugify(projectName)}`

      console.log(welcomeMessage)
      const packageManager = await getPackageManager(this.args, projectDir)

      if (this.args['--init-next']) {
        const result = await initNext({ ...this.args, packageManager })
        if (!result.success) {
          error(result.reason || 'Failed to initialize Payload app in Next.js project')
        } else {
          success('Payload app successfully initialized in Next.js project')
        }
        process.exit(result.success ? 0 : 1)
        // TODO: This should continue the normal prompt flow
      }

      const templateArg = this.args['--template']
      if (templateArg) {
        const valid = validateTemplate(templateArg)
        if (!valid) {
          console.log(helpMessage())
          process.exit(1)
        }
      }

      const validTemplates = getValidTemplates()
      const template = await parseTemplate(this.args, validTemplates)

      switch (template.type) {
        case 'local':
        case 'starter': {
          const dbDetails = await selectDb(this.args, projectName)
          const payloadSecret = generateSecret()
          await createProject({
            cliArgs: this.args,
            dbDetails,
            packageManager,
            projectDir,
            projectName,
            template,
          })
          await writeEnvFile({
            cliArgs: this.args,
            databaseUri: dbDetails.dbUri,
            payloadSecret,
            projectDir,
            template,
          })
          break
        }
        case 'plugin': {
          await createProject({
            cliArgs: this.args,
            packageManager,
            projectDir,
            projectName,
            template,
          })
          break
        }
      }

      success('Payload project successfully created')
      console.log(successMessage(projectDir, packageManager))
    } catch (error: unknown) {
      console.log(error)
    }
  }
}

async function getPackageManager(args: CliArgs, projectDir: string): Promise<PackageManager> {
  let packageManager: PackageManager = 'npm'

  if (args['--use-npm']) {
    packageManager = 'npm'
  } else if (args['--use-yarn']) {
    packageManager = 'yarn'
  } else if (args['--use-pnpm']) {
    packageManager = 'pnpm'
  } else {
    const detected = await detect({ cwd: projectDir })
    packageManager = detected || 'npm'
  }
  return packageManager
}
