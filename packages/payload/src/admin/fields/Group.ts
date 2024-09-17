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

export type GroupFieldServerProps = ServerFieldBase<GroupField, GroupFieldClientWithoutType>

export type GroupFieldServerComponent = FieldServerComponent<
  GroupField,
  GroupFieldClientWithoutType
>

export type GroupFieldClientComponent = FieldClientComponent<GroupFieldClientWithoutType>

export type GroupFieldLabelServerComponent = FieldLabelServerComponent<
  GroupField,
  GroupFieldClientWithoutType
>

export type GroupFieldLabelClientComponent = FieldLabelClientComponent<GroupFieldClientWithoutType>

export type GroupFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  GroupField,
  GroupFieldClientWithoutType
>

export type GroupFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<GroupFieldClientWithoutType>

export type GroupFieldErrorServerComponent = FieldErrorServerComponent<
  GroupField,
  GroupFieldClientWithoutType
>

export type GroupFieldErrorClientComponent = FieldErrorClientComponent<GroupFieldClientWithoutType>
