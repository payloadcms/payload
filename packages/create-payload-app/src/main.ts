import * as p from '@clack/prompts'
import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import chalk from 'chalk'
import figures from 'figures'
import path from 'path'

import type { CliArgs } from './types.js'

import { configurePayloadConfig } from './lib/configure-payload-config.js'
import { PACKAGE_VERSION } from './lib/constants.js'
import { createProject } from './lib/create-project.js'
import { parseExample } from './lib/examples.js'
import { generateSecret } from './lib/generate-secret.js'
import { getPackageManager } from './lib/get-package-manager.js'
import { getNextAppDetails, initNext } from './lib/init-next.js'
import { manageEnvFiles } from './lib/manage-env-files.js'
import { parseProjectName } from './lib/parse-project-name.js'
import { parseTemplate } from './lib/parse-template.js'
import { selectDb } from './lib/select-db.js'
import { getValidTemplates, validateTemplate } from './lib/templates.js'
import { updatePayloadInProject } from './lib/update-payload-in-project.js'
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

        // Next.js
        '--init-next': Boolean, // TODO: Is this needed if we detect if inside Next.js project?

        // Package manager
        '--no-deps': Boolean,
        '--use-bun': Boolean,
        '--use-npm': Boolean,
        '--use-pnpm': Boolean,
        '--use-yarn': Boolean,

        // Other
        '--no-git': Boolean,

        // Flags
        '--beta': Boolean,
        '--debug': Boolean,
        '--dry-run': Boolean,

        // Aliases
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
      if (this.args['--help']) {
        helpMessage()
        process.exit(0)
      }

      const debugFlag = this.args['--debug']

      // eslint-disable-next-line no-console
      console.log('\n')
      p.intro(chalk.bgCyan(chalk.black(' create-payload-app ')))
      p.note("Welcome to Payload. Let's create a project!")

      // Detect if inside Next.js project
      const nextAppDetails = await getNextAppDetails(process.cwd())
      const {
        hasTopLevelLayout,
        isPayloadInstalled,
        isSupportedNextVersion,
        nextAppDir,
        nextConfigPath,
        nextVersion,
      } = nextAppDetails

      if (nextConfigPath && !isSupportedNextVersion) {
        p.log.warn(
          `Next.js v${nextVersion} is unsupported. Next.js >= 15 is required to use Payload.`,
        )
        p.outro(feedbackOutro())
        process.exit(0)
      }

      // Upgrade Payload in existing project
      if (isPayloadInstalled && nextConfigPath) {
        p.log.warn(`Payload installation detected in current project.`)
        const shouldUpdate = await p.confirm({
          initialValue: false,
          message: chalk.bold(`Upgrade Payload in this project?`),
        })

        if (!p.isCancel(shouldUpdate) && shouldUpdate) {
          const { message, success: updateSuccess } = await updatePayloadInProject(nextAppDetails)
          if (updateSuccess) {
            info(message)
          } else {
            error(message)
          }
        }

        p.outro(feedbackOutro())
        process.exit(0)
      }

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
        const valid = validateTemplate(templateArg)
        if (!valid) {
          helpMessage()
          process.exit(1)
        }
      }

      const exampleArg = this.args['--example']

      if (exampleArg) {
        const example = await parseExample({
          name: exampleArg,
          branch: this.args['--branch'] ?? 'main',
        })

        if (!example) {
          helpMessage()
          process.exit(1)
        }

        await createProject({
          cliArgs: this.args,
          example,
          packageManager,
          projectDir,
          projectName,
        })
      }

      if (debugFlag) {
        debug(`Using ${exampleArg ? 'examples' : 'templates'} from git tag: v${PACKAGE_VERSION}`)
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
            await createProject({
              cliArgs: this.args,
              packageManager,
              projectDir,
              projectName,
              template,
            })
            break
          }
          case 'starter': {
            const dbDetails = await selectDb(this.args, projectName)

            await createProject({
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
    }
  }
}
