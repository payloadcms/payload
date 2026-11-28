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
        url: 'https://github.com/payloadcms/payload/examples/custom-server#3.x',
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
          Object.keys(packageJson.dependencies).filter((n) => n.startsWith('@payloadcms/db-')),
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
          expect(content).toContain("import { mongooseAdapter } from '@payloadcms/db-mongodb'")
          expect(content).toContain('mongooseAdapter')
        } else if (db === 'postgres') {
          expect(content).toContain("import { postgresAdapter } from '@payloadcms/db-postgres'")
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
            '@payloadcms/db-mongodb': 'workspace:*',
            payload: 'workspace:*',
            '@payloadcms/ui': 'workspace:*',
          },
        }

        const correctlyModifiedJSON = {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            '@payloadcms/db-mongodb': `${latestVersion}`,
            payload: `${latestVersion}`,
            '@payloadcms/ui': `${latestVersion}`,
          },
        }

        updatePackageJSONDependencies({
          latestVersion,
          packageJson: initialJSON,
        })

        expect(initialJSON).toEqual(correctlyModifiedJSON)
      })

      it('bumps Payload packages pinned in devDependencies and peerDependencies', () => {
        const latestVersion = '4.0.0-beta.7'
        const initialJSON = {
          name: 'test-plugin',
          version: '1.0.0',
          dependencies: {
            '@payloadcms/ui': '3.82.1',
          },
          devDependencies: {
            '@payloadcms/db-mongodb': '3.82.1',
            '@payloadcms/eslint-config': '3.28.0',
            '@payloadcms/next': '3.82.1',
            '@payloadcms/transformer-sharp': '4.0.0-beta.4',
            payload: '3.82.1',
          },
          peerDependencies: {
            payload: '^3.82.1',
          },
        }

        const correctlyModifiedJSON = {
          name: 'test-plugin',
          version: '1.0.0',
          dependencies: {
            '@payloadcms/ui': `${latestVersion}`,
          },
          devDependencies: {
            '@payloadcms/db-mongodb': `${latestVersion}`,
            '@payloadcms/eslint-config': '3.28.0',
            '@payloadcms/next': `${latestVersion}`,
            '@payloadcms/transformer-sharp': `${latestVersion}`,
            payload: `${latestVersion}`,
          },
          peerDependencies: {
            payload: `^${latestVersion}`,
          },
        }

        updatePackageJSONDependencies({
          latestVersion,
          packageJson: initialJSON,
        })

        expect(initialJSON).toEqual(correctlyModifiedJSON)
      })

      it('keeps v4-only package pins when a v3 version is resolved', () => {
        const latestVersion = '3.93.0'
        const initialJSON = {
          name: 'test-plugin',
          version: '1.0.0',
          devDependencies: {
            '@payloadcms/next': '3.82.1',
            '@payloadcms/transformer-sharp': '4.0.0-beta.4',
            payload: '3.82.1',
          },
        }

        const correctlyModifiedJSON = {
          name: 'test-plugin',
          version: '1.0.0',
          devDependencies: {
            '@payloadcms/next': `${latestVersion}`,
            '@payloadcms/transformer-sharp': '4.0.0-beta.4',
            payload: `${latestVersion}`,
          },
        }

        updatePackageJSONDependencies({
          latestVersion,
          packageJson: initialJSON,
        })

        expect(initialJSON).toEqual(correctlyModifiedJSON)
      })

      it('never leaves a workspace: placeholder in the scaffolded package.json', () => {
        const latestVersion = '3.93.0'
        const initialJSON = {
          name: 'test-blank',
          version: '1.0.0',
          dependencies: {
            '@payloadcms/next': 'workspace:*',
            '@payloadcms/transformer-sharp': 'workspace:*',
            payload: 'workspace:*',
          },
        }

        const correctlyModifiedJSON = {
          name: 'test-blank',
          version: '1.0.0',
          dependencies: {
            '@payloadcms/next': `${latestVersion}`,
            '@payloadcms/transformer-sharp': `${latestVersion}`,
            payload: `${latestVersion}`,
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
