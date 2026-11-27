import * as p from '@clack/prompts'
import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import chalk from 'chalk'
import figures from 'figures'
import path from 'path'

import type { CliArgs } from './types.js'

import { configurePayloadConfig } from './lib/configure-payload-config.js'
import { createProject } from './lib/create-project.js'
import { parseExample } from './lib/examples.js'
import { generateSecret } from './lib/generate-secret.js'
import { getPackageManager } from './lib/get-package-manager.js'
import { getNextAppDetails, initNext } from './lib/init-next.js'
import { manageEnvFiles } from './lib/manage-env-files.js'
import { parseProjectName } from './lib/parse-project-name.js'
import { parseTemplate } from './lib/parse-template.js'
import { selectAgent } from './lib/select-agent.js'
import { selectDb } from './lib/select-db.js'
import { getValidTemplates, validateTemplate } from './lib/templates.js'
import { hasPayloadDependency, upgradeProject } from './lib/upgrade-project.js'
import { getLatestPackageVersion } from './utils/getLatestPackageVersion.js'
import { debug, error, info } from './utils/log.js'
import {
  feedbackOutro,
  helpMessage,
  moveMessage,
  successfulNextInit,
  successMessage,
} from './utils/messages.js'

export class Main {
  args: CliArgs

  constructor() {
    // @ts-expect-error bad typings
    this.args = arg(
      {
        '--agent': String,
        '--branch': String,
        '--db': String,
        '--db-accept-recommended': Boolean,
        '--db-connection-string': String,
        '--example': String,
        '--help': Boolean,
        '--local-template': String,
        '--name': String,
        '--secret': String,
        '--template': String,
        '--version': String, // Allows overriding the installed Payload version instead of installing the latest

        // Next.js
        '--init-next': Boolean, // TODO: Is this needed if we detect if inside Next.js project?

        // Agent
        '--no-agent': Boolean,

        // Package manager
        '--no-deps': Boolean,
        '--use-bun': Boolean,
        '--use-npm': Boolean,
        '--use-pnpm': Boolean,
        '--use-yarn': Boolean,

        // Other
        '--no-git': Boolean,
        '--payload-version': String,

        // Flags
        '--beta': Boolean,
        '--debug': Boolean,
        '--dry-run': Boolean,

        // Aliases
        '-a': '--agent',
        '-d': '--db',
        '-e': '--example',
        '-h': '--help',
        '-n': '--name',
        '-t': '--template',
      },
      { permissive: true },
    )
  }

