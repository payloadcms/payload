import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CLICommand, CLIRuntime, SanitizedConfig } from '../config/types.js'
import type { Payload } from '../index.js'

import { createCountDocumentsCommand } from './commands/collections/countDocuments.js'
import { createCreateDocumentsCommand } from './commands/collections/createDocuments.js'
import { createDeleteDocumentsCommand } from './commands/collections/deleteDocuments.js'
import { createFindDocumentsCommand } from './commands/collections/findDocuments.js'
import { createGetCollectionSchemaCommand } from './commands/collections/getCollectionSchema.js'
import { createUpdateDocumentCommand } from './commands/collections/updateDocument.js'
import { createCLI } from './index.js'

const makePayload = (methods: Record<string, unknown> = {}): Payload =>
  ({
    collections: {
      posts: {
        config: {
          flattenedFields: [],
          slug: 'posts',
        },
      },
    },
    config: {
      collections: [{ flattenedFields: [], slug: 'posts' }],
      globals: [{ flattenedFields: [], slug: 'settings' }],
      upload: { limits: {} },
    },
    ...methods,
  }) as unknown as Payload

const runDataCommand = async ({
  args,
  commandName,
  createCommand,
  payload,
}: {
  args: string[]
  commandName: string
  createCommand: CLICommand
  payload: Payload
}): Promise<string> => {
  const runtime: CLIRuntime = {
    configDir: process.cwd(),
    destroy: async () => undefined,
    getConfig: async () =>
      ({ cli: { commands: { [commandName]: createCommand } } }) as SanitizedConfig,
    getPayload: vi.fn().mockResolvedValue(payload),
    isScheduled: false,
    markScheduled: () => undefined,
  }
  const cli = await createCLI(runtime)
  const command = cli.commands.find((item) => item.name() === commandName)!
  let output = ''

  command.configureOutput({
    writeErr: () => undefined,
    writeOut: (value) => (output += value),
  })

  await cli.parseAsync([commandName, ...args], { from: 'user' })

  return output
}

