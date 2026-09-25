import type { MarkOptional } from 'ts-essentials'

import type { ArrayField, ArrayFieldClient } from '../../fields/config/types.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
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

type ArrayFieldClientWithoutType = MarkOptional<ArrayFieldClient, 'type'>

type ArrayFieldBaseClientProps = {
  readonly validate?: ArrayFieldValidation
} & FieldPaths

type ArrayFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type ArrayFieldClientProps = ArrayFieldBaseClientProps &
  ClientFieldBase<ArrayFieldClientWithoutType>

export type ArrayFieldServerProps = ArrayFieldBaseServerProps &
  ServerFieldBase<ArrayField, ArrayFieldClientWithoutType>
export type ArrayFieldLabelServerProps = FieldLabelServerProps<
  ArrayField,
  ArrayFieldClientWithoutType
>

export type ArrayFieldLabelClientProps = FieldLabelClientProps<ArrayFieldClientWithoutType>

export type ArrayFieldDescriptionServerProps = FieldDescriptionServerProps<
  ArrayField,
  ArrayFieldClientWithoutType
>
export type ArrayFieldDescriptionClientProps =
  FieldDescriptionClientProps<ArrayFieldClientWithoutType>

export type ArrayFieldErrorServerProps = FieldErrorServerProps<
  ArrayField,
  ArrayFieldClientWithoutType
>
export type ArrayFieldErrorClientProps = FieldErrorClientProps<ArrayFieldClientWithoutType>

export type ArrayFieldDiffServerProps = FieldDiffServerProps<ArrayField, ArrayFieldClient>
export type ArrayFieldDiffClientProps = FieldDiffClientProps<ArrayFieldClient>
