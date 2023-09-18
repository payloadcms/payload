import slugify from '@sindresorhus/slugify'
import arg from 'arg'
import commandExists from 'command-exists'
import { createProject } from './lib/create-project'
import { selectDb } from './lib/select-db'
import { generateSecret } from './lib/generate-secret'
import { parseProjectName } from './lib/parse-project-name'
import { parseTemplate } from './lib/parse-template'
import { getValidTemplates, validateTemplate } from './lib/templates'
import { writeEnvFile } from './lib/write-env-file'
import type { CliArgs } from './types'
import { success } from './utils/log'
import { helpMessage, successMessage, welcomeMessage } from './utils/messages'

export class Main {
  args: CliArgs

  constructor() {
    // @ts-expect-error bad typings
    this.args = arg(
      {
        '--help': Boolean,
        '--name': String,
        '--template': String,
        '--db': String,
        '--secret': String,
        '--use-npm': Boolean,
        '--no-deps': Boolean,
        '--dry-run': Boolean,
        '--beta': Boolean,

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
        console.log(await helpMessage())
        process.exit(0)
      }
      const templateArg = this.args['--template']
      if (templateArg) {
        const valid = await validateTemplate(templateArg)
        if (!valid) {
          console.log(await helpMessage())
          process.exit(1)
        }
      }

      console.log(welcomeMessage)
      const projectName = await parseProjectName(this.args)
      const validTemplates = await getValidTemplates()
      const template = await parseTemplate(this.args, validTemplates)

      const projectDir =
        projectName === '.' ? process.cwd() : `./${slugify(projectName)}`
      const packageManager = await getPackageManager(this.args)

      if (template.type !== 'plugin') {
        const dbChoice = await selectDb(this.args, projectName)
        const payloadSecret = await generateSecret()
        if (!this.args['--dry-run']) {
          await createProject({
            cliArgs: this.args,
            projectName,
            projectDir,
            template,
            packageManager,
          })
          await writeEnvFile({
            databaseUri: dbChoice.dbUri,
            payloadSecret,
            template,
            projectDir,
          })
        }
      } else {
        if (!this.args['--dry-run']) {
          await createProject({
            cliArgs: this.args,
            projectName,
            projectDir,
            template,
            packageManager,
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

async function getPackageManager(args: CliArgs): Promise<string> {
  let packageManager: string
  if (args['--use-npm']) {
    packageManager = 'npm'
  } else {
    try {
      await commandExists('yarn')
      packageManager = 'yarn'
    } catch (error: unknown) {
      packageManager = 'npm'
    }
  }
  return packageManager
}
