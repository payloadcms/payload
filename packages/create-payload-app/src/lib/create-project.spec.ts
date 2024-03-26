import fse from 'fs-extra'
import path from 'path'
import type { BundlerType, CliArgs, DbType, ProjectTemplate } from '../types.js'
import { createProject } from './create-project.js'
import { bundlerPackages, dbPackages, editorPackages } from './packages.js'
import { getValidTemplates } from './templates.js'

const projectDir = path.resolve(__dirname, './tmp')
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
      '--no-deps': true,
    } as CliArgs
    const packageManager = 'yarn'

    it('creates starter project', async () => {
      const projectName = 'starter-project'
      const template: ProjectTemplate = {
        name: 'blank',
        type: 'starter',
        url: 'https://github.com/payloadcms/payload/templates/blank',
        description: 'Blank Template',
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

    describe('db adapters and bundlers', () => {
      const templates = getValidTemplates()

      it.each([
        ['blank', 'mongodb', 'webpack'],
        ['blank', 'postgres', 'webpack'],
        ['website', 'mongodb', 'webpack'],
        ['website', 'postgres', 'webpack'],
        ['ecommerce', 'mongodb', 'webpack'],
        ['ecommerce', 'postgres', 'webpack'],
      ])('update config and deps: %s, %s, %s', async (templateName, db, bundler) => {
        const projectName = 'starter-project'

        const template = templates.find((t) => t.name === templateName)

        await createProject({
          cliArgs: args,
          projectName,
          projectDir,
          template: template as ProjectTemplate,
          packageManager,
          dbDetails: {
            dbUri: `${db}://localhost:27017/create-project-test`,
            type: db as DbType,
          },
        })

        const dbReplacement = dbPackages[db as DbType]
        const bundlerReplacement = bundlerPackages[bundler as BundlerType]
        const editorReplacement = editorPackages['slate']

        const packageJsonPath = path.resolve(projectDir, 'package.json')
        const packageJson = fse.readJsonSync(packageJsonPath)

        // Check deps
        expect(packageJson.dependencies['payload']).toEqual('^2.0.0')
        expect(packageJson.dependencies[dbReplacement.packageName]).toEqual(dbReplacement.version)

        // Should only have one db adapter
        expect(
          Object.keys(packageJson.dependencies).filter((n) => n.startsWith('@payloadcms/db-')),
        ).toHaveLength(1)

        expect(packageJson.dependencies[bundlerReplacement.packageName]).toEqual(
          bundlerReplacement.version,
        )
        expect(packageJson.dependencies[editorReplacement.packageName]).toEqual(
          editorReplacement.version,
        )

        let payloadConfigPath = path.resolve(projectDir, 'src/payload.config.ts')

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

        expect(content).not.toContain('// bundler-config-import')
        expect(content).toContain(bundlerReplacement.importReplacement)

        expect(content).not.toContain('// bundler-config')
        expect(content).toContain(bundlerReplacement.configReplacement)
      })
    })
  })

  describe('Templates', () => {
    it.todo('Verify that all templates are valid')
    // Loop through all templates.ts that should have replacement comments, and verify that they are present
  })
})
