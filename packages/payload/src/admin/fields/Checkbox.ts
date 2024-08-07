import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CheckboxFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'checkbox' }>

export type CheckboxFieldProps = {
  readonly checked?: boolean
  readonly disableFormData?: boolean
  readonly field: CheckboxFieldClient
  readonly id?: string
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly validate?: CheckboxFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type CheckboxFieldLabelComponent = LabelComponent<'checkbox'>

export type CheckboxFieldDescriptionComponent = DescriptionComponent<'checkbox'>

export type CheckboxFieldErrorComponent = ErrorComponent<'checkbox'>
