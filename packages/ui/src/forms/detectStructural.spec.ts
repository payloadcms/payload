import { describe, expect, it } from 'vitest'

import { detectStructural } from './detectStructural.js'

describe('detectStructural', () => {
  it('detects an added array row at top level', () => {
    const prev = { lineItems: [{ sku: 'a' }] }
    const next = { lineItems: [{ sku: 'a' }, { sku: 'b' }] }
    expect(detectStructural(prev, next)).toEqual([{ kind: 'add', path: 'lineItems.1' }])
  })

  it('detects a removed array row', () => {
    const prev = { lineItems: [{ sku: 'a' }, { sku: 'b' }] }
    const next = { lineItems: [{ sku: 'a' }] }
    expect(detectStructural(prev, next)).toEqual([{ kind: 'remove', path: 'lineItems.1' }])
  })

  it('does not flag a row swap as add+remove when ids align', () => {
    const prev = {
      lineItems: [
        { id: '1', sku: 'a' },
        { id: '2', sku: 'b' },
      ],
    }
    const next = {
      lineItems: [
        { id: '2', sku: 'b' },
        { id: '1', sku: 'a' },
      ],
    }
    expect(detectStructural(prev, next)).toEqual([])
  })

  it('detects a new block placement at top level', () => {
    const prev = { content: [{ blockType: 'text', text: 'hi' }] }
    const next = {
      content: [
        { blockType: 'text', text: 'hi' },
        { blockType: 'image', src: '/a' },
      ],
    }
    expect(detectStructural(prev, next)).toEqual([{ kind: 'add', path: 'content.1' }])
  })

  it('emits multiple add events when multiple rows are appended', () => {
    const prev = { lineItems: [] }
    const next = { lineItems: [{ sku: 'a' }, { sku: 'b' }, { sku: 'c' }] }
    expect(detectStructural(prev, next)).toEqual([
      { kind: 'add', path: 'lineItems.0' },
      { kind: 'add', path: 'lineItems.1' },
      { kind: 'add', path: 'lineItems.2' },
    ])
  })

  it('treats a non-array → array transition as adds for every new row', () => {
    const prev = {} as Record<string, unknown>
    const next = { lineItems: [{ sku: 'a' }] }
    expect(detectStructural(prev, next)).toEqual([{ kind: 'add', path: 'lineItems.0' }])
  })

  it('ignores non-array fields entirely (e.g., string changes)', () => {
    const prev = { title: 'before' }
    const next = { title: 'after' }
    expect(detectStructural(prev, next)).toEqual([])
  })

  it('emits no events when prev and next are identical', () => {
    const prev = { lineItems: [{ sku: 'a' }, { sku: 'b' }] }
    const next = { lineItems: [{ sku: 'a' }, { sku: 'b' }] }
    expect(detectStructural(prev, next)).toEqual([])
  })
})
