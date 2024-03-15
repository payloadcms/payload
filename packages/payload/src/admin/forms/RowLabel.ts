import type { Data } from './Form.js'

export type RowLabelComponent = React.ComponentType

export type RowLabel = Record<string, string> | RowLabelComponent | string
