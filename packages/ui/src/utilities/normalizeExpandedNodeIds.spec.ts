import type { Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import { normalizeExpandedNodeIds } from './normalizeExpandedNodeIds.js'

describe('normalizeExpandedNodeIds', () => {
  it('should keep one numeric ID when the same ID arrives as string and number', () => {
    const payload = { collections: { folders: {} }, db: { defaultIDType: 'number' } }

    const ids = normalizeExpandedNodeIds({
      collectionSlug: 'folders',
      ids: ['4', '1', 5, 1],
      payload: payload as unknown as Payload,
    })

    expect(ids).toStrictEqual([4, 1, 5])
  })
})
