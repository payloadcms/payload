import { countChangedFields } from './countChangedFields.js'
import type { ClientField } from 'payload'

describe('countChangedFields', () => {
  it('should return 0 when no fields have changed', () => {
    const fields: ClientField[] = [
      { name: 'field1', type: 'text' },
      { name: 'field2', type: 'number' },
    ]
    const comparison = { field1: 'a', field2: 123 }
    const version = { field1: 'a', field2: 123 }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(0)
  })

  it('should count changed fields correctly', () => {
    const fields: ClientField[] = [
      { name: 'field1', type: 'text' },
      { name: 'field2', type: 'number' },
    ]
    const comparison = { field1: 'a', field2: 123 }
    const version = { field1: 'b', field2: 123 }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(1)
  })

  it('should not count the id field', () => {
    const fields: ClientField[] = [
      { name: 'id', type: 'text' },
      { name: 'field1', type: 'text' },
    ]
    const comparison = { id: '1', field1: 'a' }
    const version = { id: '2', field1: 'a' }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(0)
  })

  it('should count only one change for collapsible fields with multiple changed fields', () => {
    const fields: ClientField[] = [
      {
        type: 'collapsible',
        label: 'A collapsible field',
        fields: [
          { name: 'nestedField1', type: 'text' },
          { name: 'nestedField2', type: 'number' },
        ],
      },
    ]
    const comparison = { nestedField1: 'a', nestedField2: 1 }
    const version = { nestedField1: 'b', nestedField2: 2 }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(1)
  })

  it('should count all changed fields in row fields', () => {
    const fields: ClientField[] = [
      {
        type: 'row',
        fields: [
          { name: 'nestedField1', type: 'text' },
          { name: 'nestedField2', type: 'number' },
        ],
      },
    ]
    const comparison = { nestedField1: 'a', nestedField2: 123, shouldBeIgnored: 'a' }
    const version = { nestedField1: 'b', nestedField2: 456, shouldBeIgnored: 'b' }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(2)
  })

  it('should count only one change for each unnamed tab with multiple changed fields ', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'tab1',
            fields: [
              { name: 'nestedField1', type: 'text' },
              { name: 'nestedField2', type: 'number' },
            ],
          },
        ],
      },
    ]
    const comparison = { nestedField1: 'a', nestedField2: 1, shouldBeIgnored: 'a' }
    const version = { nestedField1: 'b', nestedField2: 2, shouldBeIgnored: 'b' }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(1)
  })

  it('should count only one change for each named tab with multiple changed fields ', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            name: 'tab1',
            fields: [
              { name: 'nestedField1', type: 'text' },
              { name: 'nestedField2', type: 'number' },
            ],
          },
        ],
      },
    ]
    const comparison = { tab1: { nestedField1: 'a', nestedField2: 1 } }
    const version = { tab1: { nestedField1: 'b', nestedField2: 2 } }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(1)
  })

  it('should ignore UI fields', () => {
    const fields: ClientField[] = [
      { name: 'field1', type: 'text' },
      {
        name: 'field2',
        type: 'ui',
        admin: {
          components: { Field: undefined },
        },
      },
    ]
    const comparison = { field1: 'a' }
    const version = { field1: 'b' }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(1)
  })
})
