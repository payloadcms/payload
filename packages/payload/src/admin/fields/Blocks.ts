import type { MarkOptional } from 'ts-essentials'

import type { BlockField, BlockFieldClient } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type BlocksFieldClientWithoutType = MarkOptional<BlockFieldClient, 'type'>

export type BlockFieldProps = {
  readonly validate?: BlockFieldValidation
} & Omit<FormFieldBase<BlocksFieldClientWithoutType>, 'validate'>

export type BlockFieldLabelServerComponent = FieldLabelServerComponent<BlockField>

export type BlockFieldLabelClientComponent = FieldLabelClientComponent<BlocksFieldClientWithoutType>

export type BlockFieldDescriptionServerComponent = FieldDescriptionServerComponent<BlockField>

export type BlockFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<BlocksFieldClientWithoutType>

export type BlockFieldErrorServerComponent = FieldErrorServerComponent<BlockField>

export type BlockFieldErrorClientComponent = FieldErrorClientComponent<BlocksFieldClientWithoutType>
