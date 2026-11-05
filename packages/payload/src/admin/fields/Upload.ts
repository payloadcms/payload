import type { MarkOptional } from 'ts-essentials'

import type { UploadField, UploadFieldClient } from '../../fields/config/types.js'
import type { UploadFieldValidation } from '../../fields/validations.js'
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

type UploadFieldClientWithoutType = MarkOptional<UploadFieldClient, 'type'>

type UploadFieldBaseClientProps = {
  readonly path: string
  readonly validate?: UploadFieldValidation
}

type UploadFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type UploadFieldClientProps = ClientFieldBase<UploadFieldClientWithoutType> &
  UploadFieldBaseClientProps

export type UploadFieldServerProps = ServerFieldBase<UploadField, UploadFieldClientWithoutType> &
  UploadFieldBaseServerProps
export type UploadFieldLabelServerProps = FieldLabelServerProps<
  UploadField,
  UploadFieldClientWithoutType
>

export type UploadFieldLabelClientProps = FieldLabelClientProps<UploadFieldClientWithoutType>

export type UploadFieldDescriptionServerProps = FieldDescriptionServerProps<
  UploadField,
  UploadFieldClientWithoutType
>

export type UploadFieldDescriptionClientProps =
  FieldDescriptionClientProps<UploadFieldClientWithoutType>

export type UploadFieldErrorServerProps = FieldErrorServerProps<
  UploadField,
  UploadFieldClientWithoutType
>

export type UploadFieldErrorClientProps = FieldErrorClientProps<UploadFieldClientWithoutType>

export type UploadFieldDiffServerProps = FieldDiffServerProps<UploadField, UploadFieldClient>

export type UploadFieldDiffClientProps = FieldDiffClientProps<UploadFieldClient>
