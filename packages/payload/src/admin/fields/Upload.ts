import type {
  ClientFieldConfig,
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  StaticLabel,
} from 'payload'

import type { UploadFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'

export type UploadFieldClient = {
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'upload' }>

export type UploadFieldProps = {
  readonly field: UploadFieldClient
  readonly validate?: UploadFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type UploadFieldLabelComponent = LabelComponent<'upload'>

export type UploadFieldDescriptionComponent = DescriptionComponent<'upload'>

export type UploadFieldErrorComponent = ErrorComponent<'upload'>
