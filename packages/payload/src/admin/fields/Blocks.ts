import type { MarkOptional } from 'ts-essentials'

import type { BlocksField, BlocksFieldClient } from '../../fields/config/types.js'
import type { BlocksFieldValidation } from '../../fields/validations.js'
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

type BlocksFieldClientWithoutType = MarkOptional<BlocksFieldClient, 'type'>

type BlocksFieldBaseClientProps = {
  readonly validate?: BlocksFieldValidation
}

export type BlocksFieldClientProps = BlocksFieldBaseClientProps &
  ClientFieldBase<BlocksFieldClientWithoutType>

export type BlocksFieldServerProps = ServerFieldBase<BlocksField>

export type BlocksFieldServerComponent = FieldServerComponent<BlocksField>

export type BlocksFieldClientComponent = FieldClientComponent<
  BlocksFieldClientWithoutType,
  BlocksFieldBaseClientProps
>

export type BlocksFieldLabelServerComponent = FieldLabelServerComponent<BlocksField>

export type BlocksFieldLabelClientComponent =
  FieldLabelClientComponent<BlocksFieldClientWithoutType>

export type BlocksFieldDescriptionServerComponent = FieldDescriptionServerComponent<BlocksField>

export type BlocksFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<BlocksFieldClientWithoutType>

export type BlocksFieldErrorServerComponent = FieldErrorServerComponent<BlocksField>

export type BlocksFieldErrorClientComponent =
  FieldErrorClientComponent<BlocksFieldClientWithoutType>
