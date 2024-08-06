import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type GroupFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'group'>
  readonly forceRender?: boolean
} & FormFieldBase

export type GroupFieldLabelComponent = LabelComponent<'group'>

export type GroupFieldDescriptionComponent = DescriptionComponent<'group'>

export type GroupFieldErrorComponent = ErrorComponent<'group'>
