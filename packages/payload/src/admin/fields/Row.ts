import type { MarkOptional } from 'ts-essentials'

import type { RowField, RowFieldClient } from '../../fields/config/types.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldErrorClientComponent,
  FieldErrorServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type RowFieldClientWithoutType = MarkOptional<RowFieldClient, 'type'>

type RowFieldBaseClientProps = {
  readonly forceRender?: boolean
  readonly indexPath: string
}

export type RowFieldClientProps = ClientFieldBase<RowFieldClientWithoutType> &
  RowFieldBaseClientProps

export type RowFieldServerProps = ServerFieldBase<RowField>

export type RowFieldServerComponent = FieldServerComponent<RowField, RowFieldClient>

export type RowFieldClientComponent = FieldClientComponent<
  RowFieldClientWithoutType,
  RowFieldBaseClientProps
>

export type RowFieldLabelServerComponent = FieldLabelServerComponent<RowField>

export type RowFieldLabelClientComponent = FieldLabelClientComponent<RowFieldClientWithoutType>

export type RowFieldDescriptionServerComponent = FieldDescriptionServerComponent<RowField>

export type RowFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RowFieldClientWithoutType>

export type RowFieldErrorServerComponent = FieldErrorServerComponent<RowField>

export type RowFieldErrorClientComponent = FieldErrorClientComponent<RowFieldClientWithoutType>
