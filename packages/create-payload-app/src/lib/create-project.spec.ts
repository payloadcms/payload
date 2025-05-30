import { jest } from '@jest/globals'
import fs from 'fs'
import fse from 'fs-extra'
import globby from 'globby'
import * as os from 'node:os'
import path from 'path'

import type { CliArgs, DbType, ProjectExample, ProjectTemplate } from '../types.js'

import { createProject } from './create-project.js'
import { dbReplacements } from './replacements.js'
import { getValidTemplates } from './templates.js'
import { manageEnvFiles } from './manage-env-files.js'

describe('createProject', () => {
  let projectDir: string
  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log = jest.fn()
  })

  beforeEach(() => {
    const tempDirectory = fs.realpathSync(os.tmpdir())
    projectDir = `${tempDirectory}/${Math.random().toString(36).substring(7)}`
  })

  afterEach(() => {
    if (fse.existsSync(projectDir)) {
      fse.rmSync(projectDir, { recursive: true })
    }
  })

  describe('#createProject', () => {
    const args = {
      _: ['project-name'],
      '--db': 'mongodb',
      '--local-template': 'blank',
      '--no-deps': true,
    } as CliArgs
    const packageManager = 'yarn'

    it('creates plugin template', async () => {
      const projectName = 'plugin'
      const template: ProjectTemplate = {
        name: 'plugin',
        type: 'plugin',
        description: 'Template for creating a Payload plugin',
        url: 'https://github.com/payloadcms/payload/templates/plugin',
      }

      await createProject({
        cliArgs: { ...args, '--local-template': 'plugin' } as CliArgs,
        packageManager,
        projectDir,
        projectName,
        template,
      })

      const packageJsonPath = path.resolve(projectDir, 'package.json')
      const packageJson = fse.readJsonSync(packageJsonPath)

      // Check package name and description
      expect(packageJson.name).toStrictEqual(projectName)
    })

    it('creates example', async () => {
      const projectName = 'custom-server-example'
      const example: ProjectExample = {
        name: 'custom-server',
        url: 'https://github.com/payloadcms/payload/examples/custom-server#main',
      }

      await createProject({
        cliArgs: {
          ...args,
          '--local-template': undefined,
          '--local-example': 'custom-server',
        } as CliArgs,
        packageManager,
        projectDir,
        projectName,
        example,
      })

      const packageJsonPath = path.resolve(projectDir, 'package.json')
      const packageJson = fse.readJsonSync(packageJsonPath)

      // Check package name and description
      expect(packageJson.name).toStrictEqual(projectName)
    })

    describe('creates project from template', () => {
      const templates = getValidTemplates()

      it.each([
        ['blank', 'mongodb'],
        ['blank', 'postgres'],

        // TODO: Re-enable these once 3.0 is stable and templates updated
        // ['website', 'mongodb'],
        // ['website', 'postgres'],
        // ['ecommerce', 'mongodb'],
        // ['ecommerce', 'postgres'],
      ])('update config and deps: %s, %s', async (templateName, db) => {
        const projectName = 'starter-project'

        const template = templates.find((t) => t.name === templateName)

        const cliArgs = {
          ...args,
          '--db': db,
          '--local-template': templateName,
        } as CliArgs

        await createProject({
          cliArgs,
          dbDetails: {
            type: db as DbType,
            dbUri: `${db}://localhost:27017/create-project-test`,
          },
          packageManager,
          projectDir,
          projectName,
          template: template as ProjectTemplate,
        })

        const dbReplacement = dbReplacements[db as DbType]

        const packageJsonPath = path.resolve(projectDir, 'package.json')
        const packageJson = fse.readJsonSync(packageJsonPath)

        // Verify git was initialized
        expect(fse.existsSync(path.resolve(projectDir, '.git'))).toBe(true)

        // Should only have one db adapter
        expect(
          Object.keys(packageJson.dependencies).filter((n) => n.startsWith('@payloadcms/db-')),
        ).toHaveLength(1)

        const payloadConfigPath = (
          await globby('**/payload.config.ts', {
            absolute: true,
            cwd: projectDir,
          })
        )?.[0]

        const content = fse.readFileSync(payloadConfigPath, 'utf-8')

        // Check payload.config.ts
        expect(content).not.toContain('// database-adapter-import')
        expect(content).toContain(dbReplacement.importReplacement)

        expect(content).not.toContain('// database-adapter-config-start')
        expect(content).not.toContain('// database-adapter-config-end')
        expect(content).toContain(dbReplacement.configReplacement().join('\n'))
      })
    })

    describe('managing env files', () => {
      let envFilePath = ''
      let envExampleFilePath = ''

      beforeEach(() => {
        envFilePath = path.join(projectDir, '.env')
        envExampleFilePath = path.join(projectDir, '.env.example')

        if (fse.existsSync(envFilePath)) {
          fse.removeSync(envFilePath)
        }

        fse.ensureDirSync(projectDir)
      })

      it('generates .env using defaults (not from .env.example)', async () => {
        // ensure no .env.example exists so that the default values are used
        // the `manageEnvFiles` function will look for .env.example in the file system
        if (fse.existsSync(envExampleFilePath)) {
          fse.removeSync(envExampleFilePath)
        }

        await manageEnvFiles({
          cliArgs: {
            '--debug': true,
          } as CliArgs,
          databaseUri: '', // omitting this will ensure the default vars are used
          payloadSecret: '', // omitting this will ensure the default vars are used
          projectDir,
          template: undefined,
        })

        expect(fse.existsSync(envFilePath)).toBe(true)

        const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

        expect(updatedEnvContent).toBe(
          `# Added by Payload\nPAYLOAD_SECRET=YOUR_SECRET_HERE\nDATABASE_URI=your-connection-string-here`,
        )
      })

      it('generates .env from .env.example', async () => {
        // create or override the .env.example file with a connection string that will NOT be overridden
        fse.ensureFileSync(envExampleFilePath)
        fse.writeFileSync(
          envExampleFilePath,
          `DATABASE_URI=example-connection-string\nCUSTOM_VAR=custom-value\n`,
        )

        await manageEnvFiles({
          cliArgs: {
            '--debug': true,
          } as CliArgs,
          databaseUri: '', // omitting this will ensure the `.env.example` vars are used
          payloadSecret: '', // omitting this will ensure the `.env.example` vars are used
          projectDir,
          template: undefined,
        })

        expect(fse.existsSync(envFilePath)).toBe(true)

        const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

        expect(updatedEnvContent).toBe(
          `DATABASE_URI=example-connection-string\nCUSTOM_VAR=custom-value\nPAYLOAD_SECRET=YOUR_SECRET_HERE\n# Added by Payload`,
        )
      })

      it('updates existing .env without overriding vars', async () => {
        // create an existing .env file with some custom variables that should NOT be overridden
        fse.ensureFileSync(envFilePath)
        fse.writeFileSync(
          envFilePath,
          `CUSTOM_VAR=custom-value\nDATABASE_URI=example-connection-string\n`,
        )

        // create an .env.example file to ensure that its contents DO NOT override existing .env vars
        fse.ensureFileSync(envExampleFilePath)
        fse.writeFileSync(
          envExampleFilePath,
          `CUSTOM_VAR=custom-value-2\nDATABASE_URI=example-connection-string-2\n`,
        )

        await manageEnvFiles({
          cliArgs: {
            '--debug': true,
          } as CliArgs,
          databaseUri: '', // omitting this will ensure the `.env` vars are kept
          payloadSecret: '', // omitting this will ensure the `.env` vars are kept
          projectDir,
          template: undefined,
        })

        expect(fse.existsSync(envFilePath)).toBe(true)

        const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

        expect(updatedEnvContent).toBe(
          `# Added by Payload\nPAYLOAD_SECRET=YOUR_SECRET_HERE\nDATABASE_URI=example-connection-string\nCUSTOM_VAR=custom-value`,
        )
      })

      it('sanitizes .env based on selected database type', async () => {
        await manageEnvFiles({
          cliArgs: {
            '--debug': true,
          } as CliArgs,
          databaseType: 'mongodb', // this mimics the CLI selection and will be used as the DATABASE_URI
          databaseUri: 'mongodb://localhost:27017/test', // this mimics the CLI selection and will be used as the DATABASE_URI
          payloadSecret: 'test-secret', // this mimics the CLI selection and will be used as the PAYLOAD_SECRET
          projectDir,
          template: undefined,
        })

        const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

        expect(updatedEnvContent).toBe(
          `# Added by Payload\nPAYLOAD_SECRET=test-secret\nDATABASE_URI=mongodb://localhost:27017/test`,
        )

        // delete the generated .env file and do it again, but this time, omit the databaseUri to ensure the default is generated

        fse.removeSync(envFilePath)

        await manageEnvFiles({
          cliArgs: {
            '--debug': true,
          } as CliArgs,
          databaseType: 'mongodb', // this mimics the CLI selection and will be used as the DATABASE_URI
          databaseUri: '', // omit this to ensure the default is generated based on the selected database type
          payloadSecret: 'test-secret',
          projectDir,
          template: undefined,
        })

        const updatedEnvContentWithDefault = fse.readFileSync(envFilePath, 'utf-8')
        expect(updatedEnvContentWithDefault).toBe(
          `# Added by Payload\nPAYLOAD_SECRET=test-secret\nDATABASE_URI=mongodb://127.0.0.1/your-database-name`,
        )
      })
    })
  })
})
