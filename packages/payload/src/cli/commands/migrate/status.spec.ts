import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initializeMigration } from './initialize.js'
import { createMigrateStatusCommand } from './status.js'

vi.mock('./initialize.js', () => ({ initializeMigration: vi.fn() }))

describe('migrate:status', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each([
    { offset: -100000, status: 'STALE' },
    { offset: 100000, status: 'Active' },
  ])('should report $status for an ISO string expiry', async ({ offset, status }) => {
    const info = vi.fn()

    vi.mocked(initializeMigration).mockResolvedValue({
      adapter: { migrateStatus: vi.fn().mockResolvedValue(undefined) },
      payload: {
        findGlobal: vi.fn().mockResolvedValue({
          locked: true,
          expires_at: new Date(Date.now() + offset).toISOString(),
        }),
        logger: { info },
      },
    } as unknown as Awaited<ReturnType<typeof initializeMigration>>)

    await createMigrateStatusCommand.handler({
      getPayload: vi.fn(),
      isJSON: false,
    } as unknown as Parameters<typeof createMigrateStatusCommand.handler>[0])

    expect(info).toHaveBeenCalledWith({ msg: `  Status: ${status}` })
  })
})
