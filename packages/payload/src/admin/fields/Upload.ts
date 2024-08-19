import type { MarkOptional } from 'ts-essentials'

import type { UploadField, UploadFieldClient } from '../../fields/config/types.js'
import type { UploadFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  FormFieldBase,
} from '../types.js'

type UploadFieldClientWithoutType = MarkOptional<UploadFieldClient, 'type'>

export type UploadFieldProps = {
  readonly validate?: UploadFieldValidation
} & Omit<FormFieldBase<UploadFieldClientWithoutType>, 'validate'>

export type UploadFieldLabelServerComponent = FieldLabelServerComponent<UploadField>

export type UploadFieldLabelClientComponent =
  FieldLabelClientComponent<UploadFieldClientWithoutType>

export type UploadFieldDescriptionServerComponent = FieldDescriptionServerComponent<UploadField>

export type UploadFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<UploadFieldClientWithoutType>

export type UploadFieldErrorServerComponent = FieldErrorServerComponent<UploadField>

export type UploadFieldErrorClientComponent =
  FieldErrorClientComponent<UploadFieldClientWithoutType>
