import type { MarkOptional } from 'ts-essentials'

import type { CodeFieldClient } from '../../fields/config/types.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type CodeFieldProps = {
  readonly autoComplete?: string
  readonly descriptionProps?: FieldDescriptionProps<CodeFieldProps>
  readonly errorProps?: ErrorProps<CodeFieldProps>
  readonly field: MarkOptional<CodeFieldClient, 'type'>
  readonly labelProps?: LabelProps<CodeFieldProps>
  readonly validate?: CodeFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type CodeFieldLabelComponent = LabelComponent<CodeFieldProps>

export type CodeFieldDescriptionComponent = DescriptionComponent<CodeFieldProps>

export type CodeFieldErrorComponent = ErrorComponent<CodeFieldProps>
