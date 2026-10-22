import type { Payload, PayloadRequest } from 'payload'

import { acquireMigrationLock, releaseMigrationLock } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { migrationLockRetry } from './migrationLockRetry.js'

describe('migration locking', () => {
  let payload: Payload
  const req = {} as PayloadRequest

  beforeEach(() => {
    payload = {
      db: {
        tryAcquireMigrationLock: vi.fn().mockResolvedValue({ acquired: true }),
        releaseMigrationLock: vi.fn().mockResolvedValue(undefined),
      },
      logger: { warn: vi.fn() },
    } as unknown as Payload
  })

  it('should delegate acquisition without requiring a transaction', async () => {
    const result = await acquireMigrationLock({ payload, req, timeout: 5000 })

    expect(result.acquired).toBe(true)
    expect(result.instanceId).toMatch(/^[0-9a-f-]{36}$/)
    expect(payload.db.tryAcquireMigrationLock).toHaveBeenCalledWith({
      instanceId: result.instanceId,
      timeout: 5000,
    })
  })

  it('should return false when the adapter rejects acquisition', async () => {
    vi.mocked(payload.db.tryAcquireMigrationLock!).mockResolvedValue({ acquired: false })

    expect((await acquireMigrationLock({ payload, req })).acquired).toBe(false)
  })

  it('should propagate database failures', async () => {
    const error = new Error('lock table missing')

    vi.mocked(payload.db.tryAcquireMigrationLock!).mockRejectedValue(error)

    await expect(acquireMigrationLock({ payload, req })).rejects.toBe(error)
  })

  it('should reject adapters without atomic locking', async () => {
    payload.db.tryAcquireMigrationLock = undefined

    await expect(acquireMigrationLock({ payload, req })).rejects.toThrow('does not support')
  })

  it.each([0, -1, NaN, Infinity])('should reject invalid timeout %s', async (timeout) => {
    await expect(acquireMigrationLock({ payload, req, timeout })).rejects.toThrow('timeout')
    expect(payload.db.tryAcquireMigrationLock).not.toHaveBeenCalled()
  })

  it('should bypass locking only with an explicit bootstrap opt-out', async () => {
    const result = await acquireMigrationLock({ payload, req, skipLock: true })

    expect(result).toEqual({ acquired: true, instanceId: 'no-lock' })
    expect(payload.db.tryAcquireMigrationLock).not.toHaveBeenCalled()
    expect(payload.logger.warn).toHaveBeenCalled()
    await releaseMigrationLock({ payload, req, instanceId: result.instanceId })
    expect(payload.db.releaseMigrationLock).not.toHaveBeenCalled()
  })

  it('should delegate release with the owner ID', async () => {
    await releaseMigrationLock({ payload, req, instanceId: 'owner' })

    expect(payload.db.releaseMigrationLock).toHaveBeenCalledWith({ instanceId: 'owner' })
  })

  it('should propagate release failures', async () => {
    const error = new Error('connection lost')

    vi.mocked(payload.db.releaseMigrationLock!).mockRejectedValue(error)

    await expect(releaseMigrationLock({ payload, req, instanceId: 'owner' })).rejects.toBe(error)
  })
})

describe('SQLite lock contention', () => {
  it('should retry wrapped writer contention', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('query failed', { cause: { code: 'SQLITE_BUSY' } }))
      .mockResolvedValue('acquired')

    await expect(migrationLockRetry({ isSQLite: true, operation })).resolves.toBe('acquired')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('should stop retrying after bounded contention', async () => {
    const error = { code: 'SQLITE_LOCKED' }
    const operation = vi.fn().mockRejectedValue(error)

    await expect(migrationLockRetry({ isSQLite: true, operation })).rejects.toBe(error)
    expect(operation).toHaveBeenCalledTimes(6)
  })

  it.each([true, false])('should propagate unrelated failures (SQLite: %s)', async (isSQLite) => {
    const error = new Error('schema missing')
    const operation = vi.fn().mockRejectedValue(error)

    await expect(migrationLockRetry({ isSQLite, operation })).rejects.toBe(error)
    expect(operation).toHaveBeenCalledTimes(1)
  })
})
