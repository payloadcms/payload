import type { UploadField } from 'payload'

import type { FormFieldBase } from '../shared/index.js'

export type UploadFieldProps = FormFieldBase & {
  filterOptions?: UploadField['filterOptions']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
  width?: string
}
