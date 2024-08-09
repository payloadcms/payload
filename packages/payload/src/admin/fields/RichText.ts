import type { MarkOptional } from 'ts-essentials'

import type { RichTextFieldClient } from '../../fields/config/types.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RichTextFieldProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = {
  readonly field: MarkOptional<RichTextFieldClient<TValue, TAdapterProps, TExtraProperties>, 'type'>
  readonly validate?: RichTextFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type RichTextFieldLabelComponent = LabelComponent<'richText'>

export type RichTextFieldDescriptionComponent = DescriptionComponent<'richText'>

export type RichTextFieldErrorComponent = ErrorComponent<'richText'>
