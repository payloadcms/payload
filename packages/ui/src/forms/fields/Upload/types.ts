import { UploadField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  path?: string
  name?: string
  filterOptions?: UploadField['filterOptions']
  relationTo?: UploadField['relationTo']
}
