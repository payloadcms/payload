import type { MarkOptional } from 'ts-essentials'

import type { GroupField, GroupFieldClient } from '../../fields/config/types.js'
import type { FieldErrorClientProps, FieldErrorServerProps } from '../forms/Error.js'
import type { ClientFieldBase, FieldPaths, ServerFieldBase } from '../forms/Field.js'
import type {
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldLabelClientProps,
  FieldLabelServerProps,
} from '../types.js'

type GroupFieldClientWithoutType = MarkOptional<GroupFieldClient, 'type'>

type GroupFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type GroupFieldBaseClientProps = FieldPaths

export type GroupFieldClientProps = ClientFieldBase<GroupFieldClientWithoutType> &
  GroupFieldBaseClientProps

export type GroupFieldServerProps = GroupFieldBaseServerProps &
  ServerFieldBase<GroupField, GroupFieldClientWithoutType>
export type GroupFieldLabelServerProps = FieldLabelServerProps<
  GroupField,
  GroupFieldClientWithoutType
>

export type GroupFieldLabelClientProps = FieldLabelClientProps<GroupFieldClientWithoutType>

export type GroupFieldDescriptionServerProps = FieldDescriptionServerProps<
  GroupField,
  GroupFieldClientWithoutType
>

export type GroupFieldDescriptionClientProps =
  FieldDescriptionClientProps<GroupFieldClientWithoutType>

export type GroupFieldErrorServerProps = FieldErrorServerProps<
  GroupField,
  GroupFieldClientWithoutType
>

export type GroupFieldErrorClientProps = FieldErrorClientProps<GroupFieldClientWithoutType>

export type GroupFieldDiffServerProps = FieldDiffServerProps<GroupField, GroupFieldClient>

export type GroupFieldDiffClientProps = FieldDiffClientProps<GroupFieldClient>
