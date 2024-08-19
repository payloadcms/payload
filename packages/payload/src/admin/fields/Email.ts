import type { MarkOptional } from 'ts-essentials'

import type { EmailFieldClient } from '../../fields/config/types.js'
import type { EmailFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

type EmailFieldClientWithoutType = MarkOptional<EmailFieldClient, 'type'>

export type EmailFieldProps = {
  readonly autoComplete?: string
  readonly descriptionProps?: FieldDescriptionProps<EmailFieldClient>
  readonly errorProps?: ErrorProps<EmailFieldClient>
  readonly field: EmailFieldClientWithoutType
  readonly labelProps?: LabelProps<EmailFieldClient>
  readonly validate?: EmailFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type EmailFieldLabelComponent = LabelComponent<EmailFieldClientWithoutType>

export type EmailFieldDescriptionComponent = DescriptionComponent<EmailFieldClientWithoutType>

export type EmailFieldErrorComponent = ErrorComponent<EmailFieldClientWithoutType>
