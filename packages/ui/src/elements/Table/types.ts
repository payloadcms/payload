import type React from 'react'

import type { FieldBase, SanitizedCollectionConfig } from 'payload/types'

export type Column = {
  accessor: string
  active: boolean
  components: {
    Heading: React.ReactNode
    Cell: React.ReactNode
  }
  label: FieldBase['label']
  name: FieldBase['name']
}

export type Props = {
  columns?: Column[]
  data: unknown[]
  customCellContext?: Record<string, unknown>
}
