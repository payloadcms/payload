import type { ComponentWithServerProps } from '../../config/types.js'

export type RowLabelComponent = ComponentWithServerProps

export type RowLabel = Record<string, string> | RowLabelComponent | string
