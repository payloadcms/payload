import type { MarkOptional } from 'ts-essentials'

import type { UploadFieldClient } from '../../fields/config/types.js'
import type { UploadFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type UploadFieldProps = {
  readonly field: MarkOptional<UploadFieldClient, 'type'>
  readonly validate?: UploadFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type UploadFieldLabelComponent = LabelComponent<'upload'>

export type UploadFieldDescriptionComponent = DescriptionComponent<'upload'>

export type UploadFieldErrorComponent = ErrorComponent<'upload'>
