import fse from 'fs-extra'
import path from 'path'
import type { CliArgs, ProjectTemplate } from '../types'
import { createProject } from './create-project'

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
