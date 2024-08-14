import type { MarkOptional } from 'ts-essentials'

import type { CheckboxFieldClient } from '../../fields/config/types.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CheckboxFieldProps = {
  readonly checked?: boolean
  readonly disableFormData?: boolean
  readonly field: MarkOptional<CheckboxFieldClient, 'type'>
  readonly id?: string
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly validate?: CheckboxFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type CheckboxFieldLabelComponent = LabelComponent<'checkbox'>

export type CheckboxFieldDescriptionComponent = DescriptionComponent<'checkbox'>

export type CheckboxFieldErrorComponent = ErrorComponent<'checkbox'>
