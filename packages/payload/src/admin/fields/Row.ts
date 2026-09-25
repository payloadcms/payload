import type { MarkOptional } from 'ts-essentials'

import type { RowField, RowFieldClient } from '../../fields/config/types.js'
import type {
  ClientComponentProps,
  ClientFieldBase,
  FieldPaths,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldErrorClientProps,
  FieldErrorServerProps,
  FieldLabelClientProps,
  FieldLabelServerProps,
} from '../types.js'

type RowFieldClientWithoutType = MarkOptional<RowFieldClient, 'type'>

type RowFieldBaseClientProps = FieldPaths & Pick<ClientComponentProps, 'forceRender'>

export type RowFieldClientProps = ClientFieldBase<RowFieldClientWithoutType> &
  RowFieldBaseClientProps

export type RowFieldServerProps = ServerFieldBase<RowField, RowFieldClientWithoutType>
export type RowFieldLabelServerProps = FieldLabelServerProps<RowField, RowFieldClientWithoutType>

export type RowFieldLabelClientProps = FieldLabelClientProps<RowFieldClientWithoutType>

export type RowFieldDescriptionServerProps = FieldDescriptionServerProps<
  RowField,
  RowFieldClientWithoutType
>

export type RowFieldDescriptionClientProps = FieldDescriptionClientProps<RowFieldClientWithoutType>

export type RowFieldErrorServerProps = FieldErrorServerProps<RowField, RowFieldClientWithoutType>

export type RowFieldErrorClientProps = FieldErrorClientProps<RowFieldClientWithoutType>

export type RowFieldDiffServerProps = FieldDiffServerProps<RowField, RowFieldClient>

export type RowFieldDiffClientProps = FieldDiffClientProps<RowFieldClient>
