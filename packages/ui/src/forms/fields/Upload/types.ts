import type { UploadField } from 'payload/types'

import type { FormFieldBase } from '../shared.js'

export type UploadFieldProps = FormFieldBase & {
  filterOptions?: UploadField['filterOptions']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
}
