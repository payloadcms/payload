import fse from 'fs-extra'
import path from 'path'
import type { BundlerType, CliArgs, DbType, ProjectTemplate } from '../types'
import { createProject } from './create-project'
import { bundlerPackages, dbPackages } from './packages'

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
      fse.rmdirSync(projectDir, { recursive: true })
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

    it.each([
      ['mongodb', 'webpack'],
      ['postgres', 'webpack'],
    ])(
      'should properly replace dependencies and update payload config when %s and %s are selected',
      async (db, bundler) => {
        const projectName = 'starter-project'
        const template: ProjectTemplate = {
          name: 'blank',
          type: 'starter',
          url: 'https://github.com/payloadcms/payload/templates/blank#feat/2.0-template-updates',
          description: 'Blank Template',
        }
        await createProject({
          cliArgs: args,
          projectName,
          projectDir,
          template,
          packageManager,
          dbDetails: {
            dbUri: `${db}://localhost:27017/create-project-test`,
            type: db as DbType,
          },
        })

        const dbReplacement = dbPackages[db as DbType]
        const bundlerReplacement = bundlerPackages[bundler as BundlerType]

        const packageJsonPath = path.resolve(projectDir, 'package.json')
        const packageJson = fse.readJsonSync(packageJsonPath)

        // Check deps
        expect(packageJson.dependencies[dbReplacement.packageName]).toBeDefined()
        expect(
          packageJson.dependencies[bundlerReplacement.packageName],
        ).toBeDefined()

        const payloadConfigPath = path.resolve(projectDir, 'src/payload.config.ts')
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
      },
    )

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
  })
})
