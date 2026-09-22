import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  migrateAPIKeysToHash: vi.fn(),
  payload: {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
    },
  },
}))

vi.mock('../../../auth/apiKeys/migrateToHash.js', () => ({
  migrateAPIKeysToHash: mocks.migrateAPIKeysToHash,
}))

vi.mock('./initialize.js', () => ({
  initializeMigration: vi.fn().mockImplementation(async () => ({ payload: mocks.payload })),
}))

import { createMigrateAPIKeysCommand } from './apiKeys.js'

describe('createMigrateAPIKeysCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fail when any API key cannot be recovered', async () => {
    mocks.migrateAPIKeysToHash.mockResolvedValue({ failed: 1, migrated: 2, skipped: 3 })

    await expect(
      createMigrateAPIKeysCommand.handler({
        args: {},
        getConfig: vi.fn(),
        getPayload: vi.fn(),
        help: {} as never,
        isJSON: true,
      }),
    ).rejects.toThrow('1 API key(s) could not be recovered')
  })
})