describe('Payload data CLI', () => {
  const temporaryDirectories: string[] = []

  afterEach(() => {
    process.exitCode = undefined
    vi.restoreAllMocks()
    for (const directory of temporaryDirectories) {
      rmSync(directory, { force: true, recursive: true })
    }
    temporaryDirectories.length = 0
  })

  it('should register MCP-style commands with Commander', async () => {
    const runtime: CLIRuntime = {
      configDir: process.cwd(),
      destroy: async () => undefined,
      getConfig: async () =>
        ({
          cli: {
            commands: {
              createDocuments: createCreateDocumentsCommand,
              getCollectionSchema: createGetCollectionSchemaCommand,
            },
          },
        }) as SanitizedConfig,
      getPayload: vi.fn(),
      isScheduled: false,
      markScheduled: () => undefined,
    }
    const cli = await createCLI(runtime)

    expect(cli.commands.map((command) => command.name())).toEqual([
      'createDocuments',
      'getCollectionSchema',
    ])
  })

  it('should always bypass access control', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 2 })
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ count })

    await runDataCommand({
      args: ['--slug', 'posts', '--where', '{"status":{"equals":"published"}}'],
      commandName: 'countDocuments',
      createCommand: createCountDocumentsCommand,
      payload,
    })

    expect(count).toHaveBeenCalledWith({
      collection: 'posts',
      locale: undefined,
      overrideAccess: true,
      trash: undefined,
      where: { status: { equals: 'published' } },
    })
    expect(log).toHaveBeenCalledWith('{\n  "totalDocs": 2\n}')
  })

  it('should use the shared JSON output when --json is passed', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 2 })
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ count })

    const output = await runDataCommand({
      args: ['--slug', 'posts', '--json'],
      commandName: 'countDocuments',
      createCommand: createCountDocumentsCommand,
      payload,
    })

    expect(log).not.toHaveBeenCalled()
    expect(JSON.parse(output)).toEqual({
      command: 'countDocuments',
      result: { totalDocs: 2 },
      success: true,
    })
  })

  it('should read JSON arguments from local files', async () => {
    const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'payload-data-cli-'))
    const wherePath = path.join(temporaryDirectory, 'where.json')
    const count = vi.fn().mockResolvedValue({ totalDocs: 1 })
    const payload = makePayload({ count })

    temporaryDirectories.push(temporaryDirectory)
    writeFileSync(wherePath, '{"title":{"equals":"from-file"}}')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runDataCommand({
      args: ['--slug', 'posts', '--where', `@${wherePath}`],
      commandName: 'countDocuments',
      createCommand: createCountDocumentsCommand,
      payload,
    })

    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { title: { equals: 'from-file' } } }),
    )
  })

  it('should accept complete semantic input as JSON', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 1 })
    const payload = makePayload({ count })

    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runDataCommand({
      args: ['--input', '{"slug":"posts","where":{"status":{"equals":"draft"}}}'],
      commandName: 'countDocuments',
      createCommand: createCountDocumentsCommand,
      payload,
    })

    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { equals: 'draft' } } }),
    )
  })

  it('should reject unknown JSON input properties', async () => {
    const payload = makePayload({ count: vi.fn() })

    expect(createCountDocumentsCommand.schema).toMatchObject({ additionalProperties: false })
    await expect(
      runDataCommand({
        args: ['--input', '{"slug":"posts","collection":"pages"}'],
        commandName: 'countDocuments',
        createCommand: createCountDocumentsCommand,
        payload,
      }),
    ).rejects.toThrow('Invalid command input')
  })

  it('should create multiple documents and convert schema-friendly point values', async () => {
    const create = vi.fn(async ({ data }) => ({ id: data.title }))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ create })

    await runDataCommand({
      args: [
        '--slug',
        'posts',
        '--documents',
        '{"data":{"title":"one","location":{"longitude":1,"latitude":2}},"file":"./one.png"}',
        '--documents',
        '{"data":{"title":"two"}}',
      ],
      commandName: 'createDocuments',
      createCommand: createCreateDocumentsCommand,
      payload,
    })

    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[0]![0]).toMatchObject({
      collection: 'posts',
      data: { location: [1, 2], title: 'one' },
      filePath: path.resolve(process.cwd(), 'one.png'),
      overrideAccess: true,
    })
    expect(create.mock.calls[1]![0]).toMatchObject({
      data: { title: 'two' },
      filePath: undefined,
    })
  })

  it('should include partial create failures in JSON output and the exit code', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ id: 'one' })
      .mockRejectedValueOnce(new Error('Could not create document.'))
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ create })

    const output = await runDataCommand({
      args: [
        '--slug',
        'posts',
        '--documents',
        '{"data":{"title":"one"}}',
        '--documents',
        '{"data":{"title":"two"}}',
        '--json',
      ],
      commandName: 'createDocuments',
      createCommand: createCreateDocumentsCommand,
      payload,
    })

    expect(log).not.toHaveBeenCalled()
    expect(JSON.parse(output)).toEqual({
      command: 'createDocuments',
      exitCode: 1,
      result: {
        docs: [{ doc: { id: 'one' }, index: 0 }],
        errors: [{ index: 1, message: 'Could not create document.' }],
      },
      success: false,
    })
  })

  it('should pass a resolved local file path to upload operations', async () => {
    const update = vi.fn().mockResolvedValue({ id: '1' })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ update })

    await runDataCommand({
      args: ['--slug', 'posts', '--id', '1', '--data', '{}', '--file', './logo.png'],
      commandName: 'updateDocument',
      createCommand: createUpdateDocumentCommand,
      payload,
    })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: path.resolve(process.cwd(), 'logo.png'),
        id: 1,
        overrideAccess: true,
      }),
    )
  })

  it('should reject destructive collection commands without an id or where clause', async () => {
    const payload = makePayload({ delete: vi.fn() })

    await expect(
      runDataCommand({
        args: ['--slug', 'posts'],
        commandName: 'deleteDocuments',
        createCommand: createDeleteDocumentsCommand,
        payload,
      }),
    ).rejects.toThrow('Either id or where must be provided.')
  })

  it('should parse boolean flags before Zod validation', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const payload = makePayload({ find })

    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runDataCommand({
      args: ['--slug', 'posts', '--draft', '--trash'],
      commandName: 'findDocuments',
      createCommand: createFindDocumentsCommand,
      payload,
    })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: true,
        trash: true,
      }),
    )
  })

  it('should parse negated boolean flags', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const update = vi.fn().mockResolvedValue({ id: 1 })
    const payload = makePayload({ find, update })

    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runDataCommand({
      args: ['--slug', 'posts', '--no-pagination'],
      commandName: 'findDocuments',
      createCommand: createFindDocumentsCommand,
      payload,
    })
    await runDataCommand({
      args: ['--slug', 'posts', '--id', '1', '--data', '{}', '--no-override-lock'],
      commandName: 'updateDocument',
      createCommand: createUpdateDocumentCommand,
      payload,
    })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ pagination: false }))
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ overrideLock: false }))
  })

  it('should reject unknown options before loading command data', async () => {
    const payload = makePayload({ count: vi.fn() })

    await expect(
      runDataCommand({
        args: ['--slug', 'posts', '--unknown'],
        commandName: 'countDocuments',
        createCommand: createCountDocumentsCommand,
        payload,
      }),
    ).rejects.toThrow("unknown option '--unknown'")
  })

  it('should generate command help from input schemas', async () => {
    const payload = makePayload()
    const runtime: CLIRuntime = {
      configDir: process.cwd(),
      destroy: async () => undefined,
      getConfig: async () =>
        ({ cli: { commands: { findDocuments: createFindDocumentsCommand } } }) as SanitizedConfig,
      getPayload: vi.fn().mockResolvedValue(payload),
      isScheduled: false,
      markScheduled: () => undefined,
    }
    const cli = await createCLI(runtime)
    const command = cli.commands.find((item) => item.name() === 'findDocuments')!

    const help = command.helpInformation()

    expect(help).toContain('Usage: payload findDocuments [options]')
    expect(help).toContain('--slug <slug>')
    expect(help).toContain('--draft')
    expect(help).toContain('--limit <number>')
  })
})
