'use client'
import type { Row } from 'payload'

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
