import type { MarkOptional } from 'ts-essentials'

import type { NumberField, NumberFieldClient } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type NumberFieldClientWithoutType = MarkOptional<NumberFieldClient, 'type'>

export type NumberFieldProps = {
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
} & Omit<FormFieldBase<NumberFieldClientWithoutType>, 'validate'>

export type NumberFieldLabelServerComponent = FieldLabelServerComponent<NumberField>

export type NumberFieldLabelClientComponent =
  FieldLabelClientComponent<NumberFieldClientWithoutType>

export type NumberFieldDescriptionServerComponent = FieldDescriptionServerComponent<NumberField>

export type NumberFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<NumberFieldClientWithoutType>

export type NumberFieldErrorServerComponent = FieldErrorServerComponent<NumberField>

export type NumberFieldErrorClientComponent =
  FieldErrorClientComponent<NumberFieldClientWithoutType>
