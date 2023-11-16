import React from 'react'

import type { Data } from '../Form/types'

export type Props = {
  className?: string
  label?: RowLabel
  path: string
  rowNumber?: number
}

export type RowLabelArgs = {
  data: Data
  index?: number
  path: string
}

export type RowLabelFunction = (args: RowLabelArgs) => string

export type RowLabelComponent = React.ComponentType<RowLabelArgs>

export type RowLabel = Record<string, string> | RowLabelComponent | RowLabelFunction | string

export function isComponent(label: RowLabel): label is RowLabelComponent {
  return React.isValidElement(label)
}
