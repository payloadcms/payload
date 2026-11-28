import { pgEnum, pgSchema, pgTable, text } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import type { BasePostgresAdapter } from '../postgres/types.js'

import { getSchemaNames } from './getSchemaNames.js'

const table = (schema?: string) => {
  const columns = { name: text('name') }

  return (schema ? pgSchema(schema).table('t', columns) : pgTable('t', columns)) as any
}

const getNames = (args: Partial<BasePostgresAdapter>) =>
  getSchemaNames({ adapter: { enums: {}, tables: {}, ...args } })

describe('getSchemaNames', () => {
  it('should return public without schemaName and tableSchema', () => {
    expect(getNames({})).toEqual(['public'])
  })

  it('should treat an empty schemaName like no schemaName', () => {
    expect(getNames({ schemaName: '' })).toEqual(['public'])
    expect(getNames({ schemaName: '', tableSchema: () => undefined })).toEqual(['public'])
  })

  it('should return schemaName without tableSchema, ignoring the tables', () => {
    expect(getNames({ schemaName: 'core', tables: { a: table('core') } })).toEqual(['core'])
  })

  it('should list the default schema first, then the other schemas sorted', () => {
    const names = getNames({
      schemaName: 'core',
      tables: { a: table('core'), b: table('zoo'), c: table('inventory'), d: table('zoo') },
      tableSchema: () => undefined,
    })

    expect(names).toEqual(['core', 'inventory', 'zoo'])
  })

  it('should include public and the schemas of enums, and the default schema even when unused', () => {
    const names = getNames({
      enums: {
        plain: pgEnum('plain', ['a']),
        status: pgSchema('billing').enum('status', ['a', 'b']),
      },
      schemaName: 'core',
      tables: { a: table('inventory'), b: table() },
      tableSchema: () => undefined,
    })

    expect(names).toEqual(['core', 'billing', 'inventory', 'public'])
  })
})
