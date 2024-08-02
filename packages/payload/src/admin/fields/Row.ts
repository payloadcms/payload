import type {
  ClientFieldConfig,
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
} from 'payload'

import type { ErrorComponent } from '../forms/Error.js'

export type RowFieldProps = {
  readonly fields: ClientFieldConfig[]
  readonly forceRender?: boolean
  readonly indexPath: string
  readonly path?: string
  readonly width?: string
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<'row'>

export type RowFieldDescriptionComponent = DescriptionComponent<'row'>

export type RowFieldErrorComponent = ErrorComponent<'row'>
