import type { UploadField } from 'payload/types'

import type { FormFieldBase } from '../shared/index.js'

export type UploadFieldProps = FormFieldBase & {
  filterOptions?: UploadField['filterOptions']
  label?: UploadField['label']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
  width?: string
}
