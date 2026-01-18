import fs from 'fs'
import fse from 'fs-extra'
import globby from 'globby'
import * as os from 'node:os'
import path from 'path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vitest } from 'vitest'
import type { CliArgs, DbType, ProjectExample, ProjectTemplate } from '../types.js'

import { createProject, updatePackageJSONDependencies } from './create-project.js'
import { getValidTemplates } from './templates.js'

describe('createProject', () => {
  let projectDir: string

  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log = vitest.fn()
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

    it('updates project name in plugin template importMap file', async () => {
      const projectName = 'my-custom-plugin'
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

      const importMapPath = path.resolve(projectDir, './dev/app/(payload)/admin/importMap.js')
      const importMapFile = fse.readFileSync(importMapPath, 'utf-8')

      expect(importMapFile).not.toContain('plugin-package-name-placeholder')
      expect(importMapFile).toContain('my-custom-plugin')
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
    }, 90_000)

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

        const packageJsonPath = path.resolve(projectDir, 'package.json')
        const packageJson = fse.readJsonSync(packageJsonPath)

        // Verify git was initialized
        expect(fse.existsSync(path.resolve(projectDir, '.git'))).toBe(true)

        // Should only have one db adapter
        expect(
          Object.keys(packageJson.dependencies).filter((n) => n.startsWith('@ruya.sa/db-')),
        ).toHaveLength(1)

        const payloadConfigPath = (
          await globby('**/payload.config.ts', {
            absolute: true,
            cwd: projectDir,
          })
        )?.[0]

        const content = fse.readFileSync(payloadConfigPath, 'utf-8')

        // Check payload.config.ts doesn't have placeholder comments
        expect(content).not.toContain('// database-adapter-import')
        expect(content).not.toContain('// database-adapter-config-start')
        expect(content).not.toContain('// database-adapter-config-end')

        // Verify correct adapter import and usage based on db type
        if (db === 'mongodb') {
          expect(content).toContain("import { mongooseAdapter } from '@ruya.sa/db-mongodb'")
          expect(content).toContain('mongooseAdapter')
        } else if (db === 'postgres') {
          expect(content).toContain("import { postgresAdapter } from '@ruya.sa/db-postgres'")
          expect(content).toContain('postgresAdapter')
        }
      })
    })

    describe('updates package.json', () => {
      it('updates package name and bumps workspace versions', async () => {
        const latestVersion = '3.0.0'
        const initialJSON = {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            '@ruya.sa/db-mongodb': 'workspace:*',
            payload: 'workspace:*',
            '@ruya.sa/ui': 'workspace:*',
          },
        }

        const correctlyModifiedJSON = {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            '@ruya.sa/db-mongodb': `${latestVersion}`,
            payload: `${latestVersion}`,
            '@ruya.sa/ui': `${latestVersion}`,
          },
        }

        updatePackageJSONDependencies({
          latestVersion,
          packageJson: initialJSON,
        })

        expect(initialJSON).toEqual(correctlyModifiedJSON)
      })
    })
  })
})
