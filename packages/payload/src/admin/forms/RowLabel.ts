import type { Data } from './Form'

export type RowLabelArgs = {
  data: Data
  index?: number
  path: string
}

export type RowLabelFunction = (args: RowLabelArgs) => string

export type RowLabelComponent = React.ComponentType<RowLabelArgs>

export type RowLabel = Record<string, string> | RowLabelComponent | RowLabelFunction | string
