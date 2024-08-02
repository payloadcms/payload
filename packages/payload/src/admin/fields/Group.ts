import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type GroupFieldProps = {
  readonly fields: ClientFieldConfig[]
  readonly forceRender?: boolean
  readonly hideGutter?: boolean
  readonly name?: string
  readonly width?: string
} & FormFieldBase

export type GroupFieldLabelComponent = LabelComponent<'group'>

export type GroupFieldDescriptionComponent = DescriptionComponent<'group'>

export type GroupFieldErrorComponent = ErrorComponent<'group'>
