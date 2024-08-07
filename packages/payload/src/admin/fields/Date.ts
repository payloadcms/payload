import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { DateFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type DateFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'date' }>

export type DateFieldProps = {
  readonly field: DateFieldClient
  readonly validate?: DateFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type DateFieldLabelComponent = LabelComponent<'date'>

export type DateFieldDescriptionComponent = DescriptionComponent<'date'>

export type DateFieldErrorComponent = ErrorComponent<'date'>
