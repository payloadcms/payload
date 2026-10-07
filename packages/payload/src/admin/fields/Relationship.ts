import type { MarkOptional } from 'ts-essentials'

import type { RelationshipField, RelationshipFieldClient } from '../../fields/config/types.js'
import type { RelationshipFieldValidation } from '../../fields/validations.js'
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

type RelationshipFieldClientWithoutType = MarkOptional<RelationshipFieldClient, 'type'>

type RelationshipFieldBaseClientProps = {
  readonly path: string
  readonly validate?: RelationshipFieldValidation
}

type RelationshipFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type RelationshipFieldClientProps = ClientFieldBase<RelationshipFieldClientWithoutType> &
  RelationshipFieldBaseClientProps

export type RelationshipFieldServerProps = RelationshipFieldBaseServerProps &
  ServerFieldBase<RelationshipField, RelationshipFieldClientWithoutType>
export type RelationshipFieldLabelServerProps = FieldLabelServerProps<
  RelationshipField,
  RelationshipFieldClientWithoutType
>

export type RelationshipFieldLabelClientProps =
  FieldLabelClientProps<RelationshipFieldClientWithoutType>

export type RelationshipFieldDescriptionServerProps = FieldDescriptionServerProps<
  RelationshipField,
  RelationshipFieldClientWithoutType
>

export type RelationshipFieldDescriptionClientProps =
  FieldDescriptionClientProps<RelationshipFieldClientWithoutType>

export type RelationshipFieldErrorServerProps = FieldErrorServerProps<
  RelationshipField,
  RelationshipFieldClientWithoutType
>

export type RelationshipFieldErrorClientProps =
  FieldErrorClientProps<RelationshipFieldClientWithoutType>

export type RelationshipFieldDiffServerProps = FieldDiffServerProps<
  RelationshipField,
  RelationshipFieldClient
>

export type RelationshipFieldDiffClientProps = FieldDiffClientProps<RelationshipFieldClient>
