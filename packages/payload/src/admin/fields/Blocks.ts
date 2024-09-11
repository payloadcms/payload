import type { MarkOptional } from 'ts-essentials'

import type { BlockField, BlockFieldClient } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type BlocksFieldClientWithoutType = MarkOptional<BlockFieldClient, 'type'>

type BlocksFieldBaseClientProps = {
  readonly validate?: BlockFieldValidation
}

export type BlocksFieldClientProps = BlocksFieldBaseClientProps &
  ClientFieldBase<BlocksFieldClientWithoutType>

export type BlocksFieldServerProps = ServerFieldBase<BlockField, BlocksFieldClientWithoutType>

export type BlocksFieldServerComponent = FieldServerComponent<
  BlockField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldClientComponent = FieldClientComponent<
  BlocksFieldClientWithoutType,
  BlocksFieldBaseClientProps
>

export type BlockFieldLabelServerComponent = FieldLabelServerComponent<
  BlockField,
  BlocksFieldClientWithoutType
>

export type BlockFieldLabelClientComponent = FieldLabelClientComponent<BlocksFieldClientWithoutType>

export type BlockFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  BlockField,
  BlocksFieldClientWithoutType
>

export type BlockFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<BlocksFieldClientWithoutType>

export type BlockFieldErrorServerComponent = FieldErrorServerComponent<
  BlockField,
  BlocksFieldClientWithoutType
>

export type BlockFieldErrorClientComponent = FieldErrorClientComponent<BlocksFieldClientWithoutType>
