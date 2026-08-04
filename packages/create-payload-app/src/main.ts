import * as p from '@clack/prompts'
import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import chalk from 'chalk'
import figures from 'figures'
import path from 'path'

import type {
  CliArgs,
  NextAppDetails,
  TanStackAppDetails,
  TanStackDetectionResult,
} from './types.js'

import { configurePayloadConfig } from './lib/configure-payload-config.js'
import { createProject } from './lib/create-project.js'
import { parseExample } from './lib/examples.js'
import { generateSecret } from './lib/generate-secret.js'
import { getPackageManager } from './lib/get-package-manager.js'
import { getNextAppDetails, initNext } from './lib/init-next.js'
import { initTanStack } from './lib/init-tanstack.js'
import { manageEnvFiles } from './lib/manage-env-files.js'
import { parseProjectName } from './lib/parse-project-name.js'
import { parseTemplate } from './lib/parse-template.js'
import { selectAgent } from './lib/select-agent.js'
import { selectDb } from './lib/select-db.js'
import { getTanStackAppDetails } from './lib/tanstack/detect.js'
import { getValidTemplates, validateTemplate } from './lib/templates.js'
import {
  updatePayloadInNextProject,
  updatePayloadInTanStackProject,
} from './lib/update-payload-in-project.js'
import { debug, error, info } from './utils/log.js'
import {
  feedbackOutro,
  helpMessage,
  moveMessage,
  successfulNextInit,
  successfulTanStackInit,
  successMessage,
} from './utils/messages.js'
import {
  DEFAULT_PAYLOAD_VERSION_TAG,
  resolvePackageVersion,
} from './utils/resolvePackageVersion.js'

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
        '--payload-version': String, // Install a specific Payload version or npm dist-tag (e.g. 3.40.0 or canary; default: canary)
        '--secret': String,
        '--template': String,

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

      // Set DEBUG env var for logger utility
      if (debugFlag) {
        process.env.DEBUG = 'true'
      }

      const LATEST_VERSION = await resolvePackageVersion({
        debug: debugFlag,
        packageName: 'payload',
        versionOrTag: this.args['--payload-version'] ?? DEFAULT_PAYLOAD_VERSION_TAG,
      })

      if (this.args['--help']) {
        helpMessage()
        process.exit(0)
      }

      // eslint-disable-next-line no-console
      console.log('\n')
      p.intro(chalk.bgCyan(chalk.black(' create-payload-app ')))
      p.note("Welcome to Payload. Let's create a project!")

      const tanStackDetection = await getTanStackAppDetails({ projectDir: process.cwd() })
      const nextAppDetails = await getNextAppDetails(process.cwd())
      const existingHost = resolveExistingHost({ nextAppDetails, tanStackDetection })

      if (existingHost.kind === 'ambiguous') {
        p.log.warn(
          'Both Next.js and TanStack project markers were detected. Remove one framework before installing Payload.',
        )
        p.outro(feedbackOutro())
        return
      }

      if (existingHost.kind === 'unsupported-tanstack') {
        p.log.warn(existingHost.reason)
        p.outro(feedbackOutro())
        return
      }

      if (existingHost.kind === 'next' && !existingHost.appDetails.isSupportedNextVersion) {
        p.log.warn(
          `Next.js v${existingHost.appDetails.nextVersion} is unsupported. Next.js >= 15 is required to use Payload.`,
        )
        p.outro(feedbackOutro())
        process.exit(0)
      }

      const hasPayload = existingHost.kind !== 'none' && existingHost.appDetails.isPayloadInstalled

      if (hasPayload) {
        p.log.warn(`Payload installation detected in current project.`)
        const shouldUpdate = await p.confirm({
          initialValue: false,
          message: chalk.bold(`Upgrade Payload in this project?`),
        })

        if (!p.isCancel(shouldUpdate) && shouldUpdate) {
          const versionOrTag = this.args['--payload-version'] ?? DEFAULT_PAYLOAD_VERSION_TAG
          const updateResult =
            existingHost.kind === 'next'
              ? await updatePayloadInNextProject({
                  appDetails: existingHost.appDetails,
                  versionOrTag,
                })
              : await updatePayloadInTanStackProject({
                  appDetails: existingHost.appDetails,
                  versionOrTag,
                })

          const { message, success: updateSuccess } = updateResult
          if (updateSuccess) {
            info(message)
          } else {
            error(message)
          }
        }

        p.outro(feedbackOutro())
        return
      }

      if (existingHost.kind === 'next') {
        this.args['--name'] = slugify(
          path.basename(path.dirname(existingHost.appDetails.nextConfigPath!)),
        )
      } else if (existingHost.kind === 'tanstack') {
        this.args['--name'] = slugify(path.basename(existingHost.appDetails.projectDir))
      }

      const projectName = await parseProjectName(this.args)
      let projectDir: string
      if (existingHost.kind === 'next') {
        projectDir = path.dirname(existingHost.appDetails.nextConfigPath!)
      } else if (existingHost.kind === 'tanstack') {
        projectDir = existingHost.appDetails.projectDir
      } else {
        projectDir = path.resolve(process.cwd(), slugify(projectName))
      }

      const packageManager = await getPackageManager({ cliArgs: this.args, projectDir })

      if (existingHost.kind === 'next') {
        const { hasTopLevelLayout, nextAppDir } = existingHost.appDetails

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
          nextAppDetails: existingHost.appDetails,
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

      if (existingHost.kind === 'tanstack') {
        const frameworkName =
          existingHost.appDetails.kind === 'start' ? 'TanStack Start' : 'TanStack Router'
        p.log.step(chalk.bold(`${chalk.bgBlack(` ${frameworkName} `)} project detected!`))

        const proceed = await p.confirm({
          initialValue: true,
          message: chalk.bold(
            existingHost.appDetails.kind === 'start'
              ? 'Install Payload in this TanStack Start project?'
              : 'Convert this project to TanStack Start and install Payload?',
          ),
        })
        if (p.isCancel(proceed) || !proceed) {
          p.outro(feedbackOutro())
          process.exit(0)
        }

        const dbDetails = await selectDb(this.args, projectName)
        const result = await initTanStack({
          ...this.args,
          appDetails: existingHost.appDetails,
          dbType: dbDetails.type,
          packageManager,
          projectDir,
        })

        if (result.success === false) {
          p.log.error(result.reason)
          p.outro(feedbackOutro())
          process.exit(1)
        }

        await configurePayloadConfig({
          dbType: dbDetails.type,
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
        p.note(successfulTanStackInit(), chalk.bgGreen(chalk.black(' TanStack Start initialized ')))
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
          branch: this.args['--branch'] ?? 'main',
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
    }
  }
}

type ExistingHost =
  | { appDetails: NextAppDetails; kind: 'next' }
  | { appDetails: TanStackAppDetails; kind: 'tanstack' }
  | { kind: 'ambiguous' }
  | { kind: 'none' }
  | { kind: 'unsupported-tanstack'; reason: string }

export function resolveExistingHost({
  nextAppDetails,
  tanStackDetection,
}: {
  nextAppDetails: NextAppDetails
  tanStackDetection: TanStackDetectionResult
}): ExistingHost {
  if (nextAppDetails.nextConfigPath && tanStackDetection.detected) {
    return { kind: 'ambiguous' }
  }

  if (nextAppDetails.nextConfigPath) {
    return { appDetails: nextAppDetails, kind: 'next' }
  }

  if (!tanStackDetection.detected) {
    return { kind: 'none' }
  }

  if (!tanStackDetection.compatible) {
    return { kind: 'unsupported-tanstack', reason: tanStackDetection.reason }
  }

  return { appDetails: tanStackDetection.details, kind: 'tanstack' }
}
