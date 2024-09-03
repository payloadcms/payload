import type { MarkOptional } from 'ts-essentials'

import type { RowField, RowFieldClient } from '../../fields/config/types.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldErrorClientComponent,
  FieldErrorServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type RowFieldClientWithoutType = MarkOptional<RowFieldClient, 'type'>

export type RowFieldProps = {
  readonly forceRender?: boolean
  readonly indexPath: string
} & FormFieldBase<RowFieldClientWithoutType>

export type RowFieldLabelServerComponent = FieldLabelServerComponent<RowField>

export type RowFieldLabelClientComponent = FieldLabelClientComponent<RowFieldClientWithoutType>

export type RowFieldDescriptionServerComponent = FieldDescriptionServerComponent<RowField>

export type RowFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RowFieldClientWithoutType>

export type RowFieldErrorServerComponent = FieldErrorServerComponent<RowField>

export type RowFieldErrorClientComponent = FieldErrorClientComponent<RowFieldClientWithoutType>
