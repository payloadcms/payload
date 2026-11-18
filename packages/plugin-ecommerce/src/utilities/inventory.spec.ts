import { describe, expect, it } from 'vitest'

import { defaultInventoryFieldName, getInventoryFieldName } from './inventory.js'

describe('getInventoryFieldName', () => {
  it('should fall back to the default field name when inventory is not configured', () => {
    expect(getInventoryFieldName({})).toBe(defaultInventoryFieldName)
  })

  it('should fall back to the default field name when inventory is enabled with a boolean', () => {
    expect(getInventoryFieldName({ inventory: true })).toBe(defaultInventoryFieldName)
  })

  it('should fall back to the default field name when no override is provided', () => {
    expect(getInventoryFieldName({ inventory: {} })).toBe(defaultInventoryFieldName)
  })

  it('should return the configured field name', () => {
    expect(getInventoryFieldName({ inventory: { fieldName: 'stock' } })).toBe('stock')
  })
})
