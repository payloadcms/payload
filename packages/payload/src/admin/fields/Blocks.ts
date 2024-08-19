import type { MarkOptional } from 'ts-essentials'

import type { BlockFieldClient } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  ArrayFieldProps,
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type BlockFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<ArrayFieldProps>
  readonly errorProps?: ErrorProps<ArrayFieldProps>
  readonly field: MarkOptional<BlockFieldClient, 'type'>
  readonly labelProps?: LabelProps<ArrayFieldProps>
  readonly validate?: BlockFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type BlockFieldLabelComponent = LabelComponent<BlockFieldProps>

export type BlockFieldDescriptionComponent = DescriptionComponent<BlockFieldProps>

export type BlockFieldErrorComponent = ErrorComponent<BlockFieldProps>
