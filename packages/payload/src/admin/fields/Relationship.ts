import type { MarkOptional } from 'ts-essentials'

import type { RelationshipField, RelationshipFieldClient } from '../../fields/config/types.js'
import type { RelationshipFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type RelationshipFieldClientWithoutType = MarkOptional<RelationshipFieldClient, 'type'>

export type RelationshipFieldProps = {
  readonly validate?: RelationshipFieldValidation
} & Omit<FormFieldBase<RelationshipFieldClientWithoutType>, 'validate'>

export type RelationshipFieldLabelServerComponent = FieldLabelServerComponent<RelationshipField>

export type RelationshipFieldLabelClientComponent =
  FieldLabelClientComponent<RelationshipFieldClientWithoutType>

export type RelationshipFieldDescriptionServerComponent =
  FieldDescriptionServerComponent<RelationshipField>

export type RelationshipFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RelationshipFieldClientWithoutType>

export type RelationshipFieldErrorServerComponent = FieldErrorServerComponent<RelationshipField>

export type RelationshipFieldErrorClientComponent =
  FieldErrorClientComponent<RelationshipFieldClientWithoutType>
