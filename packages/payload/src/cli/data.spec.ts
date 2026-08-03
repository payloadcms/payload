import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CLIArgs, CLICommand } from '../config/types.js'
import type { Payload } from '../index.js'

import { createCountDocumentsCommand } from './commands/collections/countDocuments.js'
import { createCreateDocumentsCommand } from './commands/collections/createDocuments.js'
import { createDeleteDocumentsCommand } from './commands/collections/deleteDocuments.js'
import { createFindDocumentsCommand } from './commands/collections/findDocuments.js'
import { createGetCollectionSchemaCommand } from './commands/collections/getCollectionSchema.js'
import { createUpdateDocumentCommand } from './commands/collections/updateDocument.js'

type DataCommand = CLICommand

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
  createCommand,
  payload,
}: {
  args: string[]
  createCommand: DataCommand
  payload: Payload
}): Promise<void> => {
  const cliArgs = {
    getConfig: vi.fn(),
    getPayload: vi.fn().mockResolvedValue(payload),
    run: vi.fn<CLIArgs['run']>(async ({ handler }) => {
      const exitCode = await handler()

      if (typeof exitCode === 'number') {
        process.exitCode = exitCode
      }
    }),
  } satisfies CLIArgs
  const command = createCommand(cliArgs)
    .exitOverride()
    .configureOutput({
      writeErr: () => undefined,
    })
  const program = new Command().name('payload').exitOverride().addCommand(command)

  await program.parseAsync([command.name(), ...args], { from: 'user' })
}

describe('Payload data CLI', () => {
  const temporaryDirectories: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const directory of temporaryDirectories) {
      rmSync(directory, { force: true, recursive: true })
    }
    temporaryDirectories.length = 0
  })

  it('should register MCP-style commands with Commander', () => {
    const args = {} as CLIArgs
    const createDocuments = createCreateDocumentsCommand(args)
    const getCollectionSchema = createGetCollectionSchemaCommand(args)

    expect(createDocuments.name()).toBe('createDocuments')
    expect(getCollectionSchema.name()).toBe('getCollectionSchema')
  })

  it('should always bypass access control', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 2 })
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ count })

    await runDataCommand({
      args: ['--slug', 'posts', '--where', '{"status":{"equals":"published"}}'],
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
      createCommand: createCountDocumentsCommand,
      payload,
    })

    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { title: { equals: 'from-file' } } }),
    )
  })

  it('should create multiple documents and convert schema-friendly point values', async () => {
    const create = vi.fn(async ({ data }) => ({ id: data.title }))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ create })

    await runDataCommand({
      args: [
        '--slug',
        'posts',
        '--data',
        '{"title":"one","location":{"longitude":1,"latitude":2}}',
        '--data',
        '{"title":"two"}',
      ],
      createCommand: createCreateDocumentsCommand,
      payload,
    })

    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[0]![0]).toMatchObject({
      collection: 'posts',
      data: { location: [1, 2], title: 'one' },
      overrideAccess: true,
    })
  })

  it('should pass a resolved local file path to upload operations', async () => {
    const update = vi.fn().mockResolvedValue({ id: '1' })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const payload = makePayload({ update })

    await runDataCommand({
      args: ['--slug', 'posts', '--id', '1', '--data', '{}', '--file', './logo.png'],
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
        createCommand: createDeleteDocumentsCommand,
        payload,
      }),
    ).rejects.toThrow('Either --id or --where must be provided.')
  })

  it('should parse boolean flags before Zod validation', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const payload = makePayload({ find })

    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runDataCommand({
      args: ['--slug', 'posts', '--draft', '--trash'],
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
      createCommand: createFindDocumentsCommand,
      payload,
    })
    await runDataCommand({
      args: ['--slug', 'posts', '--id', '1', '--data', '{}', '--no-override-lock'],
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
        createCommand: createCountDocumentsCommand,
        payload,
      }),
    ).rejects.toThrow("unknown option '--unknown'")
  })

  it('should validate repeated files against document data', async () => {
    const payload = makePayload({ create: vi.fn() })

    await expect(
      runDataCommand({
        args: [
          '--slug',
          'posts',
          '--data',
          '{"title":"one"}',
          '--data',
          '{"title":"two"}',
          '--file',
          './one.png',
        ],
        createCommand: createCreateDocumentsCommand,
        payload,
      }),
    ).rejects.toThrow('Pass one --file for each document')
  })

  it('should generate command help from option definitions', () => {
    const program = new Command().name('payload')
    const command = createFindDocumentsCommand({} as CLIArgs)

    program.addCommand(command)

    const help = command.helpInformation()

    expect(help).toContain('Usage: payload findDocuments [options]')
    expect(help).toContain('--slug <collection>')
    expect(help).toContain('--draft')
    expect(help).toContain('--limit <number>')
    expect(help).toContain('default: 10')
  })
})
