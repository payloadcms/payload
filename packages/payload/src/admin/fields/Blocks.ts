import type { MarkOptional } from 'ts-essentials'

import type { BlocksField, BlocksFieldClient } from '../../fields/config/types.js'
import type { BlocksFieldValidation } from '../../fields/validations.js'
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

type BlocksFieldClientWithoutType = MarkOptional<BlocksFieldClient, 'type'>

type BlocksFieldBaseClientProps = {
  readonly validate?: BlocksFieldValidation
} & FieldPaths

type BlocksFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type BlocksFieldClientProps = BlocksFieldBaseClientProps &
  ClientFieldBase<BlocksFieldClientWithoutType>

export type BlocksFieldServerProps = BlocksFieldBaseServerProps &
  ServerFieldBase<BlocksField, BlocksFieldClientWithoutType>
export type BlocksFieldLabelServerProps = FieldLabelServerProps<
  BlocksField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldLabelClientProps = FieldLabelClientProps<BlocksFieldClientWithoutType>

type BlockRowLabelBase = {
  blockType: string
  rowLabel: string
  rowNumber: number
}

export type BlockRowLabelClientProps = BlockRowLabelBase &
  ClientFieldBase<BlocksFieldClientWithoutType>

export type BlockRowLabelServerProps = BlockRowLabelBase &
  ServerFieldBase<BlocksField, BlocksFieldClientWithoutType>

export type BlocksFieldDescriptionServerProps = FieldDescriptionServerProps<
  BlocksField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldDescriptionClientProps =
  FieldDescriptionClientProps<BlocksFieldClientWithoutType>

export type BlocksFieldErrorServerProps = FieldErrorServerProps<
  BlocksField,
  BlocksFieldClientWithoutType
>

export type BlocksFieldErrorClientProps = FieldErrorClientProps<BlocksFieldClientWithoutType>

export type BlocksFieldDiffServerProps = FieldDiffServerProps<BlocksField, BlocksFieldClient>

export type BlocksFieldDiffClientProps = FieldDiffClientProps<BlocksFieldClient>
