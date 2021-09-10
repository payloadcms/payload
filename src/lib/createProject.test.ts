import fse from 'fs-extra'
import path from 'path'
import type { ProjectTemplate } from '../types'
import {
  createProject,
  getLatestPayloadVersion,
  updatePayloadVersion,
} from './createProject'

describe('createProject', () => {
  const projectDir = path.resolve(__dirname, './tmp')
  beforeAll(() => {
    console.log = jest.fn()
    fse.rmdirSync(projectDir, { recursive: true })
  })
  afterEach(() => {
    fse.rmdirSync(projectDir, { recursive: true })
  })

  describe('#createProject', () => {
    const args = { _: ['project-name'], '--no-deps': true }
    const packageManager = 'yarn'

    it('creates static project', async () => {
      const expectedPayloadVersion = await getLatestPayloadVersion()
      const template: ProjectTemplate = { name: 'ts-todo', type: 'static' }
      await createProject(args, projectDir, template, packageManager)

      const packageJsonPath = path.resolve(projectDir, 'package.json')
      const packageJson = fse.readJsonSync(packageJsonPath)
      expect(packageJson.dependencies.payload).toBe(expectedPayloadVersion)
    })
  })

  describe('#updatePayloadVersion', () => {
    it('updates payload version in package.json', async () => {
      const packageJsonPath = path.resolve(projectDir, 'package.json')
      await fse.mkdir(projectDir)
      await fse.writeJson(
        packageJsonPath,
        { dependencies: { payload: '0.0.1' } },
        { spaces: 2 },
      )
      await updatePayloadVersion(projectDir)
      const modified = await fse.readJson(packageJsonPath)
      expect(modified.dependencies.payload).not.toBe('0.0.1')
    })
  })
})
