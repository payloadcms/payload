import type { MarkOptional } from 'ts-essentials'

import type { BlocksField, BlocksFieldClient } from '../../fields/config/types.js'
import type { BlocksFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
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
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type BlocksFieldClientWithoutType = MarkOptional<BlocksFieldClient, 'type'>

type BlocksFieldBaseClientProps = {
  readonly validate?: BlocksFieldValidation
} & FieldPaths &
  Pick<ServerFieldBase, 'permissions'>

export type BlocksFieldClientProps = BlocksFieldBaseClientProps &
  ClientFieldBase<BlocksFieldClientWithoutType>

export type BlocksFieldServerProps = ServerFieldBase<BlocksField, BlocksFieldClientWithoutType>

export type BlocksFieldServerComponent = FieldServerComponent<
  BlocksField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldClientComponent = FieldClientComponent<
  BlocksFieldClientWithoutType,
  BlocksFieldBaseClientProps
>

export type BlocksFieldLabelServerComponent = FieldLabelServerComponent<
  BlocksField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldLabelClientComponent =
  FieldLabelClientComponent<BlocksFieldClientWithoutType>

export type BlocksFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  BlocksField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<BlocksFieldClientWithoutType>

export type BlocksFieldErrorServerComponent = FieldErrorServerComponent<
  BlocksField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldErrorClientComponent =
  FieldErrorClientComponent<BlocksFieldClientWithoutType>
