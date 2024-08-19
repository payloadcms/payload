import type { MarkOptional } from 'ts-essentials'

import type { JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

type JSONFieldClientWithoutType = MarkOptional<JSONFieldClient, 'type'>

export type JSONFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<JSONFieldClientWithoutType>
  readonly errorProps?: ErrorProps<JSONFieldClientWithoutType>
  readonly field: JSONFieldClientWithoutType
  readonly labelProps?: LabelProps<JSONFieldClientWithoutType>
  readonly validate?: JSONFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type JSONFieldLabelComponent = LabelComponent<JSONFieldClientWithoutType>

export type JSONFieldDescriptionComponent = DescriptionComponent<JSONFieldClientWithoutType>

export type JSONFieldErrorComponent = ErrorComponent<JSONFieldClientWithoutType>
