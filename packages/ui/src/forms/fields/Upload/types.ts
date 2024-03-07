import type { UploadField } from 'payload/types'

import type { FormFieldBase } from '../shared.d.ts'

export type Props = FormFieldBase & {
  filterOptions?: UploadField['filterOptions']
  name?: string
  path?: string
  relationTo?: UploadField['relationTo']
}
