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

export type SelectFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<SelectFieldProps>
  readonly errorProps?: ErrorProps<SelectFieldProps>
  readonly field: MarkOptional<SelectFieldClient, 'type'>
  readonly labelProps?: LabelProps<SelectFieldProps>
  readonly onChange?: (e: string | string[]) => void
  readonly validate?: SelectFieldValidation
  readonly value?: string
} & Omit<FormFieldBase, 'validate'>

export type SelectFieldLabelComponent = LabelComponent<SelectFieldProps>

export type SelectFieldDescriptionComponent = DescriptionComponent<SelectFieldProps>

export type SelectFieldErrorComponent = ErrorComponent<SelectFieldProps>
