import type { MarkOptional } from 'ts-essentials'

import type { GroupField, GroupFieldClient } from '../../fields/config/types.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldPaths,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldDiffClientComponent,
  FieldDiffServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type GroupFieldClientWithoutType = MarkOptional<GroupFieldClient, 'type'>

type GroupFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type GroupFieldBaseClientProps = FieldPaths

export type GroupFieldClientProps = ClientFieldBase<GroupFieldClientWithoutType> &
  GroupFieldBaseClientProps

export type GroupFieldServerProps = GroupFieldBaseServerProps &
  ServerFieldBase<GroupField, GroupFieldClientWithoutType>

export type GroupFieldServerComponent = FieldServerComponent<
  GroupField,
  GroupFieldClientWithoutType,
  GroupFieldBaseServerProps
>

export type GroupFieldClientComponent = FieldClientComponent<
  GroupFieldClientWithoutType,
  GroupFieldBaseClientProps
>

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

export type GroupFieldDiffServerComponent = FieldDiffServerComponent<GroupField, GroupFieldClient>

export type GroupFieldDiffClientComponent = FieldDiffClientComponent<GroupFieldClient>
