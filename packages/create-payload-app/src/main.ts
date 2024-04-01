import * as p from '@clack/prompts'
import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import chalk from 'chalk'
import { detect } from 'detect-package-manager'
import globby from 'globby'
import path from 'path'

import type { CliArgs, PackageManager } from './types.js'

import { configurePayloadConfig } from './lib/configure-payload-config.js'
import { createProject } from './lib/create-project.js'
import { generateSecret } from './lib/generate-secret.js'
import { initNext } from './lib/init-next.js'
import { parseProjectName } from './lib/parse-project-name.js'
import { parseTemplate } from './lib/parse-template.js'
import { selectDb } from './lib/select-db.js'
import { getValidTemplates, validateTemplate } from './lib/templates.js'
import { writeEnvFile } from './lib/write-env-file.js'
import { error, info } from './utils/log.js'
import { feedbackOutro, helpMessage, successMessage, successfulNextInit } from './utils/messages.js'

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
    const initContext: {
      nextConfigPath: string | undefined
    } = {
      nextConfigPath: undefined,
    }

    try {
      if (this.args['--help']) {
        helpMessage()
        process.exit(0)
      }

      // eslint-disable-next-line no-console
      console.log('\n')
      p.intro(chalk.bgCyan(chalk.black(' create-payload-app ')))
      p.log.message("Welcome to Payload. Let's create a project!")
      // Detect if inside Next.js projeckpt
      const nextConfigPath = (
        await globby('next.config.*js', { absolute: true, cwd: process.cwd() })
      )?.[0]
      initContext.nextConfigPath = nextConfigPath

      if (initContext.nextConfigPath) {
        this.args['--name'] = slugify(path.basename(path.dirname(initContext.nextConfigPath)))
      }

      const projectName = await parseProjectName(this.args)
      const projectDir = nextConfigPath
        ? path.dirname(nextConfigPath)
        : path.resolve(process.cwd(), slugify(projectName))

      const packageManager = await getPackageManager(this.args, projectDir)

      if (nextConfigPath) {
        // p.note('Detected existing Next.js project.')
        p.log.step(chalk.bold('Detected existing Next.js project.'))
        const proceed = await p.confirm({
          initialValue: true,
          message: 'Install Payload in this project?',
        })
        if (p.isCancel(proceed) || !proceed) {
          process.exit(0)
        }

        const dbDetails = await selectDb(this.args, projectName)

        const result = await initNext({
          ...this.args,
          dbType: dbDetails.type,
          nextConfigPath,
          packageManager,
          projectDir,
        })

        if (result.success === false) {
          process.exit(1)
        }

        await configurePayloadConfig({
          dbDetails,
          projectDirOrConfigPath: {
            payloadConfigPath: result.payloadConfigPath,
          },
        })

        info('Payload project successfully created!')
        p.note(successfulNextInit(), chalk.bgGreen(chalk.black(' Documentation ')))
        p.outro(feedbackOutro())
        return
      }

      const templateArg = this.args['--template']
      if (templateArg) {
        const valid = validateTemplate(templateArg)
        if (!valid) {
          helpMessage()
          process.exit(1)
        }
      }

      const validTemplates = getValidTemplates()
      const template = await parseTemplate(this.args, validTemplates)
      if (!template) {
        p.log.error('Invalid template given')
        process.exit(1)
      }

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

      info('Payload project successfully created!')
      p.note(successMessage(projectDir, packageManager), chalk.bgGreen(chalk.black(' Next Steps ')))
      p.outro(feedbackOutro())
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
