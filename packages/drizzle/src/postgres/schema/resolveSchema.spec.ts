import { getTableConfig, pgEnum, pgSchema, pgTable, text } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'

import type { BasePostgresAdapter } from '../types.js'

import { resolveSchema } from './resolveSchema.js'

const createAdapter = ({ schemaName, ...args }: Partial<BasePostgresAdapter> = {}) =>
  ({
    pgSchema: schemaName ? pgSchema(schemaName) : { enum: pgEnum, table: pgTable },
    schemaName,
    ...args,
  }) as BasePostgresAdapter

// The schema that a table built by `resolveSchema` ends up in; `undefined` is `public`
const schemaOf = (adapter: BasePostgresAdapter, name = 'posts') =>
  getTableConfig(
    resolveSchema({ name, type: 'table', adapter }).table(name, { title: text('title') }),
  ).schema

describe('resolveSchema', () => {
  it('should return the adapter schema without tableSchema', () => {
    const adapter = createAdapter({ schemaName: 'core' })

    expect(resolveSchema({ name: 'posts', type: 'table', adapter })).toBe(adapter.pgSchema)
    expect(resolveSchema({ name: 'enum_posts_status', type: 'enum', adapter })).toBe(
      adapter.pgSchema,
    )
  })

  it('should call tableSchema with the name and type', () => {
    const tableSchema = vi.fn(() => undefined)
    const adapter = createAdapter({ tableSchema })

    resolveSchema({ name: 'posts', type: 'table', adapter })
    resolveSchema({ name: 'enum_posts_status', type: 'enum', adapter })

    expect(tableSchema).toHaveBeenNthCalledWith(1, { name: 'posts', type: 'table' })
    expect(tableSchema).toHaveBeenNthCalledWith(2, { name: 'enum_posts_status', type: 'enum' })
  })

  it('should use the default schema when tableSchema returns nothing or the default schema', () => {
    expect(schemaOf(createAdapter({ tableSchema: () => undefined }))).toBeUndefined()
    expect(schemaOf(createAdapter({ tableSchema: () => 'public' }))).toBeUndefined()
    expect(schemaOf(createAdapter({ schemaName: 'core', tableSchema: () => undefined }))).toBe(
      'core',
    )
    expect(schemaOf(createAdapter({ schemaName: 'core', tableSchema: () => 'core' }))).toBe('core')
  })

  it('should treat an empty schemaName like no schemaName', () => {
    const adapter = createAdapter({ schemaName: '', tableSchema: () => 'public' })

    expect(resolveSchema({ name: 'posts', type: 'table', adapter })).toBe(adapter.pgSchema)
  })

  it('should use the schema that tableSchema returns, including public next to a custom default', () => {
    expect(schemaOf(createAdapter({ tableSchema: () => 'inventory' }))).toBe('inventory')
    expect(schemaOf(createAdapter({ schemaName: 'core', tableSchema: () => 'public' }))).toBe(
      undefined,
    )
  })

  it('should keep the payload_migrations table, but not an enum of that name, in the default schema', () => {
    const adapter = createAdapter({ tableSchema: () => 'inventory' })

    expect(schemaOf(adapter, 'payload_migrations')).toBeUndefined()
    expect(resolveSchema({ name: 'payload_migrations', type: 'enum', adapter })).not.toBe(
      adapter.pgSchema,
    )
  })
})
