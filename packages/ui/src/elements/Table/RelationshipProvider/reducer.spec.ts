import { describe, expect, it } from 'vitest'

import { reducer } from './reducer.js'

describe('list relationship cache', () => {
  it('should resolve requested numeric IDs and mark missing documents without mutating the cache', () => {
    const state = { media: { 1: null, 2: null, 3: null } }
    const result = reducer(state, {
      type: 'ADD_LOADED',
      relationTo: 'media',
      idsToLoad: ['1', '2', '3'],
      docs: [
        { id: 1, filename: 'one.jpg' },
        { id: 3, filename: 'three.jpg' },
      ],
    })

    expect(result.media).toEqual({
      1: { id: 1, filename: 'one.jpg' },
      2: false,
      3: { id: 3, filename: 'three.jpg' },
    })
    expect(state.media).toEqual({ 1: null, 2: null, 3: null })
  })

  it('should keep prefetched data when a response arrives for an already loaded document', () => {
    const fresh = { id: 'upload', filename: 'fresh.jpg' }
    const state = { media: { upload: fresh } }
    const result = reducer(state, {
      type: 'ADD_LOADED',
      relationTo: 'media',
      idsToLoad: ['upload', 'old-page'],
      docs: [{ id: 'upload', filename: 'stale.jpg' }],
    })

    expect(result).toEqual({ media: { upload: fresh } })
    expect(state).toEqual({ media: { upload: fresh } })
  })

  it('should request only missing documents without replacing cached or denied documents', () => {
    const cached = { id: 'loaded', filename: 'thumbnail.jpg' }
    const result = reducer(
      { media: { loaded: cached, denied: false, pending: null } },
      {
        type: 'REQUEST',
        docs: ['loaded', 'denied', 'pending', 'missing'].map((value) => ({
          relationTo: 'media',
          value,
        })),
      },
    )

    expect(result.media).toEqual({ loaded: cached, denied: false, pending: null, missing: null })
  })
})
