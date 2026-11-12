import { describe, expect, it, vi } from 'vitest'

import { pushDevSchema } from './pushDevSchema.js'

describe('pushDevSchema', () => {
  it('should retry the schema check after a failed push', async () => {
    const pushSchema = vi.fn().mockRejectedValue(new Error('An explicit migration is required'))
    const adapter = {
      payload: { config: { localization: false } },
      rawTables: { requiresMigration: { columns: {} } },
      requireDrizzleKit: () => ({ pushSchema }),
    }

    await expect(pushDevSchema(adapter as never)).rejects.toThrow(
      'An explicit migration is required',
    )
    await expect(pushDevSchema(adapter as never)).rejects.toThrow(
      'An explicit migration is required',
    )
    expect(pushSchema).toHaveBeenCalledTimes(2)
  })

  it('should retry after applying the generated schema fails', async () => {
    const apply = vi.fn().mockRejectedValue(new Error('Schema application failed'))
    const pushSchema = vi.fn().mockResolvedValue({ apply, hasDataLoss: false, warnings: [] })
    const adapter = {
      payload: { config: { localization: false } },
      rawTables: { cannotApply: { columns: {} } },
      requireDrizzleKit: () => ({ pushSchema }),
    }

    await expect(pushDevSchema(adapter as never)).rejects.toThrow('Schema application failed')
    await expect(pushDevSchema(adapter as never)).rejects.toThrow('Schema application failed')
    expect(apply).toHaveBeenCalledTimes(2)
  })
})
