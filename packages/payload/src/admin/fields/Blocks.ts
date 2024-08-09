import type { MarkOptional } from 'ts-essentials'

import type { BlockFieldClient } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type BlockFieldProps = {
  readonly field: MarkOptional<BlockFieldClient, 'type'>
  readonly validate?: BlockFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type BlockFieldLabelComponent = LabelComponent<'blocks'>

export type BlockFieldDescriptionComponent = DescriptionComponent<'blocks'>

export type BlockFieldErrorComponent = ErrorComponent<'blocks'>
