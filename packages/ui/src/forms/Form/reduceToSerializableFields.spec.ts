import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { reduceToSerializableFields } from './reduceToSerializableFields.js'

/**
 * Minimal stand-in for a React element: any object whose `$$typeof` is a symbol.
 * `deepCopyObjectSimpleWithoutReactComponents` prunes values by exactly this signal,
 * so this is enough to exercise the sanitizer without pulling in React.
 */
const reactElement = (props: Record<string, unknown> = {}): any => ({
  $$typeof: Symbol.for('react.element'),
  props,
  type: 'span',
})

/** Recursively check whether any React element survived in the reduced state. */
const containsReactElement = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol') {
    return true
  }
  return Object.values(value).some(containsReactElement)
}

describe('reduceToSerializableFields', () => {
  it('strips the top-level customComponents React tree while keeping field data', () => {
    const state: FormState = {
      'meta.title': {
        customComponents: {
          Field: reactElement(),
          Label: reactElement(),
        },
        initialValue: 'Initial title',
        valid: true,
        value: 'Hello world',
      },
    }

    const result = reduceToSerializableFields(state)

    expect(() => JSON.stringify(result)).not.toThrow()
    expect(containsReactElement(result)).toBe(false)

    // The React nodes are gone; the customComponents object serializes to `{}`.
    const serialized = JSON.parse(JSON.stringify(result))
    expect(serialized['meta.title'].customComponents).toEqual({})

    // Plain values survive untouched.
    expect(result['meta.title'].value).toBe('Hello world')
    expect(result['meta.title'].initialValue).toBe('Initial title')
    expect(result['meta.title'].valid).toBe(true)
  })

  it('strips React trees nested in rows[i].customComponents.RowLabel', () => {
    const state: FormState = {
      items: {
        rows: [
          {
            blockType: 'cta',
            collapsed: false,
            customComponents: {
              RowLabel: reactElement(),
            },
            id: 'row-1',
          },
          {
            customComponents: {
              RowLabel: reactElement(),
            },
            id: 'row-2',
          },
        ],
        value: 2,
      },
    }

    const result = reduceToSerializableFields(state)

    expect(() => JSON.stringify(result)).not.toThrow()
    expect(containsReactElement(result)).toBe(false)

    // Row metadata is preserved.
    expect(result.items.rows?.[0]?.id).toBe('row-1')
    expect(result.items.rows?.[0]?.blockType).toBe('cta')
    expect(result.items.rows?.[0]?.collapsed).toBe(false)
    expect(result.items.rows?.[1]?.id).toBe('row-2')
    expect(result.items.value).toBe(2)
  })

  it('severs a real circular reference held behind a RowLabel element so the state can be JSON.stringified', () => {
    // Reproduce the reported cycle: a RowLabel element whose props reach an object
    // that closes a circle (BasePayload -> db -> payload -> ...).
    const payload: any = { db: {} }
    payload.db.payload = payload

    const state: FormState = {
      array: {
        rows: [
          {
            customComponents: {
              RowLabel: reactElement({ payload }),
            },
            id: 'only-row',
          },
        ],
        value: 1,
      },
    }

    // Sanity check: the raw state genuinely cannot be serialized...
    expect(() => JSON.stringify(state)).toThrow(/circular/i)

    // ...but the reduced copy can, because the element (and the cycle behind its
    // props) is pruned at the `$$typeof` boundary before the props are ever visited.
    const result = reduceToSerializableFields(state)
    expect(() => JSON.stringify(result)).not.toThrow()
    expect(containsReactElement(result)).toBe(false)
    expect(result.array.rows?.[0]?.id).toBe('only-row')
    expect(result.array.value).toBe(1)
  })

  it('preserves nested block rows and their values while dropping every React node', () => {
    const state: FormState = {
      layout: {
        rows: [
          {
            blockType: 'columns',
            customComponents: { RowLabel: reactElement() },
            id: 'block-1',
          },
        ],
        value: 1,
      },
      'layout.0.text': {
        customComponents: { Field: reactElement() },
        initialValue: 'seed',
        value: 'nested value',
      },
      'meta.title': {
        customComponents: { Label: reactElement() },
        value: 'A title',
      },
    }

    const result = reduceToSerializableFields(state)
    const roundTripped = JSON.parse(JSON.stringify(result))

    expect(containsReactElement(result)).toBe(false)
    expect(roundTripped['meta.title'].value).toBe('A title')
    expect(roundTripped.layout.rows[0].id).toBe('block-1')
    expect(roundTripped.layout.rows[0].blockType).toBe('columns')
    expect(roundTripped['layout.0.text'].value).toBe('nested value')
    expect(roundTripped['layout.0.text'].initialValue).toBe('seed')
  })
})
