import { describe, expect, it } from 'vitest'

import { inventoryField } from './inventoryField.js'

describe('inventoryField', () => {
  it('should default to the inventory field name', () => {
    expect(inventoryField().name).toBe('inventory')
  })

  it('should use the configured field name', () => {
    expect(inventoryField({ fieldName: 'stock' }).name).toBe('stock')
  })

  it('should keep the generated field overridable', () => {
    const field = inventoryField({ fieldName: 'stock', overrides: { min: 1 } })

    expect(field.name).toBe('stock')
    expect(field.min).toBe(1)
  })
})
