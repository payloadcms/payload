import type { FieldTypes } from '..'
import type { UploadField } from 'payload/types'

export type Props = Omit<UploadField, 'type'> & {
  fieldTypes: FieldTypes
  path?: string
}
