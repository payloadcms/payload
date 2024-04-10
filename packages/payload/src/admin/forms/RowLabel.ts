import type { ReactComponentWithPayload } from '../../config/types.js'

export type RowLabelComponent = ReactComponentWithPayload

export type RowLabel = Record<string, string> | RowLabelComponent | string
