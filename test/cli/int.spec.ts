import type { Payload } from 'payload'

import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import testConfig from './config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const CLI_COMMAND_TEST_TIMEOUT = 180_000
const generatedDirectory = path.resolve(dirname, 'generated')
const documentsFile = path.resolve(generatedDirectory, 'documents.json')
const importMapFile = path.resolve(generatedDirectory, 'importMap.js')
const inputFile = path.resolve(generatedDirectory, 'input.json')
const migrationsDirectory = path.resolve(dirname, 'migrations')
const schemaFile = path.resolve(dirname, 'payload-generated-schema.ts')
const scriptOutputFile = path.resolve(generatedDirectory, 'script-output.txt')
const typesFile = path.resolve(generatedDirectory, 'payload-types.ts')
const uploadFile = path.resolve(dirname, '../uploads/image.png')
const whereFile = path.resolve(generatedDirectory, 'where.json')

process.env.SQLITE_URL ??= `file:${path.resolve(dirname, 'payload.db')}`

test.suite({ config: testConfig })('CLI', () => {
  test(
    '--json build --no-types -- --help',
    testCLICommand(async (command, { cli }) => {
      await expect(access(importMapFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(importMapFile, 'utf8')).resolves.toContain('export const importMap')
      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage:')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'build',
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'build --help',
    testCLICommand(async (_command, { cli }) => {
      await expect(access(importMapFile)).rejects.toThrow()

      const output = await cli('build --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload build')
      await expect(access(importMapFile)).rejects.toThrow()
    }),
  )

  test.options({ db: 'drizzle' })(
    'generate:db-schema --no-log --json',
    testCLICommand(async (command, { cli }) => {
      await expect(access(schemaFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(schemaFile, 'utf8')).resolves.toContain('export const pages')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'generate:db-schema',
        result: { outputFile: schemaFile },
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test.options({ db: 'drizzle' })(
    'generate:db-schema --help',
    testCLICommand(async (_command, { cli }) => {
      await expect(access(schemaFile)).rejects.toThrow()

      const output = await cli('generate:db-schema --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload generate:db-schema')
      await expect(access(schemaFile)).rejects.toThrow()
    }),
  )

  test(
    'generate:importmap --json',
    testCLICommand(async (command, { cli }) => {
      await expect(access(importMapFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(importMapFile, 'utf8')).resolves.toContain('export const importMap')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'generate:importmap',
        result: {
          outputFile: importMapFile,
          written: true,
        },
        success: true,
      })
    }),
  )

  test(
    'generate:importmap --help',
    testCLICommand(async (_command, { cli }) => {
      await expect(access(importMapFile)).rejects.toThrow()

      const output = await cli('generate:importmap --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload generate:importmap')
      await expect(access(importMapFile)).rejects.toThrow()
    }),
  )

  test(
    'generate:types --json',
    testCLICommand(async (command, { cli }) => {
      await expect(access(typesFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(typesFile, 'utf8')).resolves.toContain('export interface Page')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'generate:types',
        result: {
          outputFile: typesFile,
          written: true,
        },
        success: true,
      })
    }),
  )

  test(
    'generate:types --help',
    testCLICommand(async (_command, { cli }) => {
      await expect(access(typesFile)).rejects.toThrow()

      const output = await cli('generate:types --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload generate:types')
      await expect(access(typesFile)).rejects.toThrow()
    }),
  )

  test(
    'help --json',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      const response = JSON.parse(output.stdout) as CLIOutput<{
        commands: Array<{ name: string }>
        globalOptions: Array<{ flags: string }>
      }>

      expect(response).toMatchObject({ command: 'help', success: true })
      expect(response.result.commands.map(({ name }) => name)).toEqual(
        expect.arrayContaining([
          'build',
          'generate:db-schema',
          'generate:importmap',
          'generate:types',
          'help',
          'hello',
          'info',
          'jobs:handle-schedules',
          'jobs:run',
          'migrate',
          'migrate:create',
          'migrate:down',
          'migrate:fresh',
          'migrate:refresh',
          'migrate:reset',
          'migrate:status',
          'run',
        ]),
      )
      expect(response.result.globalOptions.map(({ flags }) => flags)).toContain('--no-json')
      expect(response.result.globalOptions.map(({ flags }) => flags)).not.toContain('--json')
    }),
  )

  test(
    'help --help',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('help --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload help')
    }),
  )

  test(
    'help --no-json',
    testCLICommand(async (_command, { cli }) => {
      process.env.PAYLOAD_CLI_JSON = '1'

      const output = await cli('help --no-json')

      expect(output.stdout).toContain('--json')
      expect(output.stdout).not.toContain('--no-json')
    }),
  )

  test(
    '--help (PAYLOAD_CLI_JSON=1)',
    testCLICommand(async (_command, { cli }) => {
      process.env.PAYLOAD_CLI_JSON = '1'

      const output = await cli('--help')
      const response = JSON.parse(output.stdout) as CLIOutput<{
        globalOptions: Array<{ flags: string }>
      }>

      expect(response.result.globalOptions.map(({ flags }) => flags)).toContain('--no-json')
      expect(response.result.globalOptions.map(({ flags }) => flags)).not.toContain('--json')
    }),
  )

  test(
    'payload',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('')

      expect(output.stdout).toContain('Manage and operate a local Payload project.')
      expect(output.stdout).toContain('--json')
      expect(output.stdout).not.toContain('--no-json')
    }),
  )

  test(
    'payload (PAYLOAD_CLI_JSON=1)',
    testCLICommand(async (_command, { cli }) => {
      process.env.PAYLOAD_CLI_JSON = '1'

      const output = await cli('')

      expect(output.stdout).toContain('--no-json')
      expect(output.stdout).not.toContain('--json')
    }),
  )

  test(
    'info --json',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'info',
        result: {
          binaries: { node: process.versions.node },
          packages: expect.arrayContaining([expect.objectContaining({ name: 'payload' })]),
        },
        success: true,
      })
    }),
  )

  test(
    'info --help',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('info --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload info')
    }),
  )

  test(
    'info --help --json',
    testCLICommand(async (_command, { cli }) => {
      const helpOptionOutput = await cli('info --help --json')
      const helpCommandOutput = await cli('help info --json')

      expect(JSON.parse(helpOptionOutput.stdout)).toEqual(JSON.parse(helpCommandOutput.stdout))
    }),
  )

  test(
    'info (PAYLOAD_CLI_JSON=1)',
    testCLICommand(async (_command, { cli }) => {
      process.env.PAYLOAD_CLI_JSON = '1'
      process.env.PAYLOAD_TEST_CLI_CONFIG_LOG = 'true'

      const output = await cli('info')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'info',
        success: true,
      })
      expect(output.stderr).toContain('Loading CLI config.')
    }),
  )

  test(
    'info --no-json',
    testCLICommand(async (_command, { cli }) => {
      process.env.PAYLOAD_CLI_JSON = '1'

      const output = await cli('info --no-json')

      expect(output.stdout).toContain('Binaries:')
      expect(output.stdout).not.toContain('"command":"info"')
    }),
  )

  test(
    'info --help --no-json',
    testCLICommand(async (_command, { cli }) => {
      process.env.PAYLOAD_CLI_JSON = '1'

      const output = await cli('info --help --no-json')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload info')
      expect(output.stdout).not.toContain('"command":"help"')
    }),
  )

  test(
    'createDocuments --help',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('createDocuments --help')
      const help = output.stdout.replace(/\s+/g, ' ')

      expect(help).toContain('--slug <slug> The target slug. (required)')
      expect(help).toContain(
        '--documents <json|@file> A JSON array of {"data": {...}, "file"?: ...} objects. (required)',
      )
      expect(help.indexOf('--documents')).toBeLessThan(help.indexOf('--depth'))
      expect(help).toContain(
        '--depth <number> How many levels deep to populate relationships. (default: 0)',
      )
      expect(help).toContain(
        '--override-access <true|false> Bypass access control. (default: true)',
      )
      expect(help).toContain(
        '--returning Return complete documents instead of only their IDs. (default: false)',
      )
      expect(help).toContain('A JSON array of {"data": {...}, "file"?: ...} objects.')
      expect(help).toContain('Examples:')
      expect(help).toContain(
        `payload createDocuments --slug posts --documents '[{"data":{"title":"First post"}}]'`,
      )
      expect(help).toContain('payload createDocuments --input @create-posts.json')
    }),
  )

  test(
    'createDocuments --help --json',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('createDocuments --help --json')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'help',
        result: {
          command: {
            name: 'createDocuments',
            examples: [
              `payload createDocuments --slug posts --documents '[{"data":{"title":"First post"}}]'`,
              'payload createDocuments --input @create-posts.json',
            ],
            inputSchema: {
              properties: {
                documents: {
                  description: 'A JSON array of {"data": {...}, "file"?: ...} objects.',
                },
                overwriteExistingFiles: {},
                returning: { default: false },
                showHiddenFields: {},
              },
            },
          },
        },
        success: true,
      })
    }),
  )

  test(
    `createDocuments --slug pages --documents '[{"data":{"title":"not created"}}]' --select '{"title":true}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const output = await cli({
        command: `createDocuments --slug pages --documents '[{"data":{"title":"not created"}}]' --select '{"title":true}' --json`,
        reject: false,
      })
      const pages = await payload.count({
        collection: 'pages',
        where: { title: { equals: 'not created' } },
      })

      expect(output.exitCode).toBe(1)
      expect(pages.totalDocs).toBe(0)
      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'createDocuments',
        error: {
          code: 'INVALID_INPUT',
          issues: [{ message: 'select requires returning to be true.', path: 'select' }],
        },
        success: false,
      })
    }),
  )

  test(
    'findDocuments --help --json',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('findDocuments --help --json')

      expect(JSON.parse(output.stdout)).toMatchObject({
        result: {
          command: {
            name: 'findDocuments',
            inputSchema: {
              properties: {
                showHiddenFields: {},
              },
            },
          },
        },
      })
    }),
  )

  test(
    'updateDocument --help --json',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('updateDocument --help --json')

      expect(JSON.parse(output.stdout)).toMatchObject({
        result: {
          command: {
            name: 'updateDocument',
            inputSchema: {
              properties: {
                overwriteExistingFiles: {},
                returning: { default: false },
                showHiddenFields: {},
              },
            },
          },
        },
      })
    }),
  )

  test(
    `updateDocument --slug pages --where '{"title":{"equals":"Seeded page"}}' --data '{"title":"not updated"}' --select '{"title":true}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const output = await cli({
        command: `updateDocument --slug pages --where '{"title":{"equals":"Seeded page"}}' --data '{"title":"not updated"}' --select '{"title":true}' --json`,
        reject: false,
      })
      const seededPages = await payload.count({
        collection: 'pages',
        where: { title: { equals: 'Seeded page' } },
      })

      expect(output.exitCode).toBe(1)
      expect(seededPages.totalDocs).toBe(1)
      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'updateDocument',
        error: {
          code: 'INVALID_INPUT',
          issues: [{ message: 'select requires returning to be true.', path: 'select' }],
        },
        success: false,
      })
    }),
  )

  test(
    'countDocuments --slug pages --json',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'countDocuments',
        result: { totalDocs: 1 },
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'countDocuments --slug pages --override-access false --json',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'countDocuments',
        result: { totalDocs: 0 },
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'countDocuments --slug pages --override-access yes',
    testCLICommand(async (_command, { cli }) => {
      await expect(cli('countDocuments --slug pages --override-access yes')).rejects.toThrow(
        'Expected true or false.',
      )
    }),
  )

  test(
    'countDocuments --help',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('countDocuments --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('--override-access <true|false>')
    }),
  )

  test(
    'countDocuments --slug pages --where @where.json',
    testCLICommand(async (_command, { cli }) => {
      await writeFile(whereFile, JSON.stringify({ title: { equals: 'Seeded page' } }))

      const output = await cli(`countDocuments --slug pages --where @${whereFile}`)

      expect(output.stdout).toContain('"totalDocs": 1')
    }),
  )

  test(
    `countDocuments --input '{"slug":"pages","collection":"pages"}' --json`,
    testCLICommand(async (_command, { cli }) => {
      const output = await cli({
        command: `countDocuments --input '{"slug":"pages","collection":"pages"}' --json`,
        reject: false,
      })
      const response = JSON.parse(output.stdout)

      expect(output.exitCode).toBe(1)
      expect(response).toMatchObject({
        command: 'countDocuments',
        error: {
          code: 'INVALID_INPUT',
          inputSchema: { additionalProperties: false },
        },
        success: false,
      })
    }),
  )

  test(
    `createDocuments --slug pages --documents '[{"data":{"title":"one","location":{"longitude":1,"latitude":2}}},{"data":{"title":"two"}}]' --json`,
    testCLICommand(async (command, { cli, payload }) => {
      const output = await cli(command)
      const pages = await payload.find({
        collection: 'pages',
        pagination: false,
        sort: 'title',
        where: { title: { in: ['one', 'two'] } },
      })

      expect(pages.docs).toHaveLength(2)
      expect(pages.docs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ location: [1, 2], title: 'one' }),
          expect.objectContaining({ title: 'two' }),
        ]),
      )

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'createDocuments',
        result: {
          docs: [
            { id: expect.anything(), index: 0 },
            { id: expect.anything(), index: 1 },
          ],
          errors: [],
        },
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'createDocuments --slug pages --documents @documents.json --json',
    testCLICommand(async (_command, { cli, payload }) => {
      await writeFile(
        documentsFile,
        JSON.stringify([{ data: { title: 'file one' } }, { data: { title: 'file two' } }]),
      )

      const output = await cli(`createDocuments --slug pages --documents @${documentsFile} --json`)
      const pages = await payload.find({
        collection: 'pages',
        pagination: false,
        where: { title: { in: ['file one', 'file two'] } },
      })

      expect(pages.docs).toHaveLength(2)
      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'createDocuments',
        result: {
          docs: [
            { id: expect.anything(), index: 0 },
            { id: expect.anything(), index: 1 },
          ],
          errors: [],
        },
        success: true,
      })
    }),
  )

  test(
    'createDocuments --input @input.json --returning --json',
    testCLICommand(async (_command, { cli, payload }) => {
      await writeFile(
        inputFile,
        JSON.stringify({
          slug: 'pages',
          documents: [{ data: { title: 'Merged input' } }],
          returning: false,
        }),
      )

      const output = await cli(`createDocuments --input @${inputFile} --returning --json`)
      const response = JSON.parse(output.stdout)
      const pages = await payload.find({
        collection: 'pages',
        where: { title: { equals: 'Merged input' } },
      })

      expect(pages.docs).toHaveLength(1)
      expect(response).toMatchObject({
        command: 'createDocuments',
        result: {
          docs: [{ doc: expect.objectContaining({ title: 'Merged input' }), index: 0 }],
          errors: [],
        },
        success: true,
      })
    }),
  )

  test(
    `createDocuments --slug pages --documents '[{"data":{}}]' --draft --returning --json`,
    testCLICommand(async (_command, { cli }) => {
      const output = await cli({
        command: `createDocuments --slug pages --documents '[{"data":{}}]' --draft --returning --json`,
        reject: false,
      })
      const response = JSON.parse(output.stdout)

      expect(output.exitCode).toBe(0)
      expect(response).toMatchObject({
        command: 'createDocuments',
        result: {
          docs: [{ doc: { _status: 'draft' }, index: 0 }],
          errors: [],
        },
        success: true,
      })
    }),
  )

  test(
    `createDocuments --slug pages --documents '[{"data":{"title":"created"}},{"data":{"title":null}}]' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const output = await cli({
        command: `createDocuments --slug pages --documents '[{"data":{"title":"created"}},{"data":{"title":null}}]' --json`,
        reject: false,
      })
      const response = JSON.parse(output.stdout)
      const created = await payload.find({
        collection: 'pages',
        where: { title: { equals: 'created' } },
      })

      expect(output.exitCode).toBe(1)
      expect(created.docs).toHaveLength(1)

      expect(response).toMatchObject({
        command: 'createDocuments',
        exitCode: 1,
        result: {
          slug: 'pages',
          docs: [{ id: expect.anything(), index: 0 }],
          errors: [
            {
              index: 1,
              issues: [expect.objectContaining({ path: 'data.title' })],
            },
          ],
          schema: {
            properties: { title: expect.objectContaining({ type: 'string' }) },
            required: expect.arrayContaining(['title']),
          },
        },
        success: false,
      })
    }),
  )

  test(
    `updateDocument --slug pages --where '{"title":{"equals":"Seeded page"}}' --data '{"title":null}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const output = await cli({
        command: `updateDocument --slug pages --where '{"title":{"equals":"Seeded page"}}' --data '{"title":null}' --json`,
        reject: false,
      })
      const response = JSON.parse(output.stdout)
      const pages = await payload.find({
        collection: 'pages',
        where: { title: { equals: 'Seeded page' } },
      })

      expect(output.exitCode).toBe(1)
      expect(pages.docs).toHaveLength(1)
      expect(response).toMatchObject({
        command: 'updateDocument',
        exitCode: 1,
        result: {
          slug: 'pages',
          errors: [expect.objectContaining({ message: expect.any(String) })],
          schema: {
            properties: { title: expect.objectContaining({ type: 'string' }) },
            required: expect.arrayContaining(['title']),
          },
        },
        success: false,
      })
    }),
  )

  test(
    `updateDocument --slug pages --id <page-id> --data '{"metadata":{"title":"Updated"}}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          metadata: {
            description: 'Keep this description',
            title: 'Original',
          },
          requireMetadata: true,
          title: 'Nested update',
        },
      })
      const output = await cli({
        command: `updateDocument --slug pages --id ${page.id} --data '{"metadata":{"title":"Updated"}}' --returning --json`,
        reject: false,
      })
      const updatedPage = await payload.findByID({ collection: 'pages', id: page.id })

      expect(output.exitCode).toBe(0)
      expect(updatedPage.metadata).toEqual({
        description: 'Keep this description',
        title: 'Updated',
      })
    }),
  )

  test.options({ db: 'drizzle' })(
    `updateDocument --slug pages --id <page-id> --data '{"title":"Updated"}' --override-access false --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const page = await payload.create({
        collection: 'pages',
        data: { title: 'Numeric ID' },
      })
      const output = await cli(
        `updateDocument --slug pages --id ${page.id} --data '{"title":"Updated"}' --override-access false --json`,
      )
      const updatedPage = await payload.findByID({ id: page.id, collection: 'pages' })

      expect(output.exitCode).toBe(0)
      expect(updatedPage.title).toBe('Updated')
    }),
  )

  test(
    `updateDocument --slug custom-ids --id 1e5 --data '{"title":"Updated"}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      await payload.create({
        collection: 'custom-ids',
        data: { id: '1e5', title: 'Target' },
      })
      await payload.create({
        collection: 'custom-ids',
        data: { id: '100000', title: 'Other' },
      })

      const output = await cli(
        `updateDocument --slug custom-ids --id 1e5 --data '{"title":"Updated"}' --json`,
      )
      const target = await payload.findByID({ id: '1e5', collection: 'custom-ids' })
      const other = await payload.findByID({ id: '100000', collection: 'custom-ids' })

      expect(output.exitCode).toBe(0)
      expect(target.title).toBe('Updated')
      expect(other.title).toBe('Other')
    }),
  )

  test(
    `updateDocument --input '{"slug":"custom-ids","id":123,"data":{"title":"Updated"},"overrideAccess":false}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      await payload.create({
        collection: 'custom-ids',
        data: { id: '123', title: 'Target' },
      })

      const output = await cli(
        `updateDocument --input '{"slug":"custom-ids","id":123,"data":{"title":"Updated"},"overrideAccess":false}' --json`,
      )
      const target = await payload.findByID({ id: '123', collection: 'custom-ids' })

      expect(output.exitCode).toBe(0)
      expect(target.title).toBe('Updated')
    }),
  )

  test(
    'deleteDocuments --slug custom-ids --id 12345678901234567890 --json',
    testCLICommand(async (_command, { cli, payload }) => {
      await payload.create({
        collection: 'custom-ids',
        data: { id: '12345678901234567890', title: 'Target' },
      })
      await payload.create({
        collection: 'custom-ids',
        data: { id: '12345678901234567000', title: 'Rounded ID' },
      })

      const output = await cli('deleteDocuments --slug custom-ids --id 12345678901234567890 --json')
      const target = await payload.findByID({
        id: '12345678901234567890',
        collection: 'custom-ids',
        disableErrors: true,
      })
      const roundedIDDocument = await payload.findByID({
        id: '12345678901234567000',
        collection: 'custom-ids',
      })

      expect(output.exitCode).toBe(0)
      expect(target).toBeNull()
      expect(roundedIDDocument.title).toBe('Rounded ID')
    }),
  )

  test(
    `duplicateDocument --slug pages --id <seeded-page-id> --data '{"title":null}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const seededPage = await payload.find({
        collection: 'pages',
        limit: 1,
        where: { title: { equals: 'Seeded page' } },
      })
      const output = await cli({
        command: `duplicateDocument --slug pages --id ${seededPage.docs[0]!.id} --data '{"title":null}' --json`,
        reject: false,
      })
      const response = JSON.parse(output.stdout)
      const pages = await payload.count({ collection: 'pages' })

      expect(output.exitCode).toBe(1)
      expect(pages.totalDocs).toBe(1)
      expect(response).toMatchObject({
        command: 'duplicateDocument',
        exitCode: 1,
        result: {
          slug: 'pages',
          errors: [expect.objectContaining({ path: 'data.title' })],
          schema: {
            properties: { title: expect.objectContaining({ type: 'string' }) },
            required: expect.arrayContaining(['title']),
          },
        },
        success: false,
      })
    }),
  )

  test(
    `updateGlobal --slug settings --data '{"title":null}' --json`,
    testCLICommand(async (_command, { cli, payload }) => {
      const output = await cli({
        command: `updateGlobal --slug settings --data '{"title":null}' --json`,
        reject: false,
      })
      const response = JSON.parse(output.stdout)
      const settings = await payload.findGlobal({ slug: 'settings' })

      expect(output.exitCode).toBe(1)
      expect(settings.title).toBe('Seeded settings')
      expect(response).toMatchObject({
        command: 'updateGlobal',
        exitCode: 1,
        result: {
          slug: 'settings',
          errors: [expect.objectContaining({ path: 'data.title' })],
          schema: {
            properties: { title: expect.objectContaining({ type: 'string' }) },
            required: expect.arrayContaining(['title']),
          },
        },
        success: false,
      })
    }),
  )

  test(
    `updateDocument --slug pages --where '{"title":{"equals":"Seeded page"}}' --data '{"title":"Updated page"}' --no-override-lock --json`,
    testCLICommand(async (command, { cli, payload }) => {
      const output = await cli(command)
      const updated = await payload.find({
        collection: 'pages',
        where: { title: { equals: 'Updated page' } },
      })

      expect(updated.docs).toHaveLength(1)

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'updateDocument',
        result: { docs: [{ id: expect.anything() }], errors: [] },
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    `updateDocument --slug media --id <seeded-media-id> --data '{"title":"Updated media"}' --file ${uploadFile}`,
    testCLICommand(async (_command, { cli, payload }) => {
      const seededMedia = await payload.find({
        collection: 'media',
        limit: 1,
        where: { title: { equals: 'Seeded media' } },
      })
      const output = await cli(
        `updateDocument --slug media --id ${seededMedia.docs[0]!.id} --data '{"title":"Updated media"}' --file ${uploadFile} --returning`,
      )
      const updatedMedia = await payload.findByID({
        id: seededMedia.docs[0]!.id,
        collection: 'media',
      })

      expect(output.stdout).toContain('"title": "Updated media"')
      expect(updatedMedia).toMatchObject({ filename: 'image.png', title: 'Updated media' })
    }),
  )

  test(
    'deleteDocuments --slug pages --json',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli({ command: 'deleteDocuments --slug pages --json', reject: false })

      expect(output.exitCode).toBe(1)
      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'deleteDocuments',
        error: { code: 'INVALID_INPUT' },
        success: false,
      })
    }),
  )

  test(
    'findDocuments --slug pages --draft --trash --no-pagination --json',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('findDocuments --slug pages --draft --trash --no-pagination --json')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'findDocuments',
        result: { docs: [expect.objectContaining({ title: 'Seeded page' })] },
        success: true,
      })
    }),
  )

  test(
    'countDocuments --slug pages --unknown',
    testCLICommand(async (_command, { cli }) => {
      await expect(cli('countDocuments --slug pages --unknown')).rejects.toThrow(
        "unknown option '--unknown'",
      )
    }),
  )

  test(
    'jobs:handle-schedules --all-queues --json',
    testCLICommand(async (command, { cli, payload }) => {
      const jobsBefore = (await payload.find({
        collection: 'payload-jobs',
        limit: 100,
      } as never)) as { docs: unknown[] }

      expect(jobsBefore.docs).toHaveLength(0)

      const output = await cli(command)
      const jobsAfter = (await payload.find({
        collection: 'payload-jobs',
        limit: 100,
      } as never)) as {
        docs: Array<{ meta?: { scheduled?: boolean }; taskSlug?: string }>
      }

      expect(jobsAfter.docs).toEqual([
        expect.objectContaining({
          meta: expect.objectContaining({ scheduled: true }),
          taskSlug: 'noop',
        }),
      ])

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'jobs:handle-schedules',
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'jobs:handle-schedules --help',
    testCLICommand(async (_command, { cli, payload }) => {
      const jobsBefore = (await payload.find({
        collection: 'payload-jobs',
        limit: 100,
      } as never)) as { docs: unknown[] }

      expect(jobsBefore.docs).toHaveLength(0)

      const output = await cli('jobs:handle-schedules --help')
      const jobsAfter = (await payload.find({
        collection: 'payload-jobs',
        limit: 100,
      } as never)) as { docs: unknown[] }

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload jobs:handle-schedules')
      expect(jobsAfter.docs).toHaveLength(0)
    }),
  )

  test.options({ db: 'mongo' })(
    'jobs:run --all-queues --limit 1 --json',
    testCLICommand(async (command, { cli, payload }) => {
      await payload.jobs.queue({ input: {}, task: 'noop' } as never)
      const jobsBefore = (await payload.find({
        collection: 'payload-jobs',
        limit: 100,
      } as never)) as { docs: unknown[] }
      const pagesBefore = (await payload.find({ collection: 'pages', limit: 100 } as never)) as {
        docs: Array<{ title: string }>
      }

      expect(jobsBefore.docs).toHaveLength(1)
      expect(pagesBefore.docs.map(({ title }) => title)).not.toContain('CLI job ran')

      const output = await cli(command)
      const pagesAfter = (await payload.find({ collection: 'pages', limit: 100 } as never)) as {
        docs: Array<{ title: string }>
      }

      expect(pagesAfter.docs.map(({ title }) => title)).toContain('CLI job ran')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'jobs:run',
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test.options({ db: 'mongo' })(
    'jobs:run --help',
    testCLICommand(async (_command, { cli, payload }) => {
      await payload.jobs.queue({ input: {}, task: 'noop' } as never)
      const pagesBefore = (await payload.find({ collection: 'pages', limit: 100 } as never)) as {
        docs: Array<{ title: string }>
      }

      expect(pagesBefore.docs.map(({ title }) => title)).not.toContain('CLI job ran')

      const output = await cli('jobs:run --help')
      const pagesAfter = (await payload.find({ collection: 'pages', limit: 100 } as never)) as {
        docs: Array<{ title: string }>
      }

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload jobs:run')
      expect(pagesAfter.docs.map(({ title }) => title)).not.toContain('CLI job ran')
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate --json',
    testCLICommand(async (command, { cli, payload }) => {
      await cli('migrate:create pending --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_pending.ts'))!
        .replace('.ts', '')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsBefore.docs.find(({ name }) => name === migrationName)).toBeUndefined()

      const output = await cli(command)
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toMatchObject({
        batch: 1,
      })

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'migrate',
        result: {
          migrated: [migrationName],
          rolledBack: [],
        },
        success: true,
      })
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate --help',
    testCLICommand(async (_command, { cli, payload }) => {
      await cli('migrate:create pending --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_pending.ts'))!
        .replace('.ts', '')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsBefore.docs.find(({ name }) => name === migrationName)).toBeUndefined()

      const output = await cli('migrate --help')
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate')
      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeUndefined()
    }),
  )

  test(
    'migrate:create cli-test --force-accept-warning --json',
    testCLICommand(async (command, { cli }) => {
      await expect(access(migrationsDirectory)).rejects.toThrow()

      const output = await cli(command)
      const migrationFile = (await readdir(migrationsDirectory)).find((file) =>
        /_cli[-_]test\.ts$/.test(file),
      )

      expect(migrationFile).toBeDefined()
      await expect(
        readFile(path.resolve(migrationsDirectory, 'index.ts'), 'utf8'),
      ).resolves.toContain(migrationFile!.replace('.ts', ''))

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'migrate:create',
        result: {
          created: true,
          path: expect.stringContaining(migrationFile!),
        },
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'migrate:create --help',
    testCLICommand(async (_command, { cli }) => {
      await expect(access(migrationsDirectory)).rejects.toThrow()

      const output = await cli('migrate:create --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:create')
      await expect(access(migrationsDirectory)).rejects.toThrow()
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate:down --json',
    testCLICommand(async (command, { cli, payload }) => {
      await cli('migrate:create down --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_down.ts'))!
        .replace('.ts', '')
      await cli('migrate --json')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsBefore.docs.find(({ name }) => name === migrationName)).toBeDefined()

      const output = await cli(command)
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeUndefined()

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'migrate:down',
        result: {
          migrated: [],
          rolledBack: [migrationName],
        },
        success: true,
      })
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate:down --help',
    testCLICommand(async (_command, { cli, payload }) => {
      await cli('migrate:create down --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_down.ts'))!
        .replace('.ts', '')
      await cli('migrate --json')

      const output = await cli('migrate:down --help')
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:down')
      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeDefined()
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate:fresh --force-accept-warning --json',
    testCLICommand(async (command, { cli, payload }) => {
      await cli('migrate:create fresh --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_fresh.ts'))!
        .replace('.ts', '')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsBefore.docs.find(({ name }) => name === migrationName)).toBeUndefined()

      const output = await cli(command)
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toMatchObject({
        batch: 1,
      })

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'migrate:fresh',
        result: {
          migrated: [migrationName],
          rolledBack: [],
        },
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test.options({ db: 'mongo' })(
    'migrate:fresh --help',
    testCLICommand(async (_command, { cli, payload }) => {
      await cli('migrate:create fresh --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_fresh.ts'))!
        .replace('.ts', '')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsBefore.docs.find(({ name }) => name === migrationName)).toBeUndefined()

      const output = await cli('migrate:fresh --help')
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:fresh')
      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeUndefined()
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate:refresh --json',
    testCLICommand(async (command, { cli, payload }) => {
      await cli('migrate:create refresh --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_refresh.ts'))!
        .replace('.ts', '')
      await cli('migrate --json')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })
      const migrationBefore = migrationsBefore.docs.find(({ name }) => name === migrationName)

      expect(migrationBefore).toBeDefined()

      const output = await cli(command)
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })
      const migrationAfter = migrationsAfter.docs.find(({ name }) => name === migrationName)

      expect(migrationAfter).toBeDefined()
      expect(migrationAfter?.id).not.toBe(migrationBefore?.id)

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'migrate:refresh',
        result: {
          migrated: [migrationName],
          rolledBack: [migrationName],
        },
        success: true,
      })
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate:refresh --help',
    testCLICommand(async (_command, { cli, payload }) => {
      await cli('migrate:create refresh --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_refresh.ts'))!
        .replace('.ts', '')
      await cli('migrate --json')
      const migrationsBefore = await payload.find({
        collection: 'payload-migrations',
        limit: 100,
      })
      const migrationBefore = migrationsBefore.docs.find(({ name }) => name === migrationName)

      const output = await cli('migrate:refresh --help')
      const migrationsAfter = await payload.find({
        collection: 'payload-migrations',
        limit: 100,
      })

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:refresh')
      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)?.id).toBe(
        migrationBefore?.id,
      )
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate:reset --json',
    testCLICommand(async (command, { cli, payload }) => {
      await cli('migrate:create reset --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_reset.ts'))!
        .replace('.ts', '')
      await cli('migrate --json')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsBefore.docs.find(({ name }) => name === migrationName)).toBeDefined()

      const output = await cli(command)
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsAfter.docs).toHaveLength(0)

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'migrate:reset',
        result: {
          migrated: [],
          rolledBack: [migrationName],
        },
        success: true,
      })
    }),
  )

  test.options({ db: 'mongo' })(
    'migrate:reset --help',
    testCLICommand(async (_command, { cli, payload }) => {
      await cli('migrate:create reset --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_reset.ts'))!
        .replace('.ts', '')
      await cli('migrate --json')

      const output = await cli('migrate:reset --help')
      const migrationsAfter = await payload.find({
        collection: 'payload-migrations',
        limit: 100,
      })

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:reset')
      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeDefined()
    }),
  )

  test(
    'migrate:status --json',
    testCLICommand(async (command, { cli, payload }) => {
      await cli('migrate:create status --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_status.ts'))!
        .replace('.ts', '')
      const migrationsBefore = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(migrationsBefore.docs.find(({ name }) => name === migrationName)).toBeUndefined()

      const output = await cli(command)

      expect(`${output.stdout}\n${output.stderr}`).toContain(migrationName)
      expect(`${output.stdout}\n${output.stderr}`).toContain('No')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'migrate:status',
        result: [
          {
            name: migrationName,
            ran: false,
          },
        ],
        success: true,
      })
    }),
  )

  test(
    'migrate:status --help',
    testCLICommand(async (_command, { cli, payload }) => {
      await cli('migrate:create status --force-accept-warning --json')
      const migrationName = (await readdir(migrationsDirectory))
        .find((file) => file.endsWith('_status.ts'))!
        .replace('.ts', '')

      const output = await cli('migrate:status --help')
      const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:status')
      expect(`${output.stdout}\n${output.stderr}`).not.toContain(migrationName)
      expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeUndefined()
    }),
  )

  test(
    '--json run ./scripts/example.ts completed',
    testCLICommand(async (command, { cli }) => {
      await expect(access(scriptOutputFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(scriptOutputFile, 'utf8')).resolves.toBe('completed')

      expect(JSON.parse(output.stdout)).toMatchObject({
        command: 'run',
        success: true,
      })
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'run --help',
    testCLICommand(async (_command, { cli }) => {
      await expect(access(scriptOutputFile)).rejects.toThrow()

      const output = await cli('run --help')

      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload run')
      await expect(access(scriptOutputFile)).rejects.toThrow()
    }),
  )

  test(
    'hello --name Payload',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      expect(output.stdout).toContain('Hello, Payload!')
    }),
    CLI_COMMAND_TEST_TIMEOUT,
  )

  test(
    'hello --help',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli('hello --help')
      const help = `${output.stdout}\n${output.stderr}`.replace(/\s+/g, ' ')

      expect(help).toContain('Usage: payload hello')
      expect(help).toContain('--name <name> (required)')
      expect(help).not.toContain('Hello, Payload!')
    }),
  )

  test(
    'fail --json',
    testCLICommand(async (_command, { cli }) => {
      const output = await cli({ command: 'fail --json', reject: false })

      expect(output.exitCode).toBe(1)
      expect(JSON.parse(output.stdout)).toEqual({
        command: 'fail',
        error: {
          code: 'EXPECTED_FAILURE',
          message: 'Expected CLI failure.',
        },
        success: false,
      })
      expect(output.stderr).toContain('Preparing to fail.')
    }),
  )

  test(
    'fail --no-json',
    testCLICommand(async (_command, { cli }) => {
      process.env.PAYLOAD_CLI_JSON = '1'

      const output = await cli({ command: 'fail --no-json', reject: false })

      expect(output.exitCode).toBe(1)
      expect(output.stdout).toContain('Preparing to fail.')
      expect(output.stdout).not.toContain('"success":false')
      expect(output.stderr).toContain('Expected CLI failure.')
    }),
  )
})

async function resetCLIArtifacts(): Promise<void> {
  await rm(generatedDirectory, { force: true, recursive: true })
  await rm(migrationsDirectory, { force: true, recursive: true })
  await rm(schemaFile, { force: true })
  await mkdir(generatedDirectory, { recursive: true })
}

type CLIOutput<TResult = Record<string, unknown>> = {
  command: string
  result: TResult
  success: boolean
}

type CLICommandTestContext = {
  cli: (
    input:
      | {
          command: string
          configPath?: string
          reject?: boolean
        }
      | string,
  ) => Promise<{ exitCode: number; stderr: string; stdout: string }>
  payload: Payload
}

function testCLICommand(
  handler: (command: string, context: CLICommandTestContext) => Promise<void>,
): (context: { task: { name: string } } & CLICommandTestContext) => Promise<void> {
  return async ({ cli, payload, task }) => {
    const previousEnvironment = {
      PAYLOAD_CLI_JSON: process.env.PAYLOAD_CLI_JSON,
      PAYLOAD_CONFIG_PATH: process.env.PAYLOAD_CONFIG_PATH,
      PAYLOAD_DROP_DATABASE: process.env.PAYLOAD_DROP_DATABASE,
      PAYLOAD_FRAMEWORK: process.env.PAYLOAD_FRAMEWORK,
      PAYLOAD_TEST_CLI_CONFIG_LOG: process.env.PAYLOAD_TEST_CLI_CONFIG_LOG,
    }

    await resetCLIArtifacts()
    process.env.PAYLOAD_DROP_DATABASE = 'false'
    process.env.PAYLOAD_FRAMEWORK = 'next'

    try {
      await handler(task.name, { cli, payload })
    } finally {
      try {
        await resetCLIArtifacts()
      } finally {
        for (const [name, value] of Object.entries(previousEnvironment)) {
          if (value === undefined) {
            delete process.env[name]
          } else {
            process.env[name] = value
          }
        }
      }
    }
  }
}
