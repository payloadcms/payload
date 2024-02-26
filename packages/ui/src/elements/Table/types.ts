import type { CellProps, FieldBase } from 'payload/types'
import type React from 'react'

export type Column = {
  accessor: string
  active: boolean
  cellProps?: Partial<CellProps>
  components: {
    Cell: React.ReactNode
    Heading: React.ReactNode
  }
  label: FieldBase['label']
  name: FieldBase['name']
}

export type Props = {
  columns?: Column[]
  customCellContext?: Record<string, unknown>
  data: unknown[]
}
