import type { MarkOptional } from 'ts-essentials'

import type { GroupField, GroupFieldClient } from '../../fields/config/types.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type GroupFieldClientWithoutType = MarkOptional<GroupFieldClient, 'type'>

export type GroupFieldClientProps = ClientFieldBase<GroupFieldClientWithoutType>

export type GroupFieldServerProps = ServerFieldBase<GroupField>

export type GroupFieldServerComponent = FieldServerComponent<GroupField>

export type GroupFieldClientComponent = FieldClientComponent<GroupFieldClientWithoutType>

export type GroupFieldLabelServerComponent = FieldLabelServerComponent<GroupField>

export type GroupFieldLabelClientComponent = FieldLabelClientComponent<GroupFieldClientWithoutType>

export type GroupFieldDescriptionServerComponent = FieldDescriptionServerComponent<GroupField>

export type GroupFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<GroupFieldClientWithoutType>

export type GroupFieldErrorServerComponent = FieldErrorServerComponent<GroupField>

export type GroupFieldErrorClientComponent = FieldErrorClientComponent<GroupFieldClientWithoutType>
