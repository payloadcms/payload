import type { FormFieldBase, UploadField } from 'payload'

export type UploadFieldProps = {
  filterOptions?: UploadField['filterOptions']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
  type?: 'upload'
  width?: string
} & FormFieldBase
