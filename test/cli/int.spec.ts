/* eslint-disable vitest/no-conditional-expect */
import type { CLIRuntime, Payload } from 'payload'

import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCLI } from 'payload/cli'
import { getCommandInput } from 'payload/internal'
import { parseArgsStringToArgv } from 'string-argv'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { clearAndSeedEverything } from './seed.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const generatedDirectory = path.resolve(dirname, 'generated')
const importMapFile = path.resolve(generatedDirectory, 'importMap.js')
const inputFile = path.resolve(generatedDirectory, 'input.json')
const migrationsDirectory = path.resolve(dirname, 'migrations')
const schemaFile = path.resolve(dirname, 'payload-generated-schema.ts')
const scriptOutputFile = path.resolve(generatedDirectory, 'script-output.txt')
const typesFile = path.resolve(generatedDirectory, 'payload-types.ts')

process.env.SQLITE_URL ??= `file:${path.resolve(dirname, 'payload.db')}`

test.describe('CLI', () => {
  test.beforeAll(() => {
    process.env.PAYLOAD_FRAMEWORK = 'next'
  })

  test.beforeEach(async ({ payload }) => {
    await resetCLIState({ payload })
  })

  test.afterAll(async () => {
    await rm(generatedDirectory, { force: true, recursive: true })
    await rm(migrationsDirectory, { force: true, recursive: true })
    await rm(schemaFile, { force: true })
  })

  test(
    'build --no-types -- --help',
    testCLICommand(async (command, { cli }) => {
      await expect(access(importMapFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(importMapFile, 'utf8')).resolves.toContain('export const importMap')
      expect(`${output.stdout}\n${output.stderr}`).toContain('Usage:')

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'build',
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"build"')
      }
    }),
  )

  test('build --help', async ({ cli }) => {
    await expect(access(importMapFile)).rejects.toThrow()

    const output = await cli('build --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload build')
    await expect(access(importMapFile)).rejects.toThrow()
  })

  test.options({ db: 'drizzle' })(
    'generate:db-schema --no-log',
    testCLICommand(async (command, { cli }) => {
      await expect(access(schemaFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(schemaFile, 'utf8')).resolves.toContain('export const pages')

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'generate:db-schema',
          result: { outputFile: schemaFile },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"generate:db-schema"')
      }
    }),
  )

  test.options({ db: 'drizzle' })('generate:db-schema --help', async ({ cli }) => {
    await expect(access(schemaFile)).rejects.toThrow()

    const output = await cli('generate:db-schema --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload generate:db-schema')
    await expect(access(schemaFile)).rejects.toThrow()
  })

  test(
    'generate:importmap',
    testCLICommand(async (command, { cli }) => {
      await expect(access(importMapFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(importMapFile, 'utf8')).resolves.toContain('export const importMap')

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'generate:importmap',
          result: {
            outputFile: importMapFile,
            written: true,
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"generate:importmap"')
      }
    }),
  )

  test('generate:importmap --help', async ({ cli }) => {
    await expect(access(importMapFile)).rejects.toThrow()

    const output = await cli('generate:importmap --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload generate:importmap')
    await expect(access(importMapFile)).rejects.toThrow()
  })

  test(
    'generate:types',
    testCLICommand(async (command, { cli }) => {
      await expect(access(typesFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(typesFile, 'utf8')).resolves.toContain('export interface Page')

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'generate:types',
          result: {
            outputFile: typesFile,
            written: true,
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"generate:types"')
      }
    }),
  )

  test('generate:types --help', async ({ cli }) => {
    await expect(access(typesFile)).rejects.toThrow()

    const output = await cli('generate:types --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload generate:types')
    await expect(access(typesFile)).rejects.toThrow()
  })

  test(
    'help',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      if (!command.includes('--json')) {
        expect(output.stdout).toContain('Manage and operate a local Payload project.')
        expect(output.stdout).toContain('generate:types')
        return
      }

      const response = JSON.parse(output.stdout) as CLIOutput<{
        commands: Array<{ name: string }>
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
    }),
  )

  test('help --help', async ({ cli }) => {
    const output = await cli('help --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload help')
  })

  test(
    'info',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      if (!command.includes('--json')) {
        expect(output.stdout).toContain('Binaries:')
        expect(output.stdout).toContain(`Node: ${process.versions.node}`)
        return
      }

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

  test('info --help', async ({ cli }) => {
    const output = await cli('info --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload info')
  })

  test('info --help --json', async ({ cli }) => {
    const helpOptionOutput = await cli('info --help --json')
    const helpCommandOutput = await cli('help info --json')

    expect(JSON.parse(helpOptionOutput.stdout)).toEqual(JSON.parse(helpCommandOutput.stdout))
  })

  test(
    'jobs:handle-schedules --all-queues',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'jobs:handle-schedules',
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"jobs:handle-schedules"')
      }
    }),
  )

  test('jobs:handle-schedules --help', async ({ cli, payload }) => {
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
  })

  test.options({ db: 'mongo' })(
    'jobs:run --all-queues --limit 1',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'jobs:run',
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"jobs:run"')
      }
    }),
  )

  test.options({ db: 'mongo' })('jobs:run --help', async ({ cli, payload }) => {
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
  })

  test.options({ db: 'mongo' })(
    'migrate',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'migrate',
          result: {
            migrated: [migrationName],
            rolledBack: [],
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"migrate"')
      }
    }),
  )

  test.options({ db: 'mongo' })('migrate --help', async ({ cli, payload }) => {
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
  })

  test(
    'migrate:create cli-test --force-accept-warning',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'migrate:create',
          result: {
            created: true,
            path: expect.stringContaining(migrationFile!),
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"migrate:create"')
      }
    }),
  )

  test('migrate:create --help', async ({ cli }) => {
    await expect(access(migrationsDirectory)).rejects.toThrow()

    const output = await cli('migrate:create --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:create')
    await expect(access(migrationsDirectory)).rejects.toThrow()
  })

  test.options({ db: 'mongo' })(
    'migrate:down',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'migrate:down',
          result: {
            migrated: [],
            rolledBack: [migrationName],
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"migrate:down"')
      }
    }),
  )

  test.options({ db: 'mongo' })('migrate:down --help', async ({ cli, payload }) => {
    await cli('migrate:create down --force-accept-warning --json')
    const migrationName = (await readdir(migrationsDirectory))
      .find((file) => file.endsWith('_down.ts'))!
      .replace('.ts', '')
    await cli('migrate --json')

    const output = await cli('migrate:down --help')
    const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:down')
    expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeDefined()
  })

  test.options({ db: 'mongo' })(
    'migrate:fresh --force-accept-warning',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'migrate:fresh',
          result: {
            migrated: [migrationName],
            rolledBack: [],
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"migrate:fresh"')
      }
    }),
  )

  test.options({ db: 'mongo' })('migrate:fresh --help', async ({ cli, payload }) => {
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
  })

  test.options({ db: 'mongo' })(
    'migrate:refresh',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'migrate:refresh',
          result: {
            migrated: [migrationName],
            rolledBack: [migrationName],
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"migrate:refresh"')
      }
    }),
  )

  test.options({ db: 'mongo' })('migrate:refresh --help', async ({ cli, payload }) => {
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
  })

  test.options({ db: 'mongo' })(
    'migrate:reset',
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

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'migrate:reset',
          result: {
            migrated: [],
            rolledBack: [migrationName],
          },
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"migrate:reset"')
      }
    }),
  )

  test.options({ db: 'mongo' })('migrate:reset --help', async ({ cli, payload }) => {
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
  })

  test(
    'migrate:status',
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

      if (command.includes('--json')) {
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
      } else {
        expect(output.stdout).not.toContain('"command":"migrate:status"')
      }
    }),
  )

  test('migrate:status --help', async ({ cli, payload }) => {
    await cli('migrate:create status --force-accept-warning --json')
    const migrationName = (await readdir(migrationsDirectory))
      .find((file) => file.endsWith('_status.ts'))!
      .replace('.ts', '')

    const output = await cli('migrate:status --help')
    const migrationsAfter = await payload.find({ collection: 'payload-migrations', limit: 100 })

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload migrate:status')
    expect(`${output.stdout}\n${output.stderr}`).not.toContain(migrationName)
    expect(migrationsAfter.docs.find(({ name }) => name === migrationName)).toBeUndefined()
  })

  test(
    'run ./scripts/example.ts completed',
    testCLICommand(async (command, { cli }) => {
      await expect(access(scriptOutputFile)).rejects.toThrow()

      const output = await cli(command)

      await expect(readFile(scriptOutputFile, 'utf8')).resolves.toBe('completed')

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'run',
          success: true,
        })
      } else {
        expect(output.stdout).not.toContain('"command":"run"')
      }
    }),
  )

  test('run --help', async ({ cli }) => {
    await expect(access(scriptOutputFile)).rejects.toThrow()

    const output = await cli('run --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload run')
    await expect(access(scriptOutputFile)).rejects.toThrow()
  })

  test(
    'hello --name Payload',
    testCLICommand(async (command, { cli }) => {
      const output = await cli(command)

      if (command.includes('--json')) {
        expect(JSON.parse(output.stdout)).toMatchObject({
          command: 'hello',
          result: { message: 'Hello, Payload!' },
          success: true,
        })
      } else {
        expect(output.stdout).toContain('Hello, Payload!')
      }
    }),
  )

  test('hello --help', async ({ cli }) => {
    const output = await cli('hello --help')

    expect(`${output.stdout}\n${output.stderr}`).toContain('Usage: payload hello')
    expect(`${output.stdout}\n${output.stderr}`).not.toContain('Hello, Payload!')
  })
})

