import type { MarkOptional } from 'ts-essentials'

import type { RowField, RowFieldClient } from '../../fields/config/types.js'
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
  FieldErrorClientComponent,
  FieldErrorServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type RowFieldClientWithoutType = MarkOptional<RowFieldClient, 'type'>

type RowFieldBaseClientProps = {
  readonly forceRender?: boolean
} & Omit<FieldPaths, 'path'>

export type RowFieldClientProps = Omit<ClientFieldBase<RowFieldClientWithoutType>, 'path'> &
  RowFieldBaseClientProps

export type RowFieldServerProps = ServerFieldBase<RowField, RowFieldClientWithoutType>

export type RowFieldServerComponent = FieldServerComponent<RowField, RowFieldClientWithoutType>

export type RowFieldClientComponent = FieldClientComponent<
  RowFieldClientWithoutType,
  RowFieldBaseClientProps
>

export type RowFieldLabelServerComponent = FieldLabelServerComponent<
  RowField,
  RowFieldClientWithoutType
>

export type RowFieldLabelClientComponent = FieldLabelClientComponent<RowFieldClientWithoutType>

export type RowFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  RowField,
  RowFieldClientWithoutType
>

export type RowFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RowFieldClientWithoutType>

export type RowFieldErrorServerComponent = FieldErrorServerComponent<
  RowField,
  RowFieldClientWithoutType
>

export type RowFieldErrorClientComponent = FieldErrorClientComponent<RowFieldClientWithoutType>

export type RowFieldDiffServerComponent = FieldDiffServerComponent<RowField, RowFieldClient>

export type RowFieldDiffClientComponent = FieldDiffClientComponent<RowFieldClient>
