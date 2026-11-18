import type { Payload, PayloadRequest } from '../types/index.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

import { describe, expect, it, vi } from 'vitest'

import { enforceMaxVersions } from './enforceMaxVersions.js'

describe('enforceMaxVersions', () => {
  it.each(['collection', 'global'] as const)(
    'should select only the cutoff date for %s history and preserve deletion scope',
    async (kind) => {
      const cutoff = '2026-01-01T00:00:00.000Z'
      const findVersions = vi.fn().mockResolvedValue({ docs: [{ updatedAt: cutoff }] })
      const deleteVersions = vi.fn()
      const error = vi.fn()
      const payload = {
        db: { findVersions, findGlobalVersions: findVersions, deleteVersions },
        logger: { error },
      } as unknown as Payload
      const req = { transactionID: 'editor-transaction' } as PayloadRequest

      await enforceMaxVersions({
        id: 7,
        ...(kind === 'collection'
          ? { collection: { slug: 'fixture' } as SanitizedCollectionConfig }
          : { global: { slug: 'fixture' } as SanitizedGlobalConfig }),
        max: 50,
        payload,
        req,
      })

      expect(findVersions).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { updatedAt: true },
          limit: 1,
          page: 51,
          pagination: false,
          sort: '-updatedAt',
          req,
        }),
      )
      expect(deleteVersions).toHaveBeenCalledWith({
        ...(kind === 'collection' ? { collection: 'fixture' } : { globalSlug: 'fixture' }),
        where: {
          updatedAt: { less_than_equal: cutoff },
          ...(kind === 'collection' ? { parent: { equals: 7 } } : {}),
        },
        req,
      })
      expect(error).not.toHaveBeenCalled()
    },
  )
})
