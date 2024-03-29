import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import { detect } from 'detect-package-manager'
import globby from 'globby'
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
import { debug, error, log, success } from './utils/log.js'
import { helpMessage, successMessage, welcomeMessage } from './utils/messages.js'

export class Main {
  args: CliArgs

  constructor() {
    // @ts-expect-error bad typings
    this.args = arg(
      {
        '--db': String,
        '--db-accept-recommended': Boolean,
        '--db-connection-string': String,
        '--help': Boolean,
        '--local-template': String,
        '--name': String,
        '--secret': String,
        '--template': String,
        '--template-branch': String,

        // Next.js
        '--init-next': Boolean, // TODO: Is this needed if we detect if inside Next.js project?

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
    const initContext = {
      nextConfigPath: undefined,
    }

    try {
      if (this.args['--help']) {
        log(helpMessage())
        process.exit(0)
      }
      log(welcomeMessage)

      // Detect if inside Next.js project
      const foundConfig = (
        await globby('next.config.*js', { absolute: true, cwd: process.cwd() })
      )?.[0]
      initContext.nextConfigPath = foundConfig

      success('Next.js app detected.')

      // TODO: Prompt to continue

      if (initContext.nextConfigPath) {
        this.args['--name'] = slugify(path.basename(path.dirname(initContext.nextConfigPath)))
      }

      const projectName = await parseProjectName(this.args)
      const projectDir = foundConfig
        ? path.dirname(foundConfig)
        : path.resolve(process.cwd(), slugify(projectName))

      const packageManager = await getPackageManager(this.args, projectDir)
      debug(`Using package manager: ${packageManager}`)

      if (foundConfig) {
        const result = await initNext({ ...this.args, packageManager, projectDir })
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
          log(helpMessage())
          process.exit(1)
        }
      }

      const validTemplates = getValidTemplates()
      const template = await parseTemplate(this.args, validTemplates)

      switch (template.type) {
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
      log(successMessage(projectDir, packageManager))
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'An error occurred')
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
