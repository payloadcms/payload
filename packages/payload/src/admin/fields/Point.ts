import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type PointFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'point'>
} & FormFieldBase

export type PointFieldLabelComponent = LabelComponent<'point'>

export type PointFieldDescriptionComponent = DescriptionComponent<'point'>

export type PointFieldErrorComponent = ErrorComponent<'point'>
