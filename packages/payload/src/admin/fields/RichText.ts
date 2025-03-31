import type { MarkOptional } from 'ts-essentials'

import type { RichTextField, RichTextFieldClient } from '../../fields/config/types.js'
import type { RichTextFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldPaths,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldDiffClientComponent,
  FieldDiffServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type RichTextFieldClientWithoutType<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = MarkOptional<RichTextFieldClient<TValue, TAdapterProps, TExtraProperties>, 'type'>

type RichTextFieldBaseClientProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = {
  readonly path: string
  readonly validate?: RichTextFieldValidation
}

type RichTextFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type RichTextFieldClientProps<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = ClientFieldBase<RichTextFieldClientWithoutType<TValue, TAdapterProps, TExtraProperties>> &
  RichTextFieldBaseClientProps<TValue, TAdapterProps, TExtraProperties>

export type RichTextFieldServerProps = RichTextFieldBaseServerProps &
  ServerFieldBase<RichTextField, RichTextFieldClientWithoutType>

export type RichTextFieldServerComponent<T extends Record<string, unknown> = {}> =
  FieldServerComponent<
    RichTextField,
    RichTextFieldClientWithoutType,
    RichTextFieldBaseServerProps & T
  >

export type RichTextFieldClientComponent<T extends Record<string, unknown> = {}> =
  FieldClientComponent<RichTextFieldClientWithoutType, RichTextFieldBaseClientProps & T>

export type RichTextFieldLabelServerComponent = FieldLabelServerComponent<
  RichTextField,
  RichTextFieldClientWithoutType
>

export type RichTextFieldLabelClientComponent =
  FieldLabelClientComponent<RichTextFieldClientWithoutType>

export type RichTextFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  RichTextField,
  RichTextFieldClientWithoutType
>

export type RichTextFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<RichTextFieldClientWithoutType>

export type RichTextFieldErrorServerComponent = FieldErrorServerComponent<
  RichTextField,
  RichTextFieldClientWithoutType
>

export type RichTextFieldErrorClientComponent =
  FieldErrorClientComponent<RichTextFieldClientWithoutType>

export type RichTextFieldDiffServerComponent = FieldDiffServerComponent<
  RichTextField,
  RichTextFieldClient
>

export type RichTextFieldDiffClientComponent = FieldDiffClientComponent<RichTextFieldClient>
