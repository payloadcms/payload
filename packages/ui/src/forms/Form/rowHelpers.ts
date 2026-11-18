'use client'
import type { Data, FormState, Row } from 'payload'

import { getObjectDotNotation } from 'payload/shared'

/** Clears cached render paths whose row ownership changed in the saved data. */
export const clearRenderPathsForChangedRows = ({
  data,
  formState,
}: {
  data: Data
  formState: FormState
}): FormState => {
  for (const [path, field] of Object.entries(formState)) {
    if (field.lastRenderedPath && hasRowPathChanged({ data, formState, path })) {
      delete field.lastRenderedPath
    }

    for (const [index, row] of (field.rows ?? []).entries()) {
      if (
        row.lastRenderedPath &&
        hasRowPathChanged({ data, formState, path: `${path}.${index}` })
      ) {
        delete row.lastRenderedPath
      }
    }
  }

  return formState
}

/** Checks row identity through every ancestor, including the row itself for row-label paths. */
export const hasRowPathChanged = ({
  data,
  formState,
  path,
}: {
  data: Data
  formState: FormState
  path: string
}): boolean => {
  const segments = path.split('.')

  return segments.some((segment, index) => {
    const row = formState[segments.slice(0, index).join('.')]?.rows?.[Number(segment)]

    if (!row) {
      return false
    }

    const savedRow = getObjectDotNotation<Data>(data, segments.slice(0, index + 1).join('.'))

    return (
      row.id !== savedRow?.id ||
      (row.blockType !== undefined && row.blockType !== savedRow?.blockType)
    )
  })
}

export const extractRowsAndCollapsedIDs = ({
  collapsed,
  rowID,
  rows,
}: {
  collapsed: boolean
  rowID: string
  rows: Row[]
}): {
  collapsedIDs: string[]
  updatedRows: Row[]
} => {
  return rows.reduce(
    (acc, row) => {
      if (rowID === row.id) {
        row.collapsed = collapsed
      }
      if (row.collapsed) {
        acc.collapsedIDs.push(row.id)
      }
      acc.updatedRows.push(row)
      return acc
    },
    {
      collapsedIDs: [],
      updatedRows: [],
    },
  )
}

export const toggleAllRows = ({
  collapsed,
  rows,
}): {
  collapsedIDs: string[]
  updatedRows: Row[]
} => {
  return rows.reduce(
    (acc, row) => {
      row.collapsed = collapsed
      if (collapsed) {
        acc.collapsedIDs.push(row.id)
      }
      acc.updatedRows.push(row)
      return acc
    },
    {
      collapsedIDs: [],
      updatedRows: [],
    },
  )
}
