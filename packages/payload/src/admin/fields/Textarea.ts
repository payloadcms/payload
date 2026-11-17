import type React from 'react'
import type { MarkOptional } from 'ts-essentials'

import type { TextareaField, TextareaFieldClient } from '../../fields/config/types.js'
import type { TextareaFieldValidation } from '../../fields/validations.js'
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

type TextareaFieldClientWithoutType = MarkOptional<TextareaFieldClient, 'type'>

type TextareaFieldBaseClientProps = {
  readonly inputRef?: React.Ref<HTMLInputElement>
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  readonly path: string
  readonly validate?: TextareaFieldValidation
}

type TextareaFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type TextareaFieldClientProps = ClientFieldBase<TextareaFieldClientWithoutType> &
  TextareaFieldBaseClientProps

export type TextareaFieldServerProps = ServerFieldBase<
  TextareaField,
  TextareaFieldClientWithoutType
> &
  TextareaFieldBaseServerProps
export type TextareaFieldLabelServerProps = FieldLabelServerProps<
  TextareaField,
  TextareaFieldClientWithoutType
>

export type TextareaFieldLabelClientProps = FieldLabelClientProps<TextareaFieldClientWithoutType>

export type TextareaFieldDescriptionServerProps = FieldDescriptionServerProps<
  TextareaField,
  TextareaFieldClientWithoutType
>

export type TextareaFieldDescriptionClientProps =
  FieldDescriptionClientProps<TextareaFieldClientWithoutType>

export type TextareaFieldErrorServerProps = FieldErrorServerProps<
  TextareaField,
  TextareaFieldClientWithoutType
>

export type TextareaFieldErrorClientProps = FieldErrorClientProps<TextareaFieldClientWithoutType>

export type TextareaFieldDiffServerProps = FieldDiffServerProps<TextareaField, TextareaFieldClient>

export type TextareaFieldDiffClientProps = FieldDiffClientProps<TextareaFieldClient>
