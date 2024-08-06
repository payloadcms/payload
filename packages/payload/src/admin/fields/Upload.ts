import type {
  DescriptionComponent,
  FormFieldBase,
  LabelComponent,
  UploadField,
  UploadFieldValidation,
} from 'payload'

import type { ErrorComponent } from '../forms/Error.js'

export type UploadFieldProps = {
  filterOptions?: UploadField['filterOptions']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
  validate?: UploadFieldValidation
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type UploadFieldLabelComponent = LabelComponent<'upload'>

export type UploadFieldDescriptionComponent = DescriptionComponent<'upload'>

export type UploadFieldErrorComponent = ErrorComponent<'upload'>
