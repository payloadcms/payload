import { describe, expect, it, vi } from 'vitest'

import type { SQLiteAdapter } from './types.js'

import { createTransactionHandlers } from './createTransactionHandlers.js'

describe('SQLite caller transaction admission', () => {
  it('should reject a contender before invoking a second native BEGIN', async () => {
    const { handlers, nativeBegin } = setup({})

    await handlers.beginTransaction()
    await expect(handlers.beginTransaction()).rejects.toMatchObject({ code: 'SQLITE_BUSY' })
    expect(nativeBegin).toHaveBeenCalledTimes(1)
    await handlers.commitTransaction('tx')
    await expect(handlers.beginTransaction()).resolves.toBe('tx')
  })

  it('should hold admission while native BEGIN is pending', async () => {
    let release!: (id: string) => void
    const nativeBegin = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          release = resolve
        }),
    )
    const { handlers } = setup({ nativeBegin })
    const pending = handlers.beginTransaction()

    await expect(handlers.beginTransaction()).rejects.toMatchObject({ code: 'SQLITE_BUSY' })
    release('tx')
    await pending
    await handlers.rollbackTransaction('tx')
  })

  it('should release admission when native BEGIN fails or returns no transaction', async () => {
    const error = new Error('External database busy')
    const nativeBegin = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(null)
      .mockResolvedValue('tx')
    const { handlers } = setup({ nativeBegin })

    await expect(handlers.beginTransaction()).rejects.toBe(error)
    await expect(handlers.beginTransaction()).resolves.toBeNull()
    await expect(handlers.beginTransaction()).resolves.toBe('tx')
  })

  it('should not release admission for an unknown transaction ID', async () => {
    const { handlers } = setup({})

    await handlers.beginTransaction()
    await handlers.commitTransaction('unknown')
    await handlers.rollbackTransaction('unknown')
    await expect(handlers.beginTransaction()).rejects.toMatchObject({ code: 'SQLITE_BUSY' })
    await handlers.rollbackTransaction('tx')
    await expect(handlers.beginTransaction()).resolves.toBe('tx')
  })

  it('should retain admission until native commit settles despite a duplicate commit', async () => {
    let release!: () => void
    const nativeCommit = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            release = resolve
          }),
      )
      .mockResolvedValue(undefined)
    const { handlers } = setup({ nativeCommit })

    await handlers.beginTransaction()
    const pending = handlers.commitTransaction('tx')

    await Promise.resolve()
    await handlers.commitTransaction('tx')
    await expect(handlers.beginTransaction()).rejects.toMatchObject({ code: 'SQLITE_BUSY' })
    release()
    await pending
    await expect(handlers.beginTransaction()).resolves.toBe('tx')
  })

  it('should release admission and propagate a native commit failure', async () => {
    const error = new Error('Native commit failed')
    const { handlers } = setup({ nativeCommit: vi.fn().mockRejectedValue(error) })

    await handlers.beginTransaction()
    await expect(handlers.commitTransaction('tx')).rejects.toBe(error)
    await expect(handlers.beginTransaction()).resolves.toBe('tx')
  })

  it('should release admission and propagate a native rollback failure', async () => {
    const error = new Error('Native rollback failed')
    const { handlers } = setup({ nativeRollback: vi.fn().mockRejectedValue(error) })

    await handlers.beginTransaction()
    await expect(handlers.rollbackTransaction('tx')).rejects.toBe(error)
    await expect(handlers.beginTransaction()).resolves.toBe('tx')
  })
})

const setup = ({
  nativeBegin = vi.fn().mockResolvedValue('tx'),
  nativeCommit = vi.fn().mockResolvedValue(undefined),
  nativeRollback = vi.fn().mockResolvedValue(undefined),
}: {
  nativeBegin?: ReturnType<typeof vi.fn>
  nativeCommit?: ReturnType<typeof vi.fn>
  nativeRollback?: ReturnType<typeof vi.fn>
}) => {
  const adapter = {
    beginTransaction: nativeBegin,
    commitTransaction: nativeCommit,
    rollbackTransaction: nativeRollback,
  } as unknown as SQLiteAdapter

  return {
    handlers: createTransactionHandlers({ adapter }),
    nativeBegin,
    nativeCommit,
    nativeRollback,
  }
}