  async init(): Promise<void> {
    try {
      const debugFlag = this.args['--debug']
      const hasCreationArgs = Boolean(
        this.args['--name'] ||
          this.args._[0] ||
          this.args['--template'] ||
          this.args['--example'] ||
          this.args['--local-template'] ||
          this.args['--local-example'],
      )

      // Set DEBUG env var for logger utility
      if (debugFlag) {
        process.env.DEBUG = 'true'
      }

      if (this.args['--help']) {
        helpMessage()
        process.exit(0)
      }

      // eslint-disable-next-line no-console
      console.log('\n')
      p.intro(chalk.bgCyan(chalk.black(' create-payload-app ')))
      p.note("Welcome to Payload. Let's create a project!")

      // Detect if inside Next.js project
      const nextAppDetails = await getNextAppDetails(process.cwd())
      const isCreatingProject =
        hasCreationArgs && hasPayloadDependency({ projectDir: process.cwd() })
      const { hasTopLevelLayout, isSupportedNextVersion, nextAppDir, nextVersion } = nextAppDetails
      const nextConfigPath = isCreatingProject ? undefined : nextAppDetails.nextConfigPath

      const projectDirForUpgrade = nextConfigPath ? path.dirname(nextConfigPath) : process.cwd()
      if (!isCreatingProject && hasPayloadDependency({ projectDir: projectDirForUpgrade })) {
        await upgradeProject({
          cliArgs: this.args,
          nextAppDetails: nextConfigPath ? nextAppDetails : undefined,
          projectDir: projectDirForUpgrade,
        })
        p.outro(feedbackOutro())
        return
      }

      if (nextConfigPath && !isSupportedNextVersion) {
        p.log.warn(
          `Next.js v${nextVersion} is unsupported. Next.js >= 15 is required to use Payload.`,
        )
        p.outro(feedbackOutro())
        process.exit(0)
      }

      const LATEST_VERSION = await getLatestPackageVersion({
        debug: debugFlag,
        packageName: 'payload',
      })

      if (nextConfigPath) {
        this.args['--name'] = slugify(path.basename(path.dirname(nextConfigPath)))
      }

      const projectName = await parseProjectName(this.args)
      const projectDir = nextConfigPath
        ? path.dirname(nextConfigPath)
        : path.resolve(process.cwd(), slugify(projectName))

      const packageManager = await getPackageManager({ cliArgs: this.args, projectDir })

      if (nextConfigPath) {
        p.log.step(
          chalk.bold(`${chalk.bgBlack(` ${figures.triangleUp} Next.js `)} project detected!`),
        )

        const proceed = await p.confirm({
          initialValue: true,
          message: chalk.bold(`Install ${chalk.green('Payload')} in this project?`),
        })
        if (p.isCancel(proceed) || !proceed) {
          p.outro(feedbackOutro())
          process.exit(0)
        }

        // Check for top-level layout.tsx
        if (nextAppDir && hasTopLevelLayout) {
          p.log.warn(moveMessage({ nextAppDir, projectDir }))
          p.outro(feedbackOutro())
          process.exit(0)
        }

        const dbDetails = await selectDb(this.args, projectName)

        const result = await initNext({
          ...this.args,
          dbType: dbDetails.type,
          nextAppDetails,
          packageManager,
          projectDir,
        })

        if (result.success === false) {
          p.outro(feedbackOutro())
          process.exit(1)
        }

        await configurePayloadConfig({
          dbType: dbDetails?.type,
          projectDirOrConfigPath: {
            payloadConfigPath: result.payloadConfigPath,
          },
        })

        await manageEnvFiles({
          cliArgs: this.args,
          databaseType: dbDetails.type,
          databaseUri: dbDetails.dbUri,
          payloadSecret: generateSecret(),
          projectDir,
        })

        info('Payload project successfully initialized!')
        p.note(successfulNextInit(), chalk.bgGreen(chalk.black(' Documentation ')))
        p.outro(feedbackOutro())
        return
      }

      const templateArg = this.args['--template']
      if (templateArg) {
        const valid = validateTemplate({ templateName: templateArg })
        if (!valid) {
          helpMessage()
          process.exit(1)
        }
      }

      const exampleArg = this.args['--example']

      if (exampleArg) {
        const example = await parseExample({
          name: exampleArg,
          branch: this.args['--branch'] ?? '3.x',
        })

        if (!example) {
          helpMessage()
          process.exit(1)
        }

        const agentType = await selectAgent({ cliArgs: this.args })

        await createProject({
          agentType,
          cliArgs: this.args,
          example,
          packageManager,
          projectDir,
          projectName,
        })
      }

      if (debugFlag) {
        debug(`Using ${exampleArg ? 'examples' : 'templates'} from git tag: v${LATEST_VERSION}`)
      }

      if (!exampleArg) {
        const validTemplates = getValidTemplates()
        const template = await parseTemplate(this.args, validTemplates)
        if (!template) {
          p.log.error('Invalid template given')
          p.outro(feedbackOutro())
          process.exit(1)
        }

        switch (template.type) {
          case 'plugin': {
            const agentType = await selectAgent({ cliArgs: this.args })
            await createProject({
              agentType,
              cliArgs: this.args,
              packageManager,
              projectDir,
              projectName,
              template,
            })
            break
          }
          case 'starter': {
            const dbDetails = await selectDb(this.args, projectName, template)
            const agentType = await selectAgent({ cliArgs: this.args })

            await createProject({
              agentType,
              cliArgs: this.args,
              dbDetails,
              packageManager,
              projectDir,
              projectName,
              template,
            })

            break
          }
        }
      }

      info('Payload project successfully created!')
      p.log.step(chalk.bgGreen(chalk.black(' Next Steps ')))
      p.log.message(successMessage(projectDir, packageManager))
      p.outro(feedbackOutro())
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'An error occurred')
      process.exitCode = 1
    }
  }
}
