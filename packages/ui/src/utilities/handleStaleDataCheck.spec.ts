import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { handleStaleDataCheck } from './handleStaleDataCheck.js'

const createRequest = () => {
  const findByID = vi.fn().mockResolvedValue({ updatedAt: '2026-01-01T00:00:00.000Z' })
  const findGlobal = vi.fn().mockResolvedValue({ updatedAt: '2026-01-01T00:00:00.000Z' })

  const req = {
    locale: 'de',
    payload: {
      config: {
        collections: [{ slug: 'posts', versions: { drafts: true } }],
        globals: [{ slug: 'settings', versions: { drafts: true } }],
      },
      findByID,
      findGlobal,
      logger: { error: vi.fn() },
    },
  } as unknown as PayloadRequest

  return { findByID, findGlobal, req }
}

describe('handleStaleDataCheck', () => {
  it('reads the document in the request locale', async () => {
    const { findByID, req } = createRequest()

    await handleStaleDataCheck({
      id: '1',
      collectionSlug: 'posts',
      originalUpdatedAt: '2026-01-01T00:00:00.000Z',
      req,
    })

    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ locale: 'de' }))
  })

  it('reads the global in the request locale', async () => {
    const { findGlobal, req } = createRequest()

    await handleStaleDataCheck({
      globalSlug: 'settings',
      originalUpdatedAt: '2026-01-01T00:00:00.000Z',
      req,
    })

    expect(findGlobal).toHaveBeenCalledWith(expect.objectContaining({ locale: 'de' }))
  })
})
