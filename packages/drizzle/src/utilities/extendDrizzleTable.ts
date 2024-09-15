/**
 * Implemented from:
 * https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/table.ts#L73
 * Drizzle uses @internal JSDoc to remove their internal methods from types, for example
 * Table.Symbol, columnBuilder.build - but they actually exist.
 */
import type { Column, ColumnBuilder, ColumnBuilderBase } from 'drizzle-orm'

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
  extraConfig?: (self: Table) => object
  table: Table
}

/**
 * Extends the passed table with additional columns / extra config
 * @example
 */
export const extendDrizzleTable = ({ columns, extraConfig, table }: Args): Table => {
  const resultTable = table

  const InlineForeignKeys = Object.getOwnPropertySymbols(table).find((symbol) => {
    return symbol.description?.includes('InlineForeignKeys')
  })

  if (!InlineForeignKeys) {
    throw new APIError(`Error when finding InlineForeignKeys Symbol`, 500)
  }

  if (columns) {
    for (const [name, columnBuilder] of Object.entries(columns) as [string, any][]) {
      const column = columnBuilder.build(resultTable)

      resultTable[name] = column
      resultTable[InlineForeignKeys].push(...columnBuilder.buildForeignKeys(column, resultTable))
      resultTable[DrizzleSymbol.Columns][name] = column

      resultTable[DrizzleSymbol.ExtraConfigColumns][name] =
        'buildExtraConfigColumn' in columnBuilder
          ? columnBuilder.buildExtraConfigColumn(resultTable)
          : column
    }
  }

  if (extraConfig) {
    resultTable[DrizzleSymbol.ExtraConfigBuilder] = (t) => {
      return {
        ...table[DrizzleSymbol.ExtraConfigBuilder](t),
        ...extraConfig(t),
      }
    }
  }

  return resultTable
}
