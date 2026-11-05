import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initializeMigration } from './initialize.js'
import { createMigrateCommand } from './run.js'

vi.mock('./initialize.js', () => ({ initializeMigration: vi.fn() }))

describe('migrate bootstrap option', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each([undefined, true])(
    'should forward explicit skipLock %s to the adapter',
    async (skipLock) => {
      const migrate = vi.fn().mockResolvedValue({ migrated: [], rolledBack: [] })

      vi.mocked(initializeMigration).mockResolvedValue({
        adapter: { migrate },
        payload: { logger: { info: vi.fn() } },
      } as unknown as Awaited<ReturnType<typeof initializeMigration>>)

      await createMigrateCommand.handler({
        args: createMigrateCommand.input!.parse({ skipLock }),
        getPayload: vi.fn(),
        isJSON: true,
      } as unknown as Parameters<typeof createMigrateCommand.handler>[0])

      expect(migrate).toHaveBeenCalledWith({
        forceAcceptWarning: undefined,
        shouldPrompt: false,
        skipLock,
      })
    },
  )
})
