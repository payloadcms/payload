import type { MarkOptional } from 'ts-essentials'

import type { ArrayField, ArrayFieldClient } from '../../fields/config/types.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
  MappedComponent,
} from '../types.js'

type ArrayFieldClientWithoutType = MarkOptional<ArrayFieldClient, 'type'>

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly validate?: ArrayFieldValidation
} & Omit<FormFieldBase<ArrayFieldClientWithoutType>, 'validate'>

export type ArrayFieldLabelServerComponent = FieldLabelServerComponent<ArrayField>

export type ArrayFieldLabelClientComponent = FieldLabelClientComponent<ArrayFieldClientWithoutType>

export type ArrayFieldDescriptionServerComponent = FieldDescriptionServerComponent<ArrayField>

export type ArrayFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<ArrayFieldClientWithoutType>

export type ArrayFieldErrorServerComponent = FieldErrorServerComponent<ArrayField>

export type ArrayFieldErrorClientComponent = FieldErrorClientComponent<ArrayFieldClientWithoutType>
