/**
 * Implemented from:
 * https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/table.ts#L73
 * Drizzle uses @internal JSDoc to remove their internal methods from types, for example
 * Table.Symbol, columnBuilder.build - but they actually exist.
 */
import type { ColumnBuilderBase } from 'drizzle-orm'

import { Table } from 'drizzle-orm'
import { APIError } from 'payload'

const { Symbol: DrizzleSymbol } = Table as unknown as {
  Symbol: {
    Columns: symbol
    ExtraConfigBuilder: symbol
    ExtraConfigColumns: symbol
  }
}

type Args = {
  columns?: Record<string, ColumnBuilderBase<any>>
  extraConfig?: (self: Record<string, any>) => object
  table: Table
}

/**
 * Extends the passed table with additional columns / extra config
 */
export const extendDrizzleTable = ({ columns, extraConfig, table }: Args): void => {
  const InlineForeignKeys = Object.getOwnPropertySymbols(table).find((symbol) => {
    return symbol.description?.includes('InlineForeignKeys')
  })

  if (!InlineForeignKeys) {
    throw new APIError(`Error when finding InlineForeignKeys Symbol`, 500)
  }

  if (columns) {
    for (const [name, columnBuilder] of Object.entries(columns) as [string, any][]) {
      const column = columnBuilder.build(table)

      table[name] = column
      table[InlineForeignKeys].push(...columnBuilder.buildForeignKeys(column, table))
      table[DrizzleSymbol.Columns][name] = column

      table[DrizzleSymbol.ExtraConfigColumns][name] =
        'buildExtraConfigColumn' in columnBuilder
          ? columnBuilder.buildExtraConfigColumn(table)
          : column
    }
  }

  if (extraConfig) {
    const originalExtraConfigBuilder = table[DrizzleSymbol.ExtraConfigBuilder]

    table[DrizzleSymbol.ExtraConfigBuilder] = (t) => {
      return {
        ...originalExtraConfigBuilder(t),
        ...extraConfig(t),
      }
    }
  }
}
