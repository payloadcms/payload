import type { MarkOptional } from 'ts-essentials'

import type { CheckboxFieldClient } from '../../fields/config/types.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type CheckboxFieldClientWithoutType = MarkOptional<CheckboxFieldClient, 'type'>

export type CheckboxFieldProps = {
  readonly checked?: boolean
  readonly disableFormData?: boolean
  readonly id?: string
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly validate?: CheckboxFieldValidation
} & Omit<FormFieldBase<CheckboxFieldClientWithoutType>, 'validate'>

export type CheckboxFieldLabelComponent = LabelComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldDescriptionComponent = DescriptionComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldErrorComponent = ErrorComponent<CheckboxFieldProps>
