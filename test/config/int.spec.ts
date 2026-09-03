import { execSync } from 'child_process'
import { existsSync, readFileSync, rmSync } from 'fs'
import path from 'path'
import { type BlocksField, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { testFilePath } from './testFilePath.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.suite({ config: './config.ts' })('Config', () => {
  test.describe('payload config', () => {
    test('allows a custom field at the config root', ({ payload }) => {
      const { config } = payload
      expect(config.custom).toEqual({
        name: 'Customer portal',
      })
    })

    test('allows a custom field in the root endpoints', ({ payload }) => {
      const endpoints = payload.config.endpoints
      const customEndpoint = endpoints?.find((endpoint) => endpoint.path === '/config')

      expect(customEndpoint?.custom).toEqual({
        description: 'Get the sanitized payload config',
      })
    })

    test('should allow multiple getPayload calls using different configs in same process', async () => {
      const payload2 = await getPayload({
        key: 'payload2',
        config: await buildConfigWithDefaults({
          suite: 'config-payload2',
          config: {
            collections: [
              {
                slug: 'payload2',
                fields: [{ name: 'title2', type: 'text' }],
                versions: false,
              },
            ],
          },
        }),
      })

      // Use payload2 instance before creating payload3 instance, as we share the same db connection => each instance
      // creation will reset the db schema.
      const result2: any = await payload2.create({
        collection: 'payload2',
        data: {
          title2: 'Payload 2',
        },
      } as any)

      expect(result2.title2).toBe('Payload 2')

      const payload3 = await getPayload({
        key: 'payload3',
        config: await buildConfigWithDefaults({
          suite: 'config-payload3',
          config: {
            collections: [
              {
                slug: 'payload3',
                fields: [{ name: 'title3', type: 'text' }],
                versions: false,
              },
            ],
          },
        }),
      })

      // If payload was still incorrectly cached, this would fail, as the old payload config would still be used
      const result3: any = await payload3.create({
        collection: 'payload3',
        data: {
          title3: 'Payload 3',
        },
      } as any)

      expect(result3.title3).toBe('Payload 3')

      await payload2.destroy()
      await payload3.destroy()
    })
  })

  test.describe('collection config', () => {
    test('allows a custom field in collections', ({ payload }) => {
      const [collection] = payload.config.collections
      expect(collection.custom).toEqual({
        externalLink: 'https://foo.bar',
      })
    })

    test('allows a custom field in collection endpoints', ({ payload }) => {
      const [collection] = payload.config.collections
      const [endpoint] = collection.endpoints || []

      expect(endpoint.custom).toEqual({
        examples: [{ type: 'response', value: { message: 'hi' } }],
      })
    })

    test('allows a custom field in collection fields', ({ payload }) => {
      const [collection] = payload.config.collections
      const [field] = collection.fields

      expect(field.custom).toEqual({
        description: 'The title of this page',
      })
    })

    test('allows a custom field in blocks in collection fields', ({ payload }) => {
      const [collection] = payload.config.collections
      const [, blocksField] = collection.fields

      expect((blocksField as BlocksField).blocks[0].custom).toEqual({
        description: 'The blockOne of this page',
      })
    })

    test('properly merges collection.labels with defaults', ({ payload }) => {
      const [collection] = payload.config.collections
      expect(collection?.labels).toEqual({ plural: 'Pages', singular: 'Page' })
    })
  })

  test.describe('global config', () => {
    test('allows a custom field in globals', ({ payload }) => {
      const [global] = payload.config.globals
      expect(global.custom).toEqual({ foo: 'bar' })
    })

    test('allows a custom field in global endpoints', ({ payload }) => {
      const [global] = payload.config.globals
      const [endpoint] = global.endpoints || []

      expect(endpoint.custom).toEqual({ params: [{ name: 'name', type: 'string', in: 'query' }] })
    })

    test('allows a custom field in global fields', ({ payload }) => {
      const [global] = payload.config.globals
      const [field] = global.fields

      expect(field.custom).toEqual({
        description: 'The title of my global',
      })
    })
  })

  test.describe('cors config', () => {
    test('includes a custom header in Access-Control-Allow-Headers', async ({ restClient }) => {
      const response = await restClient.GET(`/pages`)
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('x-custom-header')
    })
  })

  test.describe('bin config', () => {
    const executeCLI = (command: string) => {
      execSync(`pnpm tsx "${path.resolve(dirname, 'bin.ts')}" ${command}`, {
        env: {
          ...process.env,
          PAYLOAD_CONFIG_PATH: path.resolve(dirname, 'config.ts'),
          PAYLOAD_DROP_DATABASE: 'false',
        },
        stdio: 'inherit',
        cwd: path.resolve(dirname, '../..'), // from root
      })
    }

    const deleteTestFile = () => {
      if (existsSync(testFilePath)) {
        rmSync(testFilePath)
      }
    }

    test.skip('should execute a custom script', () => {
      deleteTestFile()
      executeCLI('start-server')
      expect(JSON.parse(readFileSync(testFilePath, 'utf-8')).docs).toHaveLength(1)
      deleteTestFile()
    })
  })
})
