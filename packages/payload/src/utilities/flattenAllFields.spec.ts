import { describe, expect, it } from 'vitest'
import type { Field } from '../fields/config/types.js'
import { flattenAllFields } from './flattenAllFields.js'

describe('flattenAllFields cache', () => {
  it('reuses a cached result while the source schema remains reachable', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' }]
    const result = flattenAllFields({ cache: true, fields })
    expect(flattenAllFields({ cache: true, fields })).toBe(result)
  })

  it('keeps independent temporary version schemas separate and preserves nested output', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' }]
    const version = (): Field[] => [{ name: 'version', type: 'group', fields }]
    const first = version(), second = version()
    const a = flattenAllFields({ cache: true, fields: first })
    const b = flattenAllFields({ cache: true, fields: second })
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
    expect(a[0]).toMatchObject({ name: 'version', flattenedFields: fields })
  })

  it('still recomputes when cache reads are disabled', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' }]
    const first = flattenAllFields({ cache: true, fields })
    fields.push({ name: 'description', type: 'text' })
    const next = flattenAllFields({ fields })
    expect(next).not.toBe(first)
    expect(next).toHaveLength(2)
    expect(flattenAllFields({ cache: true, fields })).toBe(next)
  })
})
