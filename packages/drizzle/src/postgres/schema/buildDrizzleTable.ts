import type { ForeignKeyBuilder, IndexBuilder } from 'drizzle-orm/pg-core'

import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from 'drizzle-orm/pg-core'

import type { RawColumn, RawTable } from '../../types.js'
import type { BasePostgresAdapter } from '../types.js'

import { geometryColumn } from './geometryColumn.js'

const rawColumnBuilderMap: Partial<Record<RawColumn['type'], any>> = {
  boolean,
  geometry: geometryColumn,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  uuid,
  varchar,
}

export const buildDrizzleTable = ({
  adapter,
  rawTable,
}: {
  adapter: BasePostgresAdapter
  rawTable: RawTable
}) => {
  const columns: Record<string, any> = {}

  for (const [key, column] of Object.entries(rawTable.columns)) {
    switch (column.type) {
      case 'enum':
        if ('locale' in column) {
          columns[key] = adapter.enums.enum__locales(column.name)
        } else {
          adapter.enums[column.enumName] = adapter.pgSchema.enum(
            column.enumName,
            column.options as [string, ...string[]],
          )
          columns[key] = adapter.enums[column.enumName](column.name)
        }
        break

      case 'timestamp': {
        let builder = timestamp(column.name, {
          mode: column.mode,
          precision: column.precision,
          withTimezone: column.withTimezone,
        })

        if (column.defaultNow) {
          builder = builder.defaultNow()
        }

        columns[key] = builder
        break
      }

      case 'uuid': {
        let builder = uuid(column.name)

        if (column.defaultRandom) {
          builder = builder.defaultRandom()
        }

        columns[key] = builder
        break
      }

      case 'vector': {
        const builder = vector(column.name, { dimensions: column.dimensions })
        columns[key] = builder

        break
      }

      default:
        columns[key] = rawColumnBuilderMap[column.type](column.name)
        break
    }

    if (column.reference) {
      columns[key].references(() => adapter.tables[column.reference.table][column.reference.name], {
        onDelete: column.reference.onDelete,
      })
    }

    if (column.primaryKey) {
      columns[key].primaryKey()
    }

    if (column.notNull) {
      columns[key].notNull()
    }

    if (typeof column.default !== 'undefined') {
      let sanitizedDefault = column.default

      if (column.type === 'geometry' && Array.isArray(column.default)) {
        sanitizedDefault = `SRID=4326;POINT(${column.default[0]} ${column.default[1]})`
      }

      columns[key].default(sanitizedDefault)
    }

    if (column.type === 'geometry') {
      if (!adapter.extensions.postgis) {
        adapter.extensions.postgis = true
      }
    }
  }

  const extraConfig = (cols: any) => {
    const config: Record<string, ForeignKeyBuilder | IndexBuilder> = {}

    if (rawTable.indexes) {
      for (const [key, rawIndex] of Object.entries(rawTable.indexes)) {
        let fn: any = index
        if (rawIndex.unique) {
          fn = uniqueIndex
        }

        if (Array.isArray(rawIndex.on)) {
          if (rawIndex.on.length) {
            config[key] = fn(rawIndex.name).on(...rawIndex.on.map((colName) => cols[colName]))
          }
        } else {
          config[key] = fn(rawIndex.name).on(cols[rawIndex.on])
        }
      }
    }

    if (rawTable.foreignKeys) {
      for (const [key, rawForeignKey] of Object.entries(rawTable.foreignKeys)) {
        let builder = foreignKey({
          name: rawForeignKey.name,
          columns: rawForeignKey.columns.map((colName) => cols[colName]) as any,
          foreignColumns: rawForeignKey.foreignColumns.map(
            (column) => adapter.tables[column.table][column.name],
          ),
        })

        if (rawForeignKey.onDelete) {
          builder = builder.onDelete(rawForeignKey.onDelete)
        }

        if (rawForeignKey.onUpdate) {
          builder = builder.onDelete(rawForeignKey.onUpdate)
        }

        config[key] = builder
      }
    }

    return config
  }

  adapter.tables[rawTable.name] = adapter.pgSchema.table(
    rawTable.name,
    columns as any,
    extraConfig as any,
  )
}
