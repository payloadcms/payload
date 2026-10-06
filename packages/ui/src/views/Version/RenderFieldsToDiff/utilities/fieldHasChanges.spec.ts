import { describe, it, expect } from 'vitest'

import { fieldHasChanges } from './fieldHasChanges.js'

describe('hasChanges', () => {
  it('should return false for identical values', () => {
    const a = 'value'
    const b = 'value'
    expect(fieldHasChanges(a, b)).toBe(false)
  })
  it('should return true for different values', () => {
    const a = 1
    const b = 2
    expect(fieldHasChanges(a, b)).toBe(true)
  })

  it('should return false for identical objects', () => {
    const a = { key: 'value' }
    const b = { key: 'value' }
    expect(fieldHasChanges(a, b)).toBe(false)
  })

  it('should return true for different objects', () => {
    const a = { key: 'value' }
    const b = { key: 'differentValue' }
    expect(fieldHasChanges(a, b)).toBe(true)
  })

  it('should handle undefined values', () => {
    const a = { key: 'value' }
    const b = undefined
    expect(fieldHasChanges(a, b)).toBe(true)
  })

  it('should handle null values', () => {
    const a = { key: 'value' }
    const b = null
    expect(fieldHasChanges(a, b)).toBe(true)
  })

  it('should treat null and undefined as the same empty field value', () => {
    expect(fieldHasChanges(null, undefined)).toBe(false)
    expect(fieldHasChanges(undefined, null)).toBe(false)
  })

  it.each([false, 0, ''])('should distinguish empty fields from the value %s', (value) => {
    expect(fieldHasChanges(null, value)).toBe(true)
    expect(fieldHasChanges(undefined, value)).toBe(true)
  })

  it('should preserve explicit null changes inside JSON objects', () => {
    expect(fieldHasChanges({ value: null }, {})).toBe(true)
  })
})
