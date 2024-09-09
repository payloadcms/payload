import type { MarkOptional } from 'ts-essentials'

import type { CheckboxField, CheckboxFieldClient } from '../../fields/config/types.js'
import type { CheckboxFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type CheckboxFieldClientWithoutType = MarkOptional<CheckboxFieldClient, 'type'>

export type CheckboxFieldProps = {
  readonly checked?: boolean
  readonly disableFormData?: boolean
  readonly id?: string
  readonly onChange?: (value: boolean) => void
  readonly partialChecked?: boolean
  readonly validate?: CheckboxFieldValidation
} & Omit<FormFieldBase<CheckboxFieldClientWithoutType>, 'validate'>

export type CheckboxFieldLabelServerComponent = FieldLabelServerComponent<CheckboxField>

export type CheckboxFieldLabelClientComponent =
  FieldLabelClientComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldDescriptionServerComponent = FieldDescriptionServerComponent<CheckboxField>

export type CheckboxFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CheckboxFieldClientWithoutType>

export type CheckboxFieldErrorServerComponent = FieldErrorServerComponent<CheckboxField>

export type CheckboxFieldErrorClientComponent =
  FieldErrorClientComponent<CheckboxFieldClientWithoutType>
