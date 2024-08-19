import type { MarkOptional } from 'ts-essentials'

import type { RichTextFieldClient } from '../../fields/config/types.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type RichTextFieldClientWithoutType = MarkOptional<RichTextFieldClient, 'type'>

export type RichTextFieldProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = {
  readonly validate?: RichTextFieldValidation
} & Omit<FormFieldBase<RichTextFieldClientWithoutType>, 'validate'>

export type RichTextFieldLabelComponent = LabelComponent

export type RichTextFieldDescriptionComponent = DescriptionComponent

export type RichTextFieldErrorComponent = ErrorComponent
