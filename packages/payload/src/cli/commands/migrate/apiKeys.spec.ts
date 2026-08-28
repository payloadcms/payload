import type { CLIHelp } from '../../../config/types.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const migrateAPIKeysMock = vi.fn(async () => ({ migrated: 1, scrubbed: 2, skipped: 3 }))
const infoMock = vi.fn()
const fakePayload = { logger: { info: infoMock } } as never
const initializeMigrationMock = vi.fn(async () => ({ adapter: {} as never, payload: fakePayload }))

vi.mock('../../../auth/apiKeys/migration.js', () => ({ migrateAPIKeys: migrateAPIKeysMock }))
vi.mock('./initialize.js', () => ({ initializeMigration: initializeMigrationMock }))

const { createMigrateAPIKeysCommand } = await import('./apiKeys.js')

const getPayload = vi.fn()
const getConfig = vi.fn()
const help = {} as CLIHelp

describe('createMigrateAPIKeysCommand', () => {
  beforeEach(() => {
    migrateAPIKeysMock.mockClear()
    infoMock.mockClear()
    initializeMigrationMock.mockClear()
  })

  it('disables the API key startup guard while initializing', async () => {
    await createMigrateAPIKeysCommand.handler({ args: {}, getConfig, getPayload, help })

    expect(initializeMigrationMock).toHaveBeenCalledWith(
      expect.objectContaining({ disableAPIKeyStartupGuard: true, getPayload }),
    )
  })

  it('defaults to no dry run, no batch size override, and no collection filter', async () => {
    await createMigrateAPIKeysCommand.handler({ args: {}, getConfig, getPayload, help })

    expect(migrateAPIKeysMock).toHaveBeenCalledWith({
      batchSize: undefined,
      collections: undefined,
      dryRun: false,
      payload: fakePayload,
    })
  })

  it('forwards dry run, batch size, and collections to migrateAPIKeys', async () => {
    await createMigrateAPIKeysCommand.handler({
      args: { batchSize: 50, collections: ['users', 'admins'], dryRun: true },
      getConfig,
      getPayload,
      help,
    })

    expect(migrateAPIKeysMock).toHaveBeenCalledWith({
      batchSize: 50,
      collections: ['users', 'admins'],
      dryRun: true,
      payload: fakePayload,
    })
  })

  it('logs the migration result and a completion message', async () => {
    await createMigrateAPIKeysCommand.handler({ args: {}, getConfig, getPayload, help })

    expect(infoMock).toHaveBeenCalledWith('migrated: 1, scrubbed: 2, skipped: 3')
    expect(infoMock).toHaveBeenCalledWith('Done.')
  })

  it('prefixes the logged result with [dry run] when dryRun is set', async () => {
    await createMigrateAPIKeysCommand.handler({
      args: { dryRun: true },
      getConfig,
      getPayload,
      help,
    })

    expect(infoMock).toHaveBeenCalledWith('[dry run] migrated: 1, scrubbed: 2, skipped: 3')
  })
})
