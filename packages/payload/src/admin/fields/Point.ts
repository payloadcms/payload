import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type PointFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'point' }>

export type PointFieldProps = {
  readonly field: PointFieldClient
  readonly validate?: PointFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type PointFieldLabelComponent = LabelComponent<'point'>

export type PointFieldDescriptionComponent = DescriptionComponent<'point'>

export type PointFieldErrorComponent = ErrorComponent<'point'>
