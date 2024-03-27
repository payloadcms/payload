import fse from 'fs-extra'
import path from 'path'
import type { CliArgs, DbType, ProjectTemplate } from '../types.js'
import { createProject } from './create-project.js'
import { fileURLToPath } from 'node:url'
import { dbReplacements } from './packages.js'
import { getValidTemplates } from './templates.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const projectDir = path.resolve(dirname, './tmp')
describe('createProject', () => {
  beforeAll(() => {
    console.log = jest.fn()
  })

  beforeEach(() => {
    if (fse.existsSync(projectDir)) {
      fse.rmdirSync(projectDir, { recursive: true })
    }
  })
  afterEach(() => {
    if (fse.existsSync(projectDir)) {
      fse.rmSync(projectDir, { recursive: true })
    }
  })

  describe('#createProject', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
        url: 'https://github.com/payloadcms/payload-plugin-template',
        description: 'Template for creating a Payload plugin',
      }
      await createProject({
        cliArgs: args,
        projectName,
        projectDir,
        template,
        packageManager,
      })

      const packageJsonPath = path.resolve(projectDir, 'package.json')
      const packageJson = fse.readJsonSync(packageJsonPath)

      // Check package name and description
      expect(packageJson.name).toEqual(projectName)
    })

    describe('creates project from template', () => {
      const templates = getValidTemplates()

      it.each([
        ['blank-3.0', 'mongodb'],
        ['blank-3.0', 'postgres'],

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
          projectName,
          projectDir,
          template: template as ProjectTemplate,
          packageManager,
          dbDetails: {
            dbUri: `${db}://localhost:27017/create-project-test`,
            type: db as DbType,
          },
        })

        const dbReplacement = dbReplacements[db as DbType]

        const packageJsonPath = path.resolve(projectDir, 'package.json')
        const packageJson = fse.readJsonSync(packageJsonPath)

        // Should only have one db adapter
        expect(
          Object.keys(packageJson.dependencies).filter((n) => n.startsWith('@payloadcms/db-')),
        ).toHaveLength(1)

        let payloadConfigPath = path.resolve(projectDir, 'payload.config.ts')

        // Website and ecommerce templates have payload.config.ts in src/payload
        if (!fse.existsSync(payloadConfigPath)) {
          payloadConfigPath = path.resolve(projectDir, 'src/payload/payload.config.ts')
        }
        const content = fse.readFileSync(payloadConfigPath, 'utf-8')

        // Check payload.config.ts
        expect(content).not.toContain('// database-adapter-import')
        expect(content).toContain(dbReplacement.importReplacement)

        expect(content).not.toContain('// database-adapter-config-start')
        expect(content).not.toContain('// database-adapter-config-end')
        expect(content).toContain(dbReplacement.configReplacement.join('\n'))
      })
    })
  })

  describe('Templates', () => {
    it.todo('Verify that all templates are valid')
    // Loop through all templates.ts that should have replacement comments, and verify that they are present
  })
})
