import type { MarkOptional } from 'ts-essentials'

import type { RichTextFieldClient } from '../../fields/config/types.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

type RichTextFieldClientWithoutType = MarkOptional<RichTextFieldClient, 'type'>

export type RichTextFieldProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = {
  readonly descriptionProps?: FieldDescriptionProps<RichTextFieldClientWithoutType>
  readonly errorProps?: ErrorProps<RichTextFieldClientWithoutType>
  readonly labelProps?: LabelProps<RichTextFieldClientWithoutType>
  readonly validate?: RichTextFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type RichTextFieldLabelComponent = LabelComponent<RichTextFieldClient>

export type RichTextFieldDescriptionComponent = DescriptionComponent<RichTextFieldClient>

export type RichTextFieldErrorComponent = ErrorComponent<RichTextFieldClient>
