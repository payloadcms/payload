import type { Field } from '../../../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import {
  captureBranchProjectionShape,
  restoreBranchProjectionShape,
} from './branchProjectionShape.js'

const fields: Field[] = [
  { name: 'title', type: 'text', localized: true },
  { name: 'details', type: 'group', localized: true, fields: [{ name: 'heading', type: 'text' }] },
  {
    name: 'rows',
    type: 'array',
    fields: [
      { name: 'label', type: 'text' },
      { name: 'translation', type: 'text', localized: true },
    ],
  },
  { name: 'metadata', type: 'json' },
]

describe('derived projection schema presence', () => {
  it('should restore authoritative absence, null containers and locales after native SQL clears', () => {
    const data = {
      id: 1,
      title: { en: 'Hello' },
      details: { en: null },
      rows: [{ id: 1.5, translation: { en: 'Row' } }],
      metadata: { _branchProjection: { arbitrary: true } },
    }
    const shape = captureBranchProjectionShape({ data, fields })
    const cleared = {
      ...structuredClone(data),
      title: { en: 'Hello', fr: null },
      details: { en: { heading: null }, fr: { heading: null } },
      rows: [{ id: 1.5, label: null, translation: { en: 'Row', fr: null } }],
    }

    expect(restoreBranchProjectionShape({ data: cleared, fields, shape })).toEqual(data)
  })

  it('should prune unknown schema properties without interpreting opaque JSON values', () => {
    const data = {
      id: 1,
      unknown: 'ignored',
      rows: [{ id: 1, unknown: 'ignored' }],
      metadata: { unknown: true, _branchProjection: 'opaque' },
    }

    captureBranchProjectionShape({ data, fields })
    expect(data).toEqual({
      id: 1,
      rows: [{ id: 1 }],
      metadata: { unknown: true, _branchProjection: 'opaque' },
    })
  })

  it('should reject non-cleared content claimed absent and malformed presence metadata', () => {
    const shape = captureBranchProjectionShape({ data: { id: 1 }, fields })

    expect(() =>
      restoreBranchProjectionShape({ data: { id: 1, title: { en: 'unexpected' } }, fields, shape }),
    ).toThrow('presence metadata')
    expect(() =>
      restoreBranchProjectionShape({
        data: { id: 1 },
        fields,
        shape: { absent: [1], locales: {}, nulls: [] },
      }),
    ).toThrow('presence metadata')
    expect(() =>
      captureBranchProjectionShape({
        data: { id: 1, rows: [{ id: 1, _branchProjection: {} }] },
        fields,
      }),
    ).toThrow('collides')
  })
})
