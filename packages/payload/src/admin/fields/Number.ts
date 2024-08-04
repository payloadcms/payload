import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type NumberFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'number'>
  readonly onChange?: (e: number) => void
} & FormFieldBase

export type NumberFieldLabelComponent = LabelComponent<'number'>

export type NumberFieldDescriptionComponent = DescriptionComponent<'number'>

export type NumberFieldErrorComponent = ErrorComponent<'number'>
