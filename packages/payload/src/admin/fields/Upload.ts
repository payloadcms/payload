import type { DescriptionComponent, FormFieldBase, LabelComponent, UploadField } from 'payload'

import type { ErrorComponent } from '../forms/Error.js'

export type UploadFieldProps = {
  filterOptions?: UploadField['filterOptions']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
  width?: string
} & FormFieldBase

export type UploadFieldLabelComponent = LabelComponent<'upload'>

export type UploadFieldDescriptionComponent = DescriptionComponent<'upload'>

export type UploadFieldErrorComponent = ErrorComponent<'upload'>
