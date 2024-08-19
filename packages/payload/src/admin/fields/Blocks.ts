import type { MarkOptional } from 'ts-essentials'

import type { BlockFieldClient } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type BlocksFieldClientWithoutType = MarkOptional<BlockFieldClient, 'type'>

export type BlockFieldProps = {
  readonly validate?: BlockFieldValidation
} & Omit<FormFieldBase<BlocksFieldClientWithoutType>, 'validate'>

export type BlockFieldLabelComponent = LabelComponent<BlocksFieldClientWithoutType>

export type BlockFieldDescriptionComponent = DescriptionComponent<BlocksFieldClientWithoutType>

export type BlockFieldErrorComponent = ErrorComponent<BlocksFieldClientWithoutType>
