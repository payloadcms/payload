import React from 'react'

import { RowLabel, RowLabelComponent } from 'payload/types'

export type Props = {
  className?: string
  label?: RowLabel
  path: string
  rowNumber?: number
}

export function isComponent(label: RowLabel): label is RowLabelComponent {
  return React.isValidElement(label)
}
