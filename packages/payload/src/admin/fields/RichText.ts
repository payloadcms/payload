import type { MarkOptional } from 'ts-essentials'

import type { RichTextField, RichTextFieldClient } from '../../fields/config/types.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientProps, FieldErrorServerProps } from '../forms/Error.js'
import type { ClientFieldBase, FieldPaths, ServerFieldBase } from '../forms/Field.js'
import type {
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldLabelClientProps,
  FieldLabelServerProps,
} from '../types.js'

type RichTextFieldClientWithoutType<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = MarkOptional<RichTextFieldClient<TValue, TAdapterProps, TExtraProperties>, 'type'>

type RichTextFieldBaseClientProps = {
  readonly path: string
  readonly validate?: RichTextFieldValidation
}

type RichTextFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type RichTextFieldClientProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = ClientFieldBase<RichTextFieldClientWithoutType<TValue, TAdapterProps, TExtraProperties>> &
  RichTextFieldBaseClientProps

export type RichTextFieldServerProps = RichTextFieldBaseServerProps &
  ServerFieldBase<RichTextField, RichTextFieldClientWithoutType>
export type RichTextFieldLabelServerProps = FieldLabelServerProps<
  RichTextField,
  RichTextFieldClientWithoutType
>

export type RichTextFieldLabelClientProps = FieldLabelClientProps<RichTextFieldClientWithoutType>

export type RichTextFieldDescriptionServerProps = FieldDescriptionServerProps<
  RichTextField,
  RichTextFieldClientWithoutType
>

export type RichTextFieldDescriptionClientProps =
  FieldDescriptionClientProps<RichTextFieldClientWithoutType>

export type RichTextFieldErrorServerProps = FieldErrorServerProps<
  RichTextField,
  RichTextFieldClientWithoutType
>

export type RichTextFieldErrorClientProps = FieldErrorClientProps<RichTextFieldClientWithoutType>

export type RichTextFieldDiffServerProps = FieldDiffServerProps<RichTextField, RichTextFieldClient>

export type RichTextFieldDiffClientProps = FieldDiffClientProps<RichTextFieldClient>
