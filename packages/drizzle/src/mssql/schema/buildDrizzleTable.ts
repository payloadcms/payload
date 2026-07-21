import type { ForeignKeyBuilder, IndexBuilder, PrimaryKeyBuilder } from 'drizzle-orm/mssql-core'

import { sql } from 'drizzle-orm'
import {
  bit,
  customType,
  datetime2,
  float,
  foreignKey,
  index,
  int,
  mssqlTable,
  nvarchar,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/mssql-core'
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid'

import type { BuildDrizzleTable } from '../../types.js'

/**
 * The maximum length of an `nvarchar` column that can still participate in an index
 * (SQL Server index keys are limited to 900 bytes; nvarchar is 2 bytes/char → 450 chars).
 * Unbounded text/JSON columns use `nvarchar(max)`, which cannot be indexed.
 */
const INDEXABLE_VARCHAR_LENGTH = 450

/**
 * SQL Server has no native JSON type. We store JSON as `nvarchar(max)` and (de)serialize it
 * ourselves so Payload sees parsed objects, mirroring the `mode: 'json'` behavior of the
 * SQLite/Postgres adapters.
 */
const jsonColumn = customType<{ data: unknown; driverData: string }>({
  dataType() {
    return 'nvarchar(max)'
  },
  fromDriver(value) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  },
  toDriver(value) {
    return typeof value === 'string' ? value : JSON.stringify(value)
  },
})

export const buildDrizzleTable: BuildDrizzleTable = ({ adapter, locales, rawTable }) => {
  const columns: Record<string, any> = {}
  const primaryKeys: string[] = []

  // Columns that participate in a primary key, index, or foreign key must be indexable, so they
  // are bounded to `nvarchar(450)`. All other text columns use `nvarchar(max)` to avoid truncating
  // long values (e.g. password hashes, long text fields).
  const boundedColumns = new Set<string>()
  for (const [colKey, col] of Object.entries(rawTable.columns)) {
    if (col.primaryKey) {
      boundedColumns.add(colKey)
    }
  }
  if (rawTable.indexes) {
    for (const rawIndex of Object.values(rawTable.indexes)) {
      const onCols = Array.isArray(rawIndex.on) ? rawIndex.on : [rawIndex.on]
      onCols.forEach((colKey) => boundedColumns.add(colKey))
    }
  }
  if (rawTable.foreignKeys) {
    for (const rawForeignKey of Object.values(rawTable.foreignKeys)) {
      rawForeignKey.columns.forEach((colKey) => boundedColumns.add(colKey))
    }
  }

  const varcharLength = (colKey: string): 'max' | number =>
    boundedColumns.has(colKey) ? INDEXABLE_VARCHAR_LENGTH : 'max'

  for (const [key, column] of Object.entries(rawTable.columns)) {
    switch (column.type) {
      case 'boolean': {
        columns[key] = bit(column.name)
        break
      }

      case 'enum':
        if ('locale' in column) {
          columns[key] = nvarchar(column.name, {
            enum: locales as [string, ...string[]],
            length: INDEXABLE_VARCHAR_LENGTH,
          })
        } else {
          columns[key] = nvarchar(column.name, {
            enum: column.options as [string, ...string[]],
            length: INDEXABLE_VARCHAR_LENGTH,
          })
        }
        break

      case 'geometry':
      case 'jsonb': {
        columns[key] = jsonColumn(column.name)
        break
      }

      case 'integer': {
        columns[key] = int(column.name)
        break
      }

      case 'numeric': {
        columns[key] = float(column.name)
        break
      }

      case 'serial': {
        columns[key] = int(column.name)
        break
      }

      case 'text':
      case 'varchar': {
        columns[key] = nvarchar(column.name, { length: varcharLength(key) })
        break
      }

      case 'timestamp': {
        let builder = datetime2(column.name, { mode: 'string' })

        if (column.defaultNow) {
          builder = builder.default(sql`sysutcdatetime()`)
        }

        columns[key] = builder
        break
      }
      case 'uuid': {
        let builder = nvarchar(column.name, { length: 36 })

        if (column.defaultRandom) {
          builder = builder.$defaultFn(() => uuidv4())
        }

        if (column.defaultV7) {
          builder = builder.$defaultFn(() => uuidv7())
        }

        columns[key] = builder
        break
      }

      default:
        // Fallback for types SQL Server has no direct equivalent of (e.g. pgvector types).
        columns[key] = nvarchar(column.name, { length: varcharLength(key) })
        break
    }

    if (column.reference) {
      const ref = column.reference
      columns[key].references(() => adapter.tables[ref.table][ref.name], {
        onDelete: ref.onDelete,
      })
    }

    if (column.primaryKey) {
      primaryKeys.push(key)

      // SQL Server auto-incrementing integer PKs use IDENTITY (implicitly NOT NULL).
      if (column.type === 'serial' || (column.type === 'integer' && column.autoIncrement)) {
        columns[key].identity()
      } else {
        // Table-level PRIMARY KEY requires each key column to be NOT NULL.
        columns[key].notNull()
      }
    }

    if (column.notNull) {
      columns[key].notNull()
    }

    if (typeof column.default !== 'undefined') {
      let sanitizedDefault = column.default

      if (column.type === 'geometry' && Array.isArray(column.default)) {
        sanitizedDefault = JSON.stringify({
          type: 'Point',
          coordinates: [column.default[0], column.default[1]],
        })
      }

      columns[key].default(sanitizedDefault)
    }
  }

  const extraConfig = (cols: any) => {
    const config: Record<string, ForeignKeyBuilder | IndexBuilder | PrimaryKeyBuilder> = {}

    if (primaryKeys.length) {
      config.pk = primaryKey({ columns: primaryKeys.map((colKey) => cols[colKey]) as any })
    }

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
          builder = builder.onDelete(rawForeignKey.onDelete as any)
        }

        if (rawForeignKey.onUpdate) {
          builder = builder.onUpdate(rawForeignKey.onUpdate as any)
        }

        config[key] = builder
      }
    }

    return config
  }

  adapter.tables[rawTable.name] = mssqlTable(rawTable.name, columns as any, extraConfig as any)
}
