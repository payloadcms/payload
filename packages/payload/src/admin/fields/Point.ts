import type { MarkOptional } from 'ts-essentials'

import type { PointField, PointFieldClient } from '../../fields/config/types.js'
import type { PointFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type PointFieldClientWithoutType = MarkOptional<PointFieldClient, 'type'>

export type PointFieldProps = {
  readonly validate?: PointFieldValidation
} & Omit<FormFieldBase<PointFieldClientWithoutType>, 'validate'>

export type PointFieldLabelServerComponent = FieldLabelServerComponent<PointField>

export type PointFieldLabelClientComponent = FieldLabelClientComponent<PointFieldClientWithoutType>

export type PointFieldDescriptionServerComponent = FieldDescriptionServerComponent<PointField>

export type PointFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<PointFieldClientWithoutType>

export type PointFieldErrorServerComponent = FieldErrorServerComponent<PointField>

export type PointFieldErrorClientComponent = FieldErrorClientComponent<PointFieldClientWithoutType>
