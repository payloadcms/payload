import type { MarkOptional } from 'ts-essentials'

import type { GroupField, GroupFieldClient } from '../../fields/config/types.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type GroupFieldClientWithoutType = MarkOptional<GroupFieldClient, 'type'>

export type GroupFieldProps = FormFieldBase<GroupFieldClientWithoutType>

export type GroupFieldLabelServerComponent = FieldLabelServerComponent<GroupField>

export type GroupFieldLabelClientComponent = FieldLabelClientComponent<GroupFieldClientWithoutType>

export type GroupFieldDescriptionServerComponent = FieldDescriptionServerComponent<GroupField>

export type GroupFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<GroupFieldClientWithoutType>

export type GroupFieldErrorServerComponent = FieldErrorServerComponent<GroupField>

export type GroupFieldErrorClientComponent = FieldErrorClientComponent<GroupFieldClientWithoutType>
