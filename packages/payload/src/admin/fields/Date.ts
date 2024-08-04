import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type DateFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'date'>
} & FormFieldBase

export type DateFieldLabelComponent = LabelComponent<'date'>

export type DateFieldDescriptionComponent = DescriptionComponent<'date'>

export type DateFieldErrorComponent = ErrorComponent<'date'>
