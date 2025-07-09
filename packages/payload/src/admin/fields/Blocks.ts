import type React from 'react'
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
  FieldDiffClientComponent,
  FieldDiffServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type BlocksFieldClientWithoutType = MarkOptional<BlocksFieldClient, 'type'>

type BlocksFieldBaseClientProps = {
  readonly validate?: BlocksFieldValidation
} & FieldPaths

type BlocksFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type BlocksFieldClientProps = BlocksFieldBaseClientProps &
  ClientFieldBase<BlocksFieldClientWithoutType>

export type BlocksFieldServerProps = BlocksFieldBaseServerProps &
  ServerFieldBase<BlocksField, BlocksFieldClientWithoutType>

export type BlocksFieldServerComponent = FieldServerComponent<
  BlocksField,
  BlocksFieldClientWithoutType,
  BlocksFieldBaseServerProps
>

export type BlocksFieldClientComponent = FieldClientComponent<
  BlocksFieldClientWithoutType,
  BlocksFieldBaseClientProps
>

export type BlocksFieldLabelServerComponent = FieldLabelServerComponent<
  BlocksField,
  BlocksFieldClientWithoutType
> &
  FieldPaths

export type BlocksFieldLabelClientComponent =
  FieldLabelClientComponent<BlocksFieldClientWithoutType> & FieldPaths

type BlockRowLabelBase = {
  blockType: string
  rowLabel: string
  rowNumber: number
}

export type BlockRowLabelClientProps = BlockRowLabelBase &
  ClientFieldBase<BlocksFieldClientWithoutType> &
  FieldPaths
export type BlockRowLabelClientComponent = React.ComponentType<BlockRowLabelClientProps>

export type BlockRowLabelServerProps = BlockRowLabelBase &
  FieldPaths &
  ServerFieldBase<BlocksField, BlocksFieldClientWithoutType>
export type BlockRowLabelServerComponent = React.ComponentType<BlockRowLabelServerProps>

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

export type BlocksFieldDiffServerComponent = FieldDiffServerComponent<
  BlocksField,
  BlocksFieldClient
>

export type BlocksFieldDiffClientComponent = FieldDiffClientComponent<BlocksFieldClient>
