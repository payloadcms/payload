import type { MarkOptional } from 'ts-essentials'

import type { SelectFieldClient } from '../../fields/config/types.js'
import type { SelectFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

type SelectFieldClientWithoutType = MarkOptional<SelectFieldClient, 'type'>

export type SelectFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<SelectFieldClientWithoutType>
  readonly errorProps?: ErrorProps<SelectFieldClientWithoutType>
  readonly field: SelectFieldClientWithoutType
  readonly labelProps?: LabelProps<SelectFieldClientWithoutType>
  readonly onChange?: (e: string | string[]) => void
  readonly validate?: SelectFieldValidation
  readonly value?: string
} & Omit<FormFieldBase, 'validate'>

export type SelectFieldLabelComponent = LabelComponent<SelectFieldClientWithoutType>

export type SelectFieldDescriptionComponent = DescriptionComponent<SelectFieldClientWithoutType>

export type SelectFieldErrorComponent = ErrorComponent<SelectFieldClientWithoutType>
