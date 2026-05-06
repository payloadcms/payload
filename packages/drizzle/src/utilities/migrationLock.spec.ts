import type { Payload } from 'payload'

import { describe, it, expect, vi, beforeEach } from 'vitest'

import { acquireMigrationLock, releaseMigrationLock } from 'payload'

describe('acquireMigrationLock', () => {
  let mockPayload: Partial<Payload>
  let mockReq: any

  beforeEach(() => {
    mockPayload = {
      db: {
        beginTransaction: vi.fn().mockResolvedValue('mock-transaction-id'),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
      findGlobal: vi.fn(),
      updateGlobal: vi.fn(),
      logger: {
        warn: vi.fn(),
        info: vi.fn(),
      },
    }
    mockReq = {
      payload: mockPayload,
      transactionID: Promise.resolve('mock-transaction-id'),
    }
  })

  it('should acquire lock when not locked', async () => {
    const mockFindGlobal = mockPayload.findGlobal as any
    mockFindGlobal.mockResolvedValue({
      locked: false,
      locked_by: null,
      locked_at: null,
      expires_at: null,
    })

    const result = await acquireMigrationLock({
      payload: mockPayload as Payload,
      req: mockReq,
      timeout: 300000,
    })

    expect(result.acquired).toBe(true)
    expect(result.instanceId).toMatch(/^[0-9a-f-]{36}$/) // UUID format
    expect(mockPayload.updateGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'payload-migrations-lock',
        data: expect.objectContaining({
          locked: true,
          locked_by: result.instanceId,
        }),
      }),
    )
  })

  it('should fail to acquire lock when already locked and not expired', async () => {
    const futureDate = new Date(Date.now() + 100000)
    const mockFindGlobal = mockPayload.findGlobal as any
    mockFindGlobal.mockResolvedValue({
      locked: true,
      locked_by: 'another-instance',
      locked_at: new Date(),
      expires_at: futureDate,
    })

    const result = await acquireMigrationLock({
      payload: mockPayload as Payload,
      req: mockReq,
      timeout: 300000,
    })

    expect(result.acquired).toBe(false)
    expect(mockPayload.updateGlobal).not.toHaveBeenCalled()
  })

  it('should acquire lock when existing lock is stale', async () => {
    const pastDate = new Date(Date.now() - 100000)
    const mockFindGlobal = mockPayload.findGlobal as any
    mockFindGlobal.mockResolvedValue({
      locked: true,
      locked_by: 'crashed-instance',
      locked_at: new Date(Date.now() - 400000),
      expires_at: pastDate,
    })

    const result = await acquireMigrationLock({
      payload: mockPayload as Payload,
      req: mockReq,
      timeout: 300000,
    })

    expect(result.acquired).toBe(true)
    expect(mockPayload.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Stale migration lock detected'),
      }),
    )
  })

  it('should return no-lock when transactions unavailable', async () => {
    mockReq.transactionID = Promise.resolve(null)

    const result = await acquireMigrationLock({
      payload: mockPayload as Payload,
      req: mockReq,
      timeout: 300000,
    })

    expect(result.acquired).toBe(true)
    expect(result.instanceId).toBe('no-lock')
    expect(mockPayload.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('transactions'),
      }),
    )
  })

  it('should return no-lock when global does not exist (upgrade scenario)', async () => {
    const mockFindGlobal = mockPayload.findGlobal as any
    mockFindGlobal.mockRejectedValue(new Error('Global not found'))

    const result = await acquireMigrationLock({
      payload: mockPayload as Payload,
      req: mockReq,
      timeout: 300000,
    })

    expect(result.acquired).toBe(true)
    expect(result.instanceId).toBe('no-lock')
    expect(mockPayload.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Migration lock global not initialized'),
      }),
    )
    expect(mockPayload.updateGlobal).not.toHaveBeenCalled()
  })
})

describe('releaseMigrationLock', () => {
  let mockPayload: Partial<Payload>
  let mockReq: any

  beforeEach(() => {
    mockReq = {}
    mockPayload = {
      updateGlobal: vi.fn(),
      logger: {
        info: vi.fn(),
      },
    }
  })

  it('should release lock', async () => {
    await releaseMigrationLock({
      instanceId: 'test-instance-id',
      payload: mockPayload as Payload,
      req: mockReq,
    })

    expect(mockPayload.updateGlobal).toHaveBeenCalledWith({
      slug: 'payload-migrations-lock',
      data: { locked: false },
    })
  })

  it('should skip release when instanceId is no-lock', async () => {
    await releaseMigrationLock({
      instanceId: 'no-lock',
      payload: mockPayload as Payload,
      req: mockReq,
    })

    expect(mockPayload.updateGlobal).not.toHaveBeenCalled()
  })
})
