import type { MarkOptional } from 'ts-essentials'

import type { DateField, DateFieldClient } from '../../fields/config/types.js'
import type { DateFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type DateFieldClientWithoutType = MarkOptional<DateFieldClient, 'type'>

export type DateFieldProps = {
  readonly validate?: DateFieldValidation
} & Omit<FormFieldBase<DateFieldClientWithoutType>, 'validate'>

export type DateFieldLabelServerComponent = FieldLabelServerComponent<DateField>

export type DateFieldLabelClientComponent = FieldLabelClientComponent<DateFieldClientWithoutType>

export type DateFieldDescriptionServerComponent = FieldDescriptionServerComponent<DateField>

export type DateFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<DateFieldClientWithoutType>

export type DateFieldErrorServerComponent = FieldErrorServerComponent<DateField>

export type DateFieldErrorClientComponent = FieldErrorClientComponent<DateFieldClientWithoutType>
