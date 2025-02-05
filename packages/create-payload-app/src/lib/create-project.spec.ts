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
      it('updates .env files without overwriting existing data', async () => {
        const envFilePath = path.join(projectDir, '.env')
        const envExampleFilePath = path.join(projectDir, '.env.example')

        fse.ensureDirSync(projectDir)
        fse.ensureFileSync(envFilePath)
        fse.ensureFileSync(envExampleFilePath)

        const initialEnvContent = `CUSTOM_VAR=custom-value\nDATABASE_URI=old-connection\n`
        const initialEnvExampleContent = `CUSTOM_VAR=custom-value\nDATABASE_URI=old-connection\nPAYLOAD_SECRET=YOUR_SECRET_HERE\n`

        fse.writeFileSync(envFilePath, initialEnvContent)
        fse.writeFileSync(envExampleFilePath, initialEnvExampleContent)

        await manageEnvFiles({
          cliArgs: {
            '--debug': true,
          } as CliArgs,
          databaseType: 'mongodb',
          databaseUri: 'mongodb://localhost:27017/test',
          payloadSecret: 'test-secret',
          projectDir,
          template: undefined,
        })

        const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

        expect(updatedEnvContent).toContain('CUSTOM_VAR=custom-value')
        expect(updatedEnvContent).toContain('DATABASE_URI=mongodb://localhost:27017/test')
        expect(updatedEnvContent).toContain('PAYLOAD_SECRET=test-secret')

        const updatedEnvExampleContent = fse.readFileSync(envExampleFilePath, 'utf-8')

        expect(updatedEnvExampleContent).toContain('CUSTOM_VAR=custom-value')
        expect(updatedEnvContent).toContain('DATABASE_URI=mongodb://localhost:27017/test')
        expect(updatedEnvContent).toContain('PAYLOAD_SECRET=test-secret')
      })

      it('creates .env and .env.example if they do not exist', async () => {
        const envFilePath = path.join(projectDir, '.env')
        const envExampleFilePath = path.join(projectDir, '.env.example')

        fse.ensureDirSync(projectDir)

        if (fse.existsSync(envFilePath)) fse.removeSync(envFilePath)
        if (fse.existsSync(envExampleFilePath)) fse.removeSync(envExampleFilePath)

        await manageEnvFiles({
          cliArgs: {
            '--debug': true,
          } as CliArgs,
          databaseUri: '',
          payloadSecret: '',
          projectDir,
          template: undefined,
        })

        expect(fse.existsSync(envFilePath)).toBe(true)
        expect(fse.existsSync(envExampleFilePath)).toBe(true)

        const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')
        expect(updatedEnvContent).toContain('DATABASE_URI=your-connection-string-here')
        expect(updatedEnvContent).toContain('PAYLOAD_SECRET=YOUR_SECRET_HERE')

        const updatedEnvExampleContent = fse.readFileSync(envExampleFilePath, 'utf-8')
        expect(updatedEnvExampleContent).toContain('DATABASE_URI=your-connection-string-here')
        expect(updatedEnvExampleContent).toContain('PAYLOAD_SECRET=YOUR_SECRET_HERE')
      })
    })
  })
})
