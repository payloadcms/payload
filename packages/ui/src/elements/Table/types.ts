import type React from 'react'

import type { CellProps, FieldBase } from 'payload/types'

export type Column = {
  accessor: string
  active: boolean
  components: {
    Heading: React.ReactNode
    Cell: React.ReactNode
  }
  label: FieldBase['label']
  name: FieldBase['name']
  cellProps?: Partial<CellProps>
}

export type Props = {
  columns?: Column[]
  data: unknown[]
  customCellContext?: Record<string, unknown>
}
