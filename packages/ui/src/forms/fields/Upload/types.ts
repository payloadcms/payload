import type { UploadField } from 'payload/types'

import type { FormFieldBase } from '../shared.js'

export type Props = FormFieldBase & {
  filterOptions?: UploadField['filterOptions']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
}
