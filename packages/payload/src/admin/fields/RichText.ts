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

export type RichTextFieldProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = {
  readonly descriptionProps?: FieldDescriptionProps<RichTextFieldProps>
  readonly errorProps?: ErrorProps<RichTextFieldProps>
  readonly field: MarkOptional<RichTextFieldClient<TValue, TAdapterProps, TExtraProperties>, 'type'>
  readonly labelProps?: LabelProps<RichTextFieldProps>
  readonly validate?: RichTextFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type RichTextFieldLabelComponent = LabelComponent<RichTextFieldProps>

export type RichTextFieldDescriptionComponent = DescriptionComponent<RichTextFieldProps>

export type RichTextFieldErrorComponent = ErrorComponent<RichTextFieldProps>
