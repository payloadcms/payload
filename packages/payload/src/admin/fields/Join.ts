import type { MarkOptional } from 'ts-essentials'

import type { JoinField, JoinFieldClient } from '../../fields/config/types.js'
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

type JoinFieldClientWithoutType = MarkOptional<JoinFieldClient, 'type'>

type JoinFieldBaseClientProps = {
  readonly path: string
}

type JoinFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type JoinFieldClientProps = ClientFieldBase<JoinFieldClientWithoutType> &
  JoinFieldBaseClientProps

export type JoinFieldServerProps = JoinFieldBaseServerProps &
  ServerFieldBase<JoinField, JoinFieldClientWithoutType>
export type JoinFieldLabelServerProps = FieldLabelServerProps<JoinField, JoinFieldClientWithoutType>

export type JoinFieldLabelClientProps = FieldLabelClientProps<JoinFieldClientWithoutType>

export type JoinFieldDescriptionServerProps = FieldDescriptionServerProps<
  JoinField,
  JoinFieldClientWithoutType
>

export type JoinFieldDescriptionClientProps =
  FieldDescriptionClientProps<JoinFieldClientWithoutType>

export type JoinFieldErrorServerProps = FieldErrorServerProps<JoinField, JoinFieldClientWithoutType>

export type JoinFieldErrorClientProps = FieldErrorClientProps<JoinFieldClientWithoutType>

export type JoinFieldDiffServerProps = FieldDiffServerProps<JoinField, JoinFieldClient>

export type JoinFieldDiffClientProps = FieldDiffClientProps<JoinFieldClient>
