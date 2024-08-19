import type { MarkOptional } from 'ts-essentials'

import type { UploadFieldClient } from '../../fields/config/types.js'
import type { UploadFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type UploadFieldClientWithoutType = MarkOptional<UploadFieldClient, 'type'>

export type UploadFieldProps = {
  readonly validate?: UploadFieldValidation
} & Omit<FormFieldBase<UploadFieldClientWithoutType>, 'validate'>

export type UploadFieldLabelComponent = LabelComponent<UploadFieldClientWithoutType>

export type UploadFieldDescriptionComponent = DescriptionComponent<UploadFieldClientWithoutType>

export type UploadFieldErrorComponent = ErrorComponent<UploadFieldClientWithoutType>
