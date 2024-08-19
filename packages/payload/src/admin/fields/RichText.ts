import type { MarkOptional } from 'ts-essentials'

import type { RichTextField, RichTextFieldClient } from '../../fields/config/types.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type RichTextFieldClientWithoutType = MarkOptional<RichTextFieldClient, 'type'>

export type RichTextFieldProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = {
  readonly validate?: RichTextFieldValidation
} & Omit<FormFieldBase<RichTextFieldClientWithoutType>, 'validate'>

export type RichTextFieldLabelServerComponent = FieldLabelServerComponent<RichTextField>

export type RichTextFieldLabelClientComponent =
  FieldLabelClientComponent<RichTextFieldClientWithoutType>

export type RichTextFieldDescriptionServerComponent = FieldDescriptionServerComponent<RichTextField>

export type RichTextFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RichTextFieldClientWithoutType>

export type RichTextFieldErrorServerComponent = FieldErrorServerComponent<RichTextField>

export type RichTextFieldErrorClientComponent =
  FieldErrorClientComponent<RichTextFieldClientWithoutType>
