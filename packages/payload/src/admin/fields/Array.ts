import type { MarkOptional } from 'ts-essentials'

import type { ArrayFieldClient } from '../../fields/config/types.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
  MappedComponent,
} from '../types.js'

type ArrayFieldClientWithoutType = MarkOptional<ArrayFieldClient, 'type'>

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly descriptionProps?: FieldDescriptionProps<ArrayFieldClientWithoutType>
  readonly errorProps?: ErrorProps<ArrayFieldClientWithoutType>
  readonly field: ArrayFieldClientWithoutType
  readonly labelProps?: LabelProps<ArrayFieldClientWithoutType>
  readonly validate?: ArrayFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type ArrayFieldLabelComponent = LabelComponent<ArrayFieldClientWithoutType>

export type ArrayFieldDescriptionComponent = DescriptionComponent<ArrayFieldClientWithoutType>

export type ArrayFieldErrorComponent = ErrorComponent<ArrayFieldClientWithoutType>
