import type {
  DescriptionComponent,
  FormFieldBase,
  GenericClientFieldConfig,
  LabelComponent,
} from 'payload'

import type { ErrorComponent } from '../forms/Error.js'
import { UploadFieldValidation } from '../../fields/validations.js'

export type UploadFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'upload'>
  readonly validate?: UploadFieldValidation
} & FormFieldBase

export type UploadFieldLabelComponent = LabelComponent<'upload'>

export type UploadFieldDescriptionComponent = DescriptionComponent<'upload'>

export type UploadFieldErrorComponent = ErrorComponent<'upload'>
