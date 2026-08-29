import type { DefaultCellComponentProps, Where } from 'payload'

import { toWords } from 'payload/shared'
import React from 'react'

/**
 * Converts a Payload `Where` query object into a human-readable natural language string.
 *
 * This function reads only the **first condition** of the query — specifically the first
 * `and` clause inside the first `or` group (i.e. `where.or[0].and[0]`). Compound queries
 * with multiple `or` / `and` conditions are not fully represented in the output.
 *
 * @example
 * // Given a where query: { or: [{ and: [{ status: { equals: 'published' } }] }] }
 * transformWhereToNaturalLanguage(where)
 * // Returns: "Status equals Published"
 *
 * @param where - The Payload `Where` query object to transform.
 * @returns A human-readable string representing the first condition in the query,
 *          or `'No where query'` / `''` if the query is empty or cannot be parsed.
 */
const transformWhereToNaturalLanguage = (where: Where): string => {
  if (where.or && where.or.length > 0 && where.or[0].and && where.or[0].and.length > 0) {
    const orQuery = where.or[0]
    const andQuery = orQuery?.and?.[0]

    if (!andQuery || typeof andQuery !== 'object') {
      return 'No where query'
    }

    const key = Object.keys(andQuery)[0]

    if (!key || !andQuery[key] || typeof andQuery[key] !== 'object') {
      return 'No where query'
    }

    const operator = Object.keys(andQuery[key])[0]
    const value = andQuery[key][operator]

    if (typeof value === 'string') {
      return `${toWords(key)} ${operator} ${toWords(value)}`
    } else if (Array.isArray(value)) {
      return `${toWords(key)} ${operator} ${value.map((val) => toWords(val)).join(' or ')}`
    }
  }

  return ''
}

/**
 * A table cell component used in the Query Presets list view to display
 * a human-readable summary of a saved `Where` query filter.
 *
 * Renders the first condition of the query as a natural language string
 * (e.g. `"Status equals Published"`). Falls back to `"No where query"` when
 * the `cellData` is empty or absent.
 *
 * @param props - Standard `DefaultCellComponentProps` injected by Payload's table renderer.
 * @param props.cellData - The `Where` query object stored in the Query Preset document.
 */
export const QueryPresetsWhereCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  return <div>{cellData ? transformWhereToNaturalLanguage(cellData) : 'No where query'}</div>
}
