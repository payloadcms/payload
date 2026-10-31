import { describe, expect, it } from 'vitest'

import { resolveStreamedCSVColumns } from './resolveStreamedCSVColumns.js'

describe('resolveStreamedCSVColumns', () => {
  const schemaColumns = ['id', 'title', 'array_0_field1', 'array_0_field2', 'createdAt']

  it('should include array columns that only appear after the first batch', () => {
    const scannedColumns = [
      'id',
      'title',
      'array_0_field1',
      'array_0_field2',
      'createdAt',
      'array_1_field1',
      'array_1_field2',
      'array_2_field1',
      'array_2_field2',
    ]

    const result = resolveStreamedCSVColumns({ scannedColumns, schemaColumns })

    expect(result).toContain('array_1_field1')
    expect(result).toContain('array_1_field2')
    expect(result).toContain('array_2_field1')
    expect(result).toContain('array_2_field2')
    expect(result.indexOf('array_0_field1')).toBeLessThan(result.indexOf('array_1_field1'))
    expect(result.indexOf('array_1_field1')).toBeLessThan(result.indexOf('array_2_field1'))
    expect(result.indexOf('array_0_field2')).toBeLessThan(result.indexOf('array_2_field2'))
  })

  it('should keep schema columns that are absent from the data when no before hook runs', () => {
    const result = resolveStreamedCSVColumns({
      scannedColumns: ['id', 'title'],
      schemaColumns,
    })

    expect(result).toEqual(schemaColumns)
  })

  it('should drop a column the before hook removes without dropping later-batch array columns', () => {
    const result = resolveStreamedCSVColumns({
      hookColumns: ['id', 'title', 'array_0_field1'],
      rawColumns: ['id', 'title', 'secret', 'array_0_field1'],
      scannedColumns: [
        'id',
        'title',
        'secret',
        'array_0_field1',
        'array_1_field1',
        'array_2_field1',
      ],
      schemaColumns: ['id', 'title', 'secret', 'array_0_field1', 'createdAt'],
    })

    expect(result).not.toContain('secret')
    expect(result).not.toContain('createdAt')
    expect(result).toContain('title')
    expect(result).toContain('array_0_field1')
    expect(result).toContain('array_1_field1')
    expect(result).toContain('array_2_field1')
  })

  it('should include a column the before hook adds on the first batch', () => {
    const result = resolveStreamedCSVColumns({
      hookColumns: ['id', 'title', 'batchRef'],
      rawColumns: ['id', 'title'],
      scannedColumns: ['id', 'title', 'array_1_field1'],
      schemaColumns: ['id', 'title', 'createdAt'],
    })

    expect(result).toContain('batchRef')
    expect(result).toContain('array_1_field1')
    expect(result).not.toContain('createdAt')
  })
})
