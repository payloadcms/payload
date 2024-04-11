import type { ComponentWithServerSideProps } from '../../config/types.js'

export type RowLabelComponent = ComponentWithServerSideProps

export type RowLabel = Record<string, string> | RowLabelComponent | string
