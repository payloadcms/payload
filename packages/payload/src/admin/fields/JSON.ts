import type { MarkOptional } from 'ts-essentials'

import type { JSONField, JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type JSONFieldClientWithoutType = MarkOptional<JSONFieldClient, 'type'>

export type JSONFieldProps = {
  readonly validate?: JSONFieldValidation
} & Omit<FormFieldBase<JSONFieldClientWithoutType>, 'validate'>

export type JSONFieldLabelServerComponent = FieldLabelServerComponent<JSONField>

export type JSONFieldLabelClientComponent = FieldLabelClientComponent<JSONFieldClientWithoutType>

export type JSONFieldDescriptionServerComponent = FieldDescriptionServerComponent<JSONField>

export type JSONFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<JSONFieldClientWithoutType>

export type JSONFieldErrorServerComponent = FieldErrorServerComponent<JSONField>

export type JSONFieldErrorClientComponent = FieldErrorClientComponent<JSONFieldClientWithoutType>
