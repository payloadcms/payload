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

type CodeFieldClientWithoutType = MarkOptional<CodeFieldClient, 'type'>

export type CodeFieldProps = {
  readonly autoComplete?: string
  readonly descriptionProps?: FieldDescriptionProps<CodeFieldClientWithoutType>
  readonly errorProps?: ErrorProps<CodeFieldClientWithoutType>
  readonly field: CodeFieldClientWithoutType
  readonly labelProps?: LabelProps<CodeFieldClientWithoutType>
  readonly validate?: CodeFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type CodeFieldLabelComponent = LabelComponent<CodeFieldClientWithoutType>

export type CodeFieldDescriptionComponent = DescriptionComponent<CodeFieldClientWithoutType>

export type CodeFieldErrorComponent = ErrorComponent<CodeFieldClientWithoutType>