async function resetCLIState({ payload }: { payload: Payload }): Promise<void> {
  await rm(generatedDirectory, { force: true, recursive: true })
  await rm(migrationsDirectory, { force: true, recursive: true })
  await rm(schemaFile, { force: true })
  await mkdir(generatedDirectory, { recursive: true })
  process.env.PAYLOAD_DROP_DATABASE = 'false'

  await payload.delete({
    collection: 'payload-jobs',
    where: { id: { exists: true } },
  } as never)
  await clearAndSeedEverything(payload)
}

type CLIOutput<TResult = Record<string, unknown>> = {
  command: string
  result: TResult
  success: boolean
}

type CLICommandTestContext = {
  cli: (command: string) => Promise<{ stderr: string; stdout: string }>
  payload: Payload
}

function testCLICommand(
  handler: (command: string, context: CLICommandTestContext) => Promise<void>,
): (context: { task: { name: string } } & CLICommandTestContext) => Promise<void> {
  return async ({ cli, payload, task }) => {
    const command = task.name
    const args = parseArgsStringToArgv(command)
    const commandName = args[0]!
    const variants = [
      [false, 'shell'],
      [true, 'shell'],
      [false, 'inline'],
      [true, 'inline'],
      [false, 'file'],
      [true, 'file'],
    ] as const

    for (const [index, [isJSON, source]] of variants.entries()) {
      if (index > 0) {
        await resetCLIState({ payload })
      }

      let commandToRun = command

      if (source !== 'shell') {
        const runtime: CLIRuntime = {
          configDir: dirname,
          destroy: () => Promise.resolve(),
          getConfig: () => Promise.resolve(payload.config),
          getPayload: () => Promise.resolve(payload),
          isScheduled: false,
          markScheduled: () => undefined,
        }
        const parserCLI = await createCLI(runtime)
        const parsedCommand = parserCLI.commands.find(
          (command) => command.name() === commandName || command.aliases().includes(commandName),
        )

        if (!parsedCommand) {
          throw new Error(`Could not find CLI command '${commandName}'.`)
        }

        parsedCommand.action(() => undefined)
        await parserCLI.parseAsync(['node', 'payload', ...args])

        const input = JSON.stringify(await getCommandInput(parsedCommand))

        if (source === 'file') {
          await writeFile(inputFile, input)
          commandToRun = `${commandName} --input @${inputFile}`
        } else {
          commandToRun = `${commandName} --input '${input}'`
        }
      }

      if (isJSON) {
        commandToRun = `--json ${commandToRun}`
      }

      await handler(commandToRun, { cli, payload })
    }
  }
}
