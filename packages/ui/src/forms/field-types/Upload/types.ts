import type { FieldTypes } from 'payload/config'
import type { UploadField } from 'payload/types'

export type Props = Omit<UploadField, 'type'> & {
  fieldTypes: FieldTypes
  path?: string
}
