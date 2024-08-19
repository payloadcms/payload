import type { MarkOptional } from 'ts-essentials'

import type { EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DateFieldProps,
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly descriptionProps?: FieldDescriptionProps<DateFieldProps>
  readonly errorProps?: ErrorProps<DateFieldProps>
  readonly field: MarkOptional<EmailFieldClient, 'type'>
  readonly labelProps?: LabelProps<DateFieldProps>
  readonly validate?: EmailFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type EmailFieldLabelComponent = LabelComponent<EmailFieldProps>

export type EmailFieldDescriptionComponent = DescriptionComponent<EmailFieldProps>

export type EmailFieldErrorComponent = ErrorComponent<EmailFieldProps>
