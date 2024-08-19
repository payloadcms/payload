import type { MarkOptional } from 'ts-essentials'

import type { BlockFieldClient } from '../../fields/config/types.js'
import type { BlockFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

type BlockFieldClientWithoutType = MarkOptional<BlockFieldClient, 'type'>

export type BlockFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<BlockFieldClientWithoutType>
  readonly errorProps?: ErrorProps<BlockFieldClientWithoutType>
  readonly field: BlockFieldClientWithoutType
  readonly labelProps?: LabelProps<BlockFieldClientWithoutType>
  readonly validate?: BlockFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type BlockFieldLabelComponent = LabelComponent<BlockFieldClientWithoutType>

export type BlockFieldDescriptionComponent = DescriptionComponent<BlockFieldClientWithoutType>

export type BlockFieldErrorComponent = ErrorComponent<BlockFieldClientWithoutType>
