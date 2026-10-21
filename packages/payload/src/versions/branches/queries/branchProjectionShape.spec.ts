import type { Block, Field } from '../../../fields/config/types.js'

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

  it('should preserve wire keys and localized ancestry through named and transparent tabs', () => {
    const nestedFields: Field[] = [
      {
        type: 'tabs',
        tabs: [
          { label: 'Transparent', fields: [{ name: 'quoted"💡', type: 'text' }] },
          {
            name: 'details',
            localized: true,
            fields: [
              {
                name: 'rows',
                type: 'array',
                fields: [{ name: 'label', type: 'text', localized: true }],
              },
            ],
          },
        ],
      },
    ]
    const data = { id: 1, details: { en: { rows: [{ id: 1.5 }, { id: '1.5', label: 'Text' }] } } }
    const shape = captureBranchProjectionShape({ data, fields: nestedFields })

    expect(shape).toEqual({
      absent: [JSON.stringify(['quoted"💡']), '["details","en","rows",1.5,"label"]'],
      locales: { '["details"]': ['en'] },
      nulls: [],
    })
    const native = {
      id: 1,
      'quoted"💡': null,
      details: {
        en: {
          rows: [
            { id: 1.5, label: null },
            { id: '1.5', label: 'Text' },
          ],
        },
        fr: { rows: [] },
      },
    }

    expect(restoreBranchProjectionShape({ data: native, fields: nestedFields, shape })).toEqual(
      data,
    )
  })

  it('should isolate cached referenced blocks by catalog and allow lazy recursive block definitions', () => {
    const sharedFields: Field[] = [{ name: 'content', type: 'blocks', blocks: ['callout'] }]
    const firstBlocks: Block[] = [
      { slug: 'callout', fields: [{ name: 'first', type: 'text' }, ...sharedFields] },
    ]
    const secondBlocks: Block[] = [{ slug: 'callout', fields: [{ name: 'second', type: 'text' }] }]
    const first = {
      id: 1,
      content: [
        {
          id: 'outer',
          blockType: 'callout',
          blockName: 'Name',
          content: [{ id: 2, blockType: 'callout' }],
        },
      ],
    }
    const second = {
      id: 2,
      content: [{ id: 3, blockType: 'callout', second: 'Kept', first: 'Removed' }],
    }
    const firstShape = captureBranchProjectionShape({
      blocks: firstBlocks,
      data: first,
      fields: sharedFields,
    })
    const secondShape = captureBranchProjectionShape({
      blocks: secondBlocks,
      data: second,
      fields: sharedFields,
    })

    expect(firstShape.absent).toEqual([
      '["content","outer","first"]',
      '["content","outer","content",2,"first"]',
      '["content","outer","content",2,"content"]',
    ])
    expect(second).toEqual({ id: 2, content: [{ id: 3, blockType: 'callout', second: 'Kept' }] })
    expect(
      restoreBranchProjectionShape({
        blocks: firstBlocks,
        data: structuredClone(first),
        fields: sharedFields,
        shape: firstShape,
      }),
    ).toEqual(first)
    expect(
      restoreBranchProjectionShape({
        blocks: secondBlocks,
        data: structuredClone(second),
        fields: sharedFields,
        shape: secondShape,
      }),
    ).toEqual(second)
    expect(() =>
      captureBranchProjectionShape({
        blocks: secondBlocks,
        data: { content: [{ blockType: 'unknown' }] },
        fields: sharedFields,
      }),
    ).toThrow('Unknown block')
  })

  it('should keep validating each document and metadata after the schema plan is cached', () => {
    const data = { id: 1, title: { en: 'First' } }
    const shape = captureBranchProjectionShape({ data, fields })
    const originalShape = structuredClone(shape)

    expect(restoreBranchProjectionShape({ data: structuredClone(data), fields, shape })).toEqual(
      data,
    )
    expect(shape).toEqual(originalShape)
    expect(() =>
      restoreBranchProjectionShape({ data: { id: 2, title: { fr: 'Forbidden' } }, fields, shape }),
    ).toThrow('presence metadata')
    expect(() => captureBranchProjectionShape({ data: { rows: [null] }, fields })).toThrow(
      'presence metadata',
    )
    expect(() =>
      captureBranchProjectionShape({ data: { rows: [{ _branchProjection: {} }] }, fields }),
    ).toThrow('collides')
    expect(() =>
      restoreBranchProjectionShape({
        data: {},
        fields,
        shape: { ...shape, locales: { '["title"]': [1] } },
      }),
    ).toThrow('presence metadata')
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
