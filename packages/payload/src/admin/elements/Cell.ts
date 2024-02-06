import type { Field, FieldBase } from '../../fields/config/types'

export type CellProps = {
  className?: string
  fieldType?: Field['type']
  isFieldAffectingData?: boolean
  label?: string
  link?: boolean
  name: FieldBase['name']
  onClick?: (Props) => void
}

export type CellComponentProps<Data = unknown> = {
  data: Data
}
