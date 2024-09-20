import type { MarkOptional } from 'ts-essentials'

import type { UploadField, UploadFieldClient } from '../../fields/config/types.js'
import type { UploadFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type UploadFieldClientWithoutType = MarkOptional<UploadFieldClient, 'type'>

type UploadFieldBaseClientProps = {
  readonly validate?: UploadFieldValidation
}

export type UploadFieldClientProps = ClientFieldBase<UploadFieldClientWithoutType> &
  UploadFieldBaseClientProps

export type UploadFieldServerProps = ServerFieldBase<UploadField, UploadFieldClientWithoutType>

export type UploadFieldServerComponent = FieldServerComponent<
  UploadField,
  UploadFieldClientWithoutType
>

export type UploadFieldClientComponent = FieldClientComponent<
  UploadFieldClientWithoutType,
  UploadFieldBaseClientProps
>

export type UploadFieldLabelServerComponent = FieldLabelServerComponent<
  UploadField,
  UploadFieldClientWithoutType
>

export type UploadFieldLabelClientComponent =
  FieldLabelClientComponent<UploadFieldClientWithoutType>

export type UploadFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  UploadField,
  UploadFieldClientWithoutType
>

export type UploadFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<UploadFieldClientWithoutType>

export type UploadFieldErrorServerComponent = FieldErrorServerComponent<
  UploadField,
  UploadFieldClientWithoutType
>

export type UploadFieldErrorClientComponent =
  FieldErrorClientComponent<UploadFieldClientWithoutType>
