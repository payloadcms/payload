import { is, sql } from 'drizzle-orm'
import { PgUUID } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import { postgresUnaccent } from './postgresUnaccent.js'

describe('postgresUnaccent', () => {
  it('returns a handler with the expected name and operators', () => {
    const handler = postgresUnaccent()

    expect(handler.name).toBe('postgres-unaccent')
    expect(handler.operators).toEqual(['contains', 'like', 'not_like'])
  })

  it('declares fieldTypes restricted to text and textarea', () => {
    const handler = postgresUnaccent()

    expect(handler.fieldTypes).toEqual(['text', 'textarea'])
  })

  it('declares requiredExtensions of unaccent', () => {
    const handler = postgresUnaccent()

    expect(handler.requiredExtensions).toEqual(['unaccent'])
  })

  it('wraps the column and value in a parameterized unaccent(...) SQL expression', () => {
    const handler = postgresUnaccent()
    const column = sql`"title"`

    const result = handler.transformOperands({
      adapter: {} as any,
      column,
      field: { name: 'title', type: 'text' } as any,
      originalOperator: 'contains',
      path: 'title',
      resolvedOperator: 'contains',
      storage: 'column',
      value: '%acido%',
    })

    expect(is(result.column, Object)).toBe(true)
    expect((result.column as any).queryChunks[0].value[0]).toBe('unaccent(')
    expect((result.column as any).queryChunks[1]).toBe(column)

    expect((result.value as any).queryChunks[0].value[0]).toBe('unaccent(')
    expect((result.value as any).queryChunks[1]).toBe('%acido%')
  })

  it('returns the operands unchanged when the column is a native PgUUID column', () => {
    const handler = postgresUnaccent()
    const uuidColumn = Object.create(PgUUID.prototype)

    const result = handler.transformOperands({
      adapter: {} as any,
      column: uuidColumn,
      field: { name: 'id', type: 'text' } as any,
      originalOperator: 'contains',
      path: 'id',
      resolvedOperator: 'contains',
      storage: 'column',
      value: '%acido%',
    })

    expect(result.column).toBe(uuidColumn)
    expect(result.value).toBe('%acido%')
  })
})
