import type React from 'react'

import type { FieldBase } from '../../../../fields/config/types'

export type Column = {
  accessor: string
  active: boolean
  components: {
    Heading: React.ReactNode
    renderCell: (row: any, data: any) => React.ReactNode
  }
  label: FieldBase['label']
  name: FieldBase['name']
}

export type Props = {
  columns?: Column[]
  data: unknown[]
}
