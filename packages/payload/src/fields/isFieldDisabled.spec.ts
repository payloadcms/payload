import { describe, expect, it } from 'vitest'

import type { Field } from './config/types.js'

import { fieldIsHiddenOrDisabled } from './config/types.js'
import { isFieldDisabled } from './isFieldDisabled.js'

const baseField = (admin?: any): Field => ({ name: 'foo', type: 'text', admin }) as unknown as Field

describe('isFieldDisabled', () => {
  it('returns false for field with no admin', () => {
    const field = { name: 'foo', type: 'text' } as unknown as Field
    expect(isFieldDisabled(field, 'field')).toBe(false)
    expect(isFieldDisabled(field, 'column')).toBe(false)
  })

  it('returns false when admin.disabled is undefined', () => {
    const field = baseField({})
    expect(isFieldDisabled(field, 'field')).toBe(false)
  })

  it('returns false when admin.disabled is false', () => {
    const field = baseField({ disabled: false })
    expect(isFieldDisabled(field, 'field')).toBe(false)
    expect(isFieldDisabled(field, 'column')).toBe(false)
  })

  it('returns true for every area when admin.disabled is true', () => {
    const field = baseField({ disabled: true })
    for (const area of ['bulkEdit', 'column', 'field', 'filter', 'groupBy'] as const) {
      expect(isFieldDisabled(field, area)).toBe(true)
    }
  })

  it('returns true only for the specified area in object form', () => {
    const field = baseField({ disabled: { column: true } })
    expect(isFieldDisabled(field, 'column')).toBe(true)
    expect(isFieldDisabled(field, 'field')).toBe(false)
    expect(isFieldDisabled(field, 'filter')).toBe(false)
  })

  it('returns true for multiple areas when object lists multiple', () => {
    const field = baseField({ disabled: { column: true, filter: true } })
    expect(isFieldDisabled(field, 'column')).toBe(true)
    expect(isFieldDisabled(field, 'filter')).toBe(true)
    expect(isFieldDisabled(field, 'field')).toBe(false)
  })

  it('treats explicit false in object form as not-disabled', () => {
    const field = baseField({ disabled: { field: false, column: true } })
    expect(isFieldDisabled(field, 'field')).toBe(false)
    expect(isFieldDisabled(field, 'column')).toBe(true)
  })

  it('returns false for empty object', () => {
    const field = baseField({ disabled: {} })
    for (const area of ['bulkEdit', 'column', 'field', 'filter', 'groupBy'] as const) {
      expect(isFieldDisabled(field, area)).toBe(false)
    }
  })
})

describe('fieldIsHiddenOrDisabled', () => {
  it('returns true when admin.disabled is true', () => {
    const field = { name: 'x', type: 'text', admin: { disabled: true } } as unknown as Field
    expect(fieldIsHiddenOrDisabled(field)).toBe(true)
  })

  it('returns true when admin.disabled.field is true', () => {
    const field = {
      name: 'x',
      type: 'text',
      admin: { disabled: { field: true } },
    } as unknown as Field
    expect(fieldIsHiddenOrDisabled(field)).toBe(true)
  })

  it('returns false when only admin.disabled.column is true', () => {
    const field = {
      name: 'x',
      type: 'text',
      admin: { disabled: { column: true } },
    } as unknown as Field
    expect(fieldIsHiddenOrDisabled(field)).toBe(false)
  })

  it('returns true when field.hidden is true regardless of disabled', () => {
    const field = { name: 'x', type: 'text', hidden: true } as unknown as Field
    expect(fieldIsHiddenOrDisabled(field)).toBe(true)
  })
})
