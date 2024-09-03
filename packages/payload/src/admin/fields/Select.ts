import type { MarkOptional } from 'ts-essentials'

import type { SelectField, SelectFieldClient } from '../../fields/config/types.js'
import type { SelectFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type SelectFieldClientWithoutType = MarkOptional<SelectFieldClient, 'type'>

export type SelectFieldProps = {
  readonly onChange?: (e: string | string[]) => void
  readonly validate?: SelectFieldValidation
  readonly value?: string
} & Omit<FormFieldBase<SelectFieldClientWithoutType>, 'validate'>

export type SelectFieldLabelServerComponent = FieldLabelServerComponent<SelectField>

export type SelectFieldLabelClientComponent =
  FieldLabelClientComponent<SelectFieldClientWithoutType>

export type SelectFieldDescriptionServerComponent = FieldDescriptionServerComponent<SelectField>

export type SelectFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<SelectFieldClientWithoutType>

export type SelectFieldErrorServerComponent = FieldErrorServerComponent<SelectField>

export type SelectFieldErrorClientComponent =
  FieldErrorClientComponent<SelectFieldClientWithoutType>
